import React, { useState, useMemo } from 'react';
import type { DisasterAlert, KpwbiOffice } from '../../types';
import { KPWBI_OFFICES } from '../../constants/kpwbiOffices';
import { isOfficeAffectedByAlert } from '../../utils/disasterImpact';
import { haversineDistance } from '../../utils/geo';
import './ReportModal.css';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: DisasterAlert[];
}

interface ImpactedRecord {
  office: KpwbiOffice;
  alert: DisasterAlert;
  distanceKm: number | null;
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, alerts }) => {
  // Set default start date to 7 days ago and end date to now
  const defaultStartDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().slice(0, 16); // format: YYYY-MM-DDTHH:MM
  }, []);

  const defaultEndDate = useMemo(() => {
    return new Date().toISOString().slice(0, 16);
  }, []);

  const [startDate, setStartDate] = useState<string>(defaultStartDate);
  const [endDate, setEndDate] = useState<string>(defaultEndDate);
  const [report, setReport] = useState<{
    totalAlerts: number;
    earthquakes: number;
    otherDisasters: number;
    severityBreakdown: { critical: number; warning: number; watch: number };
    impactedOffices: ImpactedRecord[];
    allAlertsInRange: DisasterAlert[];
  } | null>(null);

  if (!isOpen) return null;

  const generateReportData = (startStr: string, endStr: string) => {
    const start = new Date(startStr).getTime();
    const end = new Date(endStr).getTime();

    // 1. Filter alerts within range
    const filtered = alerts.filter((alert) => {
      const time = new Date(alert.timestamp).getTime();
      return time >= start && time <= end;
    });

    // 2. Counts
    const earthquakes = filtered.filter((a) => a.type === 'earthquake');
    const otherDisasters = filtered.filter((a) => a.type !== 'earthquake');

    const severityBreakdown = earthquakes.reduce(
      (acc, curr) => {
        acc[curr.severity]++;
        return acc;
      },
      { critical: 0, warning: 0, watch: 0 }
    );

    // 3. Find impacted KPW offices
    const impactedOffices: ImpactedRecord[] = [];
    KPWBI_OFFICES.forEach((office) => {
      filtered.forEach((alert) => {
        if (isOfficeAffectedByAlert(office, alert)) {
          const distanceKm =
            alert.latitude !== undefined && alert.longitude !== undefined
              ? haversineDistance(office.latitude, office.longitude, alert.latitude, alert.longitude)
              : null;
          
          impactedOffices.push({
            office,
            alert,
            distanceKm,
          });
        }
      });
    });

    // Sort impacted offices by alert severity, then distance
    const severityOrder = { critical: 3, warning: 2, watch: 1 };
    impactedOffices.sort((a, b) => {
      const sevDiff = (severityOrder[b.alert.severity] || 0) - (severityOrder[a.alert.severity] || 0);
      if (sevDiff !== 0) return sevDiff;
      return (a.distanceKm || 0) - (b.distanceKm || 0);
    });

    // Sort all alerts by timestamp descending (newest first)
    const sortedFiltered = [...filtered].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    setReport({
      totalAlerts: filtered.length,
      earthquakes: earthquakes.length,
      otherDisasters: otherDisasters.length,
      severityBreakdown,
      impactedOffices,
      allAlertsInRange: sortedFiltered,
    });
  };

  const handleGenerateReport = () => {
    generateReportData(startDate, endDate);
  };

  const handleQuickPick = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);

    const startStr = start.toISOString().slice(0, 16);
    const endStr = end.toISOString().slice(0, 16);

    setStartDate(startStr);
    setEndDate(endStr);

    generateReportData(startStr, endStr);
  };

  const handleExportCSV = () => {
    if (!report) return;

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'REPORTING DISASTER & KPW IMPACT\n';
    csvContent += `Range Waktu: ${startDate.replace('T', ' ')} s.d ${endDate.replace('T', ' ')}\n\n`;
    csvContent += 'SUMMARY STATS\n';
    csvContent += `Total Alerts,${report.totalAlerts}\n`;
    csvContent += `Gempa Bumi,${report.earthquakes}\n`;
    csvContent += `Bencana Lainnya,${report.otherDisasters}\n`;
    csvContent += `Gempa Critical,${report.severityBreakdown.critical}\n`;
    csvContent += `Gempa Warning,${report.severityBreakdown.warning}\n`;
    csvContent += `Gempa Watch,${report.severityBreakdown.watch}\n\n`;

    csvContent += 'KPW IMPACTED LIST\n';
    csvContent += 'KPW Office,City,Disaster Title,Type,Severity,Distance (km),Time\n';

    report.impactedOffices.forEach(({ office, alert, distanceKm }) => {
      const distanceStr = distanceKm !== null ? distanceKm.toFixed(1) : '-';
      const formattedTitle = alert.title.replace(/"/g, '""');
      csvContent += `"${office.name}","${office.city}","${formattedTitle}","${alert.type}","${alert.severity}",${distanceStr},"${new Date(alert.timestamp).toLocaleString('id-ID')}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `disaster_report_${startDate.split('T')[0]}_to_${endDate.split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="report-modal-overlay" onClick={onClose}>
      <div className="report-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="report-modal-header">
          <div className="report-modal-title-area">
            <span className="report-modal-icon">📊</span>
            <h2>Disaster & KPW Impact Reporting</h2>
          </div>
          <button className="report-modal-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        {/* Inputs Section */}
        <div className="report-modal-inputs">
          <div className="inputs-row">
            <div className="input-group">
              <label>Waktu Mulai (Start Time)</label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>Waktu Selesai (End Time)</label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <button className="generate-report-btn" onClick={handleGenerateReport}>
              Generate Report
            </button>
          </div>
          
          <div className="quick-picks-row">
            <span className="quick-picks-label">Quick Pick:</span>
            <button className="quick-pick-btn" onClick={() => handleQuickPick(7)}>Last Week</button>
            <button className="quick-pick-btn" onClick={() => handleQuickPick(365)}>Last Year</button>
            <button className="quick-pick-btn" onClick={() => handleQuickPick(365 * 3)}>Last 3Y</button>
            <button className="quick-pick-btn" onClick={() => handleQuickPick(365 * 5)}>Last 5Y</button>
          </div>
        </div>

        {/* Results Area */}
        <div className="report-modal-results">
          {report ? (
            <div className="report-container">
              {/* Export Button */}
              <div className="report-export-row">
                <h3>Hasil Laporan</h3>
                <button className="export-report-btn" onClick={handleExportCSV}>
                  📥 Export to CSV
                </button>
              </div>

              {/* Grid Summary */}
              <div className="report-summary-grid">
                <div className="summary-card">
                  <div className="summary-val">{report.totalAlerts}</div>
                  <div className="summary-lbl">Total Kejadian</div>
                </div>
                <div className="summary-card">
                  <div className="summary-val">{report.earthquakes}</div>
                  <div className="summary-lbl">Gempa Bumi</div>
                </div>
                <div className="summary-card">
                  <div className="summary-val">{report.otherDisasters}</div>
                  <div className="summary-lbl">Bencana Lainnya</div>
                </div>
              </div>

              {/* Earthquake Severity Breakdown */}
              {report.earthquakes > 0 && (
                <div className="severity-breakdown-section">
                  <h4>Tingkat Keparahan Gempa (Earthquake Severity)</h4>
                  <div className="severity-bar-container">
                    <div className="severity-segment critical" style={{ flex: report.severityBreakdown.critical || 1 }}>
                      Critical: {report.severityBreakdown.critical}
                    </div>
                    <div className="severity-segment warning" style={{ flex: report.severityBreakdown.warning || 1 }}>
                      Warning: {report.severityBreakdown.warning}
                    </div>
                    <div className="severity-segment watch" style={{ flex: report.severityBreakdown.watch || 1 }}>
                      Watch: {report.severityBreakdown.watch}
                    </div>
                  </div>
                </div>
              )}

              {/* Impacted KPW Offices List */}
              <div className="impacted-offices-section">
                <h4>KPwBI Terdampak (Geographically Impacted Offices)</h4>
                {report.impactedOffices.length > 0 ? (
                  <div className="report-table-wrapper">
                    <table className="report-table">
                      <thead>
                        <tr>
                          <th>Kantor Perwakilan</th>
                          <th>Kota</th>
                          <th>Disaster</th>
                          <th>Tingkat</th>
                          <th>Jarak Epicenter</th>
                          <th>Waktu</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.impactedOffices.map(({ office, alert, distanceKm }, idx) => (
                          <tr key={`${office.id}-${alert.id}-${idx}`}>
                            <td className="font-semibold">{office.name}</td>
                            <td>{office.city}</td>
                            <td>
                              <span className="disaster-tag font-semibold">
                                {alert.type === 'earthquake' ? '🌋 ' : alert.type === 'extreme_weather' ? '⚡ ' : alert.type === 'karhutla' ? '🔥 ' : '⚠️ '}
                                {alert.title}
                              </span>
                            </td>
                            <td>
                              <span className={`severity-tag ${alert.severity}`}>
                                {alert.severity.toUpperCase()}
                              </span>
                            </td>
                            <td className="font-semibold">
                              {distanceKm !== null ? `${distanceKm.toFixed(1)} km` : '-'}
                            </td>
                            <td className="time-col">
                              {new Date(alert.timestamp).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                              })}{' '}
                              {new Date(alert.timestamp).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-report-state">
                    ✅ Tidak ada Kantor Perwakilan (KPW) Bank Indonesia yang terdampak radius kebencanaan pada periode ini.
                  </div>
                )}
              </div>

              {/* List of All Disasters / Earthquakes in Period */}
              <div className="all-disasters-section">
                <h4>Daftar Kejadian Gempa Bumi & Bencana (Disaster Incidents List)</h4>
                {report.allAlertsInRange.length > 0 ? (
                  <div className="report-table-wrapper">
                    <table className="report-table">
                      <thead>
                        <tr>
                          <th>Waktu</th>
                          <th>Judul Bencana</th>
                          <th>Tipe</th>
                          <th>Tingkat Keparahan</th>
                          <th style={{ textAlign: 'center' }}>Kekuatan</th>
                          <th>Kedalaman</th>
                          <th>Area / Wilayah</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.allAlertsInRange.map((alert) => (
                          <tr key={alert.id}>
                            <td className="time-col">
                              {new Date(alert.timestamp).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}{' '}
                              {new Date(alert.timestamp).toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="font-semibold">{alert.title}</td>
                            <td style={{ textTransform: 'capitalize' }}>{alert.type}</td>
                            <td>
                              <span className={`severity-tag ${alert.severity}`}>
                                {alert.severity.toUpperCase()}
                              </span>
                            </td>
                            <td className="font-semibold" style={{ textAlign: 'center' }}>
                              {alert.magnitude !== undefined ? `${alert.magnitude} M` : '-'}
                            </td>
                            <td>
                              {alert.depth !== undefined ? `${alert.depth} km` : '-'}
                            </td>
                            <td>{alert.affectedArea || alert.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="empty-report-state">
                    Tidak ada kejadian bencana dalam periode ini.
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="report-prompt">
              Silakan pilih range waktu di atas dan klik <strong>Generate Report</strong> untuk menampilkan statistik dampak bencana.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportModal;
