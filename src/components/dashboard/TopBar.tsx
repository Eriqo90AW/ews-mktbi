import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { DisasterAlert, DisasterType, RiskCalcResult } from '../../types';
import { KPWBI_OFFICES } from '../../constants/kpwbiOffices';
import { renderDisasterIcon } from '../../utils/alertUtils';
import './TopBar.css';

interface TopBarProps {
  criticalCount: number;
  totalAlerts: number;
  criticalAlerts: DisasterAlert[];
  allAlerts: DisasterAlert[];
  riskResults: RiskCalcResult[];
  onAlertSelect: (alertId: string) => void;
  onGenerateReport?: () => void;
  selectedType: DisasterType | 'all';
  onTypeChange: (type: DisasterType | 'all') => void;
  onSwitchToKerentanan: () => void;
  onSwitchToPotensi: () => void;
}

const FILTER_OPTIONS: Array<{ value: DisasterType | 'all'; emoji: string; label: string }> = [
  { value: 'all', emoji: '🌐', label: 'Semua' },
  { value: 'earthquake', emoji: '💢', label: 'Gempa' },
  { value: 'extreme_weather', emoji: '⚡', label: 'Cuaca' },
  { value: 'karhutla', emoji: '🔥', label: 'Karhutla' },
  { value: 'volcanic', emoji: '🌋', label: 'Gunung Api' },
];

