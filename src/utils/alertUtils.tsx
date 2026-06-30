import React from 'react';
import type { DisasterType } from '../types';

export function getDisasterEmoji(type: DisasterType | string): string {
  switch (type) {
    case 'earthquake':
    case 'gempa': return '💢';
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

export function getDisasterIconHtml(type: DisasterType | string): string {
  if (type === 'earthquake' || type === 'gempa') {
    return `<img src="/earthquake-icon.png" style="width: 24px; height: 24px; object-fit: contain; vertical-align: middle;" alt="Gempa" />`;
  }
  return getDisasterEmoji(type);
}

export function renderDisasterIcon(
  type: DisasterType | string,
  className?: string,
  style?: React.CSSProperties
): React.ReactNode {
  if (type === 'earthquake' || type === 'gempa') {
    return (
      <img
        src="/earthquake-icon.png"
        alt="Gempa"
        className={className}
        style={{
          width: '1.2em',
          height: '1.2em',
          verticalAlign: 'middle',
          objectFit: 'contain',
          display: 'inline-block',
          ...style
        }}
      />
    );
  }
  return <span className={className} style={style}>{getDisasterEmoji(type)}</span>;
}
