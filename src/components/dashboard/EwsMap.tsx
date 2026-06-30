import React, { useEffect, useRef, useMemo, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, Polyline } from 'react-leaflet';
import L from 'leaflet';
import type { DisasterAlert, DisasterType } from '../../types';
import { PROVINCES } from '../../constants/provinces';
import { KPWBI_OFFICES } from '../../constants/kpwbiOffices';
import { findNearestOfficesByProvince } from '../../utils/geo';
import { mapTextToProvinceId } from '../../utils/provinceMap';
import { BnpbInariskService } from '../../services/bnpbInariskService';
import MapController from './map/MapController';
import MapEventsHandler from './map/MapEventsHandler';
import AlertCircles from './map/AlertCircles';
import KpwMarkers from './map/KpwMarkers';
import DrcMarkers from './map/DrcMarkers';
import NearestKpwPanel from './map/NearestKpwPanel';
import MapLegend from './map/MapLegend';
import 'leaflet/dist/leaflet.css';
import './EwsMap.css';

export interface EwsMapProps {
  alerts: DisasterAlert[];
  riskResults?: import('../../types').RiskCalcResult[];
  selectedProvinceId: string | null;
  selectedAlertId: string | null;
  onProvinceSelect: (provinceId: string) => void;
  onAlertSelect: (alertId: string) => void;
  activeTypeFilter?: DisasterType | 'all' | any;
  isSidebarCollapsed?: boolean;
  isKerentananView?: boolean;
  isPotensiView?: boolean;
}

const INDONESIA_CENTER: [number, number] = [-2.5489, 118.0149];
const INARISK_TYPES = ['flood', 'tsunami', 'kekeringan', 'volcanic'];
const POTENSI_TYPES = ['gempa', 'karhutla', 'cuaca', 'pasang'];

function getProvinceRisk(provinceId: string, hazard: 'flood' | 'tsunami' | 'kekeringan' | 'volcanic'): number {
  return KPWBI_OFFICES.filter((o) => o.provinceId === provinceId).reduce((max, o) => {
    const idx = BnpbInariskService.getLocalHazardIndex(o.id, hazard);
    return idx > max ? idx : max;
  }, 0);
}

function getProvincePotensi(provinceId: string, hazard: 'gempa' | 'karhutla' | 'cuaca' | 'pasang'): number {
  return KPWBI_OFFICES.filter((o) => o.provinceId === provinceId).reduce((max, o) => {
    const idx = BnpbInariskService.getLocalPotensiIndex(o.id, hazard);
    return idx > max ? idx : max;
  }, 0);
}

