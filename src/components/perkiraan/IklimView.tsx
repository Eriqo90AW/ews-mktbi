import React, { useState, useMemo } from 'react';
import { ENSO_HISTORY, ENSO_CURRENT, getPhaseColor, getPhaseLabel, getEnsoElevatedProvinces } from '../../constants/ensoData';
import {
  Flood as FloodIcon,
  Dry as DryIcon
} from '@mui/icons-material';
import { PROVINCES } from '../../constants/provinces';
import { KPWBI_OFFICES } from '../../constants/kpwbiOffices';
import { BnpbInariskService } from '../../services/bnpbInariskService';
import PerkiraanMap from './PerkiraanMap';
import MobileSplitter from '../ui/MobileSplitter';
import type { EnsoPhase, EnsoOutlook } from '../../constants/ensoData';

const ENSO_OUTLOOKS: Record<EnsoPhase, EnsoOutlook> = {
  el_nino: {
    phase: 'el_nino',
    confidence: 'Tinggi',
    description:
      'Kondisi ENSO saat ini menunjukkan fase El Niño lemah/sedang setelah masa transisi Netral di awal tahun 2026. ' +
      'Indeks ONI mencapai +0.9 (di atas ambang batas El Niño +0.5). ' +
      'Diprakirakan El Niño moderat hingga kuat akan terus berkembang dan bertahan hingga akhir tahun 2026 dengan keyakinan tinggi.',
    elevatedHazards: [
      {
        hazard: 'kekeringan',
        regions: 'Jawa, Bali, Nusa Tenggara Barat, Nusa Tenggara Timur, Sulawesi bagian selatan, dan Papua',
      },
      {
        hazard: 'banjir',
        regions: 'Sumatera Utara dan Aceh (potensi anomali hujan lokal/hujan ekstrem pendek)',
      },
    ],
  },
  la_nina: {
    phase: 'la_nina',
    confidence: 'Sedang',
    description:
      'Kondisi ENSO menunjukkan potensi fase La Niña aktif. ' +
      'Indeks ONI berada di bawah ambang batas dingin -0.5. ' +
      'Anomali suhu permukaan laut Pasifik Tengah yang mendingin meningkatkan curah hujan di wilayah Indonesia Barat dan Tengah secara signifikan.',
    elevatedHazards: [
      {
        hazard: 'banjir',
        regions: 'Sumatera (Aceh, Sumatera Barat, Riau), Sulawesi Tengah, Maluku, dan Papua',
      },
    ],
  },
  netral: {
    phase: 'netral',
    confidence: 'Tinggi',
    description:
      'Kondisi ENSO berada dalam fase Netral. ' +
      'Suhu permukaan laut di Pasifik Tengah dalam kondisi normal. ' +
      'Sebagian besar wilayah Indonesia mengalami pola cuaca normal tanpa pengaruh anomali sirkulasi Monsun yang ekstrem.',
    elevatedHazards: [
      {
        hazard: 'banjir',
        regions: 'DKI Jakarta, Jawa Tengah, Jawa Timur, Kalimantan Selatan (baseline kerentanan InaRISK)',
      },
      {
        hazard: 'kekeringan',
        regions: 'Nusa Tenggara Timur (baseline kerentanan kering musiman)',
      },
    ],
  },
};

