import type { DisasterAlert, AlertSeverity } from '../types';
import { fetchHtmlWithCorsProxy } from './proxy';
import { mapTextToProvinceId } from '../utils/provinceMap';
import { getJakartaDateString } from './magmaService';

export interface BnpbKarhutlaRow {
  no: number;
  kib: string;
  regencyId: string;
  date: string;
  event: string;
  location: string;
  regency: string;
  province: string;
  documentationUrl: string;
  cause: string;
  meninggal: number;
  hilang: number;
  terluka: number;
  rumahRusak: number;
  rumahTerendam: number;
  fasumRusak: number;
}

// Coordinates mapping for major regencies/provinces involved in mock data
export function getRegencyCoordinates(regency: string, province: string): [number, number] {
  const r = regency.toLowerCase();
  const p = province.toLowerCase();
  
  if (r.includes('bontang')) return [0.1333, 117.5000];
  if (r.includes('taliabu')) return [-1.8833, 124.8333];
  if (r.includes('indragiri hulu') || r.includes('rengat')) return [-0.4500, 102.5500];
  if (r.includes('sukoharjo')) return [-7.6833, 110.8333];
  if (r.includes('kutai barat')) return [-0.6000, 115.5000];
  if (r.includes('langsa')) return [4.4667, 97.9667];
  if (r.includes('demak')) return [-6.8917, 110.6389];
  if (r.includes('sumedang')) return [-6.8583, 107.9167];
  
  if (p.includes('kalimantan timur')) return [-1.2654, 116.8312];
  if (p.includes('maluku utara')) return [0.7893, 127.3768];
  if (p.includes('riau')) return [0.5004, 101.5471];
  if (p.includes('jawa tengah')) return [-7.1510, 110.1403];
  if (p.includes('aceh')) return [4.6951, 96.7494];
  if (p.includes('jawa barat')) return [-7.0909, 107.6689];
  
  return [-2.5489, 118.0149]; // Center of Indonesia default
}

