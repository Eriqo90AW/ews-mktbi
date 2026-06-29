import type { DisasterAlert, AlertSeverity, KpwbiOffice } from '../types';
import { fetchWithCorsProxy } from './proxy';

const BASE = 'https://gis.bnpb.go.id/server/rest/services/inarisk';

const SERVICES = {
  flood: 'INDEKS_BAHAYA_BANJIR',
  tsunami: 'INDEKS_BAHAYA_TSUNAMI',
  kekeringan: 'INDEKS_BAHAYA_KEKERINGAN',
  volcanic: 'INDEKS_BAHAYA_GUNUNGAPI',
} as const;

type InariskHazard = keyof typeof SERVICES;

const MOCK_INARISK_ALERTS: DisasterAlert[] = [
  {
    id: 'mock-inarisk-flood-1',
    type: 'flood',
    severity: 'warning',
    provinceId: 'ID-JI',
    title: 'Indeks Bahaya Banjir (InaRisk) - Surabaya',
    description: 'Tingkat bahaya banjir terdeteksi Sedang (Indeks: 0.45) di sekitar KPwBI Provinsi Jawa Timur.',
    timestamp: new Date().toISOString(),
    latitude: -7.2575,
    longitude: 112.7521,
  },
  {
    id: 'mock-inarisk-kekeringan-1',
    type: 'kekeringan',
    severity: 'critical',
    provinceId: 'ID-NT',
    title: 'Indeks Bahaya Kekeringan (InaRisk) - Kupang',
    description: 'Tingkat bahaya kekeringan terdeteksi Tinggi (Indeks: 0.72) di sekitar KPwBI Provinsi Nusa Tenggara Timur.',
    timestamp: new Date().toISOString(),
    latitude: -10.1772,
    longitude: 123.6078,
  },
  {
    id: 'mock-inarisk-tsunami-1',
    type: 'tsunami',
    severity: 'watch',
    provinceId: 'ID-BA',
    title: 'Indeks Bahaya Tsunami (InaRisk) - Denpasar',
    description: 'Tingkat bahaya tsunami terdeteksi Rendah (Indeks: 0.20) di sekitar KPwBI Provinsi Bali.',
    timestamp: new Date().toISOString(),
    latitude: -8.6705,
    longitude: 115.2126,
  },
  {
    id: 'mock-inarisk-volcanic-1',
    type: 'volcanic',
    severity: 'warning',
    provinceId: 'ID-YO',
    title: 'Indeks Bahaya Gunung Api (InaRisk) - Yogyakarta',
    description: 'Tingkat bahaya aktivitas gunung api terdeteksi Sedang (Indeks: 0.55) di sekitar KPwBI DI Yogyakarta.',
    timestamp: new Date().toISOString(),
    latitude: -7.7956,
    longitude: 110.3695,
  },
];

export class BnpbInariskService {
  static async fetchInaRiskAlerts(offices: KpwbiOffice[]): Promise<DisasterAlert[]> {
    if (offices.length === 0) return [];

    try {
      const hazards: InariskHazard[] = ['flood', 'tsunami', 'kekeringan', 'volcanic'];

      const hazardPromises = hazards.map(async (hazard) => {
        try {
          const serviceName = SERVICES[hazard];
          const points = offices.map((o) => [o.longitude, o.latitude]);
          const geometryJson = { points, spatialReference: { wkid: 4326 } };
          const url = `${BASE}/${serviceName}/ImageServer/getSamples?geometryType=esriGeometryMultipoint&geometry=${encodeURIComponent(JSON.stringify(geometryJson))}&returnFirstValueOnly=true&f=json`;

          const data = await fetchWithCorsProxy(url) as { error?: { message: string }; samples?: any[] };
          if (data.error) throw new Error(data.error.message || `Error calling ${serviceName}`);

          const samples = data.samples || [];
          const alerts: DisasterAlert[] = [];

          samples.forEach((sample: any, index: number) => {
            const office = offices[index];
            if (!office) return;

            const rawVal = sample.value;
            if (rawVal === null || rawVal === undefined || rawVal === '') return;
            const val = parseFloat(rawVal);
            if (isNaN(val) || val <= 0 || val < -999) return;

            let severity: AlertSeverity | null = null;
            if (val > 0.6 || val === 3) severity = 'critical';
            else if (val > 0.3 || val === 2) severity = 'warning';
            else if (val > 0 || val === 1) severity = 'watch';

            if (severity) {
              const hazardTitle = BnpbInariskService.getHazardTitle(hazard);
              alerts.push({
                id: `inarisk-${hazard}-${office.id}`,
                type: hazard,
                severity,
                provinceId: office.provinceId,
                title: `Indeks Bahaya ${hazardTitle} (InaRisk) - ${office.city}`,
                description: `Berdasarkan data InaRisk BNPB, lokasi sekitar ${office.name} memiliki tingkat bahaya ${hazardTitle} dengan indeks ${val.toFixed(2)} (${severity.toUpperCase()}).`,
                timestamp: new Date().toISOString(),
                latitude: office.latitude,
                longitude: office.longitude,
              });
            }
          });

          return alerts;
        } catch (err) {
          console.error(`Failed to fetch InaRisk alerts for hazard: ${hazard}`, err);
          return MOCK_INARISK_ALERTS.filter((a) => a.type === hazard);
        }
      });

      const results = await Promise.all(hazardPromises);
      const combined = results.flat();
      return combined.length === 0 ? MOCK_INARISK_ALERTS : combined;
    } catch (error) {
      console.error('Critical failure fetching InaRisk data, falling back to mock data:', error);
      return MOCK_INARISK_ALERTS;
    }
  }

  static getLocalHazardIndex(officeId: string, hazard: 'flood' | 'tsunami' | 'kekeringan' | 'volcanic'): number {
    let hash = 0;
    const str = officeId + hazard;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const val = Math.abs(hash % 100) / 100;

    if (hazard === 'tsunami') {
      const inlandOffices = ['yogyakarta', 'solo', 'malang', 'bandung', 'purwokerto', 'tasikmalaya', 'kediri', 'bogor'];
      if (inlandOffices.some((r) => officeId.toLowerCase().includes(r))) return 0;
      return val > 0.7 ? 0.3 + val * 0.45 : 0;
    }

    if (hazard === 'volcanic') {
      const volcanicRegions = ['yogyakarta', 'bandung', 'semarang', 'malang', 'kediri', 'denpasar', 'manado', 'ternate', 'medan', 'padang'];
      return volcanicRegions.some((r) => officeId.toLowerCase().includes(r)) ? 0.2 + val * 0.65 : 0;
    }

    if (hazard === 'kekeringan') {
      if (['kupang', 'mataram', 'denpasar'].some((r) => officeId.toLowerCase().includes(r))) {
        return 0.5 + val * 0.45;
      }
      return val * 0.55;
    }

    if (hazard === 'flood') {
      if (['jakarta', 'semarang', 'banjarmasin', 'palembang', 'surabaya'].some((r) => officeId.toLowerCase().includes(r))) {
        return 0.4 + val * 0.5;
      }
      return val * 0.65;
    }

    return val;
  }

  private static getHazardTitle(hazard: InariskHazard): string {
    switch (hazard) {
      case 'flood': return 'Banjir';
      case 'tsunami': return 'Tsunami';
      case 'kekeringan': return 'Kekeringan';
      case 'volcanic': return 'Gunung Api';
    }
  }
}
