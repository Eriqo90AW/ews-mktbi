import type { VolcanoReport, VolcanoLevel, VolcanoSeismicity, DisasterAlert, AlertSeverity } from '../types';
import { fetchHtmlWithCorsProxy } from './proxy';


// Detailed structured mock fallback data representing the state on June 28, 2026
export const MOCK_VOLCANO_REPORTS: VolcanoReport[] = [
  // Level III (Siaga)
  {
    no: 1,
    name: 'Awu',
    visual: 'Gunung api terlihat jelas hingga tertutup kabut. Asap kawah tidak teramati. Cuaca berawan, angin lemah ke arah utara. Suhu udara sekitar 22-26°C. Kelembaban 64-80%.',
    seismicity: [
      { count: 4, type: 'gempa Vulkanik Dangkal' },
      { count: 17, type: 'gempa Tektonik Jauh' }
    ],
    recommendation: '1. Masyarakat dan pengunjung/wisatawan agar tidak mendekati dan beraktivitas di dalam radius 4 kilometer dari kawah puncak G. Awu.\n2. Masyarakat di sekitar G. Awu diharap tetap tenang, tidak terpancing isu-isu mengenai aktivitas G. Awu yang tidak dapat dipertanggungjawabkan kebenarannya. Masyarakat harap mengikuti arahan dari Badan Penanggulangan Bencana Daerah Kabupaten Kepulauan Sangihe.\n3. Masyarakat maupun Pemerintah Daerah dan instansi terkait lainnya dapat memantau perkembangan tingkat aktivitas maupun rekomendasi G. Awu setiap saat melalui aplikasi MAGMA Indonesia yang dapat diakses melalui website https://magma.esdm.go.id atau melalui aplikasi android MAGMA Indonesia yang dapat diunduh di Google Play.',
    level: 'III'
  },
  {
    no: 2,
    name: 'Lewotobi Laki-laki',
    visual: 'Gunung api terlihat jelas hingga tertutup kabut. Teramati asap kawah utama berwarna putih dengan intensitas tipis tinggi sekitar 50 meter dari puncak. Letusan teramati dengan tinggi 300-500 meter dari puncak, kolom abu letusan berwarna kelabu.',
    seismicity: [
      { count: 2, type: 'gempa Letusan/Erupsi' },
      { count: 2, type: 'gempa Hembusan' },
      { count: 2, type: 'gempa Tremor Non-Harmonik' },
      { count: 1, type: 'gempa Low Frequency' },
      { count: 1, type: 'gempa Vulkanik Dalam' },
      { count: 2, type: 'gempa Tektonik Jauh' }
    ],
    recommendation: '1. Masyarakat di sekitar G. Lewotobi Laki-laki dan pengunjung/wisatawan tidak melakukan aktivitas apapun dalam radius 5 Km dari pusat erupsi G. Lewotobi Laki-laki .\n2. Masyarakat agar tenang dan mengikuti arahan Pemda serta tidak mempercayai isu-isu yan tidak jelas sumbernya.\n3. Masyarakat di sekitar G. Lewotobi Laki-laki mewaspadai potensi banjir lahar hujan pada sungai-sungai yang berhulu di puncak G. Lewotobi Laki-laki jika terjadi hujan dengan intensitas tinggi terutama daerah Dulipali, Padang Pasir, Nobo, Nurabelen, Klatanlo, Hokeng jaya, Boru, Nawakote.\n4. Masyarakat yang terdampak hujan abu G. Lewotobi Laki-laki, memakai masker/penutup hidung-mulut untuk menghindari bahaya abu vulkanik pada sistem pernafasan.\n5. Pemerintah Daerah senantiasa berkoordinasi dengan Pos Pengamatan G. Lewotobi Laki-laki di Desa Pululera, Kecamatan Wulanggitang, Kabupaten Flores Timur, Provinsi Nusa Tenggara Timur atau Pusat Vulkanologi dan Mitigasi Bencana Geologi, Badan Geologi di Bandung.\n6. Pusat Vulkanologi dan Mitigasi Bencana Geologi akan selalu berkoordinasi dengan BPBD Provinsi Nusa Tenggara Timur dan Satlak PB setempat dalam memberikan informasi tentang kegiatan G. Lewotobi Laki-laki. Untuk informasi lebih jelas dapat menghubungi Pos Pengamatan G. Lewotobi Laki-laki.',
    level: 'III'
  },
  {
    no: 3,
    name: 'Merapi',
    visual: 'Gunung api terlihat jelas hingga tertutup kabut. Asap kawah nihil. Terjadi Guguran, namun secara visual, jarak dan arah guguran tidak teramati.',
    seismicity: [
      { count: 20, type: 'gempa Guguran' },
      { count: 22, type: 'gempa Hybrid/Fase Banyak' },
      { count: 1, type: 'gempa Tektonik Jauh' }
    ],
    recommendation: '1. Potensi bahaya saat ini berupa guguran lava dan awanpanas pada sektor selatan-barat daya meliputi Sungai Boyong sejauh maksimal 5 km, Sungai Bedog, Krasak, Bebeng sejauh maksimal 7 km. Pada sektor tenggara meliputi Sungai Woro sejauh maksimal 3 km dan Sungai Gendol 5 km. Sedangkan lontaran material vulkanik bila terjadi letusan eksplosif dapat menjangkau radius 3 km dari puncak.\n2. Masyarakat agar tidak melakukan kegiatan apapun di daerah potensi bahaya.\n3. Masyarakat agar mengantisipasi gangguan akibat abu vulkanik dari erupsi Gunung Merapi serta mewaspadai bahaya lahar terutama saat terjadi hujan di seputar G. Merapi.\n4. Penambangan di alur sungai yang berhulu di Gunung Merapi dalam KRB III direkomendasikan untuk dihentikan.\n5. Pelaku wisata direkomendasikan tidak melakukan kegiatan pada daerah potensi bahaya dan bukaan kawah sejauh 5 km dari puncak Gunung Merapi.\n6. Jika terjadi perubahan aktivitas yang signifikan, maka status aktivitas Gunung Merapi akan segera ditinjau kembali.',
    level: 'III'
  },
  {
    no: 4,
    name: 'Semeru',
    visual: 'Gunung api terlihat jelas hingga tertutup kabut. Asap kawah tidak teramati. Terekam Gempa Letusan, namun secara visual tinggi letusan and warna abu tidak teramati. Terjadi Guguran, namun secara visual, jarak dan arah guguran tidak teramati.',
    seismicity: [
      { count: 14, type: 'gempa Letusan/Erupsi' },
      { count: 5, type: 'gempa Guguran' },
      { count: 5, type: 'gempa Hembusan' },
      { count: 2, type: 'gempa Tektonik Jauh' }
    ],
    recommendation: '1. Tidak melakukan aktivitas apapun di sektor tenggara di sepanjang Besuk Kobokan, sejauh 13 km dari puncak (pusat erupsi). Di luar jarak tersebut, masyarakat tidak melakukan aktivitas pada jarak 500 meter dari tepi sungai (sempadan sungai) di sepanjang Besuk Kobokan karena berpotensi terlanda perluasan awan panas dan aliran lahar hingga jarak 17 km dari puncak.\n2. Tidak beraktivitas dalam radius 5 Km dari kawah/puncak Gunung Api Semeru karena rawan terhadap bahaya lontaran batu (pijar).\n3. Mewaspadai potensi awan panas guguran (APG), guguran lava, dan lahar di sepanjang aliran sungai/lembah yang berhulu di puncak Gunung Api Semeru, terutama sepanjang Besuk Kobokan, Besuk Bang, Besuk Kembar, dan Besuk Sat serta potensi lahar pada sungai-sungai kecil yang merupakan anak sungai dari Besuk Kobokan.',
    level: 'III'
  },
  // Level II (Waspada)
  {
    no: 1,
    name: 'Anak Krakatau',
    visual: 'Gunung api terlihat jelas hingga tertutup kabut. Teramati asap kawah utama berwarna cokelat dan hitam dengan intensitas sedang hingga tebal tinggi sekitar 10-100 meter dari puncak. Cuaca berawan hingga hujan, angin lemah ke arah timur dan barat laut.',
    seismicity: [
      { count: 38, type: 'gempa Hembusan' },
      { count: 1, type: 'gempa Harmonik' },
      { count: 7, type: 'gempa Low Frequency' },
      { count: 32, type: 'gempa Hybrid/Fase Banyak' },
      { count: 2, type: 'gempa Vulkanik Dangkal' },
      { count: 1, type: 'gempa Vulkanik Dalam' },
      { count: 1, type: 'gempa Tektonik Lokal' },
      { count: 1, type: 'gempa Tremor Menerus' }
    ],
    recommendation: 'Masyarakat/wisatawan tidak diperbolehkan mendekati kawah dalam radius 2 km dari kawah',
    level: 'II'
  },
  {
    no: 2,
    name: 'Bromo',
    visual: 'Gunung api terlihat jelas hingga tertutup kabut. Teramati asap kawah utama berwarna putih dengan intensitas tipis tinggi sekitar 50-400 meter dari puncak.',
    seismicity: [
      { count: 1, type: 'gempa Tremor Menerus' }
    ],
    recommendation: '1. Masyarakat di sekitar G. Bromo dan pengunjung/wisatawan/ pendaki tidak memasuki kawasan dalam radius 1 km dari kawah aktif G. Bromo.\n2. Masyarakat di sekitar G. Bromo, pedagang, wisatawan, pendaki, dan pengelola wisata G. Bromo agar mewaspadai terjadinya letusan freatik yang bersifat tiba - tiba dan tanpa didahului oleh gejala-gejala vulkanik yang jelas.',
    level: 'II'
  },
  {
    no: 3,
    name: 'Dukono',
    visual: 'Gunung api terlihat jelas hingga tertutup kabut. Teramati asap kawah utama berwarna putih dan kelabu dengan intensitas sedang hingga tebal tinggi sekitar 600 meter dari puncak. Letusan teramati dengan tinggi 600 meter dari puncak, kolom abu letusan berwarna putih hingga kelabu.',
    seismicity: [
      { count: 11, type: 'gempa Letusan/Erupsi' },
      { count: 5, type: 'gempa Low Frequency' },
      { count: 1, type: 'gempa Tektonik Jauh' },
      { count: 1, type: 'gempa Tremor Menerus' }
    ],
    recommendation: '1. Masyarakat di sekitar G. Dukono dan pengunjung/wisatawan agar tidak beraktivitas, mendaki, dan mendekati Kawah Malupang Warirang di dalam radius 2 km.\n2. Mengingat letusan dengan abu vulkanik secara periodik terjadi dan sebaran abu mengikuti arah dan kecepatan angin, sehingga area landaan abunya tidak tetap, maka direkomendasikan agar masyarakat di sekitar G. Dukono untuk selalu menyediakan masker/penutup hidung dan mulut.',
    level: 'II'
  },
  {
    no: 4,
    name: 'Gamalama',
    visual: 'Gunung api terlihat jelas hingga tertutup kabut. Asap kawah tidak teramati. Cuaca cerah hingga berawan, angin lemah hingga sedang ke arah timur, selatan dan barat.',
    seismicity: [
      { count: 2, type: 'gempa Tektonik Lokal' },
      { count: 2, type: 'gempa Tektonik Jauh' }
    ],
    recommendation: '1. Masyarakat di sekitar G. Gamalama dan pengunjung/wisatawan agar tidak beraktivitas di dalam radius 1.5 km dari kawah puncak G.Gamalama.\n2. Pada musim hujan, masyarakat yang tinggal di sekitar aliran sungai yang berhulu di G. Gamalama agar mewaspadai potensi ancaman bahaya sekunder berupa aliran lahar.',
    level: 'II'
  },
  {
    no: 5,
    name: 'Ili Lewotolok',
    visual: 'Gunung api terlihat jelas hingga tertutup kabut. Teramati asap kawah utama berwarna putih dengan intensitas sedang hingga tebal tinggi sekitar 20-200 meter dari puncak. Letusan teramati dengan tinggi 200-500 meter dari puncak, kolom abu letusan berwarna putih, kelabu hingga hitam.',
    seismicity: [
      { count: 134, type: 'gempa Letusan/Erupsi' },
      { count: 148, type: 'gempa Hembusan' },
      { count: 8, type: 'gempa Harmonik' },
      { count: 1, type: 'gempa Tremor Non-Harmonik' },
      { count: 1, type: 'gempa Vulkanik Dangkal' }
    ],
    recommendation: '1. Masyarakat di sekitar G. Ili Lewotolok maupun pengunjung/pendaki/wisatawan agar tidak memasuki dan tidak melakukan aktivitas di dalam wilayah radius 2 km dari pusat aktivitas G. Ili Lewotolok.\n2. Mewaspadai potensi ancaman bahaya guguran/longsoran lava dan awan panas pada sektor selatan dan tenggara, sektor barat, serta sektor timur laut G. Ili Lewotolok.\n3. Menggunakan masker pelindung mulut dan hidung serta perlengkapan lain untuk melindungi mata dan kulit.',
    level: 'II'
  },
  {
    no: 6,
    name: 'Kerinci',
    visual: 'Gunung api terlihat jelas hingga tertutup kabut. Teramati asap kawah utama berwarna putih dengan intensitas tipis tinggi sekitar 100 meter dari puncak.',
    seismicity: [
      { count: 10, type: 'gempa Hembusan' },
      { count: 48, type: 'gempa Low Frequency' },
      { count: 45, type: 'gempa Hybrid/Fase Banyak' },
      { count: 1, type: 'gempa Tektonik Jauh' },
      { count: 1, type: 'gempa Tremor Menerus' }
    ],
    recommendation: '1. Masyarakat disekitar gunungapi kerinci dan pengunjung/wisatawan tidak diperbolehkan mendaki kawah yang ada dipuncak gunungapi kerinci didalam radius 3 km dari kawah aktif.\n2. Sebaiknya jalur penerbangan disekitar gunungapi kerinci dihindari karena sewaktu-waktu masih memiliki potensi letusan abu dengan ketinggian yang dapat mengganggu jalur penerbangan.',
    level: 'II'
  },
  {
    no: 7,
    name: 'Marapi',
    visual: 'Gunung api terlihat jelas. Teramati asap kawah utama berwarna putih dengan intensitas tipis tinggi sekitar 100 meter dari puncak.',
    seismicity: [
      { count: 4, type: 'gempa Tektonik Lokal' },
      { count: 4, type: 'gempa Tektonik Jauh' }
    ],
    recommendation: 'Masyarakat disekitar Gunungapi Marapi dan pengunjung/wisatawan tidak diperbolehkan mendaki Gunungapi Marapi pada radius 3Km dari kawah/puncak.',
    level: 'II'
  },
  // Level I (Normal)
  {
    no: 1,
    name: 'Ebulobo',
    visual: 'Gunung api terlihat jelas hingga tertutup kabut. Teramati asap kawah utama berwarna putih dengan intensitas tipis tinggi sekitar 25-50 meter dari puncak.',
    seismicity: [
      { count: 3, type: 'gempa Tektonik Lokal' },
      { count: 5, type: 'gempa Tektonik Jauh' }
    ],
    recommendation: 'Masyarakat di sekitar G. Ebulobo dan pengunjung/wisatawan agar membatasi aktivitas (tidak berlama-lama) dan tidak bermalam di area kawah aktif di Utara puncak, serta tidak mendekati lubang tembusan gas yang berada di sekitar kawah untuk menghindari potensi bahaya gas beracun.',
    level: 'I'
  },
  {
    no: 2,
    name: 'Egon',
    visual: 'Gunung api terlihat jelas hingga tertutup kabut. Asap kawah tidak teramati. Cuaca cerah hingga berawan, angin lemah ke arah tenggara dan selatan. Suhu udara sekitar 22-26°C.',
    seismicity: [
      { count: 2, type: 'gempa Hembusan' },
      { count: 1, type: 'gempa Vulkanik Dangkal' },
      { count: 3, type: 'gempa Vulkanik Dalam' },
      { count: 1, type: 'gempa Tektonik Lokal' },
      { count: 3, type: 'gempa Tektonik Jauh' }
    ],
    recommendation: 'Masyarakat di sekitar G. Egon dan pengunjung/wisatawan dapat beraktivitas seperti biasanya namun disarankan agar membatasi aktivitas (tidak berlama-lama) dan tidak bermalam di area kawah aktif, serta tidak mendekati lubang tembusan gas yang berada di sekitar area kawah untuk menghindari potensi bahaya yang mungkin terjadi, seperti di antaranya gas beracun.',
    level: 'I'
  },
  {
    no: 3,
    name: 'Ile Werung',
    visual: 'Gunung api terlihat jelas. Asap kawah nihil. Cuaca cerah hingga berawan, angin lemah ke arah selatan. Suhu udara sekitar 21-26°C.',
    seismicity: [
      { count: 3, type: 'gempa Tektonik Jauh' }
    ],
    recommendation: 'Masyarakat di sekitar G. Ile Werung dan pengunjung/wisatawan agar membatasi aktivitas and tidak berlama-lama berada di sekitar kawah, tidak bermalam di area kawah aktif, and tidak mendekati lubang tembusan gas untuk menghindari potensi bahaya gas beracun.',
    level: 'I'
  }
];

