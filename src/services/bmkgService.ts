import type { DisasterAlert, KpwbiOffice, AlertSeverity } from '../types';
import { KPWBI_OFFICES } from '../constants/kpwbiOffices';
import { haversineDistance } from '../utils/nearestKpw';

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

/**
 * Finds the nearest KPwBI office to a given set of coordinates.
 */
export function findNearestKpwOffice(lat: number, lon: number): KpwbiOffice {
  let nearestOffice = KPWBI_OFFICES[0];
  let minDistance = haversineDistance(lat, lon, nearestOffice.latitude, nearestOffice.longitude);

  for (let i = 1; i < KPWBI_OFFICES.length; i++) {
    const office = KPWBI_OFFICES[i];
    const distance = haversineDistance(lat, lon, office.latitude, office.longitude);
    if (distance < minDistance) {
      minDistance = distance;
      nearestOffice = office;
    }
  }

  return nearestOffice;
}

/**
 * Parses a polygon string (lat,lon pairs separated by space) and returns the centroid coordinate.
 */
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

/**
 * Maps input text (e.g. title or description) to a Province ID.
 */
export function mapTextToProvinceId(text: string): string {
  const t = text.toLowerCase();
  if (t.includes('aceh')) return 'ID-AC';
  if (t.includes('sumatera utara') || t.includes('sumut')) return 'ID-SU';
  if (t.includes('sumatera barat') || t.includes('sumbar')) return 'ID-SB';
  if (t.includes('riau')) return 'ID-RI';
  if (t.includes('kepulauan riau') || t.includes('kepri')) return 'ID-KR';
  if (t.includes('jambi')) return 'ID-JA';
  if (t.includes('bengkulu')) return 'ID-BE';
  if (t.includes('sumatera selatan') || t.includes('sumsel')) return 'ID-SS';
  if (t.includes('bangka belitung') || t.includes('babel')) return 'ID-BB';
  if (t.includes('lampung')) return 'ID-LA';
  if (t.includes('jakarta') || t.includes('dki')) return 'ID-JK';
  if (t.includes('jawa barat') || t.includes('jabar')) return 'ID-JB';
  if (t.includes('banten')) return 'ID-BT';
  if (t.includes('jawa tengah') || t.includes('jateng')) return 'ID-JT';
  if (t.includes('yogyakarta') || t.includes('diy')) return 'ID-YO';
  if (t.includes('jawa timur') || t.includes('jatim')) return 'ID-JI';
  if (t.includes('kalimantan barat') || t.includes('kalbar')) return 'ID-KB';
  if (t.includes('kalimantan tengah') || t.includes('kalteng')) return 'ID-KT';
  if (t.includes('kalimantan selatan') || t.includes('kalsel')) return 'ID-KS';
  if (t.includes('kalimantan timur') || t.includes('kaltim')) return 'ID-KI';
  if (t.includes('kalimantan utara') || t.includes('kalut')) return 'ID-KU';
  if (t.includes('bali')) return 'ID-BA';
  if (t.includes('nusa tenggara barat') || t.includes('ntb')) return 'ID-NB';
  if (t.includes('nusa tenggara timur') || t.includes('ntt')) return 'ID-NT';
  if (t.includes('sulawesi utara') || t.includes('sulut')) return 'ID-SA';
  if (t.includes('gorontalo')) return 'ID-GO';
  if (t.includes('sulawesi tengah') || t.includes('sulteng')) return 'ID-ST';
  if (t.includes('sulawesi barat') || t.includes('sulbar')) return 'ID-SR';
  if (t.includes('sulawesi tenggara') || t.includes('sultra')) return 'ID-SG';
  if (t.includes('sulawesi selatan') || t.includes('sulsel')) return 'ID-SN';
  if (t.includes('maluku utara')) return 'ID-MU';
  if (t.includes('maluku')) return 'ID-MA';
  if (t.includes('papua barat')) return 'ID-PB';
  if (t.includes('papua')) return 'ID-PA';
  return 'ID-JK';
}

/**
 * Fetches the latest earthquakes from BMKG and maps them to DisasterAlert format.
 */
