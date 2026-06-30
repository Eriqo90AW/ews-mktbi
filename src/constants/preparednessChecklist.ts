export interface ChecklistItemDef {
  id: string;
  label: string;
  description: string;
  category: 'umum' | 'gempa' | 'banjir';
  floodOnly?: boolean;
  gempaOnly?: boolean;
}

export const CHECKLIST_ITEMS: ChecklistItemDef[] = [
  {
    id: 'fasilitas-umum',
    label: 'Kelengkapan Fasilitas Kpw',
    description:
      'Kotak P3K, senter/lampu darurat, radio komunikasi cadangan, dan prosedur evakuasi tersedia di gedung.',
    category: 'umum',
  },
  {
    id: 'asesmen-gedung',
    label: 'Asesmen Gedung oleh Satker Dpan',
    description:
      'Gedung KPw telah dilakukan asesmen struktural dan keandalan bangunan oleh Satker Departemen Pengembangan dan Pengawasan (Dpan) atau konsultan terakreditasi.',
    category: 'gempa',
    gempaOnly: true,
  },
  {
    id: 'simulasi-gempa',
    label: 'Simulasi Gempa Rutin',
    description:
      'KPw telah melakukan simulasi evakuasi gempa bumi minimal sekali dalam setahun bersama seluruh pegawai.',
    category: 'gempa',
    gempaOnly: true,
  },
  {
    id: 'jalur-evakuasi',
    label: 'Jalur Evakuasi & Titik Kumpul',
    description:
      'Jalur evakuasi darurat dan titik kumpul (meeting point) sudah ditandai, dikomunikasikan, dan diketahui seluruh pegawai.',
    category: 'gempa',
  },
  {
    id: 'perahu-karet',
    label: 'Ketersediaan Perahu Karet',
    description:
      'Perahu karet/inflatable rescue boat tersedia atau ada kesepakatan peminjaman dari instansi terkait untuk wilayah dengan risiko banjir tinggi.',
    category: 'banjir',
    floodOnly: true,
  },
];

export type ChecklistStatus = Record<string, boolean>; // itemId → checked
