import type { DisasterAlert } from '../types';

// Let's seed mock alerts with relative times to simulate live data
const now = new Date();

export const MOCK_ALERTS: DisasterAlert[] = [
  {
    id: 'alert-1',
    type: 'earthquake',
    severity: 3,
    provinceId: 'ID-SU', // Sumatera Utara (Medan)
    title: 'M 6.4 Earthquake Warning',
    description: 'A major earthquake occurred near the western coast of Nias, Sumatera Utara. Potential localized damage. Residents are advised to stay away from unstable structures.',
    timestamp: new Date(now.getTime() - 15 * 60000).toISOString(), // 15 mins ago
    magnitude: 6.4,
    depth: 10,
    affectedArea: 'Nias, Gunungsitoli, and surrounding coastlines'
  },
  {
    id: 'alert-2',
    type: 'tsunami',
    severity: 3,
    provinceId: 'ID-AC', // Aceh (Banda Aceh)
    title: 'Tsunami Threat Assessment',
    description: 'High-energy seismic activity detected offshore. Monitoring sea level gauges. Coastal communities should move to designated high grounds immediately.',
    timestamp: new Date(now.getTime() - 22 * 60000).toISOString(), // 22 mins ago
    affectedArea: 'West coast of Aceh, Sabang, and Simeulue Island'
  },
  {
    id: 'alert-3',
    type: 'volcanic',
    severity: 2,
    provinceId: 'ID-YO', // DI Yogyakarta (Yogyakarta)
    title: 'Mount Merapi Level III (Siaga)',
    description: 'Increased seismic activity and multiple pyroclastic flows (wedhus gembel) stretching 1.8km southwest. 3km exclusion zone enforced.',
    timestamp: new Date(now.getTime() - 2 * 3600000).toISOString(), // 2 hours ago
    affectedArea: 'Sleman Regency, Mount Merapi Slope Areas'
  },
  {
    id: 'alert-4',
    type: 'flood',
    severity: 2,
    provinceId: 'ID-JK', // DKI Jakarta (Jakarta)
    title: 'Extreme Flash Flood Alert',
    description: 'Katulampa Dam water level reached Alert Status II. Continuous heavy rainfall in Puncak has triggered flooding in low-lying areas of East and North Jakarta.',
    timestamp: new Date(now.getTime() - 4 * 3600000).toISOString(), // 4 hours ago
    waterLevel: 2.1,
    affectedArea: 'Ciliwung River Basin, Kampung Melayu, Bidara Cina'
  },
  {
    id: 'alert-5',
    type: 'landslide',
    severity: 1,
    provinceId: 'ID-JB', // Jawa Barat (Bandung)
    title: 'Landslide Vulnerability Advisory',
    description: 'Saturated soil conditions due to 3 days of torrential rain. Risk of landslides along the steep slopes of southern Bandung regency.',
    timestamp: new Date(now.getTime() - 8 * 3600000).toISOString(), // 8 hours ago
    affectedArea: 'Ciwidey, Pangalengan, and hilly terrains of South Bandung'
  },
  {
    id: 'alert-6',
    type: 'volcanic',
    severity: 1,
    provinceId: 'ID-NT', // Nusa Tenggara Timur (Kupang)
    title: 'Mount Lewotobi Activity Watch',
    description: 'Subtle ash emission plumes rising 500m above peak. Alert status remains at Level II (Waspada). Hikers advised against summiting.',
    timestamp: new Date(now.getTime() - 12 * 3600000).toISOString(), // 12 hours ago
    affectedArea: 'East Flores Regency'
  }
];