const MOCK_KARHUTLA_ROWS: BnpbKarhutlaRow[] = [
  { no: 1, kib: '', regencyId: '1402', date: '2026-06-28', event: 'KEBAKARAN HUTAN DAN LAHAN', location: 'Kecamatan:\nDs. Sungai Raya, Kec. Rengat', regency: 'Indragiri Hulu', province: 'Riau', documentationUrl: '', cause: '', meninggal: 0, hilang: 0, terluka: 0, rumahRusak: 0, rumahTerendam: 0, fasumRusak: 0 },
  { no: 2, kib: '', regencyId: '6474', date: '2026-06-28', event: 'KEBAKARAN HUTAN DAN LAHAN', location: 'Kecamatan:\nKec. Bontang Utara\nKel. Gunung Elai', regency: 'Kota Bontang', province: 'Kalimantan Timur', documentationUrl: '', cause: '', meninggal: 0, hilang: 0, terluka: 0, rumahRusak: 0, rumahTerendam: 0, fasumRusak: 0 },
  { no: 3, kib: '', regencyId: '8208', date: '2026-06-28', event: 'KEBAKARAN HUTAN DAN LAHAN', location: 'Kecamatan:\nKec. Taliabu Barat', regency: 'Pulau Taliabu', province: 'Maluku Utara', documentationUrl: 'https://drive.google.com/drive/folders/1vYs3I6nsmlrvtqnczOxl5wSuD8du8RAF', cause: '', meninggal: 0, hilang: 0, terluka: 0, rumahRusak: 0, rumahTerendam: 0, fasumRusak: 0 },
  { no: 4, kib: '', regencyId: '3311', date: '2026-06-27', event: 'KEBAKARAN HUTAN DAN LAHAN', location: 'Kecamatan:\nKec. Bulu\nDs. Gentan', regency: 'Sukoharjo', province: 'Jawa Tengah', documentationUrl: '', cause: '', meninggal: 0, hilang: 0, terluka: 0, rumahRusak: 0, rumahTerendam: 0, fasumRusak: 0 },
  { no: 5, kib: '', regencyId: '6407', date: '2026-06-27', event: 'KEBAKARAN HUTAN DAN LAHAN', location: 'Kecamatan:\nKec. Damai\nKel. Kampung Jengan Danum', regency: 'Kutai Barat', province: 'Kalimantan Timur', documentationUrl: '', cause: '', meninggal: 0, hilang: 0, terluka: 0, rumahRusak: 0, rumahTerendam: 0, fasumRusak: 0 },
  { no: 6, kib: '', regencyId: '1174', date: '2026-06-27', event: 'KEBAKARAN HUTAN DAN LAHAN', location: 'Kecamatan:\nKec. Langsa Baro\nGp Birem Puntong', regency: 'Kota Langsa', province: 'Aceh', documentationUrl: 'https://drive.google.com/drive/folders/18EhhgTaPWhelGEebSDOadqQl5218Z6Pf', cause: '', meninggal: 0, hilang: 0, terluka: 0, rumahRusak: 0, rumahTerendam: 0, fasumRusak: 0 },
  { no: 7, kib: '', regencyId: '1402', date: '2026-06-27', event: 'KEBAKARAN HUTAN DAN LAHAN', location: 'Kecamatan:\nKel. Sekip Hilir, Kec. Rengat', regency: 'Indragiri Hulu', province: 'Riau', documentationUrl: '', cause: '', meninggal: 0, hilang: 0, terluka: 0, rumahRusak: 0, rumahTerendam: 0, fasumRusak: 0 },
  { no: 8, kib: '', regencyId: '3311', date: '2026-06-27', event: 'KEBAKARAN HUTAN DAN LAHAN', location: 'Kecamatan:\nKec. Bulu\nDs. Gentan', regency: 'Sukoharjo', province: 'Jawa Tengah', documentationUrl: '', cause: '', meninggal: 0, hilang: 0, terluka: 0, rumahRusak: 0, rumahTerendam: 0, fasumRusak: 0 },
  { no: 9, kib: '', regencyId: '3211', date: '2026-06-27', event: 'KEBAKARAN HUTAN DAN LAHAN', location: 'Kecamatan:\n', regency: 'Sumedang', province: 'Jawa Barat', documentationUrl: '', cause: '', meninggal: 0, hilang: 0, terluka: 0, rumahRusak: 0, rumahTerendam: 0, fasumRusak: 0 },
  { no: 11, kib: '', regencyId: '1906', date: '2026-06-26', event: 'KEBAKARAN HUTAN DAN LAHAN', location: 'Kecamatan:\nKec. Manggar\nDs. Padang', regency: 'Belitung Timur', province: 'Kepulauan Bangka Belitung', documentationUrl: 'https://drive.google.com/drive/folders/1-dDvryKm_taqLm5kJG_anJ3VsVIIxTR7?usp=drive_link', cause: '', meninggal: 0, hilang: 0, terluka: 0, rumahRusak: 0, rumahTerendam: 0, fasumRusak: 0 },
  { no: 14, kib: '', regencyId: '1173', date: '2026-06-25', event: 'KEBAKARAN HUTAN DAN LAHAN', location: 'Kecamatan:\nKec. Muara Satu\nGp.Meuria Paloh', regency: 'Kota Lhokseumawe', province: 'Aceh', documentationUrl: 'https://drive.google.com/drive/u/0/folders/1CxaeQcV_-Eyy4dBMf2HYGdWWL--Vh0y9', cause: '', meninggal: 0, hilang: 0, terluka: 0, rumahRusak: 0, rumahTerendam: 0, fasumRusak: 0 },
  { no: 17, kib: '', regencyId: '9203', date: '2026-06-24', event: 'KEBAKARAN HUTAN DAN LAHAN', location: 'Kecamatan:\nDistrik Bomberay', regency: 'Fak Fak', province: 'Papua Barat', documentationUrl: 'https://drive.google.com/drive/folders/1tjLJ5PVSH13h5C7O9HZ5z7b0xaCl5J40?usp=drive_link', cause: '', meninggal: 0, hilang: 0, terluka: 0, rumahRusak: 0, rumahTerendam: 0, fasumRusak: 0 },
  { no: 19, kib: '', regencyId: '3517', date: '2026-06-23', event: 'KEBAKARAN HUTAN DAN LAHAN', location: 'Kecamatan:\nKec. Ngoro', regency: 'Jombang', province: 'Jawa Timur', documentationUrl: '', cause: '', meninggal: 0, hilang: 0, terluka: 0, rumahRusak: 0, rumahTerendam: 0, fasumRusak: 0 },
  { no: 25, kib: '', regencyId: '3512', date: '2026-06-21', event: 'KEBAKARAN HUTAN DAN LAHAN', location: 'Kecamatan:\nKec. Panji', regency: 'Situbondo', province: 'Jawa Timur', documentationUrl: 'https://drive.google.com/drive/folders/1oRSN4ZSEq3RgNaqfQ0UFgMaZpKKh8PU5', cause: '', meninggal: 0, hilang: 0, terluka: 0, rumahRusak: 0, rumahTerendam: 0, fasumRusak: 0 },
  { no: 26, kib: '', regencyId: '3309', date: '2026-06-21', event: 'KEBAKARAN HUTAN DAN LAHAN', location: 'Kecamatan:\nKec. Teras\nDs. Randusari', regency: 'Boyolali', province: 'Jawa Tengah', documentationUrl: 'https://drive.google.com/drive/folders/1AOOzKzcqmqH3T-Au8g4oXB2xOtMUh43A', cause: '', meninggal: 0, hilang: 0, terluka: 0, rumahRusak: 0, rumahTerendam: 0, fasumRusak: 0 },
  { no: 27, kib: '', regencyId: '3310', date: '2026-06-20', event: 'KEBAKARAN HUTAN DAN LAHAN', location: 'Kecamatan:\nKec. Pedan\nDs. Kaligawe', regency: 'Klaten', province: 'Jawa Tengah', documentationUrl: 'https://drive.google.com/drive/folders/1PGQZfVW0YJr8bhRweN5_sXwpHznOCTSv', cause: '', meninggal: 0, hilang: 0, terluka: 0, rumahRusak: 0, rumahTerendam: 0, fasumRusak: 0 },
  { no: 30, kib: '', regencyId: '6303', date: '2026-06-20', event: 'KEBAKARAN HUTAN DAN LAHAN', location: 'Kecamatan:\nKec. Martapura\nDs. Pesayangan\nKec. Cintapuri Darussalam\nDs. Simpang Lima', regency: 'Banjar', province: 'Kalimantan Selatan', documentationUrl: 'https://drive.google.com/drive/folders/1x-A2qTIECVBH70ybcvv9A2s1BZ-pBiE8', cause: '', meninggal: 0, hilang: 0, terluka: 0, rumahRusak: 0, rumahTerendam: 0, fasumRusak: 0 }
];

