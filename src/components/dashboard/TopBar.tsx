import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { DisasterAlert, DisasterType, RiskCalcResult } from '../../types';
import { PROVINCES } from '../../constants/provinces';
import { getDisasterEmoji } from '../../utils/alertUtils';
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

const TYPE_LABEL: Record<string, string> = {
  earthquake: 'Gempa Bumi', extreme_weather: 'Cuaca Ekstrem',
  karhutla: 'Karhutla', flood: 'Banjir', tsunami: 'Tsunami',
  volcanic: 'Gunung Api', kekeringan: 'Kekeringan', landslide: 'Longsor',
};

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'baru saja';
  if (mins < 60) return `${mins} mnt lalu`;
  const hrs = Math.floor(mins / 60);
  return hrs < 24 ? `${hrs} jam lalu` : `${Math.floor(hrs / 24)} hari lalu`;
}

export const TopBar: React.FC<TopBarProps> = ({
  criticalCount,
  totalAlerts,
  allAlerts,
  riskResults,
  onAlertSelect,
  onGenerateReport,
  selectedType,
  onTypeChange,
  onSwitchToKerentanan,
  onSwitchToPotensi,
}) => {
  const [timeStr, setTimeStr] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const time = new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(now);
      const date = new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' }).format(now);
      setTimeStr(`${date} — ${time} WIB`);
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

  const provincesMap = useMemo(() => new Map(PROVINCES.map((p) => [p.id, p])), []);

  // Group all monitored (non-forecast) alerts by computed risk level
  const alertsByRisk = useMemo(() => {
    const groups: Record<'Tinggi' | 'Sedang' | 'Rendah', DisasterAlert[]> = {
      Tinggi: [], Sedang: [], Rendah: [],
    };
    allAlerts.forEach((alert) => {
      if (alert.isForecast) return;
      const res = riskResults.find((r) => r.event.id === alert.id);
      const level = (res?.riskLevel ?? 'Rendah') as 'Tinggi' | 'Sedang' | 'Rendah';
      groups[level].push(alert);
    });
    return groups;
  }, [allAlerts, riskResults]);

  const monitoredCount = allAlerts.filter((a) => !a.isForecast).length;

  const statusClass = criticalCount > 0 ? 'critical' : totalAlerts > 0 ? 'monitoring' : 'clear';
  const statusText = criticalCount > 0
    ? `${criticalCount} Tinggi Aktif`
    : totalAlerts > 0
    ? `${totalAlerts} Dipantau`
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
              <span>{opt.emoji}</span>
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
          {monitoredCount > 0 ? (
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
                  Monitoring Aktif
                  <span className="topbar-dropdown-count">{monitoredCount}</span>
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
                  const items = alertsByRisk[level];
                  if (items.length === 0) return null;
                  const levelClass = { Tinggi: 'critical', Sedang: 'warning', Rendah: 'watch' }[level];
                  return (
                    <div key={level}>
                      <div className={`dropdown-risk-group-header dropdown-risk-group-header--${levelClass}`}>
                        <span className="dropdown-risk-group-dot" />
                        {level}
                        <span className="dropdown-risk-group-count">{items.length}</span>
                      </div>
                      {items.map((alert) => {
                        const province = provincesMap.get(alert.provinceId);
                        const sub = [
                          province?.name,
                          alert.magnitude ? `M${alert.magnitude}` : null,
                          alert.depth ? `${alert.depth} km` : null,
                        ].filter(Boolean).join(' • ');
                        return (
                          <button
                            key={alert.id}
                            className="topbar-dropdown-item"
                            onClick={() => { onAlertSelect(alert.id); setDropdownOpen(false); }}
                          >
                            <span className="dropdown-item-emoji">{getDisasterEmoji(alert.type)}</span>
                            <div className="dropdown-item-info">
                              <span className="dropdown-item-type">{TYPE_LABEL[alert.type] ?? alert.type}</span>
                              <span className="dropdown-item-title">{alert.title}</span>
                              {sub && <span className="dropdown-item-sub">{sub}</span>}
                            </div>
                            <span className="dropdown-item-time">{timeAgo(alert.timestamp)}</span>
                          </button>
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
