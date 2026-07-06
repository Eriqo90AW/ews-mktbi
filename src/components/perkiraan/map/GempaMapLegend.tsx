import React, { useState } from 'react';

interface GempaMapLegendProps {
  megathrust: boolean;
  ringOfFire: boolean;
  onToggleMegathrust: () => void;
  onToggleRingOfFire: () => void;
}

const GempaMapLegend: React.FC<GempaMapLegendProps> = ({
  megathrust,
  ringOfFire,
  onToggleMegathrust,
  onToggleRingOfFire,
}) => {
  const [isExpanded, setIsExpanded] = useState(() => window.innerWidth > 768);

  return (
    <div className={`gempa-map-legend ${isExpanded ? 'expanded' : 'collapsed'}`}>
      <div className="legend-header" onClick={() => setIsExpanded(!isExpanded)}>
        <span className="legend-title">Peta Seismik</span>
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
          <div className="legend-item" onClick={onToggleMegathrust}>
            <span className="legend-shape-icon">
              <span
                style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  backgroundColor: '#7c3aed',
                  display: 'inline-block',
                }}
              />
            </span>
            <span>Zona Megathrust</span>
            <span className={`legend-ios-toggle ${megathrust ? 'on' : 'off'}`}>
              <span className="legend-ios-thumb" />
            </span>
          </div>

          <div className="legend-item" onClick={onToggleRingOfFire}>
            <span className="legend-shape-icon" style={{ display: 'flex', alignItems: 'center' }}>
              <span
                style={{
                  width: '18px',
                  height: '3px',
                  borderRadius: '1px',
                  backgroundColor: '#ef4444',
                  display: 'inline-block',
                }}
              />
            </span>
            <span>Ring of Fire</span>
            <span className={`legend-ios-toggle ${ringOfFire ? 'on' : 'off'}`}>
              <span className="legend-ios-thumb" />
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GempaMapLegend;
