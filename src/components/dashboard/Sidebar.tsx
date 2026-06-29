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

  // Build a map: riskLevel → offices whose marker is inside ≥1 alert's radius.
  // Uses riskResults.affectedLocations (haversine-checked) not province matching.
  const affectedOfficesBySeverity = useMemo(() => {

    // Collect per-office data: which alerts affect each KPW (by radius)
    const officeAlertMap = new Map<string, { office: typeof KPWBI_OFFICES[0]; alerts: DisasterAlert[]; riskLevel: string }>();

    riskResults.forEach((res) => {
      // Only consider results that have at least one location inside the radius
      if (res.affectedLocations.length === 0) return;

      const matchedAlert = filteredAlerts.find((a) => a.id === res.event.id);
      if (!matchedAlert) return;

      res.affectedLocations.forEach((loc) => {
        const office = KPWBI_OFFICES.find((o) => o.id === loc.id);
        if (!office) return; // skip DRC locations

        if (!officeAlertMap.has(office.id)) {
          officeAlertMap.set(office.id, { office, alerts: [], riskLevel: res.riskLevel });
        }
        const entry = officeAlertMap.get(office.id)!;
        entry.alerts.push(matchedAlert);
        // Escalate to highest risk level seen for this office
        const existingWeight = { Tinggi: 3, Sedang: 2, Rendah: 1 }[entry.riskLevel] ?? 1;
        const newWeight     = { Tinggi: 3, Sedang: 2, Rendah: 1 }[res.riskLevel]    ?? 1;
        if (newWeight > existingWeight) entry.riskLevel = res.riskLevel;
      });
    });

    const result = new Map<AlertSeverity, Array<{ office: typeof KPWBI_OFFICES[0]; alerts: DisasterAlert[] }>>();
    for (const sev of ['critical', 'warning', 'watch'] as AlertSeverity[]) {
      const targetRiskLevel = { critical: 'Tinggi', warning: 'Sedang', watch: 'Rendah' }[sev];
      result.set(
        sev,
        Array.from(officeAlertMap.values())
          .filter((entry) => entry.riskLevel === targetRiskLevel)
          .map((entry) => ({ office: entry.office, alerts: entry.alerts })),
      );
    }
    return result;
  }, [riskResults, filteredAlerts]);

  const handleStatClick = (sev: AlertSeverity) => {
    setActiveStatPanel((prev) => (prev === sev ? null : sev));
  };

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
            <div className="sidebar-stat-icon critical" title={`${stats.critical} Tinggi`}>
              <span className="stat-icon-value">{stats.critical}</span>
              <span className="stat-icon-label">T</span>
            </div>
            <div className="sidebar-stat-icon warning" title={`${stats.warning} Sedang`}>
              <span className="stat-icon-value">{stats.warning}</span>
              <span className="stat-icon-label">S</span>
            </div>
            <div className="sidebar-stat-icon watch" title={`${stats.watch} Rendah`}>
              <span className="stat-icon-value">{stats.watch}</span>
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
          {/* Stats row — each card is clickable */}
          <div className="sidebar-header-row">
            <div className="sidebar-stats-row">
              {(['critical', 'warning', 'watch'] as AlertSeverity[]).map((sev) => (
                <button
                  key={sev}
                  className={`sidebar-stat-card ${sev}${activeStatPanel === sev ? ' stat-active' : ''}`}
                  onClick={() => handleStatClick(sev)}
                  title={`Lihat KPW terdampak — ${SEV_LABEL[sev]}`}
                >
                  <span className="sidebar-stat-value">{stats[sev]}</span>
                  <span className="sidebar-stat-label">{SEV_LABEL[sev]}</span>
                </button>
              ))}
            </div>
            <button className="sidebar-toggle-btn sidebar-toggle-collapse" onClick={onToggleCollapse} title="Collapse sidebar">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
          </div>

          {/* KPW affected panel — slides in below stats */}
          {activeStatPanel && (() => {
            const offices = affectedOfficesBySeverity.get(activeStatPanel) ?? [];
            return (
              <div className={`stat-panel stat-panel-${activeStatPanel}`}>
                <div className="stat-panel-header">
                  <span className="stat-panel-title">
                    KPW Terdampak
                    <span className="stat-panel-badge">{SEV_LABEL[activeStatPanel]} · {offices.length} kantor</span>
                  </span>
                  <button className="stat-panel-close" onClick={() => setActiveStatPanel(null)}>✕</button>
                </div>
                <div className="stat-panel-body">
                  {offices.length === 0 ? (
                    <p className="stat-panel-empty">Tidak ada KPW terdampak pada level ini.</p>
                  ) : (
                    offices.map(({ office, alerts }) => {
                      const uniqueTypes = [...new Set(alerts.map((a) => a.type))];
                      return (
                        <button
                          key={office.id}
                          className={`stat-panel-item${selectedProvinceId === office.provinceId ? ' selected' : ''}`}
                          onClick={() => onProvinceSelect(office.provinceId)}
                        >
                          <div className="stat-panel-item-info">
                            <span className="stat-panel-item-name">{office.name}</span>
                            <span className="stat-panel-item-city">{office.city}</span>
                          </div>
                          <span className="stat-panel-item-types">
                            {uniqueTypes.map((t) => getDisasterEmoji(t)).join(' ')}
                          </span>
                        </button>
                      );
                    })
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
                              <option value="earthquake">🫨 Gempa Bumi</option>
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