function parseVolcanoTable(tableEl: Element, level: VolcanoLevel): VolcanoReport[] {
  const reports: VolcanoReport[] = [];
  const rows = tableEl.querySelectorAll('tbody tr');

  rows.forEach((row) => {
    const cols = row.querySelectorAll('td');
    if (cols.length < 5) return;

    const no = parseInt(cols[0].textContent?.trim() || '0');
    const name = cols[1].textContent?.trim() || '';

    // Process Visual column
    const paragraphs = Array.from(cols[2].querySelectorAll('p'))
      .map(p => p.textContent?.trim() || '')
      .filter(Boolean);
    const visual = paragraphs.length > 0 ? paragraphs.join('\n') : cols[2].textContent?.trim() || '';

    // Process Seismicity column
    const seismicity: VolcanoSeismicity[] = [];
    const listItems = cols[3].querySelectorAll('li');
    listItems.forEach((li) => {
      const text = li.textContent?.trim() || '';
      // Matches "X kali gempa Y"
      const match = text.match(/^(\d+)\s+kali\s+(.+)$/i);
      if (match) {
        seismicity.push({
          count: parseInt(match[1]),
          type: match[2].trim()
        });
      } else if (text) {
        seismicity.push({
          count: 1,
          type: text
        });
      }
    });

    // Process Recommendations column
    const recParagraphs = Array.from(cols[4].querySelectorAll('li'))
      .map(li => li.textContent?.trim() || '')
      .filter(Boolean);
    const recommendation = recParagraphs.length > 0 ? recParagraphs.join('\n') : cols[4].textContent?.trim() || '';

    reports.push({
      no,
      name,
      visual,
      seismicity,
      recommendation,
      level
    });
  });

  return reports;
}