export const EwsMap: React.FC<EwsMapProps> = ({
  alerts,
  riskResults = [],
  selectedProvinceId,
  selectedAlertId,
  onProvinceSelect,
  onAlertSelect,
  activeTypeFilter = 'all',
  isSidebarCollapsed = false,
  isKerentananView = false,
  isPotensiView = false,
}) => {
  const [resetTrigger, setResetTrigger] = useState(0);
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const markerRefs = useRef<Record<string, L.Marker | null>>({});

  const [mapLayers, setMapLayers] = useState({
    kp: true,
    korwil: true,
    normal: true,
    nearest: true,
    drc: true,
    critical: true,
    warning: true,
    watch: true,
  });

  const toggleLayer = (layerKey: keyof typeof mapLayers) => {
    setMapLayers((prev) => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  useEffect(() => {
    fetch('/indonesia-provinces.json')
      .then((res) => res.json())
      .then((data) => setGeoJsonData(data))
      .catch((err) => console.error('Failed to load province GeoJSON:', err));
  }, []);

  const isInariskFilter = isKerentananView && INARISK_TYPES.includes(activeTypeFilter);
  const isPotensiFilter = isPotensiView && POTENSI_TYPES.includes(activeTypeFilter);

  const getGeoJsonStyle = (feature: any) => {
    if (!isInariskFilter && !isPotensiFilter) {
      return { fillColor: 'transparent', fillOpacity: 0, color: 'transparent', weight: 0, bubblingMouseEvents: false };
    }
    const provinceId = mapTextToProvinceId(feature.properties.Propinsi || '');
    
    let score = 0;
    if (isInariskFilter) {
      const hazard = activeTypeFilter as 'flood' | 'tsunami' | 'kekeringan' | 'volcanic';
      score = getProvinceRisk(provinceId, hazard);
    } else {
      const hazard = activeTypeFilter as 'gempa' | 'karhutla' | 'cuaca' | 'pasang';
      score = getProvincePotensi(provinceId, hazard);
    }

    if (score > 0.6) {
      return { fillColor: isPotensiFilter ? '#f97316' : '#dc2626', fillOpacity: 0.35, color: isPotensiFilter ? '#c2410c' : '#b91c1c', weight: 1.5, bubblingMouseEvents: false };
    }
    if (score > 0.3) {
      return { fillColor: isPotensiFilter ? '#fbbf24' : '#ea580c', fillOpacity: 0.3, color: isPotensiFilter ? '#d97706' : '#c2410c', weight: 1.5, bubblingMouseEvents: false };
    }
    if (score > 0) {
      return { fillColor: isPotensiFilter ? '#10b981' : '#0ea5e9', fillOpacity: 0.2, color: isPotensiFilter ? '#059669' : '#0284c7', weight: 1.2, bubblingMouseEvents: false };
    }
    return { fillColor: 'transparent', fillOpacity: 0, color: 'rgba(0,0,0,0.12)', weight: 0.8, bubblingMouseEvents: false };
  };

  const onEachFeature = (feature: any, layer: L.Layer) => {
    const propName = feature.properties.Propinsi || '';
    const provinceId = mapTextToProvinceId(propName);
    
    let score = 0;
    let hazardTitle = '';
    
    if (isInariskFilter) {
      const hazard = activeTypeFilter as 'flood' | 'tsunami' | 'kekeringan' | 'volcanic';
      score = getProvinceRisk(provinceId, hazard);
      hazardTitle = { flood: 'Banjir', tsunami: 'Tsunami', kekeringan: 'Kekeringan', volcanic: 'Gunung Api' }[hazard] ?? hazard;
    } else if (isPotensiFilter) {
      const hazard = activeTypeFilter as 'gempa' | 'karhutla' | 'cuaca' | 'pasang';
      score = getProvincePotensi(provinceId, hazard);
      hazardTitle = { gempa: 'Gempa Bumi', karhutla: 'Kebakaran Hutan', cuaca: 'Cuaca Ekstrim', pasang: 'Gelombang Pasang' }[hazard] ?? hazard;
    } else {
      return;
    }

    const severity = score > 0.6 ? 'Tinggi' : score > 0.3 ? 'Sedang' : score > 0 ? 'Rendah' : 'Aman';
    const statusColor = score > 0.6 ? 'var(--alert-critical)' : score > 0.3 ? 'var(--alert-warning)' : 'var(--alert-watch)';

    layer.bindTooltip(`
      <div style="font-family: var(--font-sans); font-size: 12px; line-height: 1.4; padding: 4px;">
        <strong>Provinsi ${propName}</strong><br/>
        Indeks ${isPotensiView ? 'Potensi' : 'Kerentanan'} ${hazardTitle}: <strong>${score > 0 ? score.toFixed(2) : '0.00'}</strong><br/>
        Status: <span style="font-weight: 700; color: ${statusColor}">${severity}</span>
      </div>
    `, { sticky: true });
  };

  const selectedOffice = KPWBI_OFFICES.find((o) => o.provinceId === selectedProvinceId) ?? null;
  const selectedAlert = alerts.find((a) => a.id === selectedAlertId) ?? null;

  const visibleAlerts = useMemo(() => {
    if (selectedAlertId) {
      return alerts.filter((alert) => alert.id === selectedAlertId);
    }
    return alerts.filter((alert) => {
      // Filter by computed riskLevel, not raw alert.severity
      const res = riskResults.find((r) => r.event.id === alert.id);
      const riskLevel = res?.riskLevel ?? 'Rendah';
      if (riskLevel === 'Tinggi'  && !mapLayers.critical) return false;
      if (riskLevel === 'Sedang'  && !mapLayers.warning)  return false;
      if (riskLevel === 'Rendah'  && !mapLayers.watch)    return false;
      return true;
    });
  }, [alerts, riskResults, selectedAlertId, mapLayers.critical, mapLayers.warning, mapLayers.watch]);

  const nearestOffices = useMemo(() => {
    if (!selectedOffice || !mapLayers.nearest) return [];
    return findNearestOfficesByProvince(selectedOffice, KPWBI_OFFICES, PROVINCES, 3);
  }, [selectedOffice, mapLayers.nearest]);

  // Open the relevant marker popup when the selection changes
  useEffect(() => {
    const targetProvinceId = selectedAlert?.provinceId ?? selectedProvinceId;
    if (!targetProvinceId) return;
    const office = KPWBI_OFFICES.find((o) => o.provinceId === targetProvinceId);
    if (!office) return;
    const marker = markerRefs.current[office.id];
    if (marker) setTimeout(() => marker.openPopup(), 100);
  }, [selectedAlert, selectedProvinceId]);

  const clearSelection = () => { onAlertSelect(''); onProvinceSelect(''); };

  return (
    <div className="map-wrapper">
      <button
        className="map-reset-btn"
        title="Reset Map View"
        onClick={() => { clearSelection(); setResetTrigger((n) => n + 1); }}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
          <path d="M3 3v5h5"></path>
        </svg>
      </button>

      <MapContainer center={INDONESIA_CENTER} zoom={5} className="map-container-element" zoomControl minZoom={4} maxZoom={18}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {isInariskFilter && geoJsonData && (
          <GeoJSON
            key={`${activeTypeFilter}-${resetTrigger}`}
            data={geoJsonData}
            style={getGeoJsonStyle}
            onEachFeature={onEachFeature}
          />
        )}

        <MapController
          selectedOffice={selectedOffice}
          selectedAlert={selectedAlert}
          resetTrigger={resetTrigger}
          isSidebarCollapsed={isSidebarCollapsed}
        />
        <MapEventsHandler onClearSelection={clearSelection} />

        {selectedOffice && nearestOffices.map(({ office }) => (
          <Polyline
            key={`line-${selectedOffice.id}-${office.id}`}
            positions={[[selectedOffice.latitude, selectedOffice.longitude], [office.latitude, office.longitude]]}
            pathOptions={{ color: '#0ea5e9', weight: 2, dashArray: '6, 6', opacity: 0.8 }}
          />
        ))}

        <AlertCircles alerts={visibleAlerts} onAlertSelect={onAlertSelect} />

        <KpwMarkers
          alerts={visibleAlerts}
          riskResults={riskResults}
          activeTypeFilter={activeTypeFilter}
          selectedProvinceId={selectedProvinceId}
          nearestOffices={nearestOffices}
          onProvinceSelect={onProvinceSelect}
          markerRefs={markerRefs}
          mapLayers={mapLayers}
          selectedAlertId={selectedAlertId}
        />

        {mapLayers.drc && <DrcMarkers selectedAlert={selectedAlert} riskResults={riskResults} />}
      </MapContainer>

      <NearestKpwPanel
        selectedOffice={selectedOffice}
        nearestOffices={nearestOffices}
        alerts={alerts}
        onAlertSelect={onAlertSelect}
        onProvinceSelect={onProvinceSelect}
      />

      <MapLegend
        isInariskFilter={isInariskFilter}
        mapLayers={mapLayers}
        onToggleLayer={toggleLayer}
        selectedAlert={selectedAlert}
        riskResults={riskResults}
      />
    </div>
  );
};

export default EwsMap;
