import type { DisasterAlert, AlertSeverity } from '../types';
import { KPWBI_OFFICES } from '../constants/kpwbiOffices';
import { mapTextToProvinceId } from '../utils/provinceMap';
import { fetchWithCorsProxy } from './proxy';

const MOCK_SIGNATURES: DisasterAlert[] = [
  {
    id: 'mock-gis-sig-1',
    type: 'extreme_weather',
    severity: 'critical',
    provinceId: 'ID-JB',
    title: 'Peringatan Dini Cuaca - Jawa Barat (GIS)',
    description: 'Potensi hujan lebat disertai kilat/petir dan angin kencang di Kabupaten Bogor, Kota Depok, Kabupaten Bekasi, dan sekitarnya.',
    timestamp: new Date().toISOString(),
    latitude: -6.5971,
    longitude: 106.7986,
    affectedArea: 'Bogor & Depok',
  },
  {
    id: 'mock-gis-sig-2',
    type: 'extreme_weather',
    severity: 'warning',
    provinceId: 'ID-JT',
    title: 'Peringatan Dini Cuaca - Jawa Tengah (GIS)',
    description: 'Potensi hujan sedang-lebat di Kabupaten Cilacap, Kabupaten Banyumas, dan Kabupaten Purbalingga.',
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    latitude: -7.4244,
    longitude: 109.2384,
    affectedArea: 'Banyumas & Cilacap',
  },
];

const MOCK_HOTSPOTS: DisasterAlert[] = [
  {
    id: 'mock-gis-hs-1',
    type: 'karhutla',
    severity: 'critical',
    provinceId: 'ID-RI',
    title: 'Hotspot Karhutla - Bengkalis (92% Confidence)',
    description: 'Terdeteksi titik panas (hotspot) dengan tingkat kepercayaan Tinggi (92%) di Kecamatan Mandau, Kabupaten Bengkalis, Provinsi Riau.',
    timestamp: new Date().toISOString(),
    latitude: 1.2821,
    longitude: 101.2138,
    affectedArea: 'Kabupaten Bengkalis',
  },
  {
    id: 'mock-gis-hs-2',
    type: 'karhutla',
    severity: 'warning',
    provinceId: 'ID-KB',
    title: 'Hotspot Karhutla - Kubu Raya (75% Confidence)',
    description: 'Terdeteksi titik panas (hotspot) dengan tingkat kepercayaan Sedang (75%) di Kecamatan Sungai Raya, Kabupaten Kubu Raya, Provinsi Kalimantan Barat.',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    latitude: -0.1582,
    longitude: 109.4215,
    affectedArea: 'Kabupaten Kubu Raya',
  },
  {
    id: 'mock-gis-hs-3',
    type: 'karhutla',
    severity: 'watch',
    provinceId: 'ID-SS',
    title: 'Hotspot Karhutla - Ogan Komering Ilir (48% Confidence)',
    description: 'Terdeteksi titik panas (hotspot) dengan tingkat kepercayaan Rendah (48%) di Kecamatan Pedamaran, Kabupaten Ogan Komering Ilir, Provinsi Sumatera Selatan.',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    latitude: -3.4215,
    longitude: 104.9128,
    affectedArea: 'Kabupaten Ogan Komering Ilir',
  },
  {
    id: 'mock-gis-hs-4',
    type: 'karhutla',
    severity: 'warning',
    provinceId: 'ID-KT',
    title: 'Hotspot Karhutla - Pulang Pisau (68% Confidence)',
    description: 'Terdeteksi titik panas (hotspot) dengan tingkat kepercayaan Sedang (68%) di Kecamatan Kahayan Hilir, Kabupaten Pulang Pisau, Provinsi Kalimantan Tengah.',
    timestamp: new Date(Date.now() - 10800000).toISOString(),
    latitude: -2.7123,
    longitude: 114.1568,
    affectedArea: 'Kabupaten Pulang Pisau',
  },
];

function webMercatorToWgs84(x: number, y: number): { lat: number; lon: number } {
  if (Math.abs(x) < 180 && Math.abs(y) < 90) return { lat: y, lon: x };
  const lon = (x * 180) / 20037508.34;
  let lat = (y * 180) / 20037508.34;
  lat = (180 / Math.PI) * (2 * Math.atan(Math.exp((lat * Math.PI) / 180)) - Math.PI / 2);
  return { lat, lon };
}

function calculateRingsCentroid(rings: number[][][]): { lat: number; lon: number } | null {
  if (!rings || rings.length === 0 || rings[0].length === 0) return null;
  let totalX = 0;
  let totalY = 0;
  let count = 0;
  for (const ring of rings) {
    for (const point of ring) {
      if (point.length >= 2) {
        totalX += point[0];
        totalY += point[1];
        count++;
      }
    }
  }
  if (count === 0) return null;
  return webMercatorToWgs84(totalX / count, totalY / count);
}

export class BMKGGisService {
  private static SIGNATURE_URL = 'https://gis.bmkg.go.id/arcgis/rest/services/MEWS/signature/MapServer/0/query?where=1=1&outFields=*&f=pjson';
  private static HOTSPOT_URL = 'https://gis.bmkg.go.id/arcgis/rest/services/Klimatologi/Hotspot/MapServer/0/query?where=1=1&outFields=*&f=pjson';

