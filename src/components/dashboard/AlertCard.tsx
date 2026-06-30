import React from 'react';
import type { DisasterAlert, Province } from '../../types';
import { severityToCssClass } from '../../types';
import { renderDisasterIcon } from '../../utils/alertUtils';
import './AlertCard.css';

interface AlertCardProps {
  alert: DisasterAlert;
  province?: Province;
  isSelected: boolean;
  onClick: () => void;
}

const TYPE_LABELS: Record<string, string> = {
  earthquake:      'Gempa Bumi',
  flood:           'Banjir',
  volcanic:        'Gunung Api',
  tsunami:         'Tsunami',
  landslide:       'Longsor',
  extreme_weather: 'Cuaca Ekstrem',
  karhutla:        'Karhutla',
  kekeringan:      'Kekeringan',
};

function renderMetrics(alert: DisasterAlert) {
  const { type, magnitude, depth, waterLevel, affectedArea, isForecast, forecastDateStr } = alert;

  switch (type) {
    case 'earthquake':
      return (
        <div className="alertcard-metrics">
          {magnitude !== undefined && (
            <div className="metric-mag">
              <span className="metric-mag-val">{magnitude.toFixed(1)}</span>
              <span className="metric-mag-unit">SR</span>
            </div>
          )}
          <div className="metric-chips">
            {depth !== undefined && (
              <span className="metric-chip">↓ {depth} km</span>
            )}
            {affectedArea && (
              <span className="metric-chip metric-chip-area">{affectedArea}</span>
            )}
          </div>
        </div>
      );

    case 'flood':
      return (
        <div className="alertcard-metrics">
          <div className="metric-chips">
            {waterLevel !== undefined && (
              <span className="metric-chip">Ketinggian {waterLevel} m</span>
            )}
            {affectedArea && (
              <span className="metric-chip metric-chip-area">{affectedArea}</span>
            )}
          </div>
        </div>
      );

    case 'extreme_weather':
      return (
        <div className="alertcard-metrics">
          <div className="metric-chips">
            {isForecast && forecastDateStr && (
              <span className="metric-chip">{forecastDateStr}</span>
            )}
            {affectedArea && (
              <span className="metric-chip metric-chip-area">{affectedArea}</span>
            )}
          </div>
        </div>
      );

    case 'volcanic':
    case 'karhutla':
    case 'landslide':
    case 'tsunami':
    case 'kekeringan':
    default:
      return affectedArea ? (
        <div className="alertcard-metrics">
          <div className="metric-chips">
            <span className="metric-chip metric-chip-area">{affectedArea}</span>
          </div>
        </div>
      ) : null;
  }
}

export const AlertCard: React.FC<AlertCardProps> = ({ alert, province, isSelected, onClick }) => {
  const formatRelativeTime = (isoString: string) => {
    try {
      const past = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - past.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      if (diffMins < 1) return 'Baru saja';
      if (diffMins < 60) return `${diffMins}m lalu`;
      if (diffHours < 24) return `${diffHours}j lalu`;
      return past.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    } catch { return ''; }
  };

  const sevCss = severityToCssClass(alert.severity);
  const sevBoxCount = alert.severity;

  return (
    <div
      className={`alertcard-container alertcard-sev-${sevCss}${isSelected ? ' selected' : ''}`}
      onClick={onClick}
    >
      <div className={`alertcard-stripe ${sevCss}`} />

      <div className="alertcard-header">
        <div className="alertcard-type-row">
          <span className="alertcard-icon">{renderDisasterIcon(alert.type)}</span>
          <span className="alertcard-type-label">{TYPE_LABELS[alert.type] ?? alert.type}</span>
        </div>
        <div className={`alertcard-sev-badge sev-${sevCss}`}>
          {[1, 2, 3].map((i) => (
            <span key={i} className={`sev-box${i <= sevBoxCount ? ' filled' : ''}`} />
          ))}
        </div>
      </div>

      <div className="alertcard-title">{alert.title}</div>

      {renderMetrics(alert)}

      <div className="alertcard-desc">{alert.description}</div>

      <div className="alertcard-footer">
        <span className="alertcard-province">{province?.name ?? 'Unknown Province'}</span>
        <span className="alertcard-dot" />
        <span className="alertcard-time">{formatRelativeTime(alert.timestamp)}</span>
        {alert.isForecast && <span className="alertcard-forecast-tag">Prakiraan</span>}
      </div>
    </div>
  );
};

export default AlertCard;
