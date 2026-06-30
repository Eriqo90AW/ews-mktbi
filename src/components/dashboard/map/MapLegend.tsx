import React, { useState } from 'react';
import type { DisasterAlert } from '../../../types';

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

const MapLegend: React.FC<MapLegendProps> = ({
  isInariskFilter,
  mapLayers,
  onToggleLayer,
  selectedAlert,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Use the raw BMKG/magma severity from the alert to determine which
  // severity indicator rows are visible in the legend.
  const selectedAlertSeverity = selectedAlert?.severity ?? null;

  const showCritical = !selectedAlert || selectedAlertSeverity === 'critical';
  const showWarning  = !selectedAlert || selectedAlertSeverity === 'warning';
  const showWatch    = !selectedAlert || selectedAlertSeverity === 'watch';

  return (
    <div className={`map-legend ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="legend-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="legend-header-title-container">
          <img
            src={isInariskFilter ? "/bnpb-logo.png" : "/bmkg-logo.png"}
            alt={isInariskFilter ? "BNPB Logo" : "BMKG Logo"}
            className="legend-agency-logo"
          />
          <span className="legend-title">{isInariskFilter ? 'Indikator Wilayah (InaRisk)' : 'Map Legend'}</span>
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
          {/* ── Alert severity rows (toggleable) ─────────────────────────── */}
          {showCritical && (
            <div
              className={`legend-item ${(!mapLayers.critical && !isInariskFilter) ? 'disabled' : ''}`}
              onClick={() => { if (!isInariskFilter) onToggleLayer('critical'); }}
              title={isInariskFilter ? 'Kerentanan Tinggi' : 'Toggle Risiko Tinggi'}
              style={{ cursor: isInariskFilter ? 'default' : 'pointer' }}
            >
              <span className="legend-shape-icon">
                <div className="legend-color critical"></div>
              </span>
              <span>{isInariskFilter ? 'Kerentanan Tinggi (>0.6)' : 'Risiko Tinggi'}</span>
              {!isInariskFilter && (
                <span className={`legend-ios-toggle ${mapLayers.critical ? 'on' : 'off'}`}>
                  <span className="legend-ios-thumb" />
                </span>
              )}
            </div>
          )}

          {showWarning && (
            <div
              className={`legend-item ${(!mapLayers.warning && !isInariskFilter) ? 'disabled' : ''}`}
              onClick={() => { if (!isInariskFilter) onToggleLayer('warning'); }}
              title={isInariskFilter ? 'Kerentanan Sedang' : 'Toggle Risiko Sedang'}
              style={{ cursor: isInariskFilter ? 'default' : 'pointer' }}
            >
              <span className="legend-shape-icon">
                <div className="legend-color warning"></div>
              </span>
              <span>{isInariskFilter ? 'Kerentanan Sedang (0.3-0.6)' : 'Risiko Sedang'}</span>
              {!isInariskFilter && (
                <span className={`legend-ios-toggle ${mapLayers.warning ? 'on' : 'off'}`}>
                  <span className="legend-ios-thumb" />
                </span>
              )}
            </div>
          )}

          {showWatch && (
            <div
              className={`legend-item ${(!mapLayers.watch && !isInariskFilter) ? 'disabled' : ''}`}
              onClick={() => { if (!isInariskFilter) onToggleLayer('watch'); }}
              title={isInariskFilter ? 'Kerentanan Rendah' : 'Toggle Risiko Rendah'}
              style={{ cursor: isInariskFilter ? 'default' : 'pointer' }}
            >
              <span className="legend-shape-icon">
                <div className="legend-color watch"></div>
              </span>
              <span>{isInariskFilter ? 'Kerentanan Rendah (>0-0.3)' : 'Risiko Rendah'}</span>
              {!isInariskFilter && (
                <span className={`legend-ios-toggle ${mapLayers.watch ? 'on' : 'off'}`}>
                  <span className="legend-ios-thumb" />
                </span>
              )}
            </div>
          )}
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
