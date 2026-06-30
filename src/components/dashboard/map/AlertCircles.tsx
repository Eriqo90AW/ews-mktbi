import React from 'react';
import { Circle, Tooltip, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { DisasterAlert, AlertSeverity } from '../../../types';
import { KPWBI_OFFICES } from '../../../constants/kpwbiOffices';
import { isValidCoord } from '../../../utils/geo';
import { getDisasterIconHtml, renderDisasterIcon } from '../../../utils/alertUtils';

interface AlertCirclesProps {
  alerts: DisasterAlert[];
  onAlertSelect?: (alertId: string) => void;
}

interface CircleConfig {
  radius: number;
  pathOptions: {
    color: string;
    fillColor: string;
    fillOpacity: number;
    weight: number;
    dashArray?: string;
    bubblingMouseEvents?: boolean;
  };
}

function getCircleRadius(alert: DisasterAlert): number {
  switch (alert.type) {
    case 'earthquake':
      return (alert.magnitude || 5) * 35000;
    case 'tsunami':
      return 150000;
    case 'flood':
      return (alert.waterLevel || 1.5) * 40000;
    case 'volcanic':
      return 85000;
    case 'landslide':
      return 50000;
    case 'extreme_weather':
      return 60000;
    case 'karhutla':
      return 90000;
    case 'kekeringan':
      return 100000;
    default:
      return 60000;
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
      bubblingMouseEvents: false,
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

const AlertCircles: React.FC<AlertCirclesProps> = ({ alerts, onAlertSelect }) => {
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

        const popupContent = (
          <div className="ews-popup-content">
            <div className={`ews-popup-header ${alert.severity}`}>
              <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                {renderDisasterIcon(alert.type)}
              </span>
              <span>{alert.title}</span>
            </div>
            <div className="ews-popup-title" style={{ marginTop: 0 }}>
              {alert.affectedArea || 'Area Terdampak'}
            </div>
            <p className="ews-popup-desc">
              {alert.description}
            </p>
            <div className="ews-popup-footer">
              <span>Radius: {(radius / 1000).toFixed(0)} km</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Severity:</span>
                <span className="ews-popup-tag" style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  padding: '2px 4px',
                  borderColor: alert.severity === 'critical' ? 'var(--alert-critical-border)' : alert.severity === 'warning' ? 'var(--alert-warning-border)' : 'var(--alert-watch-border)',
                  backgroundColor: alert.severity === 'critical' ? 'var(--alert-critical-bg)' : alert.severity === 'warning' ? 'var(--alert-warning-bg)' : 'var(--alert-watch-bg)',
                }}>
                  {[1, 2, 3].map((i) => {
                    const sevBoxCount = { critical: 3, warning: 2, watch: 1 }[alert.severity] || 1;
                    const filled = i <= sevBoxCount;
                    const fillColor = filled 
                      ? { critical: 'var(--alert-critical)', warning: 'var(--alert-warning)', watch: 'var(--alert-watch)' }[alert.severity]
                      : 'var(--border-default)';
                    return (
                      <span
                        key={i}
                        style={{
                          width: '12px',
                          height: '4px',
                          borderRadius: '1px',
                          backgroundColor: fillColor,
                          display: 'inline-block'
                        }}
                      />
                    );
                  })}
                </span>
              </div>
            </div>
          </div>
        );

        return (
          <React.Fragment key={`alert-group-${alert.id}`}>
            <Circle 
              center={center} 
              radius={radius} 
              pathOptions={pathOptions}
              eventHandlers={{
                click: () => {
                  onAlertSelect?.(alert.id);
                }
              }}
            >
              <Tooltip sticky>
                <div>
                  <strong>{alert.title}</strong><br />
                  Radius Dampak: {(radius / 1000).toFixed(0)} km<br />
                  {isValidCoord(alert.latitude, alert.longitude) && (
                    <>Epicenter: {Number(alert.latitude).toFixed(4)}, {Number(alert.longitude).toFixed(4)}<br /></>
                  )}
                  Area: {alert.affectedArea || 'Sekitar KPW'}<br />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                    <span>Severity:</span>
                    <div style={{ display: 'flex', gap: '3px' }}>
                      {[1, 2, 3].map((i) => {
                        const sevBoxCount = { critical: 3, warning: 2, watch: 1 }[alert.severity] || 1;
                        const filled = i <= sevBoxCount;
                        const fillColor = filled 
                          ? { critical: 'var(--alert-critical)', warning: 'var(--alert-warning)', watch: 'var(--alert-watch)' }[alert.severity]
                          : 'rgba(255, 255, 255, 0.2)'; // semi-transparent fallback if border-default isn't visible in dark tooltip
                        return (
                          <span
                            key={i}
                            style={{
                              width: '12px',
                              height: '4px',
                              borderRadius: '1px',
                              backgroundColor: fillColor,
                              display: 'inline-block'
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>
              </Tooltip>
              <Popup>{popupContent}</Popup>
            </Circle>
            <Marker 
              position={iconCoords} 
              icon={customIcon} 
              interactive={true}
              eventHandlers={{
                click: () => {
                  onAlertSelect?.(alert.id);
                }
              }}
            >
              <Popup>{popupContent}</Popup>
            </Marker>
          </React.Fragment>
        );
      })}
    </>
  );
};

export default AlertCircles;
