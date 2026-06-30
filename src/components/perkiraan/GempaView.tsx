import React, { useState, useMemo } from 'react';
import { MEGATHRUST_ZONES } from '../../constants/megathrustZones';
import { RING_OF_FIRE_ARCS, VOLCANO_POINTS } from '../../constants/ringOfFire';
import { KPWBI_OFFICES } from '../../constants/kpwbiOffices';
import { PROVINCES } from '../../constants/provinces';
import { distanceToPolyline } from '../../utils/geo';
import PerkiraanMap from './PerkiraanMap';

const GempaView: React.FC = () => {
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [activeLayer, setActiveLayer] = useState<'megathrust' | 'ringoffire'>('megathrust');

  const provincesMap = useMemo(() => new Map(PROVINCES.map((p) => [p.id, p])), []);

  const selectedZone = selectedZoneId ? MEGATHRUST_ZONES.find((z) => z.id === selectedZoneId) : null;

  const officesAtRisk = useMemo(() => {
    if (!selectedZone) return [];
    return KPWBI_OFFICES.filter((office) => {
      const dist = distanceToPolyline(
        office.latitude,
        office.longitude,
        selectedZone.path
      );
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
          <>
            <div className="perkiraan-section-title">Segmen Megathrust Indonesia</div>
            <div className="perkiraan-panel-scroll">
              {MEGATHRUST_ZONES.map((zone) => {
                const isSelected = selectedZoneId === zone.id;
                return (
                  <button
                    key={zone.id}
                    className={`perkiraan-row${isSelected ? ' selected' : ''}`}
                    onClick={() => handleMegathrustSelect(zone.id)}
                  >
                    <div className="perkiraan-row-info">
                      <span className="perkiraan-office-name">{zone.name}</span>
                      <div className="perkiraan-row-tags">
                        <span className="perkiraan-badge sev-critical">Mw {zone.maxMagnitude}</span>
                        <span className="perkiraan-badge flood">⚡ R={zone.impactRadiusKm} km</span>
                      </div>
                      <span className="perkiraan-province-name">
                        Provinsi: {zone.affectedProvinces.map((id) => provincesMap.get(id)?.name ?? id).join(', ')}
                      </span>
                    </div>
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0, opacity: 0.5 }}>
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                );
              })}
            </div>

            {/* At-risk KPW for selected zone */}
            {selectedZone && (
              <div className="gempa-at-risk">
                <div className="perkiraan-section-title" style={{ paddingTop: 8 }}>
                  KPw dalam Radius Dampak — {selectedZone.name}
                </div>
                {officesAtRisk.length === 0 ? (
                  <p className="perkiraan-empty-small">Tidak ada KPw dalam radius {selectedZone.impactRadiusKm} km.</p>
                ) : (
                  officesAtRisk.map((o) => (
                    <div key={o.id} className="perkiraan-row small">
                      <div className="perkiraan-row-info">
                        <span className="perkiraan-office-name">{o.name}</span>
                        <span className="perkiraan-province-name">{provincesMap.get(o.provinceId)?.name}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
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