  static async fetchSignatureData(): Promise<DisasterAlert[]> {
    try {
      const data = await fetchWithCorsProxy(this.SIGNATURE_URL) as { error?: { message: string }; features?: any[] };
      if (data.error) throw new Error(`ArcGIS Error: ${data.error.message}`);

      const features = data.features || [];
      if (features.length === 0) return MOCK_SIGNATURES;

      const alerts: DisasterAlert[] = [];
      features.forEach((feature: any, index: number) => {
        const attrs = feature.attributes || {};
        const geom = feature.geometry || {};

        let lat = -6.2088;
        let lon = 106.8456;
        let hasCoords = false;

        if (geom.rings) {
          const centroid = calculateRingsCentroid(geom.rings);
          if (centroid) { lat = centroid.lat; lon = centroid.lon; hasCoords = true; }
        } else if (geom.x !== undefined && geom.y !== undefined) {
          const coords = webMercatorToWgs84(geom.x, geom.y);
          lat = coords.lat; lon = coords.lon; hasCoords = true;
        }

        const provinceName = attrs.PROVINSI || attrs.Provinsi || attrs.provinsi || '';
        const provinceId = mapTextToProvinceId(provinceName);

        if (!hasCoords) {
          const office = KPWBI_OFFICES.find((o) => o.provinceId === provinceId) || KPWBI_OFFICES[0];
          lat = office.latitude; lon = office.longitude;
        }

        const keterangan = attrs.KETERANGAN || attrs.Keterangan || attrs.keterangan || 'Potensi Cuaca Ekstrem';

        let severity: AlertSeverity = 'watch';
        const lowerKeterangan = keterangan.toLowerCase();
        if (lowerKeterangan.includes('awas') || lowerKeterangan.includes('lebat') || lowerKeterangan.includes('ekstrem')) {
          severity = 'critical';
        } else if (lowerKeterangan.includes('siaga') || lowerKeterangan.includes('waspada')) {
          severity = 'warning';
        }

        let timestamp = new Date().toISOString();
        const rawDate = attrs.TANGGAL || attrs.Tanggal || attrs.tanggal;
        if (rawDate) timestamp = new Date(rawDate).toISOString();

        alerts.push({
          id: `bmkg-gis-sig-${attrs.OBJECTID || index}`,
          type: 'extreme_weather',
          severity,
          provinceId,
          title: `Cuaca Ekstrem - ${provinceName || 'Wilayah Indonesia'}`,
          description: keterangan,
          timestamp,
          latitude: lat,
          longitude: lon,
          affectedArea: provinceName || undefined,
        });
      });

      return alerts;
    } catch (error) {
      console.warn('Failed to fetch/parse BMKG GIS signature data, falling back to mock data:', error);
      return MOCK_SIGNATURES;
    }
  }

  static async fetchHotspotData(): Promise<DisasterAlert[]> {
    try {
      const data = await fetchWithCorsProxy(this.HOTSPOT_URL) as { error?: { message: string }; features?: any[] };
      if (data.error) throw new Error(`ArcGIS Error: ${data.error.message}`);

      const features = data.features || [];
      if (features.length === 0) return MOCK_HOTSPOTS;

      const alerts: DisasterAlert[] = [];
      features.forEach((feature: any, index: number) => {
        const attrs = feature.attributes || {};
        const geom = feature.geometry || {};

        let lat = -6.2088;
        let lon = 106.8456;
        let hasCoords = false;

        if (geom.x !== undefined && geom.y !== undefined) {
          const coords = webMercatorToWgs84(geom.x, geom.y);
          lat = coords.lat; lon = coords.lon; hasCoords = true;
        } else if (attrs.LINTANG !== undefined && attrs.BUJUR !== undefined) {
          lat = parseFloat(attrs.LINTANG); lon = parseFloat(attrs.BUJUR); hasCoords = true;
        }

        const provinceName = attrs.PROVINSI || attrs.Provinsi || attrs.provinsi || '';
        const provinceId = mapTextToProvinceId(provinceName);

        if (!hasCoords) {
          const office = KPWBI_OFFICES.find((o) => o.provinceId === provinceId) || KPWBI_OFFICES[0];
          lat = office.latitude; lon = office.longitude;
        }

        const confidence = attrs.CONFIDENCE || attrs.Confidence || attrs.confidence || '';
        let severity: AlertSeverity = 'watch';
        const confStr = String(confidence).toLowerCase();
        if (confStr.includes('high') || confStr.includes('tinggi') || parseFloat(confidence) > 80) {
          severity = 'critical';
        } else if (confStr.includes('medium') || confStr.includes('sedang') || parseFloat(confidence) > 50) {
          severity = 'warning';
        }

        const kab = attrs.KABUPATEN || attrs.Kabupaten || attrs.kabupaten || '';
        const kec = attrs.KECAMATAN || attrs.Kecamatan || attrs.kecamatan || '';

        let timestamp = new Date().toISOString();
        const rawDate = attrs.TANGGAL || attrs.Tanggal || attrs.tanggal;
        if (rawDate) timestamp = new Date(rawDate).toISOString();

        alerts.push({
          id: `bmkg-gis-hs-${attrs.OBJECTID || index}`,
          type: 'karhutla',
          severity,
          provinceId,
          title: `Hotspot Karhutla - ${kab || provinceName}`,
          description: `Terdeteksi titik panas (hotspot) dengan tingkat kepercayaan ${confidence || 'Sedang'} di Kecamatan ${kec || '-'}, Kabupaten ${kab || '-'}, Provinsi ${provinceName || '-'}.`,
          timestamp,
          latitude: lat,
          longitude: lon,
          affectedArea: kab || provinceName || undefined,
        });
      });

      return alerts;
    } catch (error) {
      console.warn('Failed to fetch/parse BMKG GIS hotspot data, falling back to mock data:', error);
      return MOCK_HOTSPOTS;
    }
  }
}
