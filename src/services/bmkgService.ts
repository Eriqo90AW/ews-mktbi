import type { DisasterAlert, AlertSeverity } from '../types';
import { KPWBI_OFFICES } from '../constants/kpwbiOffices';
import { findNearestKpwOffice } from '../utils/geo';
import { mapTextToProvinceId } from '../utils/provinceMap';

interface BmkgEarthquake {
  Tanggal: string;
  Jam: string;
  DateTime: string;
  Coordinates: string;
  Lintang: string;
  Bujur: string;
  Magnitude: string;
  Kedalaman: string;
  Wilayah: string;
  Dirasakan: string;
}

interface BmkgResponse {
  Infogempa?: {
    gempa?: BmkgEarthquake[];
  };
}

function parsePolygonCentroid(polygonStr: string): { latitude: number; longitude: number } | null {
  if (!polygonStr) return null;
  const pairs = polygonStr.trim().split(/\s+/);
  let totalLat = 0;
  let totalLon = 0;
  let count = 0;
  for (const pair of pairs) {
    const coords = pair.split(',');
    if (coords.length === 2) {
      const lat = parseFloat(coords[0]);
      const lon = parseFloat(coords[1]);
      if (!isNaN(lat) && !isNaN(lon)) {
        totalLat += lat;
        totalLon += lon;
        count++;
      }
    }
  }
  if (count === 0) return null;
  return { latitude: totalLat / count, longitude: totalLon / count };
}

