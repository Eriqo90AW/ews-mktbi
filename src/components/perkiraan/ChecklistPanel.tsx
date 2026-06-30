import React, { useState, useMemo } from 'react';
import { KPWBI_OFFICES } from '../../constants/kpwbiOffices';
import { PROVINCES } from '../../constants/provinces';
import { BnpbInariskService } from '../../services/bnpbInariskService';
import { CHECKLIST_ITEMS } from '../../constants/preparednessChecklist';
import { usePreparednessChecklist } from '../../hooks/usePreparednessChecklist';

const RISK_THRESHOLD = 0.3;

const ChecklistPanel: React.FC = () => {
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const { getStatus, toggleItem, getCompletionCount } = usePreparednessChecklist();

  const provincesMap = useMemo(() => new Map(PROVINCES.map((p) => [p.id, p])), []);

  const atRiskOffices = useMemo(() => {
    return KPWBI_OFFICES.filter((o) => {
      const flood = BnpbInariskService.getLocalHazardIndex(o.id, 'flood');
      const gempa = BnpbInariskService.getLocalPotensiIndex(o.id, 'gempa');
      return flood > RISK_THRESHOLD || gempa > RISK_THRESHOLD;
    });
  }, []);

  const clampedIndex = Math.min(selectedIndex, Math.max(0, atRiskOffices.length - 1));
  const selectedOffice = atRiskOffices[clampedIndex];

  const floodScore = selectedOffice ? BnpbInariskService.getLocalHazardIndex(selectedOffice.id, 'flood') : 0;
  const gempaScore = selectedOffice ? BnpbInariskService.getLocalPotensiIndex(selectedOffice.id, 'gempa') : 0;
  const isHighFlood = floodScore > 0.4;
  const isHighGempa = gempaScore > 0.4;

  const visibleItems = CHECKLIST_ITEMS.filter(
    (item) => !item.floodOnly || isHighFlood
  );

  const officeId = selectedOffice?.id ?? '';
  const status = getStatus(officeId);
  const completedCount = getCompletionCount(officeId, visibleItems.map((i) => i.id));
  const totalCount = visibleItems.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const progressClass = progressPct === 100 ? 'complete' : progressPct >= 60 ? 'good' : progressPct >= 30 ? 'partial' : 'low';

  const CATEGORY_ICONS: Record<string, string> = {
    umum: '🏢',
    gempa: '🫨',
    banjir: '🌊',
  };

  const goToPrev = () => setSelectedIndex((i) => Math.max(0, i - 1));
  const goToNext = () => setSelectedIndex((i) => Math.min(atRiskOffices.length - 1, i + 1));

  if (atRiskOffices.length === 0) {
    return (
      <div className="checklist-container">
        <div className="checklist-header">
          <span className="perkiraan-panel-title">Checklist Kesiapsiagaan KPw</span>
        </div>
        <p className="checklist-flood-note">Tidak ada KPw dengan risiko banjir atau gempa yang terdeteksi.</p>
      </div>
    );
  }

  return (
    <div className="checklist-container">
      <div className="checklist-header">
        <div className="checklist-header-top">
          <span className="perkiraan-panel-title">Checklist Kesiapsiagaan KPw</span>
          <span className="checklist-progress-chip" data-level={progressClass}>
            {completedCount}/{totalCount} Lengkap
          </span>
        </div>

        {/* Current office display */}
        <div className="checklist-office-display">
          <span className="checklist-office-name">{selectedOffice.name}</span>
          <span className="checklist-office-city">{selectedOffice.city}</span>
        </div>

        <div className="checklist-office-meta">
          <span>{provincesMap.get(selectedOffice.provinceId)?.name}</span>
          <span>{selectedOffice.region}</span>
          {isHighFlood && (
            <span className="flood-risk-tag">
              💧 Banjir Tinggi ({Math.round(floodScore * 100)}/100)
            </span>
          )}
          {isHighGempa && (
            <span className="gempa-risk-tag">
              🫨 Gempa Tinggi ({Math.round(gempaScore * 100)}/100)
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

        {/* Prev / Next navigator */}
        <div className="checklist-nav">
          <button
            className="checklist-nav-btn"
            onClick={goToPrev}
            disabled={clampedIndex === 0}
            aria-label="KPw sebelumnya"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span className="checklist-nav-count">
            {clampedIndex + 1} / {atRiskOffices.length} KPw berisiko
          </span>
          <button
            className="checklist-nav-btn"
            onClick={goToNext}
            disabled={clampedIndex === atRiskOffices.length - 1}
            aria-label="KPw berikutnya"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
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
              onClick={() => toggleItem(officeId, item.id)}
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