export async function fetchLatestEarthquakes(): Promise<DisasterAlert[]> {
  try {
    const response = await fetch('https://data.bmkg.go.id/DataMKG/TEWS/gempadirasakan.json');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: BmkgResponse = await response.json();
    const gempaList = data.Infogempa?.gempa || [];
    
    return gempaList.map((gempa, index) => {
      const [latStr, lonStr] = gempa.Coordinates.split(',');
      const latitude = parseFloat(latStr);
      const longitude = parseFloat(lonStr);
      const magnitude = parseFloat(gempa.Magnitude);
      const depth = parseFloat(gempa.Kedalaman);
      
      let severity: AlertSeverity = 'watch';
      if (magnitude >= 5.0) {
        severity = 'critical';
      } else if (magnitude >= 4.0) {
        severity = 'warning';
      }
      
      const nearestOffice = findNearestKpwOffice(latitude, longitude);
      
      return {
        id: `bmkg-eq-${gempa.DateTime.replace(/[^a-zA-Z0-9]/g, '') || index}`,
        type: 'earthquake',
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

/**
 * Fetches the latest extreme weather alerts from BMKG via RSS-to-JSON and maps them.
 */
export async function fetchExtremeWeather(): Promise<DisasterAlert[]> {
  try {
    const response = await fetch('https://api.rss2json.com/v1/api.json?rss_url=https://www.bmkg.go.id/alerts/nowcast/id/rss.xml');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    if (data.status !== 'ok') {
      throw new Error('RSS-to-JSON API status not ok');
    }
    const items = data.items || [];
    
    // Map items to DisasterAlert format
    // We will do parallel sub-fetches for detailed CAP XML coordinates
    const alertsPromises = items.map(async (item: any, index: number) => {
      let latitude = -6.2088; // Default to Jakarta
      let longitude = 106.8456;
      let severity: AlertSeverity = 'watch';
      let hasExactCoords = false;

      try {
        // Fetch detailed CAP XML to get polygon coordinates
        const capResponse = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent(item.link)}`);
        if (capResponse.ok) {
          const capJson = await capResponse.json();
          const xmlText = capJson.contents;
          if (xmlText) {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            
            // Parse severity
            const capSeverity = xmlDoc.querySelector('severity')?.textContent?.toLowerCase();
            if (capSeverity === 'extreme' || capSeverity === 'severe') {
              severity = 'critical';
            } else if (capSeverity === 'moderate') {
              severity = 'warning';
            } else {
              severity = 'watch';
            }
            
            // Parse polygon
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
        }
      } catch (e) {
        console.warn(`Failed to fetch CAP XML for ${item.link}, falling back to province mapping.`, e);
      }

      // If CAP XML fetch failed or coordinates not parsed, fallback to province coordinates
      let provinceId = 'ID-JK';
      if (!hasExactCoords) {
        provinceId = mapTextToProvinceId(item.title);
        const office = KPWBI_OFFICES.find(o => o.provinceId === provinceId) || KPWBI_OFFICES[0];
        latitude = office.latitude;
        longitude = office.longitude;
      } else {
        // We have coordinates, find nearest office
        const nearestOffice = findNearestKpwOffice(latitude, longitude);
        provinceId = nearestOffice.provinceId;
      }

      // Format timestamp (RSS is pubDate e.g. "2026-06-25 03:20:00")
      // BMKG details might also contain times. We will format it for display.
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

    const results = await Promise.all(alertsPromises);
    return results;
  } catch (error) {
    console.error('Failed to fetch BMKG extreme weather data:', error);
    return [];
  }
}

/**
 * Fetches the 3-day extreme weather outlook from BMKG and parses it.
 */
export async function fetchThreeDayForecast(): Promise<DisasterAlert[]> {
  try {
    const response = await fetch('https://api.allorigins.win/get?url=' + encodeURIComponent('https://www.bmkg.go.id/cuaca/potensi-cuaca-ekstrem'));
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const json = await response.json();
    const html = json.contents;
    if (!html) {
      throw new Error('No HTML content returned');
    }

    // Try to extract dates from thead
    const theadMatch = html.match(/<thead[^>]*>([\s\S]*?)<\/thead>/i);
    const headers: string[] = [];
    if (theadMatch) {
      const rxTh = /<th[^>]*>([\s\S]*?)<\/th>/gi;
      let mTh;
      while ((mTh = rxTh.exec(theadMatch[1])) !== null) {
        headers.push(mTh[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
      }
    }

    // Default dates if parsing failed
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
        let cellText = mTd[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        cells.push(cellText);
      }

      if (cells.length >= 5) {
        const provinceName = cells[1];
        const dayStatuses = [cells[2], cells[3], cells[4]];
        const provinceId = mapTextToProvinceId(provinceName);
        const office = KPWBI_OFFICES.find(o => o.provinceId === provinceId) || KPWBI_OFFICES[0];

        dayStatuses.forEach((statusText, idx) => {
          if (!statusText || statusText === '—' || statusText.trim() === '') {
            return;
          }

          const dayNum = idx + 1;
          const dateStr = dayNum === 1 ? day1Date : dayNum === 2 ? day2Date : day3Date;
          
          let severity: AlertSeverity = 'watch';
          const lowerStatus = statusText.toLowerCase();
          if (lowerStatus.includes('siaga')) {
            severity = 'critical';
          } else if (lowerStatus.includes('waspada')) {
            severity = 'warning';
          }

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
