import React from 'react';
import type { DisasterType } from '../types';
import earthquakeIcon from '../assets/earthquake.png';
import floodIcon from '../assets/flood.png';
import droughtIcon from '../assets/drought.png';

export function getDisasterIconValue(type: DisasterType | string): string {
  switch (type) {
    case 'earthquake':
    case 'gempa':
      return earthquakeIcon;
    case 'tsunami':
    case 'pasang':
      return '🌊';
    case 'flood':
    case 'banjir':
      return floodIcon;
    case 'cuaca':
    case 'extreme_weather':
      return '🌧️';
    case 'volcanic':
      return '🌋';
    case 'landslide':
      return '⛰️';
    case 'karhutla':
      return '🔥';
    case 'kekeringan':
      return droughtIcon;
    default:
      return '⚠️';
  }
}

export function getDisasterEmoji(type: DisasterType | string): string {
  return getDisasterIconValue(type);
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
  // Retained as a stub for compatibility
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

export function getDisasterIconHtml(type: DisasterType | string, _customColor?: string): string {
  const icon = getDisasterIconValue(type);
  if (icon.endsWith('.png') || icon.startsWith('data:') || icon.startsWith('/') || icon.startsWith('static/') || icon.startsWith('src/')) {
    return `<img src="${icon}" style="width: 20px; height: 20px; display: inline-block; vertical-align: middle; object-fit: contain;" alt="${type}" />`;
  }
  return `<span style="font-size: 18px; display: inline-block; vertical-align: middle; line-height: 1;">${icon}</span>`;
}

export function renderDisasterIcon(
  type: DisasterType | string,
  className?: string,
  style?: React.CSSProperties
): React.ReactNode {
  const icon = getDisasterIconValue(type);
  const size = style?.width || style?.height || '20px';

  // Extract size styles for img to prevent them from causing layout issues
  const { width, height, ...restStyle } = style || {};

  if (icon.endsWith('.png') || icon.startsWith('data:') || icon.startsWith('/') || icon.startsWith('static/') || icon.startsWith('src/')) {
    const mergedStyle: React.CSSProperties = {
      width: size,
      height: size,
      display: 'inline-block',
      verticalAlign: 'middle',
      objectFit: 'contain',
      ...restStyle
    };
    return <img src={icon} className={className} style={mergedStyle} alt={type} />;
  }

  const mergedStyle: React.CSSProperties = {
    fontSize: size,
    display: 'inline-block',
    verticalAlign: 'middle',
    lineHeight: 1,
    ...style
  };
  return <span className={className} style={mergedStyle}>{icon}</span>;
}