const IklimView: React.FC = () => {
  const [selectedPhase, setSelectedPhase] = useState<EnsoPhase>(ENSO_CURRENT.phase);

  const phaseColor = getPhaseColor(selectedPhase);
  const phaseLabel = getPhaseLabel(selectedPhase);

  const { flood: floodP, drought: droughtP } = getEnsoElevatedProvinces(selectedPhase);

  // Offices in elevated provinces
  const atRiskOffices = useMemo(() => {
    return KPWBI_OFFICES.filter(
      (o) => floodP.includes(o.provinceId) || droughtP.includes(o.provinceId)
    );
  }, [floodP, droughtP]);

  const provincesMap = useMemo(() => {
    return new Map(PROVINCES.map((p) => [p.id, p]));
  }, []);

  // Display last 8 months in timeline
  const timelineData = ENSO_HISTORY.slice(-8);
  const currentOutlook = ENSO_OUTLOOKS[selectedPhase];

  return (
    <div className="perkiraan-tab-layout">
      {/* Left panel */}
      <aside className="perkiraan-panel">
        <div className="perkiraan-panel-header">
          <span className="perkiraan-panel-title">Kondisi Iklim (ENSO — El Niño-Southern Oscillation)</span>
        </div>

        <div className="perkiraan-panel-scroll">
          {/* Current ENSO card */}
          <div className="enso-current-card" style={{ borderLeft: `4px solid ${phaseColor}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <div className="enso-phase-badge" style={{ color: phaseColor, borderColor: phaseColor, marginBottom: 0 }}>
                {phaseLabel}
              </div>
              <select
                value={selectedPhase}
                onChange={(e) => setSelectedPhase(e.target.value as EnsoPhase)}
                style={{
                  fontSize: '11px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-default)',
                  backgroundColor: 'var(--bg-surface)',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <option value="el_nino">Simulasi El Niño</option>
                <option value="la_nina">Simulasi La Niña</option>
                <option value="netral">Simulasi Netral</option>
              </select>
            </div>

            <div className="enso-oni-container">
              <span className="enso-oni-label">ONI (Oceanic Niño Index) Terkini</span>
              <div className="enso-oni-main">
                <span className="enso-oni-value" style={{ color: phaseColor }}>
                  {selectedPhase === 'el_nino' ? '+0.9' : selectedPhase === 'la_nina' ? '-0.7' : '0.0'}
                </span>
                <span className="enso-oni-month">({ENSO_CURRENT.label})</span>
              </div>
            </div>
            <p className="enso-description">{currentOutlook.description}</p>
            <div className="enso-confidence-row">
              <span>Confidence:</span>
              <span style={{ fontWeight: 600 }}>{currentOutlook.confidence}</span>
            </div>
          </div>

          {/* ONI bar timeline */}
          <div className="enso-timeline">
            <div className="enso-timeline-title">Riwayat ONI (Oceanic Niño Index) — 8 Bulan Terakhir</div>
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
          {currentOutlook.elevatedHazards.length > 0 && (
            <div className="enso-hazards">
              <div className="enso-hazards-title">Bahaya yang Meningkat</div>
              {currentOutlook.elevatedHazards.map((h) => (
                <div key={h.hazard} className={`enso-hazard-row ${h.hazard}`}>
                  <span className="enso-hazard-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
                    {h.hazard === 'banjir' ? <FloodIcon style={{ fontSize: 16 }} /> : <DryIcon style={{ fontSize: 16 }} />}
                  </span>
                  <div>
                    <span className="enso-hazard-type">{h.hazard === 'banjir' ? 'Risiko Banjir Meningkat' : 'Risiko Kekeringan Meningkat'}</span>
                    <p className="enso-hazard-regions">{h.regions}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* At-risk KPW list */}
          <div className="enso-kpw-list-section" style={{ marginTop: 8 }}>
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
                        {isFlood && (
                          <span className="perkiraan-badge flood" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <FloodIcon style={{ fontSize: 10 }} /> Banjir {Math.round(floodIdx * 100)}
                          </span>
                        )}
                        {isDrought && (
                          <span className="perkiraan-badge drought" style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <DryIcon style={{ fontSize: 10 }} /> Kekeringan {Math.round(droughtIdx * 100)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </aside>

      <MobileSplitter />

      {/* Map */}
      <div className="perkiraan-map-wrap">
        <PerkiraanMap mode="iklim" ensoPhase={selectedPhase} />
      </div>
    </div>
  );
};

export default IklimView;
