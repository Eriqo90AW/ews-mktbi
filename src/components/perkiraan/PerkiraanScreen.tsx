import React, { useState } from 'react';
import MingguanTab from './MingguanTab';
import JangkaPanjangTab from './JangkaPanjangTab';
import '../dashboard/TopBar.css';
import './PerkiraanScreen.css';

type MainTab = 'mingguan' | 'jangka_panjang';

interface PerkiraanScreenProps {
  onBack: () => void;
}

const PerkiraanScreen: React.FC<PerkiraanScreenProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<MainTab>('mingguan');

  return (
    <div className="perkiraan-container">
      {/* Header — matches topbar-container pattern */}
      <header className="topbar-container">
        {/* Left: back + brand */}
        <div className="topbar-brand">
          <button className="topbar-back-btn" onClick={onBack}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Kembali
          </button>
          <div className="topbar-divider-v" />
          <div className="topbar-brand-text">
            <h1 className="topbar-title">Halaman <span>Perkiraan</span></h1>
            <span className="topbar-brand-sub">BIMA — Kesiapsiagaan KPw BI</span>
          </div>
        </div>

        {/* Center: main tabs */}
        <div className="topbar-center">
          <div className="topbar-filter-group perkiraan">
            <button
              className={`topbar-filter-pill${activeTab === 'mingguan' ? ' active' : ''}`}
              onClick={() => setActiveTab('mingguan')}
            >
              <span>📅</span>
              <span>Mingguan</span>
            </button>
            <button
              className={`topbar-filter-pill${activeTab === 'jangka_panjang' ? ' active' : ''}`}
              onClick={() => setActiveTab('jangka_panjang')}
            >
              <span>📊</span>
              <span>Jangka Panjang</span>
            </button>
          </div>
        </div>

        {/* Right: status chip */}
        <div className="topbar-right">
          <div className={`topbar-status ${activeTab === 'mingguan' ? 'monitoring' : 'clear'}`}>
            <span className="topbar-status-dot" />
            <span>
              {activeTab === 'mingguan' ? '📅 Prakiraan 3 Hari' : '📊 Analisis Strategis'}
            </span>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <div className="perkiraan-body">
        {activeTab === 'mingguan' && <MingguanTab />}
        {activeTab === 'jangka_panjang' && <JangkaPanjangTab />}
      </div>
    </div>
  );
};

export default PerkiraanScreen;
