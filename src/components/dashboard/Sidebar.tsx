import React, { useState, useMemo } from 'react';
import type { DisasterAlert, AlertSeverity, DisasterType, RiskCalcResult } from '../../types';
import { PROVINCES } from '../../constants/provinces';
import { KPWBI_OFFICES } from '../../constants/kpwbiOffices';
import { getDisasterEmoji } from '../../utils/alertUtils';
import AlertCard from './AlertCard';
import './Sidebar.css';

const SEV_LABEL: Record<AlertSeverity, string> = {
  critical: 'Tinggi',
  warning: 'Sedang',
  watch: 'Rendah',
};

interface SidebarProps {
  filteredAlerts: DisasterAlert[];
  riskResults: RiskCalcResult[];
  stats: { critical: number; warning: number; watch: number; total: number };
  selectedProvinceId: string | null;
  onProvinceSelect: (provinceId: string) => void;
  selectedAlertId: string | null;
  onAlertSelect: (alertId: string) => void;
  severityFilter: AlertSeverity | 'all';
  setSeverityFilter: (val: AlertSeverity | 'all') => void;
  typeFilter: DisasterType | 'all';
  setTypeFilter: (val: DisasterType | 'all') => void;
  isLoading?: boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

const SORT_OPTIONS = [
  { value: 'newest', label: 'Terbaru' },
  { value: 'oldest', label: 'Terlama' },
  { value: 'magnitude-desc', label: 'Magnitudo Tertinggi' },
  { value: 'magnitude-asc', label: 'Magnitudo Terendah' },
  { value: 'severity-desc', label: 'Tingkat Tertinggi' },
] as const;
type SortKey = typeof SORT_OPTIONS[number]['value'];

const SEVERITY_WEIGHT = { critical: 3, warning: 2, watch: 1 } as const;

export const Sidebar: React.FC<SidebarProps> = ({
  filteredAlerts,
  riskResults,
  stats,
  selectedProvinceId,
  onProvinceSelect,
  selectedAlertId,
  onAlertSelect,
  severityFilter,
  setSeverityFilter,
  typeFilter,
  setTypeFilter,
  isLoading,
  isCollapsed,
  onToggleCollapse,
}) => {
  const [activeTab, setActiveTab] = useState<'alerts' | 'provinces'>('alerts');
  const [officeSearch, setOfficeSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('newest');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeStatPanel, setActiveStatPanel] = useState<AlertSeverity | null>(null);
  const [expandedRegions, setExpandedRegions] = useState<Record<string, boolean>>({
    'Sumatera': true,
    'Jawa': true,
    'Kalimantan': true,
    'Bali & Nusa Tenggara': true,
    'Sulawesi, Maluku, & Papua': true,
  });

  // Build a map: officeId -> highest riskLevel from riskResults
  const officeRiskLevels = useMemo(() => {
    const map = new Map<string, { riskLevel: string; riskScore: number; alerts: DisasterAlert[] }>();
    
    riskResults.forEach((res) => {
      res.affectedLocations.forEach((loc) => {
        const office = KPWBI_OFFICES.find((o) => o.id === loc.id);
        if (!office) return;
        
        const matchedAlert = filteredAlerts.find((a) => a.id === res.event.id);
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
  }, [riskResults, filteredAlerts]);

  // Counts of offices per risk level
  const riskStats = useMemo(() => {
    const counts: Record<AlertSeverity, number> = { critical: 0, warning: 0, watch: 0 };
    officeRiskLevels.forEach(({ riskLevel }) => {
      if (riskLevel === 'Tinggi') counts.critical++;
      else if (riskLevel === 'Sedang') counts.warning++;
      else counts.watch++;
    });
    return counts;
  }, [officeRiskLevels]);

  // Group offices per risk level for panel display
  const officesByBand = useMemo(() => {
    const result = new Map<AlertSeverity, Array<{ office: typeof KPWBI_OFFICES[0]; topHazards: string }>>([
      ['critical', []],
      ['warning', []],
      ['watch', []],
    ]);
    
    officeRiskLevels.forEach((data, officeId) => {
      const office = KPWBI_OFFICES.find((o) => o.id === officeId);
      if (!office) return;
      const band: AlertSeverity = data.riskLevel === 'Tinggi' ? 'critical' : data.riskLevel === 'Sedang' ? 'warning' : 'watch';
      const topHazards = data.alerts.map((a) => getDisasterEmoji(a.type)).join(' ');
      result.get(band)?.push({ office, topHazards });
    });
    
    return result;
  }, [officeRiskLevels]);

  const sortedAlerts = useMemo(() => {
    const list = [...filteredAlerts];
    switch (sortBy) {
      case 'newest': return list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      case 'oldest': return list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
      case 'magnitude-desc': return list.sort((a, b) => (b.magnitude || 0) - (a.magnitude || 0));
      case 'magnitude-asc': return list.sort((a, b) => (a.magnitude || 0) - (b.magnitude || 0));
      case 'severity-desc': return list.sort((a, b) => {
        const diff = (SEVERITY_WEIGHT[b.severity] || 0) - (SEVERITY_WEIGHT[a.severity] || 0);
        return diff !== 0 ? diff : new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
      default: return list;
    }
  }, [filteredAlerts, sortBy]);

  const groupedOffices = useMemo(() => {
    const searchLower = officeSearch.toLowerCase();
    const filtered = KPWBI_OFFICES.filter(
      (o) => o.name.toLowerCase().includes(searchLower) || o.city.toLowerCase().includes(searchLower)
    );
    const groups: Record<string, typeof KPWBI_OFFICES> = {
      'Sumatera': [],
      'Jawa': [],
      'Kalimantan': [],
      'Bali & Nusa Tenggara': [],
      'Sulawesi, Maluku, & Papua': [],
    };
    filtered.forEach((o) => {
      const r = o.region || 'Lainnya';
      if (groups[r]) groups[r].push(o);
      else {
        if (!groups['Lainnya']) groups['Lainnya'] = [];
        groups['Lainnya'].push(o);
      }
    });
    return groups;
  }, [officeSearch]);

  const provincesMap = useMemo(() => new Map(PROVINCES.map((p) => [p.id, p])), []);

  const handleStatClick = (sev: AlertSeverity) => {
    setActiveStatPanel((prev) => (prev === sev ? null : sev));
  };

  // Suppress unused-variable warning from linter while keeping the computed value
  void stats;

  return (
    <aside className={`sidebar-container${isCollapsed ? ' sidebar-collapsed' : ''}`}>
      {isCollapsed ? (
        /* ── Collapsed view ───────────────────────────────────── */
        <>
          <button className="sidebar-toggle-btn" onClick={onToggleCollapse} title="Expand sidebar">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          <div className="sidebar-stats-collapsed">
            <div className="sidebar-stat-icon critical" title={`${riskStats.critical} Tinggi`}>
              <span className="stat-icon-value">{riskStats.critical}</span>
              <span className="stat-icon-label">T</span>
            </div>
            <div className="sidebar-stat-icon warning" title={`${riskStats.warning} Sedang`}>
              <span className="stat-icon-value">{riskStats.warning}</span>
              <span className="stat-icon-label">S</span>
            </div>
            <div className="sidebar-stat-icon watch" title={`${riskStats.watch} Rendah`}>
              <span className="stat-icon-value">{riskStats.watch}</span>
              <span className="stat-icon-label">R</span>
            </div>
          </div>

          <div className="sidebar-tab-icons">
            <button
              className={`sidebar-tab-icon-btn ${activeTab === 'alerts' ? 'active' : ''}`}
              onClick={() => setActiveTab('alerts')}
              title={`Active Alerts (${filteredAlerts.length})`}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              {filteredAlerts.length > 0 && <span className="tab-badge">{filteredAlerts.length}</span>}
            </button>
            <button
              className={`sidebar-tab-icon-btn ${activeTab === 'provinces' ? 'active' : ''}`}
              onClick={() => setActiveTab('provinces')}
              title={`BI Offices (${KPWBI_OFFICES.length})`}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="10" r="3"/>
                <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/>
              </svg>
            </button>
          </div>
        </>
      ) : (
        /* ── Expanded view ────────────────────────────────────── */
        <>
          {/* Stats row — Risiko alert level office counts, each card clickable */}
          <div className="sidebar-header-row">
            <div className="sidebar-stats-container">
              <div className="sidebar-stats-title-row">
                <span className="sidebar-stats-title">Tingkat Risiko</span>
                <div 
                  className="sidebar-info-tooltip-container"
                  title="Risiko Bencana: Tingkat Keparahan x Indeks Kerentanan&#10;&#10;Scoring:&#10;• 1 - 3: Rendah&#10;• 4 - 6: Sedang&#10;• 7 - 9: Tinggi"
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="info-icon">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="16" x2="12" y2="12"/>
                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                  </svg>
                </div>
              </div>
              <div className="sidebar-stats-row">
                {(['critical', 'warning', 'watch'] as AlertSeverity[]).map((sev) => (
                  <button
                    key={sev}
                    className={`sidebar-stat-card ${sev}${activeStatPanel === sev ? ' stat-active' : ''}`}
                    onClick={() => handleStatClick(sev)}
                    title={`Lihat KPW — Risiko Bencana ${SEV_LABEL[sev]}`}
                  >
                    <span className="sidebar-stat-value">{riskStats[sev]}</span>
                    <span className="sidebar-stat-label">{SEV_LABEL[sev]}</span>
                  </button>
                ))}
              </div>
            </div>
            <button className="sidebar-toggle-btn sidebar-toggle-collapse" onClick={onToggleCollapse} title="Collapse sidebar">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          </div>

          {/* KPW panel grouped by Risiko alert level band */}
          {activeStatPanel && (() => {
            const offices = officesByBand.get(activeStatPanel) ?? [];
            return (
              <div className={`stat-panel stat-panel-${activeStatPanel}`}>
                <div className="stat-panel-header">
                  <span className="stat-panel-title">
                    Level Risiko Bencana
                    <span className="stat-panel-badge">{SEV_LABEL[activeStatPanel]} · {offices.length} kantor</span>
                  </span>
                  <button className="stat-panel-close" onClick={() => setActiveStatPanel(null)}>✕</button>
                </div>
                <div className="stat-panel-body">
                  {offices.length === 0 ? (
                    <p className="stat-panel-empty">Tidak ada KPW pada level risiko ini.</p>
                  ) : (
                    offices.map(({ office, topHazards }) => (
                      <button
                        key={office.id}
                        className={`stat-panel-item${selectedProvinceId === office.provinceId ? ' selected' : ''}`}
                        onClick={() => onProvinceSelect(office.provinceId)}
                      >
                        <div className="stat-panel-item-info">
                          <span className="stat-panel-item-name">{office.name}</span>
                          <span className="stat-panel-item-city">{office.city}</span>
                        </div>
                        {topHazards && (
                          <span className="stat-panel-item-types">{topHazards}</span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
            );
          })()}

          <div className="sidebar-tabs">
            <button className={`sidebar-tab-btn ${activeTab === 'alerts' ? 'active' : ''}`} onClick={() => setActiveTab('alerts')}>
              Peringatan ({filteredAlerts.length})
            </button>
            <button className={`sidebar-tab-btn ${activeTab === 'provinces' ? 'active' : ''}`} onClick={() => setActiveTab('provinces')}>
              Kantor BI ({KPWBI_OFFICES.length})
            </button>
          </div>

          <div className="sidebar-scrollable-content">
            {isLoading ? (
              <div className="sidebar-loading-overlay">
                <div className="sidebar-spinner" />
                <p style={{ fontWeight: 500, marginTop: '8px' }}>Memuat data BMKG...</p>
              </div>
            ) : (
              <>
                {activeTab === 'alerts' && (
                  <>
                    <div className="filters-accordion">
                      <button
                        className="filters-accordion-trigger"
                        onClick={() => setFiltersOpen((v) => !v)}
                      >
                        <span className="filters-trigger-label">
                          Filter &amp; Urutkan
                          {(severityFilter !== 'all' || typeFilter !== 'all' || sortBy !== 'newest') && (
                            <span className="filters-active-dot" />
                          )}
                        </span>
                        <svg
                          viewBox="0 0 24 24" width="14" height="14"
                          fill="none" stroke="currentColor" strokeWidth="2.5"
                          strokeLinecap="round" strokeLinejoin="round"
                          className={filtersOpen ? 'rotated' : ''}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>

                      {filtersOpen && (
                        <div className="filters-accordion-body">
                          <div className="filter-group">
                            <label className="filter-label">Tingkat</label>
                            <div className="severity-pills">
                              <button className={`severity-pill${severityFilter === 'all' ? ' active' : ''}`} onClick={() => setSeverityFilter('all')}>Semua</button>
                              {(['critical', 'warning', 'watch'] as const).map((sev) => {
                                const count = { critical: 3, warning: 2, watch: 1 }[sev];
                                return (
                                  <button
                                    key={sev}
                                    className={`severity-pill sev-${sev}${severityFilter === sev ? ' active' : ''}`}
                                    onClick={() => setSeverityFilter(sev)}
                                  >
                                    <span className="pill-boxes">
                                      {[1, 2, 3].map((i) => (
                                        <span key={i} className={`pill-box${i <= count ? ' filled' : ''}`} />
                                      ))}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                          <div className="filter-group">
                            <label className="filter-label">Jenis Bencana</label>
                            <select className="filter-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as DisasterType | 'all')}>
                              <option value="all">Semua Jenis</option>
                              <option value="earthquake">💢 Gempa Bumi</option>
                              <option value="extreme_weather">⚡ Cuaca Ekstrem</option>
                              <option value="karhutla">🔥 Karhutla</option>
                              <option value="volcanic">🌋 Gunung Api</option>
                            </select>
                          </div>
                          <div className="filter-group">
                            <label className="filter-label">Urutkan</label>
                            <select className="filter-select" value={sortBy} onChange={(e) => setSortBy(e.target.value as SortKey)}>
                              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>

                    {sortedAlerts.length > 0 ? (
                      sortedAlerts.map((alert) => (
                        <AlertCard
                          key={alert.id}
                          alert={alert}
                          province={provincesMap.get(alert.provinceId)}
                          isSelected={selectedAlertId === alert.id}
                          onClick={() => onAlertSelect(alert.id)}
                        />
                      ))
                    ) : (
                      <div className="empty-state">
                        <p>Tidak ada peringatan yang cocok dengan filter.</p>
                      </div>
                    )}
                  </>
                )}

                {activeTab === 'provinces' && (
                  <>
                    <input
                      type="text"
                      placeholder="Cari kantor BI atau kota..."
                      className="sidebar-search-box"
                      value={officeSearch}
                      onChange={(e) => setOfficeSearch(e.target.value)}
                    />
                    {Object.keys(groupedOffices).map((region) => {
                      const list = groupedOffices[region];
                      if (!list || list.length === 0) return null;
                      const isExpanded = !!expandedRegions[region];
                      return (
                        <div key={region} className="province-group">
                          <div className="province-group-header" onClick={() => setExpandedRegions((prev) => ({ ...prev, [region]: !prev[region] }))}>
                            <span className="province-group-title">{region}</span>
                            <span className="province-group-count">{list.length} {isExpanded ? '▲' : '▼'}</span>
                          </div>
                          {isExpanded && (
                            <div className="province-group-list">
                              {list.map((office) => {
                                const hasAlert = filteredAlerts.some((a) => a.provinceId === office.provinceId);
                                return (
                                  <button
                                    key={office.id}
                                    className={`province-item-btn ${selectedProvinceId === office.provinceId ? 'selected' : ''} ${office.isKorwil ? 'korwil-office' : ''}`}
                                    onClick={() => onProvinceSelect(office.provinceId)}
                                  >
                                    <div className="province-item-left">
                                      <span className={`province-item-dot ${hasAlert ? 'active-alert' : ''}`} />
                                      <span style={{ fontWeight: office.isKorwil ? 600 : 400 }}>
                                        {office.name}
                                        {office.isKantorPusat && ' 🏛️'}
                                        {office.isKorwil && !office.isKantorPusat && ' ★'}
                                      </span>
                                    </div>
                                    <span className="province-capital-lbl" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                      {office.city}
                                      {office.isKorwil && <span className="korwil-badge">KORWIL</span>}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {Object.values(groupedOffices).every((l) => l.length === 0) && (
                      <div className="empty-state">
                        <p>Kantor BI tidak ditemukan: "{officeSearch}"</p>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </>
      )}
    </aside>
  );
};

export default Sidebar;
