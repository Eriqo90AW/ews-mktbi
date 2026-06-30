import React, { useState, useMemo } from 'react';
import { KPWBI_OFFICES } from '../../constants/kpwbiOffices';
import { PROVINCES } from '../../constants/provinces';
import { BnpbInariskService } from '../../services/bnpbInariskService';
import EwsMap from '../dashboard/EwsMap';
import { renderDisasterIcon } from '../../utils/alertUtils';
import '../dashboard/TopBar.css';
import './PotensiScreen.css';

type PotensiHazard = 'gempa' | 'karhutla' | 'cuaca' | 'pasang';

interface PotensiScreenProps {
  onBack: () => void;
}

const HAZARD_TABS: { key: PotensiHazard; label: string }[] = [
  { key: 'gempa', label: 'Gempa Bumi' },
  { key: 'karhutla', label: 'Karhutla' },
  { key: 'cuaca', label: 'Cuaca Ekstrim' },
  { key: 'pasang', label: 'Gelombang Pasang' },
];

function riskLevel(score: number): { label: string; cls: string } {
  if (score >= 0.65) return { label: 'Tinggi', cls: 'risk-high' };
  if (score >= 0.35) return { label: 'Sedang', cls: 'risk-medium' };
  if (score > 0) return { label: 'Rendah', cls: 'risk-low' };
  return { label: 'N/A', cls: 'risk-none' };
}

const PotensiScreen: React.FC<PotensiScreenProps> = ({ onBack }) => {
  const [selectedHazard, setSelectedHazard] = useState<PotensiHazard>('gempa');
  const [selectedProvinceId, setSelectedProvinceId] = useState<string | null>(null);

  const provincesMap = useMemo(() => new Map(PROVINCES.map((p) => [p.id, p])), []);

  const rankedOffices = useMemo(() => {
    return KPWBI_OFFICES.map((office) => ({
      office,
      score: BnpbInariskService.getLocalPotensiIndex(office.id, selectedHazard),
    }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [selectedHazard]);

  const handleProvinceSelect = (provinceId: string) => {
    setSelectedProvinceId((prev) => (prev === provinceId ? null : provinceId));
  };

  const currentHazard = HAZARD_TABS.find((t) => t.key === selectedHazard)!;

  return (
    <div className="potensi-container">
      {/* Header — same topbar-container structure as TopBar */}
      <header className="topbar-container">
        {/* Left: back btn + divider + brand */}
        <div className="topbar-brand">
          <button className="topbar-back-btn" onClick={onBack}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Kembali
          </button>
          <div className="topbar-divider-v" />
          <div className="topbar-brand-text">
            <h1 className="topbar-title">Potensi <span>Bencana</span></h1>
            <span className="topbar-brand-sub">BIMA — Analisis Potensi</span>
          </div>
        </div>

        {/* Center: hazard filter pills */}
        <div className="topbar-center">
          <div className="topbar-filter-group potensi">
            {HAZARD_TABS.map((tab) => (
              <button
                key={tab.key}
                className={`topbar-filter-pill${selectedHazard === tab.key ? ' active' : ''}`}
                onClick={() => setSelectedHazard(tab.key)}
              >
                <span>{renderDisasterIcon(tab.key)}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: count status chip */}
        <div className="topbar-right">
          <div className="topbar-status potensi">
            <span className="topbar-status-dot" />
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              {renderDisasterIcon(selectedHazard, undefined, { width: '14px', height: '14px' })}
              <span>{rankedOffices.length} Wilayah — {currentHazard.label}</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main content: left panel + map */}
      <div className="potensi-content">
        <aside className="potensi-panel">
          <div className="potensi-panel-header">
            <span className="potensi-panel-title">Indeks Potensi</span>
            <span className="potensi-panel-count">{rankedOffices.length} wilayah</span>
          </div>

          <div className="potensi-panel-scroll">
            {rankedOffices.length === 0 ? (
              <div className="potensi-empty">
                <p>Tidak ada data potensi untuk bencana ini.</p>
              </div>
            ) : (
              rankedOffices.map(({ office, score }, idx) => {
                const risk = riskLevel(score);
                const province = provincesMap.get(office.provinceId);
                const isSelected = selectedProvinceId === office.provinceId;
                return (
                  <button
                    key={office.id}
                    className={`potensi-row${isSelected ? ' selected' : ''}`}
                    onClick={() => handleProvinceSelect(office.provinceId)}
                  >
                    <span className="potensi-rank">#{idx + 1}</span>
                    <div className="potensi-row-info">
                      <span className="potensi-office-name">{office.name}</span>
                      <span className="potensi-province-name">{province?.name ?? office.provinceId}</span>
                      <div className="potensi-score-bar-wrap">
                        <div
                          className={`potensi-score-bar ${risk.cls}`}
                          style={{ width: `${Math.round(score * 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="potensi-row-right">
                      <span className={`potensi-risk-badge ${risk.cls}`}>{risk.label}</span>
                      <span className="potensi-score-value">{Math.round(score * 100)}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <div className="potensi-map-wrap">
          <EwsMap
            alerts={[]}
            selectedProvinceId={selectedProvinceId}
            selectedAlertId={null}
            onProvinceSelect={handleProvinceSelect}
            onAlertSelect={() => {}}
            activeTypeFilter={selectedHazard}
            isPotensiView={true}
          />
        </div>
      </div>
    </div>
  );
};

export default PotensiScreen;
