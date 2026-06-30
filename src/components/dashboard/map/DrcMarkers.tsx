import React from 'react';
import { Marker, Tooltip, Popup } from 'react-leaflet';
import L from 'leaflet';
import { DRC_LOCATIONS } from '../../../constants/drcLocations';
import { haversineDistance } from '../../../utils/geo';
import { getAlertImpactRadiusKm } from '../../../utils/disasterImpact';
import type { DisasterAlert, RiskCalcResult, AlertSeverity } from '../../../types';

interface DrcMarkersProps {
  selectedAlert?: DisasterAlert | null;
  riskResults?: RiskCalcResult[];
}

/**
 * Determine the highest risk-level severity for a given DRC from riskResults.
 */
function getDrcRiskSeverity(
  drcId: string,
  riskResults: RiskCalcResult[]
): AlertSeverity | null {
  let maxScore = 0;
  riskResults.forEach((res) => {
    if (res.affectedLocations.some((loc) => loc.id === drcId)) {
      if (res.riskScore > maxScore) maxScore = res.riskScore;
    }
  });
  if (maxScore === 0) return null;
  if (maxScore >= 7) return 'critical';
  if (maxScore >= 4) return 'warning';
  return 'watch';
}

const DrcMarkers: React.FC<DrcMarkersProps> = ({ selectedAlert, riskResults = [] }) => {
  const visibleDrcs = DRC_LOCATIONS.filter((drc) => {
    if (selectedAlert) {
      if (selectedAlert.latitude !== undefined && selectedAlert.longitude !== undefined) {
        const dist = haversineDistance(
          selectedAlert.latitude,
          selectedAlert.longitude,
          drc.latitude,
          drc.longitude
        );
        const radius = getAlertImpactRadiusKm(selectedAlert);
        return dist <= radius;
      }
      return false;
    }
    return true;
  });

  return (
    <>
      {visibleDrcs.map((drc) => {
        const riskSeverity = getDrcRiskSeverity(drc.id, riskResults);
        const alertClass = riskSeverity ? `has-alert alert-${riskSeverity}` : '';

        const icon = L.divIcon({
          className: 'custom-marker drc-marker-container',
          html: `<svg class="drc-triangle ${alertClass}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22"><polygon points="12,2 23,22 1,22" fill="currentColor" stroke="white" stroke-width="2"/><text x="12" y="18" text-anchor="middle" font-size="8" fill="white" font-weight="bold">${drc.type}</text></svg>`,
          iconSize: [22, 22],
          iconAnchor: [11, 22],
        });

        return (
          <Marker key={drc.id} position={[drc.latitude, drc.longitude]} icon={icon}>
            <Tooltip direction="top" offset={[0, -4]} opacity={0.95}>
              <div>
                <strong>{drc.name}</strong>
                <div style={{ fontSize: '11px', color: 'var(--accent-primary)', fontWeight: 600 }}>
                  {drc.type === 'DRC' ? '▲ Disaster Recovery Center' : '▲ Data Center'}
                </div>
                <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>{drc.city}</div>
              </div>
            </Tooltip>
            <Popup offset={[0, -18]}>
              <div className="ews-popup-content">
                <div className="ews-popup-header" style={{ color: 'var(--accent-primary)' }}>
                  <span>▲</span>
                  <span>{drc.type} — Bank Indonesia</span>
                </div>
                <div className="ews-popup-title" style={{ marginTop: 0 }}>{drc.fullName}</div>
                <p className="ews-popup-desc">
                  Kota: <strong>{drc.city}</strong><br />
                  Koordinat: {drc.latitude.toFixed(4)}, {drc.longitude.toFixed(4)}
                </p>
                <div className="ews-popup-footer">
                  <span className="ews-popup-tag" style={{ color: 'var(--accent-primary)', backgroundColor: 'var(--accent-light)' }}>
                    ▲ {drc.type}
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};

export default DrcMarkers;

