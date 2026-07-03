import type { DisasterAlert, AlertSeverity } from '../types';
import { fetchWithCorsProxy } from './proxy';
import { mapTextToProvinceId } from '../utils/provinceMap';

export interface SipongiRow {
  provinsi: string;
  kabupaten: string;
  sumber: string;
  confidence: string; // e.g. "High", "Medium", "Low"
  counter: number; // number of hotspots
}

const PROVINCE_COORDINATES: Record<string, [number, number]> = {
  'aceh': [4.6951, 96.7494],
  'sumatera utara': [2.1121, 99.3906],
  'sumatera barat': [-0.7399, 100.8000],
  'riau': [0.5004, 101.5471],
  'kepulauan riau': [3.9457, 108.1428],
  'jambi': [-1.6101, 102.7753],
  'bengkulu': [-3.7928, 102.2608],
  'sumatera selatan': [-3.3194, 103.9144],
  'kepulauan bangka belitung': [-2.7410, 106.4406],
  'bangka belitung': [-2.7410, 106.4406],
  'lampung': [-4.5586, 105.4000],
  'dki jakarta': [-6.2088, 106.8456],
  'jakarta': [-6.2088, 106.8456],
  'jawa barat': [-7.0909, 107.6689],
  'banten': [-6.4058, 106.0600],
  'jawa tengah': [-7.1510, 110.1403],
  'di yogyakarta': [-7.8753, 110.4262],
  'yogyakarta': [-7.8753, 110.4262],
  'jawa timur': [-7.5360, 112.2384],
  'bali': [-8.4095, 115.1889],
  'nusa tenggara barat': [-8.6529, 117.3616],
  'nusa tenggara timur': [-8.6574, 121.0794],
  'kalimantan barat': [-0.2788, 111.4753],
  'kalimantan tengah': [-1.6814, 113.3824],
  'kalimantan selatan': [-3.0926, 115.2838],
  'kalimantan timur': [-1.2654, 116.8312],
  'kalimantan utara': [3.0731, 116.0414],
  'sulawesi utara': [0.6247, 123.9750],
  'gorontalo': [0.6999, 122.4467],
  'sulawesi tengah': [-1.4300, 121.4456],
  'sulawesi barat': [-2.8441, 119.2320],
  'sulawesi selatan': [-3.6687, 119.9740],
  'sulawesi tenggara': [-4.1449, 122.1746],
  'maluku': [-3.2384, 130.1453],
  'maluku utara': [0.7893, 127.3768],
  'papua barat': [-1.3361, 132.5700],
  'papua': [-4.2699, 138.0803],
};

export function getSipongiCoordinates(regency: string, province: string): [number, number] {
  const r = regency.toLowerCase();
  const p = province.toLowerCase();

  // Specific regency coordinate overrides
  if (r.includes('bontang')) return [0.1333, 117.5000];
  if (r.includes('taliabu')) return [-1.8833, 124.8333];
  if (r.includes('indragiri hulu') || r.includes('rengat')) return [-0.4500, 102.5500];
  if (r.includes('sukoharjo')) return [-7.6833, 110.8333];
  if (r.includes('kutai barat')) return [-0.6000, 115.5000];
  if (r.includes('langsa')) return [4.4667, 97.9667];
  if (r.includes('demak')) return [-6.8917, 110.6389];
  if (r.includes('sumedang')) return [-6.8583, 107.9167];

  // Try mapping by province center coordinates
  for (const [provName, coords] of Object.entries(PROVINCE_COORDINATES)) {
    if (p.includes(provName)) {
      return coords;
    }
  }

  return [-2.5489, 118.0149]; // Center of Indonesia default
}

