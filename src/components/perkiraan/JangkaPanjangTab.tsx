import React, { useState } from 'react';
import IklimView from './IklimView';
import GempaView from './GempaView';
import ChecklistPanel from './ChecklistPanel';

type SubTab = 'iklim' | 'gempa' | 'checklist';

const SUB_TABS: { key: SubTab; emoji: string; label: string }[] = [
  { key: 'iklim', emoji: '🌡️', label: 'Iklim (ENSO)' },
  { key: 'gempa', emoji: '🌋', label: 'Gempa Bumi' },
  { key: 'checklist', emoji: '✅', label: 'Checklist KPw' },
];

const JangkaPanjangTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('iklim');

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

      {/* Content */}
      <div className="jangka-panjang-content">
        {activeSubTab === 'iklim' && <IklimView />}
        {activeSubTab === 'gempa' && <GempaView />}
        {activeSubTab === 'checklist' && (
          <div className="perkiraan-tab-layout checklist-layout">
            <ChecklistPanel />
          </div>
        )}
      </div>
    </div>
  );
};

export default JangkaPanjangTab;
