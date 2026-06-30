import React from 'react';
import { ENSO_HISTORY, ENSO_CURRENT, ENSO_OUTLOOK, getPhaseColor, getPhaseLabel, getEnsoElevatedProvinces } from '../../constants/ensoData';
import { PROVINCES } from '../../constants/provinces';
import { KPWBI_OFFICES } from '../../constants/kpwbiOffices';
import { BnpbInariskService } from '../../services/bnpbInariskService';
import PerkiraanMap from './PerkiraanMap';

const IklimView: React.FC = () => {
  const currentPhase = ENSO_CURRENT.phase;
  const phaseColor = getPhaseColor(currentPhase);
  const phaseLabel = getPhaseLabel(currentPhase);

  const { flood: floodP, drought: droughtP } = getEnsoElevatedProvinces(currentPhase);

  // Offices in elevated provinces
  const atRiskOffices = KPWBI_OFFICES.filter(
    (o) => floodP.includes(o.provinceId) || droughtP.includes(o.provinceId)
  );

  const provincesMap = new Map(PROVINCES.map((p) => [p.id, p]));

  // Display last 8 months in timeline
  const timelineData = ENSO_HISTORY.slice(-8);

  return (
    <div className="perkiraan-tab-layout">
      {/* Left panel */}
      <aside className="perkiraan-panel">
        <div className="perkiraan-panel-header">
          <span className="perkiraan-panel-title">Kondisi Iklim (ENSO)</span>
        </div>

        {/* Current ENSO card */}
        <div className="enso-current-card" style={{ borderLeft: `4px solid ${phaseColor}` }}>
          <div className="enso-phase-badge" style={{ color: phaseColor, borderColor: phaseColor }}>
            {phaseLabel}
          </div>
          <div className="enso-oni-row">
            <span className="enso-oni-label">ONI Terkini</span>
            <span className="enso-oni-value" style={{ color: phaseColor }}>
              {ENSO_CURRENT.oni > 0 ? '+' : ''}{ENSO_CURRENT.oni.toFixed(1)}
            </span>
            <span className="enso-oni-month">({ENSO_CURRENT.label})</span>
          </div>
          <p className="enso-description">{ENSO_OUTLOOK.description}</p>
          <div className="enso-confidence-row">
            <span>Confidence:</span>
            <span style={{ fontWeight: 600 }}>{ENSO_OUTLOOK.confidence}</span>
          </div>
        </div>

        {/* ONI bar timeline */}
        <div className="enso-timeline">
          <div className="enso-timeline-title">Riwayat ONI (8 Bulan Terakhir)</div>
          <div className="enso-bars">
            {timelineData.map((m) => {
              const barH = Math.min(Math.abs(m.oni) * 60, 60);
              const color = getPhaseColor(m.phase);
              const isPositive = m.oni >= 0;
              return (
                <div key={m.month} className="enso-bar-col" title={`${m.label}: ONI ${m.oni > 0 ? '+' : ''}${m.oni.toFixed(1)}`}>
                  <div className="enso-bar-wrap">
                    {isPositive ? (
                      <div className="enso-bar pos" style={{ height: `${barH}px`, backgroundColor: color }} />
                    ) : (
                      <div className="enso-bar neg" style={{ height: `${barH}px`, backgroundColor: color }} />
                    )}
                  </div>
                  <span className="enso-bar-label">{m.label.slice(0, 3)}</span>
                </div>
              );
            })}
          </div>
          <div className="enso-bar-legend">
            <span style={{ color: getPhaseColor('el_nino') }}>■ El Niño</span>
            <span style={{ color: getPhaseColor('la_nina') }}>■ La Niña</span>
            <span style={{ color: getPhaseColor('netral') }}>■ Netral</span>
          </div>
        </div>

        {/* Elevated hazards */}
        {ENSO_OUTLOOK.elevatedHazards.length > 0 && (
          <div className="enso-hazards">
            <div className="enso-hazards-title">Bahaya yang Meningkat</div>
            {ENSO_OUTLOOK.elevatedHazards.map((h) => (
              <div key={h.hazard} className={`enso-hazard-row ${h.hazard}`}>
                <span className="enso-hazard-icon">{h.hazard === 'banjir' ? '🌧️' : '🏜️'}</span>
                <div>
                  <span className="enso-hazard-type">{h.hazard === 'banjir' ? 'Risiko Banjir Meningkat' : 'Risiko Kekeringan Meningkat'}</span>
                  <p className="enso-hazard-regions">{h.regions}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* At-risk KPW list */}
        <div className="perkiraan-panel-scroll" style={{ marginTop: 8 }}>
          <div className="perkiraan-section-title">KPw Terdampak Iklim</div>
          {atRiskOffices.length === 0 ? (
            <div className="perkiraan-empty"><p>Tidak ada KPw dalam wilayah risiko iklim yang meningkat.</p></div>
          ) : (
            atRiskOffices.map((office) => {
              const province = provincesMap.get(office.provinceId);
              const isFlood = floodP.includes(office.provinceId);
              const isDrought = droughtP.includes(office.provinceId);
              const floodIdx = BnpbInariskService.getLocalHazardIndex(office.id, 'flood');
              const droughtIdx = BnpbInariskService.getLocalHazardIndex(office.id, 'kekeringan');
              return (
                <div key={office.id} className="perkiraan-row small">
                  <div className="perkiraan-row-info">
                    <span className="perkiraan-office-name">{office.name}</span>
                    <span className="perkiraan-province-name">{province?.name}</span>
                    <div className="perkiraan-row-tags">
                      {isFlood && <span className="perkiraan-badge flood">🌧️ Banjir {Math.round(floodIdx * 100)}</span>}
                      {isDrought && <span className="perkiraan-badge drought">🏜️ Kekeringan {Math.round(droughtIdx * 100)}</span>}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* Map */}
      <div className="perkiraan-map-wrap">
        <PerkiraanMap mode="iklim" ensoPhase={currentPhase} />
      </div>
    </div>
  );
};

export default IklimView;