const MOCK_SIPONGI_ROWS: SipongiRow[] = [
  { provinsi: 'Riau', kabupaten: 'Indragiri Hulu', sumber: 'NASA-NOAA20', confidence: 'High', counter: 3 },
  { provinsi: 'Kalimantan Timur', kabupaten: 'Kutai Barat', sumber: 'NASA-SNPP', confidence: 'Medium', counter: 1 },
  { provinsi: 'Maluku Utara', kabupaten: 'Pulau Taliabu', sumber: 'NASA-MODIS', confidence: 'Low', counter: 2 },
  { provinsi: 'Jawa Tengah', kabupaten: 'Sukoharjo', sumber: 'NASA-NOAA20', confidence: 'Medium', counter: 1 },
  { provinsi: 'Aceh', kabupaten: 'Kota Langsa', sumber: 'NASA-SNPP', confidence: 'High', counter: 5 },
];

export function rowToAlert(row: SipongiRow, index: number, totalCount: number): DisasterAlert {
  const coords = getSipongiCoordinates(row.kabupaten, row.provinsi);
  
  // Severity Logic: High -> 3, Medium -> 2, Low -> 1
  let severity: AlertSeverity = 1;
  const conf = row.confidence.toLowerCase();
  if (conf.includes('high')) {
    severity = 3;
  } else if (conf.includes('medium')) {
    severity = 2;
  }

  const timestamp = new Date().toISOString();

  const description = `Sebaran titik panas (hotspot) terdeteksi di wilayah berikut:
• Provinsi: ${row.provinsi}
• Kabupaten/Kota: ${row.kabupaten}
• Satelit Pengamat: ${row.sumber}
• Tingkat Kepercayaan: ${row.confidence}
• Jumlah Titik Panas: ${row.counter} titik

Keterangan: Hotspot menunjukkan indikasi suhu permukaan yang relatif tinggi dibandingkan sekitarnya, berpotensi sebagai titik kebakaran hutan dan lahan.

Sumber Data: SIPONGI KEMENHUT`.trim();

  return {
    id: `sipongi-karhutla-${row.provinsi.toLowerCase().replace(/\s+/g, '-')}-${row.kabupaten.toLowerCase().replace(/\s+/g, '-')}-${index}`,
    type: 'karhutla',
    severity,
    provinceId: mapTextToProvinceId(row.provinsi),
    title: `Karhutla - Hotspot Sipongi (${row.kabupaten})`,
    description,
    timestamp,
    latitude: coords[0],
    longitude: coords[1],
    affectedArea: row.kabupaten
  };
}

export const SipongiService = {
  async fetchKarhutlaAlerts(fallbackToMock: boolean = true): Promise<DisasterAlert[]> {
    const apiBase = "https://opsroom.sipongidata.my.id";
    try {
      // 1. Fetch configuration to get active satellite source
      let satelliteSource = "lapan";
      try {
        const configRes = await fetchWithCorsProxy(`${apiBase}/api/konfigurasi`) as any;
        if (configRes && configRes.sumber_satelit) {
          satelliteSource = configRes.sumber_satelit;
        }
      } catch (err) {
        console.warn("Failed to fetch Sipongi konfigurasi, using default 'lapan':", err);
      }

      // 2. Query hotspot data from the last 24 hours
      const satellite = satelliteSource === "nasa" ? "all-nasa" : "all-lapan";
      const sebaranUrl = `${apiBase}/api/sebaran?late=24&satelit=${satellite}&confidence=all&provinsi=all`;
      
      const sebaranRes = await fetchWithCorsProxy(sebaranUrl) as any;
      if (!sebaranRes || !sebaranRes.data) {
        throw new Error("Invalid response structure from Sipongi API");
      }

      const rows = sebaranRes.data as SipongiRow[];
      if (!rows || rows.length === 0) {
        throw new Error("Sipongi API returned 0 results");
      }

      return rows.map((row, idx) => rowToAlert(row, idx, rows.length));
    } catch (e) {
      console.warn("Failed to fetch from Sipongi, falling back to mock data:", e);
      if (!fallbackToMock) {
        throw e;
      }
      return MOCK_SIPONGI_ROWS.map((row, idx) => rowToAlert(row, idx, MOCK_SIPONGI_ROWS.length));
    }
  }
};
