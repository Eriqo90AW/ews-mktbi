import type { KpwbiOffice, DisasterAlert } from '../types';
import { haversineDistance } from './nearestKpw';

/**
 * Gets the impact radius of a disaster alert in kilometers.
 */
export function getAlertImpactRadiusKm(alert: DisasterAlert): number {
  switch (alert.type) {
    case 'earthquake':
      return (alert.magnitude || 5) * 15;
    case 'tsunami':
      return 80;
    case 'flood':
      return (alert.waterLevel || 1.5) * 12;
    case 'volcanic':
      return 35;
    case 'landslide':
      return 15;
    case 'extreme_weather':
      return 50;
    case 'karhutla':
      return 30;
    case 'kekeringan':
      return 40;
    default:
      return 20;
    }
}

/**
 * Determines whether a KPW office is affected ("terdampak") by a specific disaster alert.
 * 
 * If coordinates are present in the alert, calculates distance using Haversine formula
 * and checks if it falls within the disaster's impact radius.
 * Otherwise, falls back to checking if they share the same provinceId.
 */
export function isOfficeAffectedByAlert(office: KpwbiOffice, alert: DisasterAlert): boolean {
  if (alert.latitude !== undefined && alert.longitude !== undefined) {
    const distance = haversineDistance(
      office.latitude,
      office.longitude,
      alert.latitude,
      alert.longitude
    );
    const radius = getAlertImpactRadiusKm(alert);
    return distance <= radius;
  }
  
  // Fallback to old province-based matching if alert has no coordinates
  return alert.provinceId === office.provinceId;
}