export function getJakartaDateString(d: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(d);
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  return `${year}-${month}-${day}`;
}

export const MagmaService = {
  async fetchDailyReport(dateStr: string, fallbackToMock: boolean = true): Promise<VolcanoReport[]> {
    const url = `https://magma.esdm.go.id/v1/gunung-api/laporan-harian/${dateStr}`;
    try {
      const htmlText = await fetchHtmlWithCorsProxy(url);
      if (!htmlText) throw new Error('Empty response from proxy');

      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');

      // Search cards by headers
      const reports: VolcanoReport[] = [];
      const cards = doc.querySelectorAll('.card');

      cards.forEach((card) => {
        const titleEl = card.querySelector('.slim-card-title');
        if (!titleEl) return;

        const titleText = titleEl.textContent || '';
        let level: VolcanoLevel | null = null;
        if (titleText.includes('Level III')) {
          level = 'III';
        } else if (titleText.includes('Level II')) {
          level = 'II';
        } else if (titleText.includes('Level I')) {
          level = 'I';
        }

        if (level) {
          const tableEl = card.querySelector('table');
          if (tableEl) {
            reports.push(...parseVolcanoTable(tableEl, level));
          }
        }
      });

      // Fallback to searching by IDs if card structures changed
      if (reports.length === 0) {
        const tabMapping: { id: string; level: VolcanoLevel }[] = [
          { id: 'tab-0', level: 'III' },
          { id: 'tab-1', level: 'II' },
          { id: 'tab-2', level: 'I' }
        ];

        tabMapping.forEach(({ id, level }) => {
          const tabEl = doc.getElementById(id);
          if (tabEl) {
            const tableEl = tabEl.querySelector('table');
            if (tableEl) {
              reports.push(...parseVolcanoTable(tableEl, level));
            }
          }
        });
      }

      if (reports.length === 0) {
        if (!fallbackToMock) {
          throw new Error('Scraping returned 0 reports');
        }
        console.warn('Scraping returned 0 reports, falling back to mock data');
        return MOCK_VOLCANO_REPORTS;
      }

      return reports;
    } catch (e) {
      if (!fallbackToMock) {
        throw e;
      }
      console.warn('Failed to fetch from MAGMA Indonesia, falling back to mock data:', e);
      return MOCK_VOLCANO_REPORTS;
    }
  },

  async fetchLiveAlerts(fallbackToMock: boolean = true): Promise<DisasterAlert[]> {
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 3600000);

    const todayStr = getJakartaDateString(today);
    const yesterdayStr = getJakartaDateString(yesterday);

    try {
      const [todayReports, yesterdayReports] = await Promise.all([
        this.fetchDailyReport(todayStr, fallbackToMock),
        this.fetchDailyReport(yesterdayStr, fallbackToMock)
      ]);

      const mergedMap = new Map<string, VolcanoReport>();
      
      yesterdayReports.forEach((r) => {
        mergedMap.set(r.name, r);
      });
      
      todayReports.forEach((r) => {
        mergedMap.set(r.name, r);
      });

      const finalReports = Array.from(mergedMap.values());

      return finalReports.map((report) => {
        const isToday = todayReports.some((tr) => tr.name === report.name);
        return volcanoReportToAlert(report, isToday ? todayStr : yesterdayStr);
      });
    } catch (e) {
      if (!fallbackToMock) {
        throw e;
      }
      console.warn('Failed to load live volcano alerts, falling back to mock alerts:', e);
      return MOCK_VOLCANO_REPORTS.map((r) => volcanoReportToAlert(r, yesterdayStr));
    }
  }
};

