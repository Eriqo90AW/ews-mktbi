import type { DrcLocation } from '../types';

/**
 * Special BI infrastructure locations (Data Centers & Disaster Recovery Centers).
 * Rendered as triangle markers on the map.
 */
export const DRC_LOCATIONS: DrcLocation[] = [
  {
    id: 'drc-sinergi-karawang',
    name: 'Sinergi',
    fullName: 'Gedung Sinergi — Data Center Bank Indonesia',
    city: 'Karawang',
    latitude: -6.3215,
    longitude: 107.3381,
    type: 'DC',
  },
  {
    id: 'drc-cilangkap',
    name: 'Cilangkap',
    fullName: 'DRC Cilangkap — Disaster Recovery Center Bank Indonesia',
    city: 'Jakarta Timur',
    latitude: -6.3063,
    longitude: 106.9269,
    type: 'DRC',
  },
];
