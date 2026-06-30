import React from 'react';
import ReactDOMServer from 'react-dom/server';
import type { DisasterType } from '../types';
import VolcanoIcon from '@mui/icons-material/Volcano';
import ThunderstormIcon from '@mui/icons-material/Thunderstorm';

export function getDisasterEmoji(type: DisasterType | string): string {
  // Retained for compatibility but returning plain text warning/indicators instead of emojis
  switch (type) {
    case 'earthquake':
    case 'gempa': return '[GEMPA]';
    case 'tsunami': return '[TSUNAMI]';
    case 'flood': return '[BANJIR]';
    case 'volcanic': return '🌋';
    case 'landslide': return '[LONGSOR]';
    case 'extreme_weather': return '🌧️';
    case 'karhutla': return '[KARHUTLA]';
    case 'kekeringan': return '[KEKERINGAN]';
    default: return '[WARNING]';
  }
}

export function getDisasterColor(type: DisasterType | string): string {
  switch (type) {
    case 'earthquake':
    case 'gempa':
      return '#8b5cf6'; // Violet/Purple (was Red)
    case 'tsunami':
    case 'pasang':
      return '#06b6d4'; // Cyan/Teal
    case 'flood':
    case 'banjir':
      return '#0284c7'; // Sky Blue
    case 'volcanic':
      return '#dc2626'; // Deep Red
    case 'landslide':
      return '#b45309'; // Brown/Amber
    case 'extreme_weather':
    case 'cuaca':
      return '#eab308'; // Amber/Yellow
    case 'karhutla':
      return '#f97316'; // Orange
    case 'kekeringan':
      return '#d97706'; // Dark Amber
    default:
      return '#f59e0b'; // Warning Amber
  }
}

export function getDisasterIconClass(type: DisasterType | string): string {
  switch (type) {
    case 'earthquake':
    case 'gempa':
      return 'wi-earthquake';
    case 'tsunami':
    case 'pasang':
      return 'wi-tsunami';
    case 'flood':
    case 'banjir':
      return 'wi-flood';
    case 'volcanic':
      return 'wi-volcano';
    case 'landslide':
      return 'wi-sandstorm';
    case 'extreme_weather':
    case 'cuaca':
      return 'wi-lightning';
    case 'karhutla':
      return 'wi-fire';
    case 'kekeringan':
      return 'wi-hot';
    default:
      return 'wi-na';
  }
}

export function getDisasterIconHtml(type: DisasterType | string, customColor?: string): string {
  const color = customColor || getDisasterColor(type);
  if (type === 'extreme_weather' || type === 'cuaca') {
    return ReactDOMServer.renderToStaticMarkup(
      <ThunderstormIcon style={{ color, fontSize: '20px', display: 'inline-block', verticalAlign: 'middle' }} />
    );
  }
  if (type === 'volcanic') {
    return ReactDOMServer.renderToStaticMarkup(
      <VolcanoIcon style={{ color, fontSize: '20px', display: 'inline-block', verticalAlign: 'middle' }} />
    );
  }
  const iconClass = getDisasterIconClass(type);
  
  return `<i class="wi ${iconClass}" style="color: ${color}; font-size: 18px; display: inline-block; vertical-align: middle; line-height: 1;"></i>`;
}

export function renderDisasterIcon(
  type: DisasterType | string,
  className?: string,
  style?: React.CSSProperties
): React.ReactNode {
  const size = style?.width || style?.height || '1.2em';
  const defaultColor = getDisasterColor(type);

  if (type === 'extreme_weather' || type === 'cuaca') {
    return (
      <ThunderstormIcon
        className={className}
        style={{
          fontSize: size,
          color: style?.color || defaultColor,
          display: 'inline-block',
          verticalAlign: 'middle',
          ...style
        }}
      />
    );
  }
  if (type === 'volcanic') {
    return (
      <VolcanoIcon
        className={className}
        style={{
          fontSize: size,
          color: style?.color || defaultColor,
          display: 'inline-block',
          verticalAlign: 'middle',
          ...style
        }}
      />
    );
  }

  const iconClass = getDisasterIconClass(type);
  
  const mergedStyle: React.CSSProperties = {
    fontSize: size,
    color: style?.color || defaultColor,
    display: 'inline-block',
    verticalAlign: 'middle',
    lineHeight: 1,
    ...style
  };

  return <i className={`wi ${iconClass} ${className || ''}`} style={mergedStyle} />;
}
