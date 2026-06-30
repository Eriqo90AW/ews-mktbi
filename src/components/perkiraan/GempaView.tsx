import React, { useState, useMemo } from 'react';
import { MEGATHRUST_ZONES } from '../../constants/megathrustZones';
import { RING_OF_FIRE_ARCS, VOLCANO_POINTS } from '../../constants/ringOfFire';
import { KPWBI_OFFICES } from '../../constants/kpwbiOffices';
import { PROVINCES } from '../../constants/provinces';
import { distanceToPolyline } from '../../utils/geo';
import PerkiraanMap from './PerkiraanMap';

function getMwColor(mw: number): string {
  if (mw >= 9.0) return '#dc2626';
  if (mw >= 8.7) return '#ea580c';
  if (mw >= 8.5) return '#d97706';
  return '#ca8a04';
}

function getMwLabel(mw: number): string {
  if (mw >= 9.0) return 'Sangat Besar';
  if (mw >= 8.7) return 'Besar';
  if (mw >= 8.5) return 'Signifikan';
  return 'Menengah';
}

// normalize mw 7.0–9.5 → 0–100%
function getMwBarPct(mw: number): number {
  return Math.min(100, Math.max(0, ((mw - 7.0) / 2.5) * 100));
}

const GempaView: React.FC = () => {
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [activeLayer, setActiveLayer] = useState<'megathrust' | 'ringoffire'>('megathrust');

  const provincesMap = useMemo(() => new Map(PROVINCES.map((p) => [p.id, p])), []);

  const selectedZone = selectedZoneId ? MEGATHRUST_ZONES.find((z) => z.id === selectedZoneId) : null;

  const officesAtRisk = useMemo(() => {
    if (!selectedZone) return [];
    return KPWBI_OFFICES.filter((office) => {
      const dist = distanceToPolyline(office.latitude, office.longitude, selectedZone.path);
      return dist <= selectedZone.impactRadiusKm;
    });
  }, [selectedZone]);

  const handleMegathrustSelect = (id: string) => {
    setSelectedZoneId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="perkiraan-tab-layout">
      {/* Left panel */}
      <aside className="perkiraan-panel">
        <div className="perkiraan-panel-header">
          <span className="perkiraan-panel-title">Peta Seismik & Ring of Fire</span>
        </div>

        {/* Layer toggle */}
        <div className="gempa-layer-tabs">
          <button
            className={`gempa-layer-btn${activeLayer === 'megathrust' ? ' active' : ''}`}
            onClick={() => setActiveLayer('megathrust')}
          >
            🟣 Zona Megathrust
          </button>
          <button
            className={`gempa-layer-btn${activeLayer === 'ringoffire' ? ' active' : ''}`}
            onClick={() => setActiveLayer('ringoffire')}
          >
            🔴 Ring of Fire
          </button>
        </div>

        {activeLayer === 'megathrust' ? (
          <div className="perkiraan-panel-scroll">
            <div className="mt-section-header">
              <span>Segmen Megathrust Indonesia</span>
              <span className="mt-count-badge">{MEGATHRUST_ZONES.length} segmen</span>
            </div>

            {MEGATHRUST_ZONES.map((zone) => {
              const isSelected = selectedZoneId === zone.id;
              const color = getMwColor(zone.maxMagnitude);
              const barPct = getMwBarPct(zone.maxMagnitude);
              const mwLabel = getMwLabel(zone.maxMagnitude);

              return (
                <div key={zone.id} className={`mt-zone-card${isSelected ? ' selected' : ''}`}>
                  <button
                    className="mt-zone-card-btn"
                    onClick={() => handleMegathrustSelect(zone.id)}
                    aria-expanded={isSelected}
                  >
                    {/* Left accent */}
                    <div className="mt-zone-accent" style={{ background: color }} />

                    <div className="mt-zone-body">
                      {/* Top row: name + Mw badge */}
                      <div className="mt-zone-top">
                        <span className="mt-zone-name">{zone.name}</span>
                        <span className="mt-zone-mw-badge" style={{ color, borderColor: `${color}40`, background: `${color}15` }}>
                          Mw {zone.maxMagnitude}
                        </span>
                      </div>

                      {/* Magnitude bar */}
                      <div className="mt-mw-bar-track">
                        <div
                          className="mt-mw-bar-fill"
                          style={{ width: `${barPct}%`, background: color }}
                        />
                      </div>
                      <div className="mt-mw-bar-label">
                        <span style={{ color }}>{mwLabel}</span>
                        <span>⚡ Radius {zone.impactRadiusKm} km</span>
                      </div>

                      {/* Province pills */}
                      <div className="mt-province-pills">
                        {zone.affectedProvinces.map((id) => (
                          <span key={id} className="mt-province-pill">
                            {provincesMap.get(id)?.name ?? id}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Chevron */}
                    <svg
                      className="mt-zone-chevron"
                      style={{ transform: isSelected ? 'rotate(90deg)' : 'none' }}
                      viewBox="0 0 24 24" width="13" height="13" fill="none"
                      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>

                  {/* Expanded: KPW at risk */}
                  {isSelected && (
                    <div className="mt-kpw-panel">
                      <div className="mt-kpw-panel-header">
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        KPw dalam radius {zone.impactRadiusKm} km
                      </div>
                      {officesAtRisk.length === 0 ? (
                        <p className="mt-kpw-empty">Tidak ada KPw dalam radius dampak ini.</p>
                      ) : (
                        <div className="mt-kpw-list">
                          {officesAtRisk.map((o) => (
                            <div key={o.id} className="mt-kpw-item">
                              <span className="mt-kpw-dot" />
                              <div>
                                <span className="mt-kpw-name">{o.name}</span>
                                <span className="mt-kpw-province">{provincesMap.get(o.provinceId)?.name}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <>
            <div className="perkiraan-section-title">Busur Vulkanik Aktif</div>
            <div className="perkiraan-panel-scroll">
              {RING_OF_FIRE_ARCS.map((arc) => (
                <div key={arc.id} className="perkiraan-row small non-interactive">
                  <div className="perkiraan-row-info">
                    <span className="perkiraan-office-name" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 12, height: 3, display: 'inline-block', borderRadius: 2, backgroundColor: arc.color }} />
                      {arc.name}
                    </span>
                  </div>
                </div>
              ))}
              <div className="perkiraan-section-title" style={{ paddingTop: 8 }}>Gunung Api Pantauan</div>
              {VOLCANO_POINTS.map((v) => {
                const levelColor = v.level === 'III' ? '#dc2626' : v.level === 'II' ? '#d97706' : '#6b7280';
                const levelLabel = { III: 'Siaga', II: 'Waspada', I: 'Normal' }[v.level];
                return (
                  <div key={v.name} className="perkiraan-row small non-interactive">
                    <div className="perkiraan-row-info">
                      <span className="perkiraan-office-name">🌋 G. {v.name}</span>
                      <div className="perkiraan-row-tags">
                        <span className="perkiraan-badge" style={{ color: levelColor, borderColor: levelColor }}>
                          Level {v.level} — {levelLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </aside>

      {/* Map */}
      <div className="perkiraan-map-wrap">
        <PerkiraanMap
          mode="gempa"
          selectedMegathrustId={selectedZoneId}
          onMegathrustSelect={handleMegathrustSelect}
        />
      </div>
    </div>
  );
};

export default GempaView;
