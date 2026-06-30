import React, { useState } from 'react';
import type { DisasterAlert, RiskCalcResult } from '../../../types';
import { DRC_LOCATIONS } from '../../../constants/drcLocations';
import { getAlertImpactRadiusKm } from '../../../utils/disasterImpact';
import { haversineDistance } from '../../../utils/geo';

interface MapLegendProps {
  isInariskFilter: boolean;
  mapLayers: {
    kp: boolean;
    korwil: boolean;
    normal: boolean;
    nearest: boolean;
    drc: boolean;
    critical: boolean;
    warning: boolean;
    watch: boolean;
  };
  onToggleLayer: (layerKey: keyof MapLegendProps['mapLayers']) => void;
  selectedAlert?: DisasterAlert | null;
  riskResults: RiskCalcResult[];
}

const MapLegend: React.FC<MapLegendProps> = ({
  isInariskFilter,
  mapLayers,
  onToggleLayer,
  selectedAlert,
  riskResults,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);



  const hasAffectedDrc = selectedAlert
    ? selectedAlert.latitude !== undefined && selectedAlert.longitude !== undefined
      ? DRC_LOCATIONS.some((drc) => {
          const dist = haversineDistance(
            selectedAlert.latitude!,
            selectedAlert.longitude!,
            drc.latitude,
            drc.longitude
          );
          const radius = getAlertImpactRadiusKm(selectedAlert);
          return dist <= radius;
        })
      : false
    : true;

  // Tentukan visibilitas legend item
  const showKp = true;
  const showKorwil = true;
  const showNormal = true;
  const showDrc = !selectedAlert || hasAffectedDrc;
  const showNearest = true; // Tetap tampilkan KPWBI Terdekat (hijau) agar relevan dengan peta
  
  // Use the computed riskLevel (not raw alert.severity) to determine which
  // severity indicator rows are visible in the legend.
  const selectedRiskLevel = selectedAlert
    ? (riskResults.find((r) => r.event.id === selectedAlert.id)?.riskLevel ?? null)
    : null;

  const showCritical = !selectedAlert || selectedRiskLevel === 'Tinggi';
  const showWarning  = !selectedAlert || selectedRiskLevel === 'Sedang';
  const showWatch    = !selectedAlert || selectedRiskLevel === 'Rendah';

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
          {showKp && (
            <div
              className={`legend-item ${!mapLayers.kp ? 'disabled' : ''}`}
              style={{ gap: '8px' }}
              onClick={() => onToggleLayer('kp')}
              title="Toggle Kantor Pusat BI"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" style={{ color: '#1e3a8a', fill: 'currentColor', flexShrink: 0 }}>
                <path d="M12,2L1,7v2h22V7L12,2z M4,9v11h3V9H4z M10,9v11h4V9h-4z M17,9v11h3V9h-3z M2,20v2h20v-2H2z" />
              </svg>
              <span>Kantor Pusat BI (KP)</span>
              <span className="legend-toggle-indicator"></span>
            </div>
          )}

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

          {showKorwil && (
            <div
              className={`legend-item ${!mapLayers.korwil ? 'disabled' : ''}`}
              style={{ gap: '8px' }}
              onClick={() => onToggleLayer('korwil')}
              title="Toggle Korwil Office"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" style={{ color: 'var(--accent-primary)', fill: 'currentColor', flexShrink: 0 }}>
                <path d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z" />
              </svg>
              <span>KPwBI Korwil Office</span>
              <span className="legend-toggle-indicator"></span>
            </div>
          )}

          {showNearest && (
            <div
              className={`legend-item ${!mapLayers.nearest ? 'disabled' : ''}`}
              onClick={() => onToggleLayer('nearest')}
              title="Toggle KPwBI Terdekat"
            >
              <div className="legend-color nearest-dot"></div>
              <span>KPwBI Terdekat</span>
              <span className="legend-toggle-indicator"></span>
            </div>
          )}

          {showNormal && (
            <div
              className={`legend-item ${!mapLayers.normal ? 'disabled' : ''}`}
              onClick={() => onToggleLayer('normal')}
              title="Toggle KPwBI Office (Normal)"
            >
              <div className="legend-color normal"></div>
              <span>KPwBI Office (Normal)</span>
              <span className="legend-toggle-indicator"></span>
            </div>
          )}

          {showDrc && (
            <div
              className={`legend-item ${!mapLayers.drc ? 'disabled' : ''}`}
              style={{ gap: '8px' }}
              onClick={() => onToggleLayer('drc')}
              title="Toggle Toggle Data Center / DRC"
            >
              <svg viewBox="0 0 24 24" width="14" height="14" style={{ flexShrink: 0 }}>
                <polygon points="12,2 23,22 1,22" fill="var(--accent-primary)" stroke="white" strokeWidth="1" />
              </svg>
              <span>Data Center / DRC (BI)</span>
              <span className="legend-toggle-indicator"></span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MapLegend;