export function rowToAlert(row: BnpbKarhutlaRow, todayStr: string): DisasterAlert {
  const coords = getRegencyCoordinates(row.regency, row.province);
  
  // Severity Logic
  // - critical: if meninggal > 0 or rumahRusak > 5
  // - warning: if terluka > 0 or rumahRusak > 0 or date is today
  // - watch: else
  let severity: AlertSeverity = 1;
  if (row.meninggal > 0 || row.rumahRusak > 5) {
    severity = 3;
  } else if (row.terluka > 0 || row.rumahRusak > 0 || row.date === todayStr) {
    severity = 2;
  }

  // Format description
  const cleanLocation = row.location.replace(/\\n/g, '\n').trim();
  
  let detailsText = '';
  if (row.meninggal > 0) detailsText += `• Meninggal: ${row.meninggal} jiwa\n`;
  if (row.hilang > 0) detailsText += `• Hilang: ${row.hilang} jiwa\n`;
  if (row.terluka > 0) detailsText += `• Terluka: ${row.terluka} jiwa\n`;
  if (row.rumahRusak > 0) detailsText += `• Rumah Rusak: ${row.rumahRusak} unit\n`;
  if (row.rumahTerendam > 0) detailsText += `• Rumah Terendam: ${row.rumahTerendam} unit\n`;
  if (row.fasumRusak > 0) detailsText += `• Fasilitas Umum Rusak: ${row.fasumRusak} unit\n`;

  let fullDescription = '';
  if (cleanLocation) fullDescription += `Lokasi:\n${cleanLocation}\n\n`;
  if (row.cause) fullDescription += `Penyebab: ${row.cause}\n\n`;
  if (detailsText) fullDescription += `Dampak Bencana:\n${detailsText}\n`;
  if (row.documentationUrl) fullDescription += `Dokumentasi: ${row.documentationUrl}`;

  fullDescription = fullDescription.trim() || 'Laporan kejadian kebakaran hutan dan lahan.';

  return {
    id: `bnpb-karhutla-${row.regency.toLowerCase().replace(/\s+/g, '-')}-${row.date}-${row.no}`,
    type: 'karhutla',
    severity,
    provinceId: mapTextToProvinceId(row.province),
    title: `Karhutla - ${row.regency}, ${row.province}`,
    description: fullDescription,
    timestamp: new Date(`${row.date}T00:00:00Z`).toISOString(),
    latitude: coords[0],
    longitude: coords[1],
    affectedArea: row.regency
  };
}

