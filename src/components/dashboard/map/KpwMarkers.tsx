import React from 'react';
import { Marker, Tooltip, Popup } from 'react-leaflet';
import L from 'leaflet';
import type { DisasterAlert, DisasterType, KpwbiOffice, AlertSeverity, RiskCalcResult } from '../../../types';
import { KPWBI_OFFICES } from '../../../constants/kpwbiOffices';
import { PROVINCES } from '../../../constants/provinces';
import { isOfficeAffectedByAlert } from '../../../utils/disasterImpact';
import { BnpbInariskService } from '../../../services/bnpbInariskService';
import { getDisasterEmoji } from '../../../utils/alertUtils';
import type { NearestKpwResult } from '../../../utils/geo';

interface KpwMarkersProps {
  alerts: DisasterAlert[];
  riskResults: RiskCalcResult[];
  activeTypeFilter: DisasterType | 'all';
  selectedProvinceId: string | null;
  nearestOffices: NearestKpwResult[];
  onProvinceSelect: (id: string) => void;
  markerRefs: React.MutableRefObject<Record<string, L.Marker | null>>;
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
  selectedAlertId?: string | null;
}

/**
 * Determine the highest risk-level severity for a given office from riskResults.
 * Returns 'critical' | 'warning' | 'watch' | null.
 */
function getOfficeRiskSeverity(
  office: KpwbiOffice,
  riskResults: RiskCalcResult[]
): AlertSeverity | null {
  let maxScore = 0;
  riskResults.forEach((res) => {
    if (res.affectedLocations.some((loc) => loc.id === office.id)) {
      if (res.riskScore > maxScore) maxScore = res.riskScore;
    }
  });
  if (maxScore === 0) return null;
  if (maxScore >= 7) return 'critical';
  if (maxScore >= 4) return 'warning';
  return 'watch';
}

function getProvinceName(provinceId: string): string {
  return PROVINCES.find((p) => p.id === provinceId)?.name ?? provinceId;
}

