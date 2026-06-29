import React, { useState, useEffect } from 'react';
import type { DisasterType } from '../../types';
import './TopBar.css';

interface TopBarProps {
  criticalCount: number;
  totalAlerts: number;
  onGenerateReport?: () => void;
  selectedType: DisasterType | 'all';
  onTypeChange: (type: DisasterType | 'all') => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  criticalCount,
  totalAlerts,
  onGenerateReport,
  selectedType,
  onTypeChange,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format to Indonesian timezone (WIB - Western Indonesia Time)
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      };
      const formattedTime = new Intl.DateTimeFormat('id-ID', options).format(now);
      const dateOptions: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Jakarta',
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      };
      const formattedDate = new Intl.DateTimeFormat('id-ID', dateOptions).format(now);
      setTimeStr(`${formattedDate} | ${formattedTime} WIB`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="topbar-container">
      <div className="topbar-brand">
        <div className="topbar-logo">🚨</div>
        <h1 className="topbar-title">
          INDONESIA <span>EWS DISASTER DASHBOARD</span>
        </h1>
      </div>

      <div className="topbar-filter-container">
        <label htmlFor="disaster-select" className="topbar-filter-label">Filter Bencana:</label>
        <select
          id="disaster-select"
          className="topbar-select"
          value={selectedType}
          onChange={(e) => onTypeChange(e.target.value as DisasterType | 'all')}
        >
          <option value="all">🌐 Semua Bencana</option>
          <option value="earthquake">🌋 Gempa Bumi</option>
          <option value="extreme_weather">⚡ Cuaca Ekstrem</option>
          <option value="karhutla">🔥 Karhutla</option>
          <option value="flood">🌧️ Banjir (InaRisk)</option>
          <option value="tsunami">🌊 Tsunami (InaRisk)</option>
          <option value="kekeringan">🏜️ Kekeringan (InaRisk)</option>
          <option value="volcanic">🌋 Gunung Api (InaRisk)</option>
        </select>
      </div>

      <div className="topbar-meta">
        <div className="topbar-clock">{timeStr || 'Loading clock...'}</div>
        
        <button className="topbar-report-btn" onClick={onGenerateReport}>
          📊 Laporan Bencana
        </button>
        
        {totalAlerts > 0 ? (
          <div className="topbar-alerts-status">
            <span className="topbar-indicator"></span>
            <span>
              {criticalCount > 0
                ? `${criticalCount} CRITICAL ALERT${criticalCount > 1 ? 'S' : ''} ACTIVE`
                : `${totalAlerts} ALERT${totalAlerts > 1 ? 'S' : ''} MONITORING`}
            </span>
          </div>
        ) : (
          <div className="topbar-alerts-status all-clear">
            <span className="topbar-indicator"></span>
            <span>SYSTEMS NORMAL — ALL CLEAR</span>
          </div>
        )}
      </div>
    </header>
  );
};

export default TopBar;
