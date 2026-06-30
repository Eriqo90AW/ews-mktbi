import React, { useState, useMemo } from 'react';
import type { DisasterAlert, KpwbiOffice } from '../../types';
import { KPWBI_OFFICES } from '../../constants/kpwbiOffices';
import { isOfficeAffectedByAlert } from '../../utils/disasterImpact';
import { haversineDistance } from '../../utils/geo';
import { BnpbInariskService } from '../../services/bnpbInariskService';
import {
  mapAlertToDisasterEvent,
  mapInariskToVulnerability,
  mapDisasterTypeToInariskHazard,
  vulnerabilityToScore,
  getRiskLevel,
} from '../../utils/riskCalculator';
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
  riskLevel: string;
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
          
          let riskLevelStr = '-';
          const event = mapAlertToDisasterEvent(alert);
          if (event) {
            const hazard = mapDisasterTypeToInariskHazard(event.type);
            const index = BnpbInariskService.getLocalHazardIndex(office.id, hazard);
            const vulLevel = mapInariskToVulnerability(index);
            const vulScore = vulnerabilityToScore(vulLevel);
            const rScore = event.disasterScore * vulScore;
            riskLevelStr = getRiskLevel(rScore);
          }

          impactedOffices.push({
            office,
            alert,
            distanceKm,
            riskLevel: riskLevelStr,
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

  const handleExportExcel = () => {
    if (!report) return;

    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">`;
    html += `<head><meta charset="utf-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Disaster Report</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head>`;
    html += `<body>`;
    
    // Title
    html += `<h2>REPORTING DISASTER & KPW IMPACT</h2>`;
    html += `<p><b>Range Waktu:</b> ${startDate.replace('T', ' ')} s.d ${endDate.replace('T', ' ')}</p><br/>`;
    
    // Summary Stats Table
    html += `<h3>SUMMARY STATS</h3>`;
    html += `<table border="1">`;
    html += `<tr><td><b>Total Alerts</b></td><td>${report.totalAlerts}</td></tr>`;
    html += `<tr><td><b>Gempa Bumi</b></td><td>${report.earthquakes}</td></tr>`;
    html += `<tr><td><b>Bencana Lainnya</b></td><td>${report.otherDisasters}</td></tr>`;
    html += `<tr><td><b>Gempa Critical</b></td><td>${report.severityBreakdown.critical}</td></tr>`;
    html += `<tr><td><b>Gempa Warning</b></td><td>${report.severityBreakdown.warning}</td></tr>`;
    html += `<tr><td><b>Gempa Watch</b></td><td>${report.severityBreakdown.watch}</td></tr>`;
    html += `</table><br/>`;

    // KPW Impacted List Table
    html += `<h3>KPW IMPACTED LIST</h3>`;
    html += `<table border="1">`;
    html += `<thead><tr style="background-color: #f2f2f2;">`;
    html += `<th>KPW Office</th><th>City</th><th>Disaster Title</th><th>Type</th><th>Severity</th><th>Tingkat Risiko</th><th>Distance (km)</th><th>Time</th>`;
    html += `</tr></thead><tbody>`;
    report.impactedOffices.forEach(({ office, alert, distanceKm, riskLevel }) => {
      const distanceStr = distanceKm !== null ? distanceKm.toFixed(1) : '-';
      html += `<tr>`;
      html += `<td>${office.name}</td>`;
      html += `<td>${office.city}</td>`;
      html += `<td>${alert.title}</td>`;
      html += `<td>${alert.type}</td>`;
      html += `<td>${alert.severity}</td>`;
      html += `<td>${riskLevel}</td>`;
      html += `<td>${distanceStr}</td>`;
      html += `<td>${new Date(alert.timestamp).toLocaleString('id-ID')}</td>`;
      html += `</tr>`;
    });
    html += `</tbody></table><br/>`;

    // All Disasters List Table
    html += `<h3>ALL DISASTERS LIST</h3>`;
    html += `<table border="1">`;
    html += `<thead><tr style="background-color: #f2f2f2;">`;
    html += `<th>Time</th><th>Disaster Title</th><th>Type</th><th>Severity</th><th>Magnitude</th><th>Depth (km)</th><th>Area</th>`;
    html += `</tr></thead><tbody>`;
    report.allAlertsInRange.forEach((alert) => {
      const magStr = alert.magnitude !== undefined ? alert.magnitude : '-';
      const depthStr = alert.depth !== undefined ? alert.depth : '-';
      html += `<tr>`;
      html += `<td>${new Date(alert.timestamp).toLocaleString('id-ID')}</td>`;
      html += `<td>${alert.title}</td>`;
      html += `<td>${alert.type}</td>`;
      html += `<td>${alert.severity}</td>`;
      html += `<td>${magStr}</td>`;
      html += `<td>${depthStr}</td>`;
      html += `<td>${alert.affectedArea || alert.description || ''}</td>`;
      html += `</tr>`;
    });
    html += `</tbody></table>`;

    html += `</body></html>`;

    const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `disaster_report_${startDate.split('T')[0]}_to_${endDate.split('T')[0]}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
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
                <button className="export-report-btn" onClick={handleExportExcel}>
                  📥 Export to Excel
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
