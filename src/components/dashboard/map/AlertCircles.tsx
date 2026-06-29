import React from 'react';
import { Circle, Tooltip } from 'react-leaflet';
import type { DisasterAlert } from '../../../types';
import { KPWBI_OFFICES } from '../../../constants/kpwbiOffices';
import { isValidCoord } from '../../../utils/geo';

interface AlertCirclesProps {
  alerts: DisasterAlert[];
}

interface CircleConfig {
  radius: number;
  pathOptions: {
    color: string;
    fillColor: string;
    fillOpacity: number;
    weight: number;
    dashArray?: string;
  };
}

function getCircleConfig(alert: DisasterAlert): CircleConfig {
  switch (alert.type) {
    case 'earthquake':
      return {
        radius: (alert.magnitude || 5) * 15000,
        pathOptions: { color: 'var(--alert-critical)', fillColor: 'var(--alert-critical)', fillOpacity: 0.12, weight: 1.5, dashArray: '4, 4' },
      };
    case 'tsunami':
      return {
        radius: 80000,
        pathOptions: { color: '#be123c', fillColor: '#be123c', fillOpacity: 0.1, weight: 2, dashArray: '8, 4' },
      };
    case 'flood':
      return {
        radius: (alert.waterLevel || 1.5) * 12000,
        pathOptions: { color: '#2563eb', fillColor: '#3b82f6', fillOpacity: 0.2, weight: 1.5 },
      };
    case 'volcanic':
      return {
        radius: 35000,
        pathOptions: { color: '#ea580c', fillColor: '#f97316', fillOpacity: 0.25, weight: 1.5 },
      };
    case 'landslide':
      return {
        radius: 15000,
        pathOptions: { color: '#78350f', fillColor: '#b45309', fillOpacity: 0.15, weight: 1.5 },
      };
    case 'extreme_weather':
      return {
        radius: 50000,
        pathOptions: { color: '#0ea5e9', fillColor: '#0ea5e9', fillOpacity: 0.12, weight: 1.5, dashArray: '6, 3' },
      };
    case 'karhutla':
      return {
        radius: 30000,
        pathOptions: { color: '#f97316', fillColor: '#ef4444', fillOpacity: 0.15, weight: 1.5, dashArray: '5, 5' },
      };
    case 'kekeringan':
      return {
        radius: 40000,
        pathOptions: { color: '#d97706', fillColor: '#f59e0b', fillOpacity: 0.15, weight: 1.5, dashArray: '4, 4' },
      };
    default:
      return {
        radius: 20000,
        pathOptions: { color: '#dc2626', fillColor: '#dc2626', fillOpacity: 0.15, weight: 1.5 },
      };
  }
}

const AlertCircles: React.FC<AlertCirclesProps> = ({ alerts }) => {
  return (
    <>
      {alerts.map((alert) => {
        let center: [number, number] | null = null;

        if (isValidCoord(alert.latitude, alert.longitude)) {
          center = [Number(alert.latitude), Number(alert.longitude)];
        } else {
          const office = KPWBI_OFFICES.find((o) => o.provinceId === alert.provinceId);
          if (office) center = [office.latitude, office.longitude];
        }

        if (!center) return null;

        const { radius, pathOptions } = getCircleConfig(alert);

        return (
          <Circle key={`indicator-${alert.id}`} center={center} radius={radius} pathOptions={pathOptions}>
            <Tooltip sticky>
              <div>
                <strong>{alert.title}</strong><br />
                Radius Dampak: {(radius / 1000).toFixed(0)} km<br />
                {isValidCoord(alert.latitude, alert.longitude) && (
                  <>Epicenter: {Number(alert.latitude).toFixed(4)}, {Number(alert.longitude).toFixed(4)}<br /></>
                )}
                Area: {alert.affectedArea || 'Sekitar KPW'}
              </div>
            </Tooltip>
          </Circle>
        );
      })}
    </>
  );
};

export default AlertCircles;
