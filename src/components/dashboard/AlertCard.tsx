import React from 'react';
import type { DisasterAlert, Province } from '../../types';
import Badge from '../ui/Badge';
import './AlertCard.css';

interface AlertCardProps {
  alert: DisasterAlert;
  province?: Province;
  isSelected: boolean;
  onClick: () => void;
}

export const AlertCard: React.FC<AlertCardProps> = ({ alert, province, isSelected, onClick }) => {
  const getDisasterEmoji = (type: string) => {
    switch (type) {
      case 'earthquake':
        return '🌋'; // Or 🌐 / 📉
      case 'tsunami':
        return '🌊';
      case 'flood':
        return '🌧️';
      case 'volcanic':
        return '🌋';
      case 'landslide':
        return '⛰️';
      case 'extreme_weather':
        return '⚡';
      case 'karhutla':
        return '🔥';
      default:
        return '⚠️';
    }
  };

  const formatRelativeTime = (isoString: string) => {
    try {
      const past = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - past.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      return past.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  };

  return (
    <div
      className={`alertcard-container ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className={`alertcard-stripe ${alert.severity}`} />
      
      <div className="alertcard-header">
        <div className="alertcard-type-title">
          <span className="alertcard-icon">{getDisasterEmoji(alert.type)}</span>
          <span className="alertcard-title">{alert.title}</span>
        </div>
        <Badge variant={alert.severity}>{alert.severity}</Badge>
      </div>

      <div className="alertcard-meta">
        <span className="alertcard-province">{province ? province.name : 'Unknown Province'}</span>
        <span className="alertcard-dot" />
        <span className="alertcard-time">{formatRelativeTime(alert.timestamp)}</span>
      </div>

      <div className="alertcard-desc">{alert.description}</div>

      {(alert.magnitude !== undefined || alert.waterLevel !== undefined || alert.depth !== undefined) && (
        <div className="alertcard-details">
          {alert.magnitude !== undefined && (
            <span className="alertcard-detail-item">
              Mag: <strong>{alert.magnitude} M</strong>
            </span>
          )}
          {alert.depth !== undefined && (
            <span className="alertcard-detail-item">
              Depth: <strong>{alert.depth} km</strong>
            </span>
          )}
          {alert.waterLevel !== undefined && (
            <span className="alertcard-detail-item">
              Level: <strong>{alert.waterLevel} m</strong>
            </span>
          )}
          {alert.affectedArea && (
            <span className="alertcard-detail-item" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '150px' }}>
              Area: <strong>{alert.affectedArea}</strong>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default AlertCard;
