import React, { useState, useMemo } from 'react';
import { KPWBI_OFFICES } from '../../constants/kpwbiOffices';
import { PROVINCES } from '../../constants/provinces';
import { BnpbInariskService } from '../../services/bnpbInariskService';
import { CHECKLIST_ITEMS } from '../../constants/preparednessChecklist';
import { usePreparednessChecklist } from '../../hooks/usePreparednessChecklist';

const ChecklistPanel: React.FC = () => {
  const [selectedOfficeId, setSelectedOfficeId] = useState<string>(KPWBI_OFFICES[0].id);
  const { getStatus, toggleItem, getCompletionCount } = usePreparednessChecklist();

  const provincesMap = useMemo(() => new Map(PROVINCES.map((p) => [p.id, p])), []);

  const selectedOffice = KPWBI_OFFICES.find((o) => o.id === selectedOfficeId)!;
  const floodScore = BnpbInariskService.getLocalHazardIndex(selectedOfficeId, 'flood');
  const isHighFlood = floodScore > 0.4;

  const visibleItems = CHECKLIST_ITEMS.filter(
    (item) => !item.floodOnly || isHighFlood
  );

  const status = getStatus(selectedOfficeId);
  const completedCount = getCompletionCount(selectedOfficeId, visibleItems.map((i) => i.id));
  const totalCount = visibleItems.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const progressClass = progressPct === 100 ? 'complete' : progressPct >= 60 ? 'good' : progressPct >= 30 ? 'partial' : 'low';

  const CATEGORY_ICONS: Record<string, string> = {
    umum: '🏢',
    gempa: '🫨',
    banjir: '🌊',
  };

  return (
    <div className="checklist-container">
      {/* Office selector */}
      <div className="checklist-header">
        <div className="checklist-header-top">
          <span className="perkiraan-panel-title">Checklist Kesiapsiagaan KPw</span>
          <span className="checklist-progress-chip" data-level={progressClass}>
            {completedCount}/{totalCount} Lengkap
          </span>
        </div>
        <select
          className="checklist-office-select"
          value={selectedOfficeId}
          onChange={(e) => setSelectedOfficeId(e.target.value)}
        >
          {KPWBI_OFFICES.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name} — {o.city}
            </option>
          ))}
        </select>
        <div className="checklist-office-meta">
          <span>{provincesMap.get(selectedOffice.provinceId)?.name}</span>
          <span>{selectedOffice.region}</span>
          {isHighFlood && (
            <span className="flood-risk-tag">
              💧 Risiko Banjir Tinggi ({Math.round(floodScore * 100)}/100)
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="checklist-progress-bar-wrap">
          <div
            className={`checklist-progress-bar ${progressClass}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="checklist-progress-label">{progressPct}% kesiapsiagaan lengkap</span>
      </div>

      {/* Items */}
      <div className="checklist-items">
        {visibleItems.map((item) => {
          const checked = !!status[item.id];
          const isFloodItem = item.floodOnly;
          return (
            <label
              key={item.id}
              className={`checklist-item${checked ? ' checked' : ''}${isFloodItem ? ' flood-only' : ''}`}
              onClick={() => toggleItem(selectedOfficeId, item.id)}
            >
              <div className={`checklist-checkbox${checked ? ' checked' : ''}`}>
                {checked && (
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <div className="checklist-item-content">
                <div className="checklist-item-header">
                  <span className="checklist-category-icon">{CATEGORY_ICONS[item.category]}</span>
                  <span className="checklist-item-label">{item.label}</span>
                  {isFloodItem && (
                    <span className="checklist-flood-tag">💧 Khusus Banjir</span>
                  )}
                </div>
                <p className="checklist-item-desc">{item.description}</p>
              </div>
            </label>
          );
        })}
      </div>

      {!isHighFlood && (
        <p className="checklist-flood-note">
          💡 Item "Ketersediaan Perahu Karet" hanya ditampilkan untuk wilayah dengan risiko banjir tinggi.
        </p>
      )}
    </div>
  );
};

export default ChecklistPanel;