export function getProvinceIdForVolcano(volcanoName: string): string {
  const name = volcanoName.toLowerCase();
  if (name.includes('awu')) return 'ID-SA'; // Sulawesi Utara
  if (name.includes('lewotobi')) return 'ID-NT'; // Nusa Tenggara Timur
  if (name.includes('merapi')) return 'ID-YO'; // DI Yogyakarta
  if (name.includes('semeru')) return 'ID-JI'; // Jawa Timur
  if (name.includes('krakatau')) return 'ID-LA'; // Lampung
  if (name.includes('bromo')) return 'ID-JI'; // Jawa Timur
  if (name.includes('dukono')) return 'ID-MU'; // Maluku Utara
  if (name.includes('gamalama')) return 'ID-MU'; // Maluku Utara
  if (name.includes('lewo')) return 'ID-NT'; // Nusa Tenggara Timur (Ili Lewotolok)
  if (name.includes('kerinci')) return 'ID-JA'; // Jambi
  if (name.includes('ebulobo')) return 'ID-NT'; // Nusa Tenggara Timur
  if (name.includes('egon')) return 'ID-NT'; // Nusa Tenggara Timur
  if (name.includes('werung')) return 'ID-NT'; // Nusa Tenggara Timur
  return 'ID-JT'; // Default / Fallback to Jawa Tengah
}

