import React, { useState, useMemo } from 'react';
import { KPWBI_OFFICES } from '../../constants/kpwbiOffices';
import { PROVINCES } from '../../constants/provinces';
import { BnpbInariskService } from '../../services/bnpbInariskService';
import EwsMap from '../dashboard/EwsMap';
import '../dashboard/TopBar.css';
import './KerentananScreen.css';

type InariskHazard = 'flood' | 'tsunami' | 'kekeringan' | 'volcanic';

interface KerentananScreenProps {
  onBack: () => void;
}

const HAZARD_TABS: { key: InariskHazard; emoji: string; label: string }[] = [
  { key: 'flood', emoji: '🌧️', label: 'Banjir' },
  { key: 'tsunami', emoji: '🌊', label: 'Tsunami' },
  { key: 'kekeringan', emoji: '🏜️', label: 'Kekeringan' },
  { key: 'volcanic', emoji: '🌋', label: 'Gunung Api' },
];

function riskLevel(score: number): { label: string; cls: string } {
  if (score >= 0.65) return { label: 'Tinggi', cls: 'risk-high' };
  if (score >= 0.35) return { label: 'Sedang', cls: 'risk-medium' };
  if (score > 0) return { label: 'Rendah', cls: 'risk-low' };
  return { label: 'N/A', cls: 'risk-none' };
}

const KerentananScreen: React.FC<KerentananScreenProps> = ({ onBack }) => {
  const [selectedHazard, setSelectedHazard] = useState<InariskHazard>('flood');
  const [selectedProvinceId, setSelectedProvinceId] = useState<string | null>(null);

  const provincesMap = useMemo(() => new Map(PROVINCES.map((p) => [p.id, p])), []);

  const rankedOffices = useMemo(() => {
    return KPWBI_OFFICES.map((office) => ({
      office,
      score: BnpbInariskService.getLocalHazardIndex(office.id, selectedHazard),
    }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);
  }, [selectedHazard]);

  const handleProvinceSelect = (provinceId: string) => {
    setSelectedProvinceId((prev) => (prev === provinceId ? null : provinceId));
  };

  const currentHazard = HAZARD_TABS.find((t) => t.key === selectedHazard)!;

  return (
    <div className="kerentanan-container">
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
            <h1 className="topbar-title">Analisis <span>Kerentanan</span></h1>
            <span className="topbar-brand-sub">BIMA — BNPB InaRisk</span>
          </div>
        </div>

        {/* Center: hazard filter pills */}
        <div className="topbar-center">
          <div className="topbar-filter-group kerentanan">
            {HAZARD_TABS.map((tab) => (
              <button
                key={tab.key}
                className={`topbar-filter-pill${selectedHazard === tab.key ? ' active' : ''}`}
                onClick={() => setSelectedHazard(tab.key)}
              >
                <span>{tab.emoji}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: count status chip */}
        <div className="topbar-right">
          <div className="topbar-status kerentanan">
            <span className="topbar-status-dot" />
            <span>{currentHazard.emoji} {rankedOffices.length} Wilayah — {currentHazard.label}</span>
          </div>
        </div>
      </header>

      {/* Main content: left panel + map */}
      <div className="kerentanan-content">
        <aside className="kerentanan-panel">
          <div className="kerentanan-panel-header">
            <span className="kerentanan-panel-title">Indeks Kerentanan</span>
            <span className="kerentanan-panel-count">{rankedOffices.length} wilayah</span>
          </div>

          <div className="kerentanan-panel-scroll">
            {rankedOffices.length === 0 ? (
              <div className="kerentanan-empty">
                <p>Tidak ada data kerentanan untuk bencana ini.</p>
              </div>
            ) : (
              rankedOffices.map(({ office, score }, idx) => {
                const risk = riskLevel(score);
                const province = provincesMap.get(office.provinceId);
                const isSelected = selectedProvinceId === office.provinceId;
                return (
                  <button
                    key={office.id}
                    className={`kerentanan-row${isSelected ? ' selected' : ''}`}
                    onClick={() => handleProvinceSelect(office.provinceId)}
                  >
                    <span className="kerentanan-rank">#{idx + 1}</span>
                    <div className="kerentanan-row-info">
                      <span className="kerentanan-office-name">{office.name}</span>
                      <span className="kerentanan-province-name">{province?.name ?? office.provinceId}</span>
                      <div className="kerentanan-score-bar-wrap">
                        <div
                          className={`kerentanan-score-bar ${risk.cls}`}
                          style={{ width: `${Math.round(score * 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="kerentanan-row-right">
                      <span className={`kerentanan-risk-badge ${risk.cls}`}>{risk.label}</span>
                      <span className="kerentanan-score-value">{Math.round(score * 100)}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        <div className="kerentanan-map-wrap">
          <EwsMap
            alerts={[]}
            selectedProvinceId={selectedProvinceId}
            selectedAlertId={null}
            onProvinceSelect={handleProvinceSelect}
            onAlertSelect={() => {}}
            activeTypeFilter={selectedHazard}
            isKerentananView={true}
          />
        </div>
      </div>
    </div>
  );
};

export default KerentananScreen;
