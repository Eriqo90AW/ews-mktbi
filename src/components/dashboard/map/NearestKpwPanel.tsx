import React from 'react';
import type { DisasterAlert, KpwbiOffice } from '../../../types';
import { isOfficeAffectedByAlert } from '../../../utils/disasterImpact';
import type { NearestKpwResult } from '../../../utils/geo';

interface NearestKpwPanelProps {
  selectedOffice: KpwbiOffice | null;
  nearestOffices: NearestKpwResult[];
  alerts: DisasterAlert[];
  onAlertSelect: (id: string) => void;
  onProvinceSelect: (id: string) => void;
}

const SEVERITY_WEIGHT = { critical: 3, warning: 2, watch: 1 } as const;

const NearestKpwPanel: React.FC<NearestKpwPanelProps> = ({
  selectedOffice,
  nearestOffices,
  alerts,
  onAlertSelect,
  onProvinceSelect,
}) => {
  if (!selectedOffice || nearestOffices.length === 0) return null;

  return (
    <div className="nearest-kpw-panel">
      <div className="nearest-kpw-header">
        <span className="nearest-kpw-icon">📍</span>
        <span className="nearest-kpw-title">
          KPW Terdekat dari <strong>{selectedOffice.city}</strong>
        </span>
      </div>
      <div className="nearest-kpw-list">
        {nearestOffices.map(({ office, distanceKm }) => {
          const activeAlerts = alerts.filter((a) => isOfficeAffectedByAlert(office, a));
          const mainAlert = activeAlerts.length > 0
            ? activeAlerts.reduce((h, c) => (SEVERITY_WEIGHT[c.severity] || 0) > (SEVERITY_WEIGHT[h.severity] || 0) ? c : h)
            : null;
          const hasAlert = mainAlert !== null;

          return (
            <div
              key={office.id}
              className={`nearest-kpw-item ${hasAlert ? `alert-${mainAlert!.severity}` : ''}`}
              onClick={() => {
                if (hasAlert) onAlertSelect(mainAlert!.id);
                else onProvinceSelect(office.provinceId);
              }}
            >
              <span className={`nearest-item-indicator ${hasAlert ? 'has-alert' : ''}`} />
              <div className="nearest-kpw-details">
                <div className="nearest-kpw-name">{office.name}</div>
                <div className="nearest-kpw-meta">
                  {office.city} {office.isKantorPusat ? '🏛️ KP' : office.isKorwil ? '★ Korwil' : ''}
                </div>
              </div>
              <div className="nearest-kpw-distance">{distanceKm.toFixed(0)} km</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NearestKpwPanel;
