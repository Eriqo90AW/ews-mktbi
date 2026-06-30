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
          {showCritical && (
            <div
              className={`legend-item ${(!mapLayers.critical && !isInariskFilter) ? 'disabled' : ''}`}
              onClick={() => { if (!isInariskFilter) onToggleLayer('critical'); }}
              title={isInariskFilter ? 'Kerentanan Tinggi' : 'Toggle Risiko Tinggi'}
              style={{ cursor: isInariskFilter ? 'default' : 'pointer' }}
            >
              <div className="legend-color critical"></div>
              <span>{isInariskFilter ? 'Kerentanan Tinggi (>0.6)' : 'Risiko Tinggi'}</span>
              {!isInariskFilter && <span className="legend-toggle-indicator"></span>}
            </div>
          )}

          {showWarning && (
            <div
              className={`legend-item ${(!mapLayers.warning && !isInariskFilter) ? 'disabled' : ''}`}
              onClick={() => { if (!isInariskFilter) onToggleLayer('warning'); }}
              title={isInariskFilter ? 'Kerentanan Sedang' : 'Toggle Risiko Sedang'}
              style={{ cursor: isInariskFilter ? 'default' : 'pointer' }}
            >
              <div className="legend-color warning"></div>
              <span>{isInariskFilter ? 'Kerentanan Sedang (0.3-0.6)' : 'Risiko Sedang'}</span>
              {!isInariskFilter && <span className="legend-toggle-indicator"></span>}
            </div>
          )}

          {showWatch && (
            <div
              className={`legend-item ${(!mapLayers.watch && !isInariskFilter) ? 'disabled' : ''}`}
              onClick={() => { if (!isInariskFilter) onToggleLayer('watch'); }}
              title={isInariskFilter ? 'Kerentanan Rendah' : 'Toggle Risiko Rendah'}
              style={{ cursor: isInariskFilter ? 'default' : 'pointer' }}
            >
              <div className="legend-color watch"></div>
              <span>{isInariskFilter ? 'Kerentanan Rendah (>0-0.3)' : 'Risiko Rendah'}</span>
              {!isInariskFilter && <span className="legend-toggle-indicator"></span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MapLegend;