export const TopBar: React.FC<TopBarProps> = (props) => {
  const {
    allAlerts,
    riskResults,
    onGenerateReport,
    selectedType,
    onTypeChange,
    onSwitchToKerentanan,
    onSwitchToPotensi,
  } = props;
  const [timeStr, setTimeStr] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const time = new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(now).replace(/\./g, ':');
      const date = new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }).format(now).replace(/\./g, ':');;
      setTimeStr(`${date} - ${time} WIB`);
    };
    updateTime();
    const id = setInterval(updateTime, 1000);
    return () => clearInterval(id);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [dropdownOpen]);

  // Build a map: officeId -> highest riskLevel from riskResults
  const officeRiskLevels = useMemo(() => {
    const map = new Map<string, { riskLevel: string; riskScore: number; alerts: DisasterAlert[] }>();
    
    riskResults.forEach((res) => {
      res.affectedLocations.forEach((loc) => {
        const office = KPWBI_OFFICES.find((o) => o.id === loc.id);
        if (!office) return;
        
        const matchedAlert = allAlerts.find((a) => a.id === res.event.id);
        const existing = map.get(office.id);
        if (!existing || res.riskScore > existing.riskScore) {
          map.set(office.id, {
            riskLevel: res.riskLevel,
            riskScore: res.riskScore,
            alerts: existing ? [...existing.alerts, matchedAlert].filter(Boolean) as DisasterAlert[] : ([matchedAlert].filter(Boolean) as DisasterAlert[]),
          });
        } else if (existing && matchedAlert) {
          if (!existing.alerts.some(a => a.id === matchedAlert.id)) {
            existing.alerts.push(matchedAlert);
          }
        }
      });
    });
    
    return map;
  }, [riskResults, allAlerts]);

  // Counts of offices per risk level
  const riskStats = useMemo(() => {
    const counts = { critical: 0, warning: 0, watch: 0 };
    officeRiskLevels.forEach(({ riskLevel }) => {
      if (riskLevel === 'Tinggi') counts.critical++;
      else if (riskLevel === 'Sedang') counts.warning++;
      else counts.watch++;
    });
    return counts;
  }, [officeRiskLevels]);

  const totalAffectedOffices = officeRiskLevels.size;

  const statusClass = riskStats.critical > 0
    ? 'critical'
    : riskStats.warning > 0
    ? 'warning'
    : totalAffectedOffices > 0
    ? 'monitoring'
    : 'clear';

  const statusText = riskStats.critical > 0
    ? `${riskStats.critical} KPwBI Bahaya`
    : totalAffectedOffices > 0
    ? `${totalAffectedOffices} KPwBI Dipantau`
    : 'Sistem Normal';

  return (
    <header className="topbar-container">
      {/* Left: brand */}
      <div className="topbar-brand">
        <div className="topbar-logo">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </div>
        <div className="topbar-brand-text">
          <span className="topbar-brand-sub">Sistem Peringatan Dini</span>
          <h1 className="topbar-title">Indonesia <span>EWS</span></h1>
        </div>
      </div>

      {/* Center: filter pills + kerentanan nav */}
      <div className="topbar-center">
        <div className="topbar-filter-group">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`topbar-filter-pill${selectedType === opt.value ? ' active' : ''}`}
              onClick={() => onTypeChange(opt.value)}
            >
              <span>{opt.value === 'all' ? opt.emoji : renderDisasterIcon(opt.value)}</span>
              <span>{opt.label}</span>
            </button>
          ))}
        </div>
        <div className="topbar-divider-v" />
        <button className="topbar-nav-btn" onClick={onSwitchToKerentanan}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Kerentanan
        </button>
        <button className="topbar-nav-btn" onClick={onSwitchToPotensi}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
          </svg>
          Potensi
        </button>
      </div>

      {/* Right: clock + report + status */}
      <div className="topbar-right">
        <span className="topbar-clock">{timeStr || '—'}</span>

        <button className="topbar-report-btn" onClick={onGenerateReport}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          Laporan
        </button>

        {/* Status chip — always a dropdown trigger when there are monitored alerts */}
        <div className="topbar-status-wrapper" ref={dropdownRef}>
          {totalAffectedOffices > 0 ? (
            <button
              className={`topbar-status ${statusClass} topbar-status-btn${dropdownOpen ? ' open' : ''}`}
              onClick={() => setDropdownOpen((o) => !o)}
              aria-expanded={dropdownOpen}
            >
              <span className="topbar-status-dot" />
              <span>{statusText}</span>
              <svg
                className="topbar-status-chevron"
                viewBox="0 0 24 24" width="12" height="12" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.18s ease' }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          ) : (
            <div className={`topbar-status ${statusClass}`}>
              <span className="topbar-status-dot" />
              <span>{statusText}</span>
            </div>
          )}

          {dropdownOpen && (
            <div className={`topbar-dropdown topbar-dropdown--${statusClass}`} role="listbox">
              <div className="topbar-dropdown-header">
                <span className="topbar-dropdown-title">
                  Kantor BI Dipantau
                  <span className="topbar-dropdown-count">{totalAffectedOffices}</span>
                </span>
                <button
                  className="topbar-dropdown-close"
                  onClick={() => setDropdownOpen(false)}
                  aria-label="Tutup"
                >
                  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <div className="topbar-dropdown-list">
                {(['Tinggi', 'Sedang', 'Rendah'] as const).map((level) => {
                  const levelOffices: Array<{ office: typeof KPWBI_OFFICES[0]; detail: { riskLevel: string; riskScore: number; alerts: DisasterAlert[] } }> = [];
                  officeRiskLevels.forEach((detail, officeId) => {
                    if (detail.riskLevel === level) {
                      const office = KPWBI_OFFICES.find((o) => o.id === officeId);
                      if (office) {
                        levelOffices.push({ office, detail });
                      }
                    }
                  });

                  if (levelOffices.length === 0) return null;
                  const levelClass = { Tinggi: 'critical', Sedang: 'warning', Rendah: 'watch' }[level];
                  return (
                    <div key={level}>
                      <div className={`dropdown-risk-group-header dropdown-risk-group-header--${levelClass}`}>
                        <span className="dropdown-risk-group-dot" />
                        {level}
                        <span className="dropdown-risk-group-count">{levelOffices.length}</span>
                      </div>
                      {levelOffices.map(({ office, detail }) => {
                        const alertIcons = Array.from(new Set(detail.alerts.map((a) => a.type)));
                        const sub = detail.alerts.map((a) => a.title).join(', ');
                        return (
                          <div
                            key={office.id}
                            className="topbar-dropdown-item"
                            style={{ cursor: 'default' }}
                          >
                            <div className="dropdown-item-emoji" style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
                              {alertIcons.map((type) => (
                                <React.Fragment key={type}>
                                  {renderDisasterIcon(type, undefined, { width: '16px', height: '16px' })}
                                </React.Fragment>
                              ))}
                            </div>
                            <div className="dropdown-item-info">
                              <span className="dropdown-item-type">{office.name}</span>
                              <span className="dropdown-item-title">{office.city}</span>
                              {sub && <span className="dropdown-item-sub">{sub}</span>}
                            </div>
                            <span className="dropdown-item-time" style={{ fontWeight: 'bold', color: `var(--alert-${levelClass})` }}>
                              Skor: {detail.riskScore}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
