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

// ONI data Apr 2024 – Jun 2025 (source: NOAA/BMKG, Jan 2025 cutoff then extrapolated)
export const ENSO_HISTORY: EnsoMonth[] = [
  { month: '2024-04', label: 'Apr 2024', oni: 0.9, phase: 'el_nino', intensity: 'lemah' },
  { month: '2024-05', label: 'Mei 2024', oni: 0.6, phase: 'el_nino', intensity: 'lemah' },
  { month: '2024-06', label: 'Jun 2024', oni: 0.2, phase: 'netral', intensity: 'netral' },
  { month: '2024-07', label: 'Jul 2024', oni: -0.1, phase: 'netral', intensity: 'netral' },
  { month: '2024-08', label: 'Agu 2024', oni: -0.4, phase: 'la_nina', intensity: 'lemah' },
  { month: '2024-09', label: 'Sep 2024', oni: -0.7, phase: 'la_nina', intensity: 'lemah' },
  { month: '2024-10', label: 'Okt 2024', oni: -0.9, phase: 'la_nina', intensity: 'lemah' },
  { month: '2024-11', label: 'Nov 2024', oni: -0.8, phase: 'la_nina', intensity: 'lemah' },
  { month: '2024-12', label: 'Des 2024', oni: -0.7, phase: 'la_nina', intensity: 'lemah' },
  { month: '2025-01', label: 'Jan 2025', oni: -0.5, phase: 'la_nina', intensity: 'lemah' },
  { month: '2025-02', label: 'Feb 2025', oni: -0.4, phase: 'la_nina', intensity: 'lemah' },
  { month: '2025-03', label: 'Mar 2025', oni: -0.2, phase: 'netral', intensity: 'netral' },
  { month: '2025-04', label: 'Apr 2025', oni: 0.0, phase: 'netral', intensity: 'netral' },
  { month: '2025-05', label: 'Mei 2025', oni: 0.1, phase: 'netral', intensity: 'netral' },
  { month: '2025-06', label: 'Jun 2025', oni: 0.3, phase: 'netral', intensity: 'netral' },
];

// Current conditions (latest data point)
export const ENSO_CURRENT: EnsoMonth = ENSO_HISTORY[ENSO_HISTORY.length - 1];

// Strategic outlook for decision-making
export const ENSO_OUTLOOK: EnsoOutlook = {
  phase: 'netral',
  confidence: 'Sedang',
  description:
    'Kondisi ENSO saat ini menunjukkan fase Netral setelah La Niña lemah yang berlangsung Sep 2024 – Feb 2025. ' +
    'Curah hujan di sebagian besar wilayah Indonesia cenderung normal. ' +
    'Perlu waspada potensi transisi ke El Niño lemah pada semester kedua 2025.',
  elevatedHazards: [
    {
      hazard: 'banjir',
      regions: 'Sumatera (Aceh, Sumatera Barat), Sulawesi Tengah, Maluku',
    },
    {
      hazard: 'kekeringan',
      regions: 'Nusa Tenggara Timur, Nusa Tenggara Barat, Jawa Timur bagian timur',
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