function createMarkerIcon(
  office: KpwbiOffice,
  riskSeverity: AlertSeverity | null,
  selectedProvinceId: string | null,
  nearestOffices: NearestKpwResult[]
): L.DivIcon {
  const classes: string[] = [];
  if (riskSeverity) classes.push('has-alert', `alert-${riskSeverity}`);
  if (selectedProvinceId === office.provinceId) {
    classes.push('selected');
  } else if (nearestOffices.some((n) => n.office.id === office.id)) {
    classes.push('nearest');
  }
  const classString = classes.join(' ');

  if (office.isKantorPusat) {
    return L.divIcon({
      className: 'custom-marker kp-marker-container',
      html: `<svg class="kp-building ${classString}" viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12,2L1,7v2h22V7L12,2z M4,9v11h3V9H4z M10,9v11h4V9h-4z M17,9v11h3V9h-3z M2,20v2h20v-2H2z"/></svg>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  }

  if (office.isKorwil) {
    return L.divIcon({
      className: 'custom-marker korwil-marker-container',
      html: `<svg class="korwil-star ${classString}" viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" stroke="white" stroke-width="2" d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z"/></svg>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  }

  return L.divIcon({
    className: 'custom-marker',
    html: `<div class="${['marker-dot', ...classes].join(' ')}"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

const KpwMarkers: React.FC<KpwMarkersProps> = ({
  alerts,
  riskResults,
  activeTypeFilter,
  selectedProvinceId,
  nearestOffices,
  onProvinceSelect,
  markerRefs,
  mapLayers,
  selectedAlertId,
}) => {
  const isInariskFilter = ['flood', 'tsunami', 'kekeringan', 'volcanic'].includes(activeTypeFilter);

  return (
    <>
      {KPWBI_OFFICES.filter((office) => {
        if (selectedAlertId) {
          // 1. Tampilkan jika kantor terdampak oleh alert terpilih
          const selectedAlert = alerts.find(a => a.id === selectedAlertId);
          if (selectedAlert && isOfficeAffectedByAlert(office, selectedAlert)) {
            return true;
          }
          // 2. Atau jika kantor tersebut adalah kantor provinsi terpilih (biru)
          if (selectedProvinceId && office.provinceId === selectedProvinceId) {
            return true;
          }
          // 3. Atau jika kantor tersebut adalah kantor terdekat (hijau)
          if (nearestOffices.some((n) => n.office.id === office.id)) {
            return true;
          }
          return false;
        }

        const activeAlerts = alerts.filter((a) => isOfficeAffectedByAlert(office, a));
        if (activeAlerts.length > 0) return true;

        const isNearest = nearestOffices.some((n) => n.office.id === office.id);
        if (isNearest && mapLayers.nearest) return true;

        if (office.isKantorPusat) return mapLayers.kp;
        if (office.isKorwil) return mapLayers.korwil;
        return mapLayers.normal;
      }).map((office) => {
        const nearestInfo = nearestOffices.find((n) => n.office.id === office.id);
        const riskSeverity = getOfficeRiskSeverity(office, riskResults);

        return (
          <Marker
            key={office.id}
            position={[office.latitude, office.longitude]}
            icon={createMarkerIcon(office, riskSeverity, selectedProvinceId, nearestOffices)}
            zIndexOffset={office.isKantorPusat ? 1000 : office.isKorwil ? 500 : 0}
            ref={(ref) => { markerRefs.current[office.id] = ref; }}
            eventHandlers={{
              click: () => {
                onProvinceSelect(office.provinceId);
              },
            }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={0.9} permanent={false}>
              <div>
                <strong>{office.city}</strong> — {office.name}
                {office.isKantorPusat && ' 🏛️ (Kantor Pusat)'}
                {office.isKorwil && !office.isKantorPusat && ' ★ Korwil'}
                {nearestInfo && (
                  <div style={{ marginTop: '4px', fontSize: '11px', color: '#10b981', fontWeight: 600 }}>
                    ↔️ Terdekat ({nearestInfo.distanceKm.toFixed(1)} km)
                  </div>
                )}
                {isInariskFilter && (() => {
                  const hazard = activeTypeFilter as 'flood' | 'tsunami' | 'kekeringan' | 'volcanic';
                  const indexVal = BnpbInariskService.getLocalHazardIndex(office.id, hazard);
                  const hazardTitle = { flood: 'Banjir', tsunami: 'Tsunami', kekeringan: 'Kekeringan', volcanic: 'Gunung Api' }[hazard];
                  return (
                    <div style={{ marginTop: '4px', fontSize: '11px', fontWeight: 700, color: indexVal > 0.6 ? 'var(--alert-critical)' : indexVal > 0.3 ? 'var(--alert-warning)' : 'var(--alert-watch)' }}>
                      {hazardTitle} Indeks: {indexVal.toFixed(2)}
                    </div>
                  );
                })()}
              </div>
            </Tooltip>

            <Popup offset={[0, -10]}>
              {isInariskFilter ? (
                (() => {
                  const hazard = activeTypeFilter as 'flood' | 'tsunami' | 'kekeringan' | 'volcanic';
                  const indexVal = BnpbInariskService.getLocalHazardIndex(office.id, hazard);
                  const hazardTitle = { flood: 'Banjir', tsunami: 'Tsunami', kekeringan: 'Kekeringan', volcanic: 'Gunung Api' }[hazard];
                  let severity: AlertSeverity = 'watch';
                  if (indexVal > 0.6) severity = 'critical';
                  else if (indexVal > 0.3) severity = 'warning';
                  return (
                    <div className="ews-popup-content">
                      <div className={`ews-popup-header ${severity}`}>
                        <span>{getDisasterEmoji(hazard)}</span>
                        <span>Indeks Bahaya {hazardTitle} (InaRisk)</span>
                      </div>
                      <div className="ews-popup-title" style={{ marginTop: 0 }}>{office.name} ({office.city})</div>
                      <p className="ews-popup-desc">
                        Berdasarkan data InaRisk BNPB, lokasi sekitar {office.name} memiliki tingkat kerentanan/bahaya {hazardTitle} dengan indeks {indexVal.toFixed(2)} dari 1.0.
                      </p>
                      <div className="ews-popup-footer">
                        <span className="ews-popup-tag" style={{
                          color: severity === 'critical' ? 'var(--alert-critical)' : severity === 'warning' ? 'var(--alert-warning)' : 'var(--alert-watch)',
                          backgroundColor: severity === 'critical' ? 'var(--alert-critical-bg)' : severity === 'warning' ? 'var(--alert-warning-bg)' : 'var(--alert-watch-bg)',
                          borderColor: severity === 'critical' ? 'var(--alert-critical-border)' : severity === 'warning' ? 'var(--alert-warning-border)' : 'var(--alert-watch-border)',
                        }}>
                          {severity.toUpperCase()} ({indexVal.toFixed(2)})
                        </span>
                        <span>InaRisk BNPB</span>
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="ews-popup-content">
                  <div className="ews-popup-header" style={{ color: 'var(--accent-primary)' }}>
                    <span>📍</span>
                    <span>KPwBI OFFICE</span>
                  </div>
                  <div className="ews-popup-title" style={{ marginTop: 0 }}>{office.name}</div>
                  <p className="ews-popup-desc">
                    City: <strong>{office.city}</strong><br />
                    Province: {getProvinceName(office.provinceId)}<br />
                    Region: {office.region}<br />
                    Coordinates: {office.latitude.toFixed(4)}, {office.longitude.toFixed(4)}
                  </p>
                  <div className="ews-popup-footer">
                    {riskSeverity && (
                      <span className="ews-popup-tag" style={{
                        color: riskSeverity === 'critical' ? 'var(--alert-critical)' : riskSeverity === 'warning' ? 'var(--alert-warning)' : 'var(--alert-watch)',
                        backgroundColor: riskSeverity === 'critical' ? 'var(--alert-critical-bg)' : riskSeverity === 'warning' ? 'var(--alert-warning-bg)' : 'var(--alert-watch-bg)',
                        borderColor: riskSeverity === 'critical' ? 'var(--alert-critical-border)' : riskSeverity === 'warning' ? 'var(--alert-warning-border)' : 'var(--alert-watch-border)',
                      }}>
                        Risiko: {riskSeverity === 'critical' ? 'Tinggi' : riskSeverity === 'warning' ? 'Sedang' : 'Rendah'}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};

export default KpwMarkers;
