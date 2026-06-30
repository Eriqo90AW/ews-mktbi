import type { KpwbiOffice, Province } from '../types';
import { KPWBI_OFFICES } from '../constants/kpwbiOffices';

export function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
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

export function isValidCoord(lat?: unknown, lng?: unknown): boolean {
  if (lat == null || lng == null) return false;
  if (typeof lat === 'string' && lat.trim() === '') return false;
  if (typeof lng === 'string' && lng.trim() === '') return false;
  
  const numLat = Number(lat);
  const numLng = Number(lng);
  
  if (isNaN(numLat) || isNaN(numLng)) return false;
  if (numLat === 0 && numLng === 0) return false;
  
  // Basic bounds check
  if (numLat < -90 || numLat > 90) return false;
  if (numLng < -180 || numLng > 180) return false;

  return true;
}

export interface NearestKpwResult {
  office: KpwbiOffice;
  distanceKm: number;
}

export function findNearestKpwOffice(lat: number, lon: number): KpwbiOffice {
  let nearest = KPWBI_OFFICES[0];
  let minDist = haversineDistance(lat, lon, nearest.latitude, nearest.longitude);
  for (let i = 1; i < KPWBI_OFFICES.length; i++) {
    const d = haversineDistance(lat, lon, KPWBI_OFFICES[i].latitude, KPWBI_OFFICES[i].longitude);
    if (d < minDist) {
      minDist = d;
      nearest = KPWBI_OFFICES[i];
    }
  }
  return nearest;
}

export function findNearestOffices(
  targetOffice: KpwbiOffice,
  allOffices: KpwbiOffice[],
  count: number = 5
): NearestKpwResult[] {
  return allOffices
    .filter((o) => o.id !== targetOffice.id)
    .map((o) => ({
      office: o,
      distanceKm: haversineDistance(
        targetOffice.latitude,
        targetOffice.longitude,
        o.latitude,
        o.longitude
      ),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, count);
}

export function findNearestOfficesByProvince(
  targetOffice: KpwbiOffice,
  allOffices: KpwbiOffice[],
  allProvinces: Province[],
  count: number = 3
): NearestKpwResult[] {
  const targetProvince = allProvinces.find((p) => p.id === targetOffice.provinceId);
  if (!targetProvince) return [];

  const nearestProvinces = allProvinces
    .filter((p) => p.id !== targetOffice.provinceId)
    .map((p) => ({
      province: p,
      distanceKm: haversineDistance(
        targetProvince.latitude,
        targetProvince.longitude,
        p.latitude,
        p.longitude
      ),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, count);

  const results: NearestKpwResult[] = [];
  for (const { province, distanceKm: provinceDistance } of nearestProvinces) {
    const officesInProvince = allOffices.filter((o) => o.provinceId === province.id);
    if (officesInProvince.length === 0) continue;

    let closest = officesInProvince[0];
    let minDist = haversineDistance(
      targetOffice.latitude,
      targetOffice.longitude,
      closest.latitude,
      closest.longitude
    );
    for (let i = 1; i < officesInProvince.length; i++) {
      const d = haversineDistance(
        targetOffice.latitude,
        targetOffice.longitude,
        officesInProvince[i].latitude,
        officesInProvince[i].longitude
      );
      if (d < minDist) {
        minDist = d;
        closest = officesInProvince[i];
      }
    }
    results.push({ office: closest, distanceKm: provinceDistance });
  }
  return results;
}
