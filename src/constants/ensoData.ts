export type EnsoPhase = 'el_nino' | 'la_nina' | 'netral';

export interface EnsoMonth {
  month: string;  // e.g. "2025-01"
  label: string;  // e.g. "Jan 2025"
  oni: number;    // Oceanic Niño Index value
  phase: EnsoPhase;
  intensity: 'lemah' | 'sedang' | 'kuat' | 'netral';
}

export interface EnsoOutlook {
  phase: EnsoPhase;
  confidence: 'Tinggi' | 'Sedang' | 'Rendah';
  description: string;
  elevatedHazards: Array<{ hazard: 'banjir' | 'kekeringan'; regions: string }>;
}

// ONI data Nov 2025 – Jun 2026 (8 months ending in Jun 2026)
export const ENSO_HISTORY: EnsoMonth[] = [
  { month: '2025-11', label: 'Nov 2025', oni: -0.8, phase: 'la_nina', intensity: 'lemah' },
  { month: '2025-12', label: 'Des 2025', oni: -0.7, phase: 'la_nina', intensity: 'lemah' },
  { month: '2026-01', label: 'Jan 2026', oni: -0.5, phase: 'la_nina', intensity: 'lemah' },
  { month: '2026-02', label: 'Feb 2026', oni: -0.3, phase: 'netral', intensity: 'netral' },
  { month: '2026-03', label: 'Mar 2026', oni: -0.1, phase: 'netral', intensity: 'netral' },
  { month: '2026-04', label: 'Apr 2026', oni: 0.2, phase: 'netral', intensity: 'netral' },
  { month: '2026-05', label: 'Mei 2026', oni: 0.6, phase: 'el_nino', intensity: 'lemah' },
  { month: '2026-06', label: 'Jun 2026', oni: 0.9, phase: 'el_nino', intensity: 'lemah' },
];

// Current conditions (latest data point)
export const ENSO_CURRENT: EnsoMonth = ENSO_HISTORY[ENSO_HISTORY.length - 1];

// Strategic outlook for decision-making
export const ENSO_OUTLOOK: EnsoOutlook = {
  phase: 'el_nino',
  confidence: 'Tinggi',
  description:
    'Kondisi ENSO saat ini menunjukkan fase El Niño lemah/sedang setelah masa transisi Netral di awal tahun 2026. ' +
    'Indeks ONI mencapai +0.9 (di atas ambang batas El Niño +0.5). ' +
    'Diprakirakan El Niño moderat hingga kuat akan terus berkembang dan bertahan hingga akhir tahun 2026 dengan keyakinan tinggi.',
  elevatedHazards: [
    {
      hazard: 'kekeringan',
      regions: 'Jawa, Bali, Nusa Tenggara Barat, Nusa Tenggara Timur, Sulawesi bagian selatan, dan Papua',
    },
    {
      hazard: 'banjir',
      regions: 'Sumatera Utara dan Aceh (potensi anomali hujan lokal/hujan ekstrem pendek)',
    },
  ],
};

export function getPhaseColor(phase: EnsoPhase): string {
  return phase === 'el_nino' ? '#ef4444' : phase === 'la_nina' ? '#3b82f6' : '#6b7280';
}

export function getPhaseLabel(phase: EnsoPhase): string {
  return phase === 'el_nino' ? 'El Niño' : phase === 'la_nina' ? 'La Niña' : 'Netral';
}

// Returns province IDs that should be visually elevated on the map given the current ENSO phase
export function getEnsoElevatedProvinces(phase: EnsoPhase): { flood: string[]; drought: string[] } {
  if (phase === 'la_nina') {
    return {
      flood: ['ID-AC', 'ID-SB', 'ID-RI', 'ID-ST', 'ID-SA', 'ID-GO', 'ID-MA', 'ID-PA'],
      drought: [],
    };
  }
  if (phase === 'el_nino') {
    return {
      flood: [],
      drought: ['ID-NT', 'ID-NB', 'ID-JI', 'ID-BA', 'ID-SS'],
    };
  }
  // Netral — use static baseline flood-vulnerable provinces from InaRISK
  return {
    flood: ['ID-JK', 'ID-JT', 'ID-KS', 'ID-SS', 'ID-JI'],
    drought: ['ID-NT'],
  };
}
