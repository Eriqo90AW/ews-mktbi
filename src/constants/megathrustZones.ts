export interface MegathrustZone {
  id: string;
  name: string;
  path: [number, number][]; // [lat, lng] polyline along trench
  centroid: [number, number];
  maxMagnitude: number; // Mw
  impactRadiusKm: number;
  affectedProvinces: string[]; // province IDs
}

export const MEGATHRUST_ZONES: MegathrustZone[] = [
  {
    id: 'mgt-aceh-andaman',
    name: 'Segmen Aceh-Andaman',
    path: [
      [14.0, 93.5], [12.0, 94.5], [10.0, 95.0], [8.0, 95.5], [6.5, 95.0], [5.5, 95.3],
    ],
    centroid: [8.5, 94.8],
    maxMagnitude: 9.2,
    impactRadiusKm: 450,
    affectedProvinces: ['ID-AC', 'ID-SU'],
  },
  {
    id: 'mgt-nias-simeulue',
    name: 'Segmen Nias-Simeulue',
    path: [
      [4.0, 95.5], [2.5, 96.0], [1.0, 96.5], [0.0, 97.0],
    ],
    centroid: [2.0, 96.3],
    maxMagnitude: 8.7,
    impactRadiusKm: 350,
    affectedProvinces: ['ID-AC', 'ID-SU'],
  },
  {
    id: 'mgt-mentawai-siberut',
    name: 'Segmen Mentawai-Siberut',
    path: [
      [-1.0, 97.5], [-2.0, 98.0], [-3.0, 98.5], [-4.0, 99.0],
    ],
    centroid: [-2.5, 98.3],
    maxMagnitude: 8.9,
    impactRadiusKm: 380,
    affectedProvinces: ['ID-SB'],
  },
  {
    id: 'mgt-mentawai-pagai',
    name: 'Segmen Mentawai-Pagai',
    path: [
      [-4.0, 99.0], [-5.0, 99.5], [-5.5, 100.0], [-6.0, 100.5],
    ],
    centroid: [-5.0, 99.8],
    maxMagnitude: 8.8,
    impactRadiusKm: 360,
    affectedProvinces: ['ID-SB', 'ID-BE'],
  },
  {
    id: 'mgt-enggano',
    name: 'Segmen Enggano',
    path: [
      [-6.0, 100.5], [-6.5, 101.0], [-7.0, 101.5], [-7.5, 102.0],
    ],
    centroid: [-6.8, 101.2],
    maxMagnitude: 8.4,
    impactRadiusKm: 300,
    affectedProvinces: ['ID-BE', 'ID-LA'],
  },
  {
    id: 'mgt-selat-sunda',
    name: 'Segmen Selat Sunda',
    path: [
      [-7.5, 102.0], [-8.0, 103.0], [-8.5, 104.0], [-8.8, 105.0],
    ],
    centroid: [-8.2, 103.5],
    maxMagnitude: 8.7,
    impactRadiusKm: 350,
    affectedProvinces: ['ID-LA', 'ID-BT', 'ID-JK'],
  },
  {
    id: 'mgt-jawa-barat',
    name: 'Segmen Jawa Barat',
    path: [
      [-8.8, 105.0], [-9.0, 106.5], [-9.2, 107.5], [-9.3, 108.5],
    ],
    centroid: [-9.1, 107.0],
    maxMagnitude: 8.7,
    impactRadiusKm: 350,
    affectedProvinces: ['ID-JK', 'ID-JB'],
  },
  {
    id: 'mgt-jawa-tengah-timur',
    name: 'Segmen Jawa Tengah-Timur',
    path: [
      [-9.3, 108.5], [-9.4, 110.0], [-9.5, 111.5], [-9.6, 113.0],
    ],
    centroid: [-9.4, 110.5],
    maxMagnitude: 8.7,
    impactRadiusKm: 350,
    affectedProvinces: ['ID-JT', 'ID-YO', 'ID-JI'],
  },
  {
    id: 'mgt-bali',
    name: 'Segmen Bali',
    path: [
      [-9.6, 113.0], [-9.7, 114.0], [-9.8, 115.0], [-9.9, 116.0],
    ],
    centroid: [-9.8, 114.5],
    maxMagnitude: 8.5,
    impactRadiusKm: 320,
    affectedProvinces: ['ID-BA'],
  },
  {
    id: 'mgt-ntb',
    name: 'Segmen Nusa Tenggara Barat',
    path: [
      [-9.9, 116.0], [-10.0, 117.0], [-10.1, 118.0], [-10.2, 119.0],
    ],
    centroid: [-10.0, 117.5],
    maxMagnitude: 8.5,
    impactRadiusKm: 320,
    affectedProvinces: ['ID-NB'],
  },
  {
    id: 'mgt-sumba',
    name: 'Segmen Sumba',
    path: [
      [-10.2, 119.0], [-10.4, 120.5], [-10.6, 122.0], [-10.8, 123.5],
    ],
    centroid: [-10.5, 121.0],
    maxMagnitude: 8.5,
    impactRadiusKm: 320,
    affectedProvinces: ['ID-NT'],
  },
  {
    id: 'mgt-sulawesi-utara',
    name: 'Segmen Sulawesi Utara',
    path: [
      [5.0, 122.0], [3.5, 124.0], [2.0, 126.0], [1.0, 127.0],
    ],
    centroid: [2.8, 124.8],
    maxMagnitude: 8.4,
    impactRadiusKm: 300,
    affectedProvinces: ['ID-SA', 'ID-GO'],
  },
  {
    id: 'mgt-banda',
    name: 'Segmen Banda',
    path: [
      [-4.0, 128.0], [-5.5, 130.0], [-7.0, 131.5], [-8.0, 133.0],
    ],
    centroid: [-6.0, 130.5],
    maxMagnitude: 8.2,
    impactRadiusKm: 280,
    affectedProvinces: ['ID-MA', 'ID-MU'],
  },
];