export const BnpbKarhutlaService = {
  async fetchKarhutlaAlerts(fallbackToMock: boolean = true): Promise<DisasterAlert[]> {
    const todayStr = getJakartaDateString();
    const today = new Date(todayStr + 'T00:00:00Z');
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 7);
    const cutoffStr = sevenDaysAgo.toISOString().slice(0, 10);

    try {
      const url = 'https://gis.bnpb.go.id/databencana/tabel/pencarian.php';
      const htmlText = await fetchHtmlWithCorsProxy(url);

      if (!htmlText) throw new Error('Empty response from proxy');

      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');

      const rows = doc.querySelectorAll('table.datatab tbody tr');
      const alerts: DisasterAlert[] = [];

      rows.forEach((row) => {
        const cols = row.querySelectorAll('td');
        if (cols.length < 16) return;

        const eventType = cols[4].textContent?.trim() || '';
        if (eventType !== 'KEBAKARAN HUTAN DAN LAHAN') return;

        const no = parseInt(cols[0].textContent?.trim() || '0');
        const kib = cols[1].textContent?.trim() || '';
        const regencyId = cols[2].textContent?.trim() || '';
        const date = cols[3].textContent?.trim() || '';
        const location = cols[5].textContent?.trim() || '';
        const regency = cols[6].textContent?.trim() || '';
        const province = cols[7].textContent?.trim() || '';
        const docLink = cols[8].querySelector('a')?.getAttribute('href') || '';
        const cause = cols[9].textContent?.trim() || '';
        const meninggal = parseInt(cols[10].textContent?.trim() || '0') || 0;
        const hilang = parseInt(cols[11].textContent?.trim() || '0') || 0;
        const terluka = parseInt(cols[12].textContent?.trim() || '0') || 0;
        const rumahRusak = parseInt(cols[13].textContent?.trim() || '0') || 0;
        const rumahTerendam = parseInt(cols[14].textContent?.trim() || '0') || 0;
        const fasumRusak = parseInt(cols[15].textContent?.trim() || '0') || 0;

        if (date >= cutoffStr && date <= todayStr) {
          alerts.push(rowToAlert({
            no, kib, regencyId, date, event: eventType, location, regency, province,
            documentationUrl: docLink, cause, meninggal, hilang, terluka, rumahRusak,
            rumahTerendam, fasumRusak
          }, todayStr));
        }
      });

      if (alerts.length > 0) {
        return alerts;
      }

      throw new Error('Scraped 0 matches, falling back to mock');
    } catch (e) {
      if (!fallbackToMock) {
        throw e;
      }

      const matchedMockRows = MOCK_KARHUTLA_ROWS.filter((row) => row.date >= cutoffStr && row.date <= todayStr);

      return matchedMockRows.map((row) => rowToAlert(row, todayStr));
    }
  }
};