export function getVolcanoCoordinates(name: string): [number, number] {
  const n = name.toLowerCase();
  if (n.includes('awu')) return [3.682, 125.446];
  if (n.includes('lewotobi')) return [-8.542, 122.775];
  if (n.includes('merapi')) return [-7.540, 110.446];
  if (n.includes('semeru')) return [-8.108, 112.922];
  if (n.includes('krakatau')) return [-6.102, 105.423];
  if (n.includes('bromo')) return [-7.942, 112.953];
  if (n.includes('dukono')) return [1.693, 127.894];
  if (n.includes('gamalama')) return [0.80, 127.325];
  if (n.includes('lewo')) return [-8.272, 123.505]; // Ili Lewotolok
  if (n.includes('kerinci')) return [-1.697, 101.264];
  if (n.includes('marapi')) return [-0.381, 100.473];
  if (n.includes('ebulobo')) return [-8.814, 121.185];
  if (n.includes('egon')) return [-8.677, 122.454];
  if (n.includes('werung')) return [-8.52, 123.58];
  return [-2.5489, 118.0149]; // Default center of Indonesia
}

export function volcanoReportToAlert(report: VolcanoReport, dateStr: string): DisasterAlert {
  const coords = getVolcanoCoordinates(report.name);
  const severityMap: Record<VolcanoLevel, AlertSeverity> = {
    'III': 'critical',
    'II': 'warning',
    'I': 'watch'
  };

  const statusLabel = {
    'III': 'Level III (Siaga)',
    'II': 'Level II (Waspada)',
    'I': 'Level I (Normal)'
  }[report.level];

  const seismicityText = report.seismicity
    .map(s => `• ${s.count} kali ${s.type}`)
    .join('\n');

  const fullDescription = `Visual:
${report.visual}

Kegempaan:
${seismicityText || 'Tidak terdeteksi gempa signifikan.'}

Rekomendasi:
${report.recommendation}`;

  return {
    id: `volcano-${report.name.toLowerCase()}-${dateStr}`,
    type: 'volcanic',
    severity: severityMap[report.level],
    provinceId: getProvinceIdForVolcano(report.name),
    title: `Gunung ${report.name} - ${statusLabel}`,
    description: fullDescription,
    timestamp: new Date(dateStr).toISOString(),
    latitude: coords[0],
    longitude: coords[1]
  };
}
