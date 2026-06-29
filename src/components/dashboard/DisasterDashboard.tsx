import React, { useState, useMemo } from 'react';
import { useAlerts } from '../../hooks/useAlerts';
import type { AlertSeverity, DisasterType } from '../../types';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import EwsMap from './EwsMap';
import ReportModal from './ReportModal';
import './DisasterDashboard.css';

export const DisasterDashboard: React.FC = () => {
  const {
    alerts,
    stats,
    isLoading,
    getFilteredAlerts,
  } = useAlerts();

  // Filters State
  const [severityFilter, setSeverityFilter] = useState<AlertSeverity | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<DisasterType | 'all'>('all');
  const [weatherTab, setWeatherTab] = useState<'nowcast' | 'day1' | 'day2' | 'day3'>('nowcast');

  // Selection State
  const [selectedProvinceId, setSelectedProvinceId] = useState<string | null>(null);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);

  // Extract forecast dates from alerts
  const forecastDates = useMemo(() => {
    const dates = { day1: 'Hari 1', day2: 'Hari 2', day3: 'Hari 3' };
    alerts.forEach((a) => {
      if (a.isForecast) {
        if (a.forecastDay === 1 && a.forecastDateStr) dates.day1 = a.forecastDateStr;
        if (a.forecastDay === 2 && a.forecastDateStr) dates.day2 = a.forecastDateStr;
        if (a.forecastDay === 3 && a.forecastDateStr) dates.day3 = a.forecastDateStr;
      }
    });
    return dates;
  }, [alerts]);

  // Compute active alerts based on selection and filters
  const filteredAlerts = useMemo(() => {
    let list = getFilteredAlerts(severityFilter, typeFilter);

    // Apply forecast filters
    if (typeFilter === 'all') {
      // In general view, hide 3-day forecast items to prevent map/list clutter
      list = list.filter((a) => !a.isForecast);
    } else if (typeFilter === 'extreme_weather') {
      if (weatherTab === 'nowcast') {
        list = list.filter((a) => !a.isForecast);
      } else if (weatherTab === 'day1') {
        list = list.filter((a) => a.isForecast && a.forecastDay === 1);
      } else if (weatherTab === 'day2') {
        list = list.filter((a) => a.isForecast && a.forecastDay === 2);
      } else if (weatherTab === 'day3') {
        list = list.filter((a) => a.isForecast && a.forecastDay === 3);
      }
    }

    return list;
  }, [getFilteredAlerts, severityFilter, typeFilter, weatherTab]);

  // Handle province selection (sidebar quick-jump or map marker click)
  const handleProvinceSelect = (provinceId: string) => {
    setSelectedProvinceId(provinceId);
    setSelectedAlertId(null); // Clear selected alert if direct province clicked

    // If province has an active alert, select it automatically
    const provinceAlert = filteredAlerts.find((a) => a.provinceId === provinceId);
    if (provinceAlert) {
      setSelectedAlertId(provinceAlert.id);
    }
  };

  // Handle alert selection (sidebar alert list click or map marker click)
  const handleAlertSelect = (alertId: string) => {
    setSelectedAlertId(alertId);
    
    // Set associated province ID
    const alert = alerts.find((a) => a.id === alertId);
    if (alert) {
      setSelectedProvinceId(alert.provinceId);
    }
  };

  return (
    <div className="dashboard-container">
      <TopBar
        criticalCount={stats.critical}
        totalAlerts={alerts.length}
        onGenerateReport={() => setIsReportOpen(true)}
        selectedType={typeFilter}
        onTypeChange={(type) => {
          setTypeFilter(type);
          // Auto reset to nowcast tab when switching disaster type
          setWeatherTab('nowcast');
        }}
      />

      {typeFilter === 'extreme_weather' && (
        <div className="weather-tab-selector">
          <button 
            className={`weather-tab-btn ${weatherTab === 'nowcast' ? 'active' : ''}`}
            onClick={() => setWeatherTab('nowcast')}
          >
            🚨 Nowcast (Peringatan Dini)
          </button>
          <button 
            className={`weather-tab-btn ${weatherTab === 'day1' ? 'active' : ''}`}
            onClick={() => setWeatherTab('day1')}
          >
            📅 Hari 1: {forecastDates.day1}
          </button>
          <button 
            className={`weather-tab-btn ${weatherTab === 'day2' ? 'active' : ''}`}
            onClick={() => setWeatherTab('day2')}
          >
            📅 Hari 2: {forecastDates.day2}
          </button>
          <button 
            className={`weather-tab-btn ${weatherTab === 'day3' ? 'active' : ''}`}
            onClick={() => setWeatherTab('day3')}
          >
            📅 Hari 3: {forecastDates.day3}
          </button>
        </div>
      )}
      
      <div className="dashboard-content">
        <Sidebar
          alerts={alerts}
          filteredAlerts={filteredAlerts}
          stats={stats}
          selectedProvinceId={selectedProvinceId}
          onProvinceSelect={handleProvinceSelect}
          selectedAlertId={selectedAlertId}
          onAlertSelect={handleAlertSelect}
          severityFilter={severityFilter}
          setSeverityFilter={setSeverityFilter}
          typeFilter={typeFilter}
          setTypeFilter={setTypeFilter}
          isLoading={isLoading}
        />
        
        <EwsMap
          alerts={filteredAlerts}
          selectedProvinceId={selectedProvinceId}
          selectedAlertId={selectedAlertId}
          onProvinceSelect={handleProvinceSelect}
          onAlertSelect={handleAlertSelect}
          activeTypeFilter={typeFilter}
        />
      </div>

      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        alerts={alerts}
      />
    </div>
  );
};

export default DisasterDashboard;
