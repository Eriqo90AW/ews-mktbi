import React, { useState } from 'react';
import IklimView from './IklimView';
import GempaView from './GempaView';
import ChecklistPanel from './ChecklistPanel';

type SubTab = 'iklim' | 'gempa';

const SUB_TABS: { key: SubTab; emoji: string; label: string }[] = [
  { key: 'iklim', emoji: '🌡️', label: 'Iklim' },
  { key: 'gempa', emoji: '🌋', label: 'Gempa Bumi' },
];

const JangkaPanjangTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('iklim');
  const [checklistOpen, setChecklistOpen] = useState<boolean>(true);

  return (
    <div className="jangka-panjang-container">
      {/* Sub-tab navigation */}
      <div className="jangka-panjang-subtabs">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.key}
            className={`jangka-subtab-btn${activeSubTab === tab.key ? ' active' : ''}`}
            onClick={() => setActiveSubTab(tab.key)}
          >
            <span>{tab.emoji}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Body: main content + checklist right sidebar */}
      <div className="jangka-panjang-body">
        <div className="jangka-panjang-content">
          {activeSubTab === 'iklim' && <IklimView />}
          {activeSubTab === 'gempa' && <GempaView />}
        </div>

        {/* Collapsible checklist sidebar */}
        <div className={`checklist-sidebar${checklistOpen ? ' open' : ''}`}>
          <button
            className="checklist-sidebar-toggle"
            onClick={() => setChecklistOpen((o) => !o)}
            title={checklistOpen ? 'Tutup Checklist' : 'Buka Checklist KPw'}
          >
            <svg
              viewBox="0 0 24 24" width="14" height="14" fill="none"
              stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ transform: checklistOpen ? 'none' : 'rotate(180deg)', transition: 'transform 0.2s' }}
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            <span className="checklist-sidebar-label">Checklist KPw</span>
          </button>

          {checklistOpen && (
            <div className="checklist-sidebar-content">
              <ChecklistPanel />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JangkaPanjangTab;
