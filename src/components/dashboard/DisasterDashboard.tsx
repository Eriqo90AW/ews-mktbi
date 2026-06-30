import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useAlerts } from '../../hooks/useAlerts';
import { useDisasterAlert } from '../../hooks/useDisasterAlert';
import type { AlertSeverity, DisasterType } from '../../types';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import EwsMap from './EwsMap';
import ReportModal from './ReportModal';
import AlertToast from '../ui/AlertToast';
import type { ToastItem } from '../ui/AlertToast';
import DisasterAlertBanner from '../ui/DisasterAlertBanner';
import './DisasterDashboard.css';

interface DisasterDashboardProps {
  onSwitchToKerentanan: () => void;
  onSwitchToPerkiraan: () => void;
}

export const DisasterDashboard: React.FC<DisasterDashboardProps> = ({
  onSwitchToKerentanan,
  onSwitchToPerkiraan
}) => {
  const { alerts, isLoading } = useAlerts();
  const { activeAlerts, riskResults } = useDisasterAlert();

  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<DisasterType | 'all'>('all');

  const [selectedProvinceId, setSelectedProvinceId] = useState<string | null>(null);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const shownAlertIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (isLoading) return;
    const unseen = activeAlerts.filter(
      (calc) => !shownAlertIds.current.has(calc.event.id)
    );
    unseen.forEach((calc) => shownAlertIds.current.add(calc.event.id));
    if (unseen.length === 0) return;
    // Show max 4; stagger by 350 ms so they don't all pop at once
    unseen.slice(0, 4).forEach((calc, i) => {
      const alert = alerts.find((a) => a.id === calc.event.id);
      if (!alert) return;
      setTimeout(() => {
        setToasts((prev) => [
          ...prev,
          { toastId: `${alert.id}-${Date.now()}`, alert },
        ]);
      }, i * 350);
    });
  }, [activeAlerts, alerts, isLoading]);

  const dismissToast = useCallback((toastId: string) => {
    setToasts((prev) => prev.filter((t) => t.toastId !== toastId));
  }, []);

  // Rolling 3-day window — alerts older than this are excluded
  const threeDaysAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 3);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, []);

  const calculatedCriticalAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (a.isForecast) return false;
      if (new Date(a.timestamp).getTime() < threeDaysAgo) return false;
      if (typeFilter !== 'all' && a.type !== typeFilter) return false;
      const riskRes = riskResults.find((r) => r.event.id === a.id);
      return riskRes && riskRes.riskLevel === 'Tinggi';
    });
  }, [alerts, riskResults, typeFilter, threeDaysAgo]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (a.isForecast) return false;
      if (new Date(a.timestamp).getTime() < threeDaysAgo) return false;

      const riskRes = riskResults.find((r) => r.event.id === a.id);
      if (!riskRes) return false;

      if (severityFilter !== 'all') {
        const mappedRiskLevel = { critical: 'Tinggi', warning: 'Sedang', watch: 'Rendah' }[severityFilter];
        if (riskRes.riskLevel !== mappedRiskLevel) return false;
      }

      if (typeFilter !== 'all' && a.type !== typeFilter) return false;
      return true;
    });
  }, [alerts, riskResults, severityFilter, typeFilter, threeDaysAgo]);

  const filteredStats = useMemo(() => {
    const stats = { critical: 0, warning: 0, watch: 0, total: 0 };

    alerts.forEach((a) => {
      if (a.isForecast) return;
      if (new Date(a.timestamp).getTime() < threeDaysAgo) return;
      if (typeFilter !== 'all' && a.type !== typeFilter) return;

      const riskRes = riskResults.find((r) => r.event.id === a.id);
      if (riskRes) {
        if (riskRes.riskLevel === 'Tinggi') stats.critical++;
        else if (riskRes.riskLevel === 'Sedang') stats.warning++;
        else if (riskRes.riskLevel === 'Rendah') stats.watch++;
        stats.total++;
      }
    });

    if (severityFilter !== 'all') {
      const activeVal = stats[severityFilter];
      stats.critical = 0; stats.warning = 0; stats.watch = 0;
      stats.total = activeVal;
      stats[severityFilter] = activeVal;
    }

    return stats;
  }, [alerts, riskResults, severityFilter, typeFilter, threeDaysAgo]);

  const handleProvinceSelect = (provinceId: string) => {
    setSelectedProvinceId(provinceId);
    setSelectedAlertId(null);
  };

  const handleAlertSelect = (alertId: string) => {
    setSelectedAlertId(alertId);
    const alert = alerts.find((a) => a.id === alertId);
    if (alert) setSelectedProvinceId(alert.provinceId);
  };

  return (
    <div className="dashboard-container">
      <DisasterAlertBanner activeAlerts={activeAlerts} />
      <TopBar
        criticalCount={filteredStats.critical}
        totalAlerts={filteredAlerts.length}
        criticalAlerts={calculatedCriticalAlerts}
        allAlerts={filteredAlerts}
        riskResults={riskResults}
        onAlertSelect={handleAlertSelect}
        onGenerateReport={() => setIsReportOpen(true)}
        selectedType={typeFilter}
        onTypeChange={setTypeFilter}
        onSwitchToKerentanan={onSwitchToKerentanan}
        onSwitchToPerkiraan={onSwitchToPerkiraan}
      />

      <div className="dashboard-content">
        <Sidebar
          filteredAlerts={filteredAlerts}
          riskResults={riskResults}
          stats={filteredStats}
          selectedProvinceId={selectedProvinceId}
          onProvinceSelect={handleProvinceSelect}
          selectedAlertId={selectedAlertId}
          onAlertSelect={handleAlertSelect}
          severityFilter={severityFilter}
          setSeverityFilter={setSeverityFilter}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          isLoading={isLoading}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((c) => !c)}
        />

        <EwsMap
          alerts={filteredAlerts}
          riskResults={riskResults}
          selectedProvinceId={selectedProvinceId}
          selectedAlertId={selectedAlertId}
          onProvinceSelect={handleProvinceSelect}
          onAlertSelect={handleAlertSelect}
          activeTypeFilter={typeFilter}
          isSidebarCollapsed={isSidebarCollapsed}
        />
      </div>

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        alerts={alerts}
      />

      <AlertToast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export default DisasterDashboard;
