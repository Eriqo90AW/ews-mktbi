import type { DisasterType } from '../types';

export function getDisasterEmoji(type: DisasterType | string): string {
  switch (type) {
    case 'earthquake': return '🫨';
    case 'tsunami': return '🌊';
    case 'flood': return '🌧️';
    case 'volcanic': return '🌋';
    case 'landslide': return '⛰️';
    case 'extreme_weather': return '⚡';
    case 'karhutla': return '🔥';
    case 'kekeringan': return '🏜️';
    default: return '⚠️';
  }
}
