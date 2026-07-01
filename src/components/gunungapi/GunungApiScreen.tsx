import React, { useState, useEffect, useMemo, useRef } from 'react';
import { MagmaService, getJakartaDateString } from '../../services/magmaService';
import {
  Volcano as VolcanoIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import type { VolcanoReport, VolcanoLevel } from '../../types';
import '../dashboard/TopBar.css';
import './GunungApiScreen.css';

interface GunungApiScreenProps {
  onBack: () => void;
}

const LEVEL_TABS: { key: VolcanoLevel; label: string; cls: string; icon: React.ComponentType<any> }[] = [
  { key: 'III', label: 'Level III (Siaga)', cls: 'level-siaga', icon: VolcanoIcon },
  { key: 'II', label: 'Level II (Waspada)', cls: 'level-waspada', icon: WarningIcon },
  { key: 'I', label: 'Level I (Normal)', cls: 'level-normal', icon: CheckCircleIcon },
];

export const GunungApiScreen: React.FC<GunungApiScreenProps> = ({ onBack }) => {
  const todayStr = getJakartaDateString();
  const [selectedLevel, setSelectedLevel] = useState<VolcanoLevel>('III');
  const [reports, setReports] = useState<VolcanoReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVolcanoName, setSelectedVolcanoName] = useState<string | null>(null);
  const [reportDate, setReportDate] = useState(todayStr);

  const [isAutoCheckActive, setIsAutoCheckActive] = useState(true);
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);
  const [isCheckingLive, setIsCheckingLive] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'success' | 'error' | 'idle'>('idle');
  const [isMockData, setIsMockData] = useState(false);

  const volcanoRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const loadData = async (isBackground: boolean = false) => {
    if (!isBackground) {
      setIsLoading(true);
    }
    setIsCheckingLive(true);
    try {
      const data = await MagmaService.fetchDailyReport(reportDate, false);
      if (isMounted.current) {
        setReports(data);
        setSyncStatus('success');
        setIsMockData(false);
        setLastCheckedAt(new Date());
      }
    } catch (err: any) {
      const isNotFoundError = err?.name === 'NotFoundError' || err?.message?.includes('404') || err?.message?.includes('not found');
      if (isNotFoundError && reportDate === todayStr) {
        const yesterday = new Date(new Date().getTime() - 24 * 3600000);
        const yesterdayStr = getJakartaDateString(yesterday);
        console.warn(`Today's report not found (404), trying yesterday's report: ${yesterdayStr}`);
        try {
          const yesterdayData = await MagmaService.fetchDailyReport(yesterdayStr, false);
          if (isMounted.current) {
            setReportDate(yesterdayStr);
            setReports(yesterdayData);
            setSyncStatus('success');
            setIsMockData(false);
            setLastCheckedAt(new Date());
          }
          return;
        } catch (yesterdayErr) {
          console.warn('Yesterday\'s report fetch failed as well:', yesterdayErr);
        }
      }

      console.warn('Real-time fetch failed, falling back to mock:', err);
      try {
        const fallbackData = await MagmaService.fetchDailyReport(reportDate, true);
        if (isMounted.current) {
          setReports(fallbackData);
          setSyncStatus('success');
          setIsMockData(true);
          setLastCheckedAt(new Date());
        }
      } catch (fallbackErr) {
        console.error('All fetch attempts failed:', fallbackErr);
        if (isMounted.current) {
          setSyncStatus('error');
        }
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        setIsCheckingLive(false);
      }
    }
  };

  useEffect(() => {
    loadData(false);
  }, [reportDate]);

  // Polling effect: only active when reportDate is today and auto-checking is enabled
  useEffect(() => {
    if (reportDate !== todayStr || !isAutoCheckActive) return;

    const intervalId = setInterval(() => {
      loadData(true);
    }, 300000); // 5 minutes

    return () => clearInterval(intervalId);
  }, [reportDate, isAutoCheckActive, todayStr]);

  const handleManualRefresh = () => {
    loadData(false);
  };

  const filteredReports = useMemo(() => {
    return reports.filter((r) => r.level === selectedLevel);
  }, [reports, selectedLevel]);

  const stats = useMemo(() => {
    return reports.reduce(
      (acc, r) => {
        acc[r.level] = (acc[r.level] || 0) + 1;
        return acc;
      },
      { III: 0, II: 0, I: 0 } as Record<VolcanoLevel, number>
    );
  }, [reports]);

  const handleVolcanoSelect = (name: string) => {
    setSelectedVolcanoName(name);
    const element = volcanoRefs.current[name];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      setReportDate(e.target.value);
    }
  };

  const currentLevelTab = LEVEL_TABS.find((t) => t.key === selectedLevel)!;

  return (
    <div className="gunungapi-container">
      {/* Header — Same topbar-container structure as existing screens */}
      <header className="topbar-container">
        <div className="topbar-brand">
          <button className="topbar-back-btn" onClick={onBack}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Kembali
          </button>
          <div className="topbar-divider-v" />
          <div className="topbar-brand-text">
            <h1 className="topbar-title">Status <span>Gunung Api</span></h1>
            <span className="topbar-brand-sub">BIMA — MAGMA Indonesia</span>
          </div>
        </div>

        {/* Center: level tabs */}
        <div className="topbar-center">
          <div className="topbar-filter-group gunungapi">
            {LEVEL_TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  className={`topbar-filter-pill${selectedLevel === tab.key ? ' active' : ''} ${tab.cls}-tab`}
                  onClick={() => {
                    setSelectedLevel(tab.key);
                    setSelectedVolcanoName(null);
                  }}
                >
                  <Icon style={{ fontSize: 14, display: 'inline-block', marginRight: '4px', verticalAlign: 'middle' }} />
                  <span>{tab.label}</span>
                  <span className="level-pill-count">{stats[tab.key] || 0}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Date Picker and Status */}
        <div className="topbar-right">
          {reportDate === todayStr && (
            <div className={`realtime-topbar-indicator ${isCheckingLive ? 'checking' : isAutoCheckActive ? 'active' : 'paused'}`} title={lastCheckedAt ? `Terakhir dicek: ${lastCheckedAt.toLocaleTimeString('id-ID')} WIB` : 'Siap dipantau'}>
              <span className="pulse-dot-mini" />
              <span>{isCheckingLive ? 'Syncing...' : isAutoCheckActive ? 'Realtime' : 'Paused'}</span>
            </div>
          )}

          <div className="date-picker-container">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="calendar-icon">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <input
              type="date"
              className="date-input"
              value={reportDate}
              onChange={handleDateChange}
              max={todayStr}
            />
          </div>
        </div>
      </header>

      {/* Main content: left summary panel + detailed view */}
      <div className="gunungapi-content">
        <aside className="gunungapi-panel">
          <div className="gunungapi-panel-header">
            <span className="gunungapi-panel-title">Daftar Gunung Api</span>
            <span className="gunungapi-panel-count">{filteredReports.length} wilayah</span>
          </div>

          {/* Real-time Control Card */}
          <div className="realtime-control-card">
            <div className="rtc-header">
              <div className="rtc-title-group">
                <span className={`rtc-status-dot ${isCheckingLive ? 'checking' : isAutoCheckActive && reportDate === todayStr ? 'active' : 'paused'}`} />
                <span className="rtc-title">Monitor Real-time</span>
              </div>
              {reportDate === todayStr ? (
                <label className="rtc-switch" title="Aktifkan pemeriksaan otomatis setiap 30 detik">
                  <input
                    type="checkbox"
                    checked={isAutoCheckActive}
                    onChange={(e) => setIsAutoCheckActive(e.target.checked)}
                  />
                  <span className="rtc-slider" />
                </label>
              ) : (
                <span className="rtc-badge-historical">Histori</span>
              )}
            </div>
            
            <div className="rtc-body">
              <div className="rtc-info-row">
                <span className="rtc-label">Status Koneksi:</span>
                <span className={`rtc-value ${syncStatus === 'success' ? 'status-ok' : syncStatus === 'error' ? 'status-err' : 'status-idle'}`}>
                  {syncStatus === 'success' ? (isMockData ? 'Luring (Fallback)' : 'Terhubung (Live)') : syncStatus === 'error' ? 'Gagal Terhubung' : 'Siap'}
                </span>
              </div>
              
              {lastCheckedAt && (
                <div className="rtc-info-row">
                  <span className="rtc-label">Terakhir Dicek:</span>
                  <span className="rtc-value">{lastCheckedAt.toLocaleTimeString('id-ID')} WIB</span>
                </div>
              )}

              {reportDate !== todayStr && (
                <div className="rtc-warning-text historical">
                  Pemeriksaan otomatis dinonaktifkan karena Anda melihat data historis.
                </div>
              )}
              
              {isMockData && reportDate === todayStr && (
                <div className="rtc-warning-text" style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                  <WarningIcon style={{ fontSize: 14, color: '#d97706', flexShrink: 0 }} />
                  <span>Gagal mengambil data live dari MAGMA (CORS/Sibuk). Menggunakan data simulasi.</span>
                </div>
              )}
            </div>
            
            <button 
              className="rtc-action-btn" 
              onClick={handleManualRefresh}
              disabled={isCheckingLive}
            >
              {isCheckingLive ? (
                <>
                  <span className="rtc-spinner-mini" /> Memeriksa...
                </>
              ) : (
                'Periksa Sekarang'
              )}
            </button>
          </div>

          <div className="gunungapi-panel-scroll">
            {isLoading ? (
              <div className="gunungapi-loading">
                <div className="gunungapi-spinner" />
                <p>Memuat data...</p>
              </div>
            ) : filteredReports.length === 0 ? (
              <div className="gunungapi-empty">
                <p>Tidak ada data gunung api untuk status ini.</p>
              </div>
            ) : (
              filteredReports.map((report) => {
                const isSelected = selectedVolcanoName === report.name;
                const seismicityCount = report.seismicity.reduce((sum, s) => sum + s.count, 0);

                return (
                  <button
                    key={report.name}
                    className={`gunungapi-row ${isSelected ? 'selected' : ''} level-${selectedLevel}`}
                    onClick={() => handleVolcanoSelect(report.name)}
                  >
                    <div className="gunungapi-row-badge">
                      <span>{report.no}</span>
                    </div>
                    <div className="gunungapi-row-info">
                      <span className="gunungapi-volcano-name">{report.name}</span>
                      <span className="gunungapi-volcano-desc">
                        {seismicityCount > 0 ? `${seismicityCount} aktivitas kegempaan` : 'Tidak terdeteksi kegempaan'}
                      </span>
                    </div>
                    <span className="chevron-icon">›</span>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* Detailed Grid / Table */}
        <main className="gunungapi-main">
          {isLoading ? (
            <div className="gunungapi-main-loading">
              <div className="gunungapi-spinner large" />
              <p>Mengunduh Laporan Harian MAGMA Indonesia...</p>
            </div>
          ) : filteredReports.length === 0 ? (
            <div className="gunungapi-main-empty">
              <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3>Tidak ada data laporan harian</h3>
              <p>Silakan ganti tanggal laporan di pojok kanan atas.</p>
            </div>
          ) : (
            <div className="gunungapi-grid">
              <div className="gunungapi-grid-header">
                <h2>Laporan Aktivitas Harian — {currentLevelTab.label}</h2>
                <p className="subtitle">Laporan Pos Pengamatan Gunung Api (PVMBG) pada tanggal {reportDate}</p>
              </div>

              <div className="volcano-cards-container">
                {filteredReports.map((report) => {
                  const isHighlighted = selectedVolcanoName === report.name;
                  return (
                    <div
                      key={report.name}
                      ref={(el) => { volcanoRefs.current[report.name] = el; }}
                      className={`volcano-detail-card ${isHighlighted ? 'highlighted' : ''} border-${selectedLevel}`}
                    >
                      <div className="card-top-row">
                        <div className="volcano-title-group">
                          <span className="volcano-index">#{report.no}</span>
                          <h3>G. {report.name}</h3>
                        </div>
                        <span className={`volcano-level-badge level-${selectedLevel}`}>
                          {LEVEL_TABS.find((t) => t.key === report.level)?.label}
                        </span>
                      </div>

                      <div className="volcano-detail-grid">
                        {/* Visual Column */}
                        <div className="detail-section visual">
                          <div className="section-title">
                            <span className="section-icon">👁️</span>
                            <h4>Kondisi Visual & Cuaca</h4>
                          </div>
                          <div className="section-content">
                            <p>{report.visual}</p>
                          </div>
                        </div>

                        {/* Seismicity Column */}
                        <div className="detail-section kegempaan">
                          <div className="section-title">
                            <span className="section-icon">📈</span>
                            <h4>Aktivitas Kegempaan</h4>
                          </div>
                          <div className="section-content">
                            {report.seismicity.length === 0 ? (
                              <p className="no-data">Tidak ada aktivitas kegempaan yang terekam.</p>
                            ) : (
                              <ul className="seismicity-list">
                                {report.seismicity.map((s, idx) => (
                                  <li key={idx} className="seismicity-item">
                                    <span className="seismicity-count">{s.count}×</span>
                                    <span className="seismicity-type">{s.type}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>

                        {/* Recommendation Column */}
                        <div className="detail-section rekomendasi">
                          <div className="section-title">
                            <span className="section-icon">📋</span>
                            <h4>Rekomendasi Ahli / PVMBG</h4>
                          </div>
                          <div className="section-content">
                            <div className="recommendations-container">
                              {report.recommendation.split('\n').map((rec, idx) => (
                                <p key={idx} className="recommendation-para">
                                  {rec}
                                </p>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default GunungApiScreen;
