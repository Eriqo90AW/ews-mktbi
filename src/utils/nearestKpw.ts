import type { KpwbiOffice, Province } from '../types';

/**
 * Calculates the distance between two geographic coordinates using the Haversine formula.
 * Returns the distance in kilometers.
 */
export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
      
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface NearestKpwResult {
  office: KpwbiOffice;
  distanceKm: number;
}

/**
 * Finds the top N nearest offices to the target office, excluding the target office itself.
 */
export function findNearestOffices(
  targetOffice: KpwbiOffice,
  allOffices: KpwbiOffice[],
  count: number = 5
): NearestKpwResult[] {
  return allOffices
    .filter((office) => office.id !== targetOffice.id)
    .map((office) => {
      const distanceKm = haversineDistance(
        targetOffice.latitude,
        targetOffice.longitude,
        office.latitude,
        office.longitude
      );
      return { office, distanceKm };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, count);
}

/**
 * Finds the top N nearest offices by province distance, excluding the target office's own province.
 */
export function findNearestOfficesByProvince(
  targetOffice: KpwbiOffice,
  allOffices: KpwbiOffice[],
  allProvinces: Province[],
  count: number = 3
): NearestKpwResult[] {
  const targetProvince = allProvinces.find((p) => p.id === targetOffice.provinceId);
  if (!targetProvince) return [];

  // Find all other provinces, calculate distance to target province, and sort them
  const nearestProvinces = allProvinces
    .filter((p) => p.id !== targetOffice.provinceId)
    .map((p) => {
      const distanceKm = haversineDistance(
        targetProvince.latitude,
        targetProvince.longitude,
        p.latitude,
        p.longitude
      );
      return { province: p, distanceKm };
    })
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, count);

  // For each nearest province, find the closest KPW office to targetOffice
  const results: NearestKpwResult[] = [];
  
  for (const { province, distanceKm: provinceDistance } of nearestProvinces) {
    const officesInProvince = allOffices.filter((o) => o.provinceId === province.id);
    if (officesInProvince.length === 0) continue;

    // Find the one closest to targetOffice
    let closestOffice = officesInProvince[0];
    let minDistance = haversineDistance(
      targetOffice.latitude,
      targetOffice.longitude,
      closestOffice.latitude,
      closestOffice.longitude
    );

    for (let i = 1; i < officesInProvince.length; i++) {
      const dist = haversineDistance(
        targetOffice.latitude,
        targetOffice.longitude,
        officesInProvince[i].latitude,
        officesInProvince[i].longitude
      );
      if (dist < minDistance) {
        minDistance = dist;
        closestOffice = officesInProvince[i];
      }
    }

    results.push({
      office: closestOffice,
      distanceKm: provinceDistance, // we use the province-to-province distance
    });
  }

  return results;
}

