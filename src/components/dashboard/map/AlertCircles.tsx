import React from 'react';
import { Circle, Tooltip, Marker } from 'react-leaflet';
import L from 'leaflet';
import type { DisasterAlert, AlertSeverity } from '../../../types';
import { KPWBI_OFFICES } from '../../../constants/kpwbiOffices';
import { isValidCoord } from '../../../utils/geo';
import { getDisasterIconHtml } from '../../../utils/alertUtils';

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

function getCircleRadius(alert: DisasterAlert): number {
  switch (alert.type) {
    case 'earthquake':
      return (alert.magnitude || 5) * 15000;
    case 'tsunami':
      return 80000;
    case 'flood':
      return (alert.waterLevel || 1.5) * 12000;
    case 'volcanic':
      return 35000;
    case 'landslide':
      return 15000;
    case 'extreme_weather':
      return 50000;
    case 'karhutla':
      return 30000;
    case 'kekeringan':
      return 40000;
    default:
      return 20000;
  }
}

function getCircleConfig(alert: DisasterAlert): CircleConfig {
  const severityColors: Record<AlertSeverity, string> = {
    critical: 'var(--alert-critical)',
    warning: 'var(--alert-warning)',
    watch: 'var(--alert-watch)',
  };

  const color = severityColors[alert.severity] || 'var(--alert-critical)';
  const radius = getCircleRadius(alert);

  return {
    radius,
    pathOptions: {
      color,
      fillColor: color,
      fillOpacity: 0.12, // Match earthquake fill opacity
      weight: 1.5,
      dashArray: '4, 4', // Match earthquake dashed style
    },
  };
}

/**
 * Calculates a coordinates offset from the center by a given distance (radius in meters)
 * at a specific bearing (135 degrees for South-East/Bottom-Right).
 */
function getBottomRightCoords(centerLat: number, centerLng: number, radiusMeters: number): [number, number] {
  const earthRadius = 6378137; // in meters
  const d = radiusMeters;
  const bearingRad = (135 * Math.PI) / 180; // 135 degrees is South-East (bottom-right)

  const latRad = (centerLat * Math.PI) / 180;
  const lngRad = (centerLng * Math.PI) / 180;

  const destLatRad = Math.asin(
    Math.sin(latRad) * Math.cos(d / earthRadius) +
      Math.cos(latRad) * Math.sin(d / earthRadius) * Math.cos(bearingRad)
  );

  const destLngRad =
    lngRad +
    Math.atan2(
      Math.sin(bearingRad) * Math.sin(d / earthRadius) * Math.cos(latRad),
      Math.cos(d / earthRadius) - Math.sin(latRad) * Math.sin(destLatRad)
    );

  const destLat = (destLatRad * 180) / Math.PI;
  const destLng = (destLngRad * 180) / Math.PI;

  return [destLat, destLng];
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
        const iconCoords = getBottomRightCoords(center[0], center[1], radius);
        const iconHtml = getDisasterIconHtml(alert.type);

        // Custom DivIcon for the disaster emoji, fully transparent container
        const customIcon = L.divIcon({
          className: 'custom-disaster-radius-icon',
          html: `<div style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            background-color: transparent;
            border: none;
            font-size: 18px;
            cursor: pointer;
            pointer-events: auto;
          ">${iconHtml}</div>`,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        return (
          <React.Fragment key={`alert-group-${alert.id}`}>
            <Circle center={center} radius={radius} pathOptions={pathOptions}>
              <Tooltip sticky>
                <div>
                  <strong>{alert.title}</strong><br />
                  Radius Dampak: {(radius / 1000).toFixed(0)} km<br />
                  {isValidCoord(alert.latitude, alert.longitude) && (
                    <>Epicenter: {Number(alert.latitude).toFixed(4)}, {Number(alert.longitude).toFixed(4)}<br /></>
                  )}
                  Area: {alert.affectedArea || 'Sekitar KPW'}<br />
                  Severity: <span style={{ textTransform: 'capitalize', fontWeight: 'bold', color: pathOptions.color }}>{alert.severity}</span>
                </div>
              </Tooltip>
            </Circle>
            <Marker position={iconCoords} icon={customIcon} interactive={false} />
          </React.Fragment>
        );
      })}
    </>
  );
};

export default AlertCircles;