async function fetchWithProxy(url: string): Promise<string> {
  try {
    const res = await fetch(`https://corsproxy.io/?${encodeURIComponent(url)}`);
    if (res.ok) return await res.text();
  } catch (e) {
    console.warn('corsproxy.io failed, trying fallback', e);
  }
  
  try {
    const res = await fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`);
    if (res.ok) return await res.text();
  } catch (e) {
    console.warn('codetabs proxy failed, trying fallback', e);
  }

  const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
  if (!res.ok) throw new Error(`All proxies failed for ${url}`);
  const data = await res.json();
  return data.contents;
}

export async function fetchLatestEarthquakes(): Promise<DisasterAlert[]> {
  try {
    const response = await fetch('https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data: BmkgResponse = await response.json();
    const gempaList = data.Infogempa?.gempa || [];

    return gempaList.map((gempa, index) => {
      const [latStr, lonStr] = gempa.Coordinates.split(',');
      const latitude = parseFloat(latStr);
      const longitude = parseFloat(lonStr);
      const magnitude = parseFloat(gempa.Magnitude);
      const depth = parseFloat(gempa.Kedalaman);

      let severity: AlertSeverity = 'watch';
      if (magnitude >= 5.0) severity = 'critical';
      else if (magnitude >= 4.0) severity = 'warning';

      const nearestOffice = findNearestKpwOffice(latitude, longitude);

      return {
        id: `bmkg-eq-${gempa.DateTime.replace(/[^a-zA-Z0-9]/g, '') || index}`,
        type: 'earthquake' as const,
        severity,
        provinceId: nearestOffice.provinceId,
        title: `M ${gempa.Magnitude} Earthquake Warning`,
        description: `${gempa.Wilayah}. Dirasakan di: ${gempa.Dirasakan}.`,
        timestamp: gempa.DateTime,
        latitude,
        longitude,
        magnitude,
        depth,
        affectedArea: gempa.Dirasakan,
      };
    });
  } catch (error) {
    console.error('Failed to fetch BMKG earthquake data:', error);
    return [];
  }
}

export async function fetchExtremeWeather(): Promise<DisasterAlert[]> {
  try {
    const response = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https://www.bmkg.go.id/alerts/nowcast/id/rss.xml');
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    if (data.status !== 'ok') throw new Error('RSS-to-JSON API status not ok');
    const rawItems = data.items || [];
    const items = rawItems.slice(0, 15);

    const alertsPromises = items.map(async (item: { guid: string; link: string; title: string; description: string; pubDate: string }, index: number) => {
      let latitude = -6.2088;
      let longitude = 106.8456;
      let severity: AlertSeverity = 'watch';
      let hasExactCoords = false;

      try {
        const xmlText = await fetchWithProxy(item.link);
        if (xmlText) {
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

          const capSeverity = xmlDoc.querySelector('severity')?.textContent?.toLowerCase();
          if (capSeverity === 'extreme' || capSeverity === 'severe') severity = 'critical';
          else if (capSeverity === 'moderate') severity = 'warning';
          else severity = 'watch';

          const polygonNode = xmlDoc.querySelector('polygon');
          if (polygonNode && polygonNode.textContent) {
            const centroid = parsePolygonCentroid(polygonNode.textContent);
            if (centroid) {
              latitude = centroid.latitude;
              longitude = centroid.longitude;
              hasExactCoords = true;
            }
          }
        }
      } catch (e) {
        console.warn(`Failed to fetch CAP XML for ${item.link}, falling back to province mapping.`, e);
      }

      let provinceId = 'ID-JK';
      if (!hasExactCoords) {
        provinceId = mapTextToProvinceId(item.title);
        const office = KPWBI_OFFICES.find((o) => o.provinceId === provinceId) || KPWBI_OFFICES[0];
        latitude = office.latitude;
        longitude = office.longitude;
      } else {
        const nearestOffice = findNearestKpwOffice(latitude, longitude);
        provinceId = nearestOffice.provinceId;
      }

      const id = `bmkg-wx-${item.guid.replace(/[^a-zA-Z0-9]/g, '') || index}`;

      return {
        id,
        type: 'extreme_weather' as const,
        severity,
        provinceId,
        title: item.title,
        description: item.description,
        timestamp: item.pubDate,
        latitude,
        longitude,
        affectedArea: item.title,
      };
    });

    return await Promise.all(alertsPromises);
  } catch (error) {
    console.error('Failed to fetch BMKG extreme weather data:', error);
    return [];
  }
}

export async function fetchThreeDayForecast(): Promise<DisasterAlert[]> {
  try {
    const html = await fetchWithProxy('https://www.bmkg.go.id/cuaca/potensi-cuaca-ekstrem');
    if (!html) throw new Error('No HTML content returned');

    const theadMatch = html.match(/<thead[^>]*>([\s\S]*?)<\/thead>/i);
    const headers: string[] = [];
    if (theadMatch) {
      const rxTh = /<th[^>]*>([\s\S]*?)<\/th>/gi;
      let mTh;
      while ((mTh = rxTh.exec(theadMatch[1])) !== null) {
        headers.push(mTh[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
      }
    }

    const day1Date = headers[2] || new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    const day2Date = headers[3] || new Date(Date.now() + 86400000).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
    const day3Date = headers[4] || new Date(Date.now() + 172800000).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

    const tbodyMatch = html.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i);
    if (!tbodyMatch) return [];

    const tbody = tbodyMatch[1];
    const alerts: DisasterAlert[] = [];
    const rxTr = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let mTr;

    while ((mTr = rxTr.exec(tbody)) !== null) {
      const trContent = mTr[1];
      const rxTd = /<td[^>]*>([\s\S]*?)<\/td>/gi;
      let mTd;
      const cells: string[] = [];
      while ((mTd = rxTd.exec(trContent)) !== null) {
        cells.push(mTd[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
      }

      if (cells.length >= 5) {
        const provinceName = cells[1];
        const dayStatuses = [cells[2], cells[3], cells[4]];
        const provinceId = mapTextToProvinceId(provinceName);
        const office = KPWBI_OFFICES.find((o) => o.provinceId === provinceId) || KPWBI_OFFICES[0];

        dayStatuses.forEach((statusText, idx) => {
          if (!statusText || statusText === '—' || statusText.trim() === '') return;

          const dayNum = idx + 1;
          const dateStr = dayNum === 1 ? day1Date : dayNum === 2 ? day2Date : day3Date;

          let severity: AlertSeverity = 'watch';
          const lowerStatus = statusText.toLowerCase();
          if (lowerStatus.includes('siaga')) severity = 'critical';
          else if (lowerStatus.includes('waspada')) severity = 'warning';

          alerts.push({
            id: `bmkg-forecast-${provinceId}-${dayNum}`,
            type: 'extreme_weather',
            severity,
            provinceId,
            title: `${statusText} (${dateStr})`,
            description: `Potensi cuaca ekstrem di Provinsi ${provinceName}: ${statusText}. Rencana perkiraan untuk tanggal ${dateStr}.`,
            timestamp: new Date(Date.now() + idx * 86400000).toISOString(),
            latitude: office.latitude,
            longitude: office.longitude,
            affectedArea: provinceName,
            isForecast: true,
            forecastDay: dayNum,
            forecastDateStr: dateStr,
          });
        });
      }
    }

    return alerts;
  } catch (error) {
    console.error('Failed to fetch/parse 3-day BMKG weather forecast:', error);
    return [];
  }
}
