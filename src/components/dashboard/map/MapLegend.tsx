import React, { useState } from 'react';
import type { DisasterAlert, AlertSeverity } from '../../../types';

interface MapLegendProps {
  isInariskFilter: boolean;
  mapLayers: {
    critical: boolean;
    warning: boolean;
    watch: boolean;
  };
  onToggleLayer: (layerKey: 'critical' | 'warning' | 'watch') => void;
  selectedAlert?: DisasterAlert | null;
}

const SEV_CONFIG: Array<{ key: 'critical' | 'warning' | 'watch'; num: AlertSeverity; label: string; color: string }> = [
  { key: 'critical', num: 3, label: 'Keparahan Tinggi', color: 'var(--alert-critical)' },
  { key: 'warning',  num: 2, label: 'Keparahan Sedang', color: 'var(--alert-warning)' },
  { key: 'watch',    num: 1, label: 'Keparahan Rendah', color: 'var(--alert-watch)' },
];

const MapLegend: React.FC<MapLegendProps> = ({
  isInariskFilter,
  mapLayers,
  onToggleLayer,
  selectedAlert,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const selectedSeverity = selectedAlert?.severity ?? null;

  return (
    <div className={`map-legend ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="legend-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="legend-header-title-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            <img src="/bmkg-logo.png" alt="BMKG Logo" className="legend-agency-logo" />
            <img src="/esdm-logo.png" alt="ESDM Logo" className="legend-agency-logo" />
            <img src="/bnpb-logo.png" alt="BNPB Logo" className="legend-agency-logo" />
          </div>
          <span className="legend-title" style={{ marginLeft: '4px' }}>
            {isInariskFilter ? 'Indikator Wilayah (InaRisk)' : 'Map Legend'}
          </span>
        </div>
        <svg
          className={`legend-toggle-icon ${isExpanded ? 'rotated' : ''}`}
          viewBox="0 0 24 24"
          width="16"
          height="16"
          stroke="currentColor"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>

      {isExpanded && (
        <div className="legend-content">
          {SEV_CONFIG.map(({ key, num, label, color }) => {
            const show = !selectedAlert || selectedSeverity === num;
            if (!show) return null;
            return (
              <div
                key={key}
                className={`legend-item ${(!mapLayers[key] && !isInariskFilter) ? 'disabled' : ''}`}
                onClick={() => { if (!isInariskFilter) onToggleLayer(key); }}
                title={isInariskFilter ? label : `Toggle ${label}`}
                style={{ cursor: isInariskFilter ? 'default' : 'pointer' }}
              >
                <span className="legend-shape-icon" style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                  {[1, 2, 3].map((i) => (
                    <span key={i} style={{
                      width: '12px', height: '4px', borderRadius: '1px',
                      backgroundColor: i <= num ? color : 'var(--border-default)',
                      display: 'inline-block',
                    }} />
                  ))}
                </span>
                <span>{isInariskFilter ? (() => {
                  const inariskLabels: Record<number, string> = { 
                    3: 'Kerentanan Tinggi (61-100)', 
                    2: 'Kerentanan Sedang (31-60)', 
                    1: 'Kerentanan Rendah (0-30)' 
                  };
                  return inariskLabels[num];
                })() : label}</span>
                {!isInariskFilter && (
                  <span className={`legend-ios-toggle ${mapLayers[key] ? 'on' : 'off'}`}>
                    <span className="legend-ios-thumb" />
                  </span>
                )}
              </div>
            );
          })}
          {!isInariskFilter && (
            <>
              <div className="legend-item legend-item--shape">
                <span className="legend-shape-icon">
                  <svg viewBox="0 0 24 24" width="14" height="14">
                    <circle cx="12" cy="12" r="9" fill="var(--accent-primary)" stroke="white" strokeWidth="2" />
                  </svg>
                </span>
                <span>KPwBI (Kantor Perwakilan)</span>
              </div>

              <div className="legend-item legend-item--shape">
                <span className="legend-shape-icon">
                  <svg viewBox="0 0 24 24" width="14" height="14">
                    <path fill="var(--accent-primary)" stroke="white" strokeWidth="1.5"
                      d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z" />
                  </svg>
                </span>
                <span>Korwil (Koordinator Wilayah)</span>
              </div>

              <div className="legend-item legend-item--shape">
                <span className="legend-shape-icon">
                  <svg viewBox="0 0 24 24" width="14" height="14">
                    <path fill="var(--accent-primary)" d="M12,2L1,7v2h22V7L12,2z M4,9v11h3V9H4z M10,9v11h4V9h-4z M17,9v11h3V9h-3z M2,20v2h20v-2H2z"/>
                  </svg>
                </span>
                <span>Kantor Pusat (KP)</span>
              </div>

              <div className="legend-item legend-item--shape">
                <span className="legend-shape-icon">
                  <svg viewBox="0 0 24 24" width="14" height="14">
                    <polygon points="12,2 23,22 1,22" fill="var(--accent-primary)" stroke="white" strokeWidth="1.5" />
                  </svg>
                </span>
                <span>Data Center (Sinergi)</span>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default MapLegend;