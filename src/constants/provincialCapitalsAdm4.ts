export interface CapitalAdm4Mapping {
  provinceId: string;
  provinceName: string;
  cityName: string;
  adm4Code: string;
}

export const PROVINCIAL_CAPITALS_ADM4: Record<string, CapitalAdm4Mapping> = {
  'ID-AC': { provinceId: 'ID-AC', provinceName: 'Aceh', cityName: 'Kota Banda Aceh', adm4Code: '11.71.01.2001' },
  'ID-SU': { provinceId: 'ID-SU', provinceName: 'Sumatera Utara', cityName: 'Kota Medan', adm4Code: '12.71.01.1001' },
  'ID-SB': { provinceId: 'ID-SB', provinceName: 'Sumatera Barat', cityName: 'Kota Padang', adm4Code: '13.71.01.1001' },
  'ID-RI': { provinceId: 'ID-RI', provinceName: 'Riau', cityName: 'Kota Pekanbaru', adm4Code: '14.71.01.1002' },
  'ID-JA': { provinceId: 'ID-JA', provinceName: 'Jambi', cityName: 'Kota Jambi', adm4Code: '15.71.01.1001' },
  'ID-SS': { provinceId: 'ID-SS', provinceName: 'Sumatera Selatan', cityName: 'Kota Palembang', adm4Code: '16.71.01.1001' },
  'ID-BE': { provinceId: 'ID-BE', provinceName: 'Bengkulu', cityName: 'Kota Bengkulu', adm4Code: '17.71.01.1001' },
  'ID-LA': { provinceId: 'ID-LA', provinceName: 'Lampung', cityName: 'Kota Bandar Lampung', adm4Code: '18.71.01.1003' },
  'ID-BB': { provinceId: 'ID-BB', provinceName: 'Kepulauan Bangka Belitung', cityName: 'Kota Pangkal Pinang', adm4Code: '19.71.01.1004' },
  'ID-KR': { provinceId: 'ID-KR', provinceName: 'Kepulauan Riau', cityName: 'Kota Batam', adm4Code: '21.71.01.1002' },
  'ID-JK': { provinceId: 'ID-JK', provinceName: 'DKI Jakarta', cityName: 'Kota Administrasi Jakarta Pusat', adm4Code: '31.71.01.1001' },
  'ID-JB': { provinceId: 'ID-JB', provinceName: 'Jawa Barat', cityName: 'Kota Bandung', adm4Code: '32.73.01.1001' },
  'ID-JT': { provinceId: 'ID-JT', provinceName: 'Jawa Tengah', cityName: 'Kota Semarang', adm4Code: '33.74.01.1001' },
  'ID-YO': { provinceId: 'ID-YO', provinceName: 'DI Yogyakarta', cityName: 'Kota Yogyakarta', adm4Code: '34.71.01.1001' },
  'ID-JI': { provinceId: 'ID-JI', provinceName: 'Jawa Timur', cityName: 'Kota Surabaya', adm4Code: '35.78.01.1001' },
  'ID-BT': { provinceId: 'ID-BT', provinceName: 'Banten', cityName: 'Kota Serang', adm4Code: '36.73.01.1001' },
  'ID-BA': { provinceId: 'ID-BA', provinceName: 'Bali', cityName: 'Kota Denpasar', adm4Code: '51.71.01.1001' },
  'ID-NB': { provinceId: 'ID-NB', provinceName: 'Nusa Tenggara Barat', cityName: 'Kota Mataram', adm4Code: '52.71.01.1004' },
  'ID-NT': { provinceId: 'ID-NT', provinceName: 'Nusa Tenggara Timur', cityName: 'Kota Kupang', adm4Code: '53.71.01.1001' },
  'ID-KB': { provinceId: 'ID-KB', provinceName: 'Kalimantan Barat', cityName: 'Kota Pontianak', adm4Code: '61.71.01.1002' },
  'ID-KT': { provinceId: 'ID-KT', provinceName: 'Kalimantan Tengah', cityName: 'Kota Palangkaraya', adm4Code: '62.71.01.1001' },
  'ID-KS': { provinceId: 'ID-KS', provinceName: 'Kalimantan Selatan', cityName: 'Kota Banjarmasin', adm4Code: '63.71.01.1001' },
  'ID-KI': { provinceId: 'ID-KI', provinceName: 'Kalimantan Timur', cityName: 'Kota Balikpapan', adm4Code: '64.71.01.1001' },
  'ID-KU': { provinceId: 'ID-KU', provinceName: 'Kalimantan Utara', cityName: 'Kota Tarakan', adm4Code: '65.71.01.1001' },
  'ID-SA': { provinceId: 'ID-SA', provinceName: 'Sulawesi Utara', cityName: 'Kota Manado', adm4Code: '71.71.01.1001' },
  'ID-ST': { provinceId: 'ID-ST', provinceName: 'Sulawesi Tengah', cityName: 'Kota Palu', adm4Code: '72.71.01.1004' },
  'ID-SN': { provinceId: 'ID-SN', provinceName: 'Sulawesi Selatan', cityName: 'Kota Makassar', adm4Code: '73.71.01.1001' },
  'ID-SG': { provinceId: 'ID-SG', provinceName: 'Sulawesi Tenggara', cityName: 'Kota Kendari', adm4Code: '74.71.01.1005' },
  'ID-GO': { provinceId: 'ID-GO', provinceName: 'Gorontalo', cityName: 'Kota Gorontalo', adm4Code: '75.71.01.1001' },
  'ID-SR': { provinceId: 'ID-SR', provinceName: 'Sulawesi Barat', cityName: 'Kabupaten Pasangkayu', adm4Code: '76.01.01.1006' },
  'ID-MA': { provinceId: 'ID-MA', provinceName: 'Maluku', cityName: 'Kota Ambon', adm4Code: '81.71.01.1006' },
  'ID-MU': { provinceId: 'ID-MU', provinceName: 'Maluku Utara', cityName: 'Kota Ternate', adm4Code: '82.71.01.1001' },
  'ID-PA': { provinceId: 'ID-PA', provinceName: 'Papua', cityName: 'Kota Jayapura', adm4Code: '91.71.01.1001' },
  'ID-PB': { provinceId: 'ID-PB', provinceName: 'Papua Barat', cityName: 'Kabupaten Manokwari', adm4Code: '92.02.03.2001' },
  'ID-PS': { provinceId: 'ID-PS', provinceName: 'Papua Selatan', cityName: 'Kabupaten Merauke', adm4Code: '93.01.01.1002' },
  'ID-PT': { provinceId: 'ID-PT', provinceName: 'Papua Tengah', cityName: 'Kabupaten Nabire', adm4Code: '94.01.01.1001' },
  'ID-PE': { provinceId: 'ID-PE', provinceName: 'Papua Pegunungan', cityName: 'Kabupaten Jayawijaya', adm4Code: '95.01.01.1001' },
  'ID-PD': { provinceId: 'ID-PD', provinceName: 'Papua Barat Daya', cityName: 'Kota Sorong', adm4Code: '96.71.01.1001' },
};
