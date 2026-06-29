export type DisasterType = 'earthquake' | 'flood' | 'volcanic' | 'tsunami' | 'landslide' | 'extreme_weather' | 'karhutla' | 'kekeringan';

export type AlertSeverity = 'critical' | 'warning' | 'watch';

export interface Province {
  id: string;
  name: string;
  capital: string;
  latitude: number;
  longitude: number;
  island: string;
}

export interface KpwbiOffice {
  id: string;
  name: string;
  city: string;
  provinceId: string;
  latitude: number;
  longitude: number;
  region: string;
  isKorwil: boolean;
  isKantorPusat?: boolean;
}

export interface DisasterAlert {
  id: string;
  type: DisasterType;
  severity: AlertSeverity;
  provinceId: string; // Links to Province.id
  title: string;
  description: string;
  timestamp: string; // ISO string or format
  latitude?: number; // Epi-center or event latitude
  longitude?: number; // Epi-center or event longitude
  magnitude?: number; // Optional magnitude for earthquakes
  depth?: number; // Optional depth in km for earthquakes
  waterLevel?: number; // Optional water level in meters for floods
  affectedArea?: string; // Optional text describing local areas
  isForecast?: boolean;
  forecastDay?: number; // 1, 2, or 3
  forecastDateStr?: string; // e.g. "25 Jun 2026"
}

export interface DrcLocation {
  id: string;
  name: string;       // e.g. "Sinergi"
  fullName: string;   // e.g. "Gedung Sinergi — Data Center BI"
  city: string;
  latitude: number;
  longitude: number;
  type: 'DC' | 'DRC'; // Data Center or Disaster Recovery Center
}

export type VolcanoLevel = 'III' | 'II' | 'I';

export interface VolcanoSeismicity {
  count: number;
  type: string;  // e.g. "gempa Letusan/Erupsi"
}

export interface VolcanoReport {
  no: number;
  name: string;
  visual: string;
  seismicity: VolcanoSeismicity[];
  recommendation: string;
  level: VolcanoLevel;
}

// === Disaster Risk Calculator Types ===

export type VulnerabilityLevel = 'Tinggi' | 'Sedang' | 'Rendah';

export type RiskLevel = 'Tinggi' | 'Sedang' | 'Rendah';

export interface DisasterEvent {
  id: string;
  latitude: number;
  longitude: number;
  radiusKm: number;          // radius dampak bencana
  disasterScore: 1 | 2 | 3;  // skor bencana real-time
  type: DisasterType;
  title: string;
}

export interface MarkedLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
}

export interface RiskCalcResult {
  event: DisasterEvent;
  vulnerabilityLevel: VulnerabilityLevel;
  vulnerabilityScore: number; // 1, 2, atau 3
  riskScore: number;          // disasterScore × vulnerabilityScore (1–9)
  riskLevel: RiskLevel;       // mapping dari riskScore
  affectedLocations: MarkedLocation[]; // lokasi terdampak dalam radius
  shouldAlert: boolean;       // true jika riskLevel "Tinggi" DAN ada lokasi terdampak
}


