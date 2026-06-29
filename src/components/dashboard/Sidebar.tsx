import React, { useState, useMemo } from 'react';
import type { DisasterAlert, Province, AlertSeverity, DisasterType } from '../../types';
import { PROVINCES, ISLAND_GROUPS } from '../../constants/provinces';
import AlertCard from './AlertCard';
import './Sidebar.css';

interface SidebarProps {
  alerts: DisasterAlert[];
  filteredAlerts: DisasterAlert[];
  stats: {
    critical: number;
    warning: number;
    watch: number;
    total: number;
  };
  selectedProvinceId: string | null;
  onProvinceSelect: (provinceId: string) => void;
  selectedAlertId: string | null;
  onAlertSelect: (alertId: string) => void;
  severityFilter: AlertSeverity | 'all';
  setSeverityFilter: (val: AlertSeverity | 'all') => void;
  typeFilter: DisasterType | 'all';
  setTypeFilter: (val: DisasterType | 'all') => void;
  isLoading?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  alerts,
  filteredAlerts,
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
}) => {
  const [activeTab, setActiveTab] = useState<'alerts' | 'provinces'>('alerts');
  const [provinceSearch, setProvinceSearch] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'magnitude-desc' | 'magnitude-asc' | 'severity-desc'>('newest');

  const sortedAlerts = useMemo(() => {
    const list = [...filteredAlerts];
    return list.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      }
      if (sortBy === 'magnitude-desc') {
        return (b.magnitude || 0) - (a.magnitude || 0);
      }
      if (sortBy === 'magnitude-asc') {
        return (a.magnitude || 0) - (b.magnitude || 0);
      }
      if (sortBy === 'severity-desc') {
        const severityWeight = { critical: 3, warning: 2, watch: 1 };
        const weightA = severityWeight[a.severity] || 0;
        const weightB = severityWeight[b.severity] || 0;
        if (weightB !== weightA) {
          return weightB - weightA;
        }
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
      return 0;
    });
  }, [filteredAlerts, sortBy]);
  const [expandedIslands, setExpandedIslands] = useState<Record<string, boolean>>({
    Sumatera: true,
    Jawa: true,
    'Bali & Nusa Tenggara': true,
    Kalimantan: true,
    Sulawesi: true,
    'Maluku & Papua': true,
  });

  const toggleIsland = (island: string) => {
    setExpandedIslands((prev) => ({
      ...prev,
      [island]: !prev[island],
    }));
  };

  const getProvinceWithActiveAlert = (provinceId: string): boolean => {
    return alerts.some((a) => a.provinceId === provinceId);
  };

  // Group and filter provinces
  const groupedProvinces = useMemo(() => {
    const searchLower = provinceSearch.toLowerCase();
    const filtered = PROVINCES.filter(
      (p) =>
        p.name.toLowerCase().includes(searchLower) ||
        p.capital.toLowerCase().includes(searchLower)
    );

    const groups: Record<string, Province[]> = {};
    ISLAND_GROUPS.forEach((island) => {
      groups[island] = [];
    });

    filtered.forEach((p) => {
      if (groups[p.island]) {
        groups[p.island].push(p);
      } else {
        groups[p.island] = [p];
      }
    });

    return groups;
  }, [provinceSearch]);

  const provincesMap = useMemo(() => {
    const map = new Map<string, Province>();
    PROVINCES.forEach((p) => map.set(p.id, p));
    return map;
  }, []);

  return (
    <aside className="sidebar-container">
      {/* Mini Stats Summary Strip */}
      <div className="sidebar-stats-row">
        <div className="sidebar-stat-card critical">
          <span className="sidebar-stat-value">{stats.critical}</span>
          <span className="sidebar-stat-label">Critical</span>
        </div>
        <div className="sidebar-stat-card warning">
          <span className="sidebar-stat-value">{stats.warning}</span>
          <span className="sidebar-stat-label">Warning</span>
        </div>
        <div className="sidebar-stat-card watch">
          <span className="sidebar-stat-value">{stats.watch}</span>
          <span className="sidebar-stat-label">Watch</span>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="sidebar-tabs">
        <button
          className={`sidebar-tab-btn ${activeTab === 'alerts' ? 'active' : ''}`}
          onClick={() => setActiveTab('alerts')}
        >
          Active Alerts ({filteredAlerts.length})
        </button>
        <button
          className={`sidebar-tab-btn ${activeTab === 'provinces' ? 'active' : ''}`}
          onClick={() => setActiveTab('provinces')}
        >
          Provinces ({PROVINCES.length})
        </button>
      </div>

      {/* Content Area */}
      <div className="sidebar-scrollable-content">
        {isLoading ? (
          <div className="sidebar-loading-overlay">
            <div className="sidebar-spinner"></div>
            <p style={{ fontWeight: 500, marginTop: '8px' }}>Memuat data BMKG & BNPB...</p>
          </div>
        ) : (
          <>
            {activeTab === 'alerts' && (
              <>
                {/* Filter Section */}
                <div className="sidebar-filters">
              <div className="filter-group">
                <label className="filter-label">Severity</label>
                <select
                  className="filter-select"
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value as AlertSeverity | 'all')}
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical Only</option>
                  <option value="warning">Warnings</option>
                  <option value="watch">Watch / Advisory</option>
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label">Disaster Type</label>
                <select
                  className="filter-select"
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value as DisasterType | 'all')}
                >
                  <option value="all">All Disasters</option>
                  <option value="earthquake">Earthquake</option>
                  <option value="extreme_weather">Cuaca Ekstrem</option>
                  <option value="karhutla">Karhutla</option>
                  <option value="flood">Flood (Banjir)</option>
                  <option value="tsunami">Tsunami</option>
                  <option value="kekeringan">Kekeringan</option>
                  <option value="volcanic">Volcanic Activity</option>
                  <option value="landslide">Landslide</option>
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label">Sort By</label>
                <select
                  className="filter-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="magnitude-desc">Highest Magnitude</option>
                  <option value="magnitude-asc">Lowest Magnitude</option>
                  <option value="severity-desc">Highest Severity</option>
                </select>
              </div>
            </div>

            {/* Alerts List */}
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
                <p>No active alerts matching the selected filters.</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'provinces' && (
          <>
            {/* Search Input */}
            <input
              type="text"
              placeholder="Search province or capital..."
              className="sidebar-search-box"
              value={provinceSearch}
              onChange={(e) => setProvinceSearch(e.target.value)}
            />

            {/* Province List Grouped by Island */}
            {Object.keys(groupedProvinces).map((island) => {
              const list = groupedProvinces[island];
              if (list.length === 0) return null;
              const isExpanded = !!expandedIslands[island];

              return (
                <div key={island} className="province-group">
                  <div
                    className="province-group-header"
                    onClick={() => toggleIsland(island)}
                  >
                    <span className="province-group-title">{island}</span>
                    <span className="province-group-count">
                      {list.length} {isExpanded ? '▲' : '▼'}
                    </span>
                  </div>
                  {isExpanded && (
                    <div className="province-group-list">
                      {list.map((province) => {
                        const hasAlert = getProvinceWithActiveAlert(province.id);
                        const isSelected = selectedProvinceId === province.id;

                        return (
                          <button
                            key={province.id}
                            className={`province-item-btn ${isSelected ? 'selected' : ''}`}
                            onClick={() => onProvinceSelect(province.id)}
                          >
                            <div className="province-item-left">
                              <span
                                className={`province-item-dot ${
                                  hasAlert ? 'active-alert' : ''
                                }`}
                              />
                              <span>{province.name}</span>
                            </div>
                            <span className="province-capital-lbl">{province.capital}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {Object.values(groupedProvinces).every((list) => list.length === 0) && (
              <div className="empty-state">
                <p>No provinces found matching "{provinceSearch}"</p>
              </div>
            )}
          </>
        )}
          </>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
export type { SidebarProps };
