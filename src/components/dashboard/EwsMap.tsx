import React, { useEffect, useRef, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, useMap, Polyline, Circle, GeoJSON, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import type { DisasterAlert, KpwbiOffice, DisasterType, AlertSeverity } from '../../types';
import { PROVINCES } from '../../constants/provinces';
import { KPWBI_OFFICES } from '../../constants/kpwbiOffices';
import { DRC_LOCATIONS } from '../../constants/drcLocations';
import { findNearestOfficesByProvince } from '../../utils/nearestKpw';
import { isOfficeAffectedByAlert } from '../../utils/disasterImpact';
import { BnpbInariskService } from '../../services/bnpbInariskService';
import { mapTextToProvinceId } from '../../services/bmkgService';
import 'leaflet/dist/leaflet.css';
import './EwsMap.css';


interface EwsMapProps {
  alerts: DisasterAlert[];
  selectedProvinceId: string | null;
  selectedAlertId: string | null;
  onProvinceSelect: (provinceId: string) => void;
  onAlertSelect: (alertId: string) => void;
  activeTypeFilter?: DisasterType | 'all';
}

const isValidCoord = (lat?: any, lng?: any): boolean => {
  if (lat == null || lng == null) return false;
  if (typeof lat === 'string' && lat.trim() === '') return false;
  if (typeof lng === 'string' && lng.trim() === '') return false;
  const numLat = Number(lat);
  const numLng = Number(lng);
  return !isNaN(numLat) && !isNaN(numLng);
};

// Controller component to programmatically pan/zoom the Leaflet map
interface MapControllerProps {
  selectedOffice: KpwbiOffice | null;
  selectedAlert: DisasterAlert | null;
  resetTrigger?: number;
}

const MapController: React.FC<MapControllerProps> = ({ selectedOffice, selectedAlert, resetTrigger }) => {
  const map = useMap();
  const prevResetTrigger = useRef(resetTrigger);

  useEffect(() => {
    try {
      if (resetTrigger !== prevResetTrigger.current) {
        prevResetTrigger.current = resetTrigger;
        map.flyTo([-2.5489, 118.0149], 5, { duration: 1.5, animate: true });
        return;
      }

      if (selectedAlert) {
        if (isValidCoord(selectedAlert.latitude, selectedAlert.longitude)) {
          const lat = Number(selectedAlert.latitude);
          const lng = Number(selectedAlert.longitude);
          if (isNaN(lat) || isNaN(lng)) {
            console.error("NaN detected despite isValidCoord true:", selectedAlert);
          } else {
            map.flyTo([lat, lng], 9, { duration: 1.5, animate: true });
          }
        } else {
          const office = KPWBI_OFFICES.find((o) => o.provinceId === selectedAlert.provinceId);
          if (office && isValidCoord(office.latitude, office.longitude)) {
            map.flyTo([Number(office.latitude), Number(office.longitude)], 9, { duration: 1.5, animate: true });
          } else {
            console.warn("No valid office found for alert province fallback:", selectedAlert);
          }
        }
      } else if (selectedOffice) {
        if (isValidCoord(selectedOffice.latitude, selectedOffice.longitude)) {
          map.flyTo([Number(selectedOffice.latitude), Number(selectedOffice.longitude)], 9, { duration: 1.5, animate: true });
        } else {
          console.warn("Selected office has invalid coords:", selectedOffice);
        }
      } else {
        map.flyTo([-2.5489, 118.0149], 5, { duration: 1.5, animate: true });
      }
    } catch (err) {
      console.error("MapController flyTo Error:", err, { selectedAlert, selectedOffice });
    }
  }, [selectedOffice, selectedAlert, resetTrigger, map]);

  return null;
};

// Component to handle map clicks (clicking away on the map background to clear selection)
const MapEventsHandler: React.FC<{ onClearSelection: () => void }> = ({ onClearSelection }) => {
  useMapEvents({
    click: () => {
      onClearSelection();
    }
  });
  return null;
};

export const EwsMap: React.FC<EwsMapProps> = ({
  alerts,
  selectedProvinceId,
  selectedAlertId,
  onProvinceSelect,
  onAlertSelect,
  activeTypeFilter = 'all',
}) => {
  const [resetTrigger, setResetTrigger] = useState(0);
  const [geoJsonData, setGeoJsonData] = useState<any>(null);

  useEffect(() => {
    fetch('/indonesia-provinces.json')
      .then((res) => res.json())
      .then((data) => setGeoJsonData(data))
      .catch((err) => console.error('Failed to load province GeoJSON:', err));
  }, []);

  const isInariskFilter = activeTypeFilter && ['flood', 'tsunami', 'kekeringan', 'volcanic'].includes(activeTypeFilter);

  // Helper to find maximum hazard index across all offices in a province
  const getProvinceRisk = (provinceId: string, hazard: 'flood' | 'tsunami' | 'kekeringan' | 'volcanic'): number => {
    const provinceOffices = KPWBI_OFFICES.filter(o => o.provinceId === provinceId);
    if (provinceOffices.length === 0) return 0;
    
    let maxIndex = 0;
    provinceOffices.forEach(o => {
      const idx = BnpbInariskService.getLocalHazardIndex(o.id, hazard);
      if (idx > maxIndex) {
        maxIndex = idx;
      }
    });
    return maxIndex;
  };

  const getGeoJsonStyle = (feature: any) => {
    if (!isInariskFilter) {
      return {
        fillColor: 'transparent',
        fillOpacity: 0,
        color: 'transparent',
        weight: 0,
        bubblingMouseEvents: false
      };
    }
    
    const hazard = activeTypeFilter as 'flood' | 'tsunami' | 'kekeringan' | 'volcanic';
    const propName = feature.properties.Propinsi || '';
    const provinceId = mapTextToProvinceId(propName);
    const riskVal = getProvinceRisk(provinceId, hazard);
    
    if (riskVal > 0.6) {
      return {
        fillColor: '#dc2626', // Red
        fillOpacity: 0.35,
        color: '#b91c1c',
        weight: 1.5,
        bubblingMouseEvents: false
      };
    } else if (riskVal > 0.3) {
      return {
        fillColor: '#ea580c', // Orange
        fillOpacity: 0.3,
        color: '#c2410c',
        weight: 1.5,
        bubblingMouseEvents: false
      };
    } else if (riskVal > 0) {
      return {
        fillColor: '#0ea5e9', // Sky blue
        fillOpacity: 0.2,
        color: '#0284c7',
        weight: 1.2,
        bubblingMouseEvents: false
      };
    }
    
    return {
      fillColor: 'transparent',
      fillOpacity: 0,
      color: 'rgba(0, 0, 0, 0.12)',
      weight: 0.8,
      bubblingMouseEvents: false
    };
  };

  const onEachFeature = (feature: any, layer: L.Layer) => {
    const propName = feature.properties.Propinsi || '';
    const provinceId = mapTextToProvinceId(propName);
    const hazard = activeTypeFilter as 'flood' | 'tsunami' | 'kekeringan' | 'volcanic';
    const riskVal = getProvinceRisk(provinceId, hazard);
    
    const hazardTitle = hazard === 'flood' ? 'Banjir' : hazard === 'tsunami' ? 'Tsunami' : hazard === 'kekeringan' ? 'Kekeringan' : 'Gunung Api';
    
    let severity = 'Aman';
    if (riskVal > 0.6) severity = 'Tinggi (Critical)';
    else if (riskVal > 0.3) severity = 'Sedang (Warning)';
    else if (riskVal > 0) severity = 'Rendah (Watch)';
    
    layer.bindTooltip(`
      <div style="font-family: var(--font-sans); font-size: 12px; line-height: 1.4; padding: 4px;">
        <strong>Provinsi ${propName}</strong><br/>
        Indeks Kerentanan ${hazardTitle}: <strong>${riskVal > 0 ? riskVal.toFixed(2) : '0.00'}</strong><br/>
        Status: <span style="font-weight: 700; color: ${riskVal > 0.6 ? 'var(--alert-critical)' : riskVal > 0.3 ? 'var(--alert-warning)' : 'var(--alert-watch)'}">${severity}</span>
      </div>
    `, { sticky: true });
  };

  const defaultCenter: [number, number] = [-2.5489, 118.0149]; // Center of Indonesia
  const defaultZoom = 5;

  // Refs for markers to programmatically trigger popups when an alert is selected
  const markerRefs = useRef<Record<string, L.Marker | null>>({});

  // Find the first KPwBI office matching the selected province
  const selectedOffice = KPWBI_OFFICES.find((o) => o.provinceId === selectedProvinceId) || null;
  
  // Find selected alert and matching province coordinates
  const selectedAlert = alerts.find((a) => a.id === selectedAlertId) || null;

  // Calculate nearest KPW offices to the selected office (top 3 provinces)
  const nearestOffices = useMemo(() => {
    if (!selectedOffice) return [];
    return findNearestOfficesByProvince(selectedOffice, KPWBI_OFFICES, PROVINCES, 3);
  }, [selectedOffice]);




  useEffect(() => {
    // Open popup when alert is selected via sidebar
    if (selectedAlert) {
      // Find matching office for this alert's province
      const office = KPWBI_OFFICES.find((o) => o.provinceId === selectedAlert.provinceId);
      if (office) {
        const marker = markerRefs.current[office.id];
        if (marker) {
          setTimeout(() => {
            marker.openPopup();
          }, 100);
        }
      }
    } else if (selectedProvinceId) {
      // Find matching office for this province
      const office = KPWBI_OFFICES.find((o) => o.provinceId === selectedProvinceId);
      if (office) {
        const marker = markerRefs.current[office.id];
        if (marker) {
          setTimeout(() => {
            marker.openPopup();
          }, 100);
        }
      }
    }
  }, [selectedAlert, selectedProvinceId]);

  // Create custom DivIcon for markers
  const createMarkerIcon = (office: KpwbiOffice) => {
    const isInariskFilter = activeTypeFilter && ['flood', 'tsunami', 'kekeringan', 'volcanic'].includes(activeTypeFilter);
    
    let activeSeverity: string | null = null;
    
    if (isInariskFilter) {
      // Do not color individual markers for InaRisk data (colored via province polygons instead)
      activeSeverity = null;
    } else {
      // Find all alerts affecting this office
      const officeAlerts = alerts.filter((alert) => isOfficeAffectedByAlert(office, alert));
      
      // Find the highest severity alert to style the marker
      if (officeAlerts.length > 0) {
        const severityWeight = { critical: 3, warning: 2, watch: 1 };
        const activeAlert = officeAlerts.reduce((highest, current) => {
          const highestWeight = severityWeight[highest.severity] || 0;
          const currentWeight = severityWeight[current.severity] || 0;
          return currentWeight > highestWeight ? current : highest;
        });
        activeSeverity = activeAlert.severity;
      }
    }
    
    const classes: string[] = [];

    if (activeSeverity) {
      classes.push('has-alert', `alert-${activeSeverity}`);
    }

    if (selectedProvinceId === office.provinceId) {
      classes.push('selected');
    } else {
      const isNearest = nearestOffices.some((n) => n.office.id === office.id);
      if (isNearest) {
        classes.push('nearest');
      }
    }

    const classString = classes.join(' ');

    if (office.isKantorPusat) {
      return L.divIcon({
        className: 'custom-marker kp-marker-container',
        html: `<svg class="kp-building ${classString}" viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12,2L1,7v2h22V7L12,2z M4,9v11h3V9H4z M10,9v11h4V9h-4z M17,9v11h3V9h-3z M2,20v2h20v-2H2z"/></svg>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
    }

    if (office.isKorwil) {
      return L.divIcon({
        className: 'custom-marker korwil-marker-container',
        html: `<svg class="korwil-star ${classString}" viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z"/></svg>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });
    }

    // Normal KPW is a dot
    const dotClasses = ['marker-dot', ...classes].join(' ');
    return L.divIcon({
      className: 'custom-marker',
      html: `<div class="${dotClasses}"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
  };


  const getDisasterEmoji = (type: string) => {
    switch (type) {
      case 'earthquake':
        return '🌋';
      case 'tsunami':
        return '🌊';
      case 'flood':
        return '🌧️';
      case 'volcanic':
        return '🌋';
      case 'landslide':
        return '⛰️';
      case 'extreme_weather':
        return '⚡';
      case 'karhutla':
        return '🔥';
      case 'kekeringan':
        return '🏜️';
      default:
        return '⚠️';
    }
  };

  // Helper to get province name from provinceId
  const getProvinceName = (provinceId: string): string => {
    const province = PROVINCES.find((p) => p.id === provinceId);
    return province ? province.name : provinceId;
  };

  return (
    <div className="map-wrapper">
      {/* Reset Map Button */}
      <button
        className="map-reset-btn"
        title="Reset Map View"
        onClick={() => {
          onAlertSelect('');
          onProvinceSelect('');
          setResetTrigger((prev) => prev + 1);
        }}
      >
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
          <path d="M3 3v5h5"></path>
        </svg>
      </button>

      <MapContainer
        center={defaultCenter}
        zoom={defaultZoom}
        className="map-container-element"
        zoomControl={true}
        minZoom={4}
        maxZoom={18}
      >
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

        <MapController selectedOffice={selectedOffice} selectedAlert={selectedAlert} resetTrigger={resetTrigger} />

        <MapEventsHandler
          onClearSelection={() => {
            onAlertSelect('');
            onProvinceSelect('');
          }}
        />

        {/* Polylines to nearest KPW offices */}
        {selectedOffice && nearestOffices.map(({ office }) => (
          <Polyline
            key={`line-${selectedOffice.id}-${office.id}`}
            positions={[
              [selectedOffice.latitude, selectedOffice.longitude],
              [office.latitude, office.longitude],
            ]}
            pathOptions={{
              color: '#0ea5e9',
              weight: 2,
              dashArray: '6, 6',
              opacity: 0.8,
            }}
          />
        ))}

        {/* Disaster alert indicators (circles representing affected radius) */}
        {alerts.map((alert) => {
          let center: [number, number] | null = null;
          
          if (isValidCoord(alert.latitude, alert.longitude)) {
            center = [Number(alert.latitude), Number(alert.longitude)];
          } else {
            const office = KPWBI_OFFICES.find((o) => o.provinceId === alert.provinceId);
            if (office) {
              center = [office.latitude, office.longitude];
            }
          }

          if (!center) return null;

          let radius = 20000; // default 20km
          let pathOpts: L.PathOptions = {
            color: '#dc2626',
            fillColor: '#dc2626',
            fillOpacity: 0.15,
            weight: 1.5,
          };

          switch (alert.type) {
            case 'earthquake':
              // Proportional to magnitude
              radius = (alert.magnitude || 5) * 15000;
              pathOpts = {
                color: 'var(--alert-critical)',
                fillColor: 'var(--alert-critical)',
                fillOpacity: 0.12,
                weight: 1.5,
                dashArray: '4, 4',
              };
              break;
            case 'tsunami':
              radius = 80000; // 80km threat zone
              pathOpts = {
                color: '#be123c', // Deep rose/red
                fillColor: '#be123c',
                fillOpacity: 0.1,
                weight: 2,
                dashArray: '8, 4',
              };
              break;
            case 'flood':
              // Proportional to water level
              radius = (alert.waterLevel || 1.5) * 12000;
              pathOpts = {
                color: '#2563eb', // Blue
                fillColor: '#3b82f6',
                fillOpacity: 0.2,
                weight: 1.5,
              };
              break;
            case 'volcanic':
              radius = 35000; // 35km caution zone
              pathOpts = {
                color: '#ea580c', // Orange
                fillColor: '#f97316',
                fillOpacity: 0.25,
                weight: 1.5,
              };
              break;
            case 'landslide':
              radius = 15000; // 15km caution zone
              pathOpts = {
                color: '#78350f', // Brown
                fillColor: '#b45309',
                fillOpacity: 0.15,
                weight: 1.5,
              };
              break;
            case 'extreme_weather':
              radius = 50000; // 50km caution zone
              pathOpts = {
                color: '#0ea5e9', // Sky blue
                fillColor: '#0ea5e9',
                fillOpacity: 0.12,
                weight: 1.5,
                dashArray: '6, 3',
              };
              break;
            case 'karhutla':
              radius = 30000; // 30km caution zone
              pathOpts = {
                color: '#f97316', // Orange
                fillColor: '#ef4444', // Red
                fillOpacity: 0.15,
                weight: 1.5,
                dashArray: '5, 5',
              };
              break;
            case 'kekeringan':
              radius = 40000; // 40km caution zone
              pathOpts = {
                color: '#d97706', // Amber-600
                fillColor: '#f59e0b', // Amber-500
                fillOpacity: 0.15,
                weight: 1.5,
                dashArray: '4, 4',
              };
              break;
            default:
              radius = 20000;
              pathOpts = {
                color: '#dc2626',
                fillColor: '#dc2626',
                fillOpacity: 0.15,
                weight: 1.5,
              };
          }

          return (
            <Circle
              key={`indicator-${alert.id}`}
              center={center}
              radius={radius}
              pathOptions={pathOpts}
            >
              <Tooltip sticky>
                <div>
                  <strong>{alert.title}</strong><br />
                  Radius Dampak: {(radius / 1000).toFixed(0)} km<br />
                  {isValidCoord(alert.latitude, alert.longitude) ? (
                    <>Epicenter: {Number(alert.latitude).toFixed(4)}, {Number(alert.longitude).toFixed(4)}<br /></>
                  ) : null}
                  Area: {alert.affectedArea || 'Sekitar KPW'}
                </div>
              </Tooltip>
            </Circle>
          );
        })}

        {KPWBI_OFFICES.map((office) => {
          const activeAlerts = alerts.filter((a) => isOfficeAffectedByAlert(office, a));
          const hasAlert = activeAlerts.length > 0;
          
          let mainAlert = activeAlerts[0];
          if (activeAlerts.length > 1) {
            const severityWeight = { critical: 3, warning: 2, watch: 1 };
            mainAlert = activeAlerts.reduce((highest, current) => {
              const highestWeight = severityWeight[highest.severity] || 0;
              const currentWeight = severityWeight[current.severity] || 0;
              return currentWeight > highestWeight ? current : highest;
            });
          }

          return (
            <Marker
              key={office.id}
              position={[office.latitude, office.longitude]}
              icon={createMarkerIcon(office)}
              zIndexOffset={office.isKantorPusat ? 1000 : (office.isKorwil ? 500 : 0)}
              ref={(ref) => {
                markerRefs.current[office.id] = ref;
              }}
              eventHandlers={{
                click: () => {
                  if (hasAlert) {
                    onAlertSelect(mainAlert.id);
                  } else {
                    onProvinceSelect(office.provinceId);
                  }
                },
              }}
            >
              {/* Tooltip on hover */}
              <Tooltip direction="top" offset={[0, -10]} opacity={0.9} permanent={false}>
                <div>
                  <strong>{office.city}</strong> — {office.name}
                  {office.isKantorPusat && ' 🏛️ (Kantor Pusat)'}
                  {office.isKorwil && !office.isKantorPusat && ' ★ Korwil'}
                  {(() => {
                    const nearestInfo = nearestOffices.find((n) => n.office.id === office.id);
                    if (nearestInfo) {
                      return (
                        <div style={{ marginTop: '4px', fontSize: '11px', color: '#10b981', fontWeight: 600 }}>
                          ↔️ Terdekat ({nearestInfo.distanceKm.toFixed(1)} km)
                        </div>
                      );
                    }
                    return null;
                  })()}
                  {(() => {
                    const isInariskFilter = activeTypeFilter && ['flood', 'tsunami', 'kekeringan', 'volcanic'].includes(activeTypeFilter);
                    if (isInariskFilter) {
                      const hazard = activeTypeFilter as 'flood' | 'tsunami' | 'kekeringan' | 'volcanic';
                      const indexVal = BnpbInariskService.getLocalHazardIndex(office.id, hazard);
                      const hazardTitle = hazard === 'flood' ? 'Banjir' : hazard === 'tsunami' ? 'Tsunami' : hazard === 'kekeringan' ? 'Kekeringan' : 'Gunung Api';
                      return (
                        <div style={{ marginTop: '4px', fontSize: '11px', color: indexVal > 0.6 ? 'var(--alert-critical)' : indexVal > 0.3 ? 'var(--alert-warning)' : 'var(--alert-watch)', fontWeight: 700 }}>
                          {hazardTitle} Indeks: {indexVal.toFixed(2)}
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </Tooltip>

              {/* Popup on click */}
              <Popup offset={[0, -10]}>
                {hasAlert ? (
                  <div className="ews-popup-content">
                    <div className={`ews-popup-header ${mainAlert.severity}`}>
                      <span>{getDisasterEmoji(mainAlert.type)}</span>
                      <span>{mainAlert.title}</span>
                    </div>
                    <div className="ews-popup-title">
                      {office.name} ({office.city})
                    </div>
                    <p className="ews-popup-desc">{mainAlert.description}</p>
                    <div className="ews-popup-footer">
                      <span className="ews-popup-tag">{mainAlert.severity.toUpperCase()}</span>
                      <span>
                        {new Date(mainAlert.timestamp).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        WIB
                      </span>
                    </div>
                  </div>
                ) : (() => {
                  const isInariskFilter = activeTypeFilter && ['flood', 'tsunami', 'kekeringan', 'volcanic'].includes(activeTypeFilter);
                  if (isInariskFilter) {
                    const hazard = activeTypeFilter as 'flood' | 'tsunami' | 'kekeringan' | 'volcanic';
                    const indexVal = BnpbInariskService.getLocalHazardIndex(office.id, hazard);
                    
                    let severity: AlertSeverity = 'watch';
                    let sevClass = 'watch';
                    if (indexVal > 0.6) {
                      severity = 'critical';
                      sevClass = 'critical';
                    } else if (indexVal > 0.3) {
                      severity = 'warning';
                      sevClass = 'warning';
                    }
                    
                    const hazardTitle = hazard === 'flood' ? 'Banjir' : hazard === 'tsunami' ? 'Tsunami' : hazard === 'kekeringan' ? 'Kekeringan' : 'Gunung Api';
                    
                    return (
                      <div className="ews-popup-content">
                        <div className={`ews-popup-header ${sevClass}`}>
                          <span>{getDisasterEmoji(hazard)}</span>
                          <span>Indeks Bahaya {hazardTitle} (InaRisk)</span>
                        </div>
                        <div className="ews-popup-title" style={{ marginTop: '0' }}>
                          {office.name} ({office.city})
                        </div>
                        <p className="ews-popup-desc">
                          Berdasarkan data InaRisk BNPB, lokasi sekitar {office.name} memiliki tingkat kerentanan/bahaya {hazardTitle} dengan indeks **{indexVal.toFixed(2)}** dari 1.0.
                        </p>
                        <div className="ews-popup-footer">
                          <span className="ews-popup-tag" style={{
                            color: severity === 'critical' ? 'var(--alert-critical)' : severity === 'warning' ? 'var(--alert-warning)' : 'var(--alert-watch)',
                            backgroundColor: severity === 'critical' ? 'var(--alert-critical-bg)' : severity === 'warning' ? 'var(--alert-warning-bg)' : 'var(--alert-watch-bg)',
                            borderColor: severity === 'critical' ? 'var(--alert-critical-border)' : severity === 'warning' ? 'var(--alert-warning-border)' : 'var(--alert-watch-border)'
                          }}>
                            {severity.toUpperCase()} ({indexVal.toFixed(2)})
                          </span>
                          <span>InaRisk BNPB</span>
                        </div>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="ews-popup-content">
                      <div className="ews-popup-header" style={{ color: 'var(--accent-primary)' }}>
                        <span>📍</span>
                        <span>KPwBI OFFICE</span>
                      </div>
                      <div className="ews-popup-title" style={{ marginTop: '0' }}>
                        {office.name}
                      </div>
                      <p className="ews-popup-desc">
                        City: <strong>{office.city}</strong><br />
                        Province: {getProvinceName(office.provinceId)}<br />
                        Region: {office.region}<br />
                        Coordinates: {office.latitude.toFixed(4)}, {office.longitude.toFixed(4)}
                      </p>
                      <div className="ews-popup-footer">
                        {office.isKantorPusat ? (
                          <span className="ews-popup-tag" style={{ color: '#1e3a8a', backgroundColor: '#dbeafe' }}>
                            🏛️ KANTOR PUSAT
                          </span>
                        ) : office.isKorwil ? (
                          <span className="ews-popup-tag" style={{ color: '#7c3aed', backgroundColor: '#ede9fe' }}>
                            ★ KORWIL
                          </span>
                        ) : (
                          <span className="ews-popup-tag" style={{ color: 'var(--accent-primary)', backgroundColor: 'var(--accent-light)' }}>
                            NORMAL STATE
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </Popup>
            </Marker>
          );
        })}
        {/* DRC / DC special location markers (triangle shape) */}
        {DRC_LOCATIONS.map((drc) => {
          const triangleSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="22" height="22"><polygon points="12,2 23,22 1,22" fill="#7c3aed" stroke="white" stroke-width="1.5"/><text x="12" y="18" text-anchor="middle" font-size="8" fill="white" font-weight="bold">${drc.type}</text></svg>`;
          const icon = L.divIcon({
            className: 'custom-marker drc-marker-container',
            html: triangleSvg,
            iconSize: [22, 22],
            iconAnchor: [11, 22],
          });
          return (
            <Marker key={drc.id} position={[drc.latitude, drc.longitude]} icon={icon}>
              <Tooltip direction="top" offset={[0, -4]} opacity={0.95} permanent={false}>
                <div>
                  <strong>{drc.name}</strong>
                  <div style={{ fontSize: '11px', color: '#7c3aed', fontWeight: 600 }}>
                    {drc.type === 'DRC' ? '🔴 Disaster Recovery Center' : '🟣 Data Center'}
                  </div>
                  <div style={{ fontSize: '11px', color: '#555', marginTop: '2px' }}>{drc.city}</div>
                </div>
              </Tooltip>
              <Popup offset={[0, -18]}>
                <div className="ews-popup-content">
                  <div className="ews-popup-header" style={{ color: '#7c3aed' }}>
                    <span>{drc.type === 'DRC' ? '🔴' : '🟣'}</span>
                    <span>{drc.type} — Bank Indonesia</span>
                  </div>
                  <div className="ews-popup-title" style={{ marginTop: '0' }}>{drc.fullName}</div>
                  <p className="ews-popup-desc">
                    Kota: <strong>{drc.city}</strong><br />
                    Koordinat: {drc.latitude.toFixed(4)}, {drc.longitude.toFixed(4)}
                  </p>
                  <div className="ews-popup-footer">
                    <span className="ews-popup-tag" style={{ color: '#7c3aed', backgroundColor: '#ede9fe' }}>
                      ▲ {drc.type}
                    </span>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Nearest KPW Panel overlay */}
      {selectedOffice && nearestOffices.length > 0 && (
        <div className="nearest-kpw-panel">
          <div className="nearest-kpw-header">
            <span className="nearest-kpw-icon">📍</span>
            <span className="nearest-kpw-title">
              KPW Terdekat dari <strong>{selectedOffice.city}</strong>
            </span>
          </div>
          <div className="nearest-kpw-list">
            {nearestOffices.map(({ office, distanceKm }) => {
              const activeAlerts = alerts.filter((a) => isOfficeAffectedByAlert(office, a));
              const hasAlert = activeAlerts.length > 0;
              
              let mainAlert = activeAlerts[0];
              if (activeAlerts.length > 1) {
                const severityWeight = { critical: 3, warning: 2, watch: 1 };
                mainAlert = activeAlerts.reduce((highest, current) => {
                  const highestWeight = severityWeight[highest.severity] || 0;
                  const currentWeight = severityWeight[current.severity] || 0;
                  return currentWeight > highestWeight ? current : highest;
                });
              }

              return (
                <div
                  key={office.id}
                  className={`nearest-kpw-item ${hasAlert ? `alert-${mainAlert.severity}` : ''}`}
                  onClick={() => {
                    if (hasAlert) {
                      onAlertSelect(mainAlert.id);
                    } else {
                      onProvinceSelect(office.provinceId);
                    }
                  }}
                >
                  <span className={`nearest-item-indicator ${hasAlert ? 'has-alert' : ''}`} />
                  <div className="nearest-kpw-details">
                    <div className="nearest-kpw-name">{office.name}</div>
                    <div className="nearest-kpw-meta">
                      {office.city} {office.isKantorPusat ? '🏛️ KP' : office.isKorwil ? '★ Korwil' : ''}
                    </div>
                  </div>
                  <div className="nearest-kpw-distance">
                    {distanceKm.toFixed(0)} km
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Map Legend Panel overlay */}
      <div className="map-legend">
        <div className="legend-title">{isInariskFilter ? 'Indikator Wilayah (InaRisk)' : 'Map Legend'}</div>
        <div className="legend-item" style={{ gap: '8px' }}>
          <svg viewBox="0 0 24 24" width="16" height="16" style={{ color: '#1e3a8a', fill: 'currentColor', flexShrink: 0 }}>
            <path d="M12,2L1,7v2h22V7L12,2z M4,9v11h3V9H4z M10,9v11h4V9h-4z M17,9v11h3V9h-3z M2,20v2h20v-2H2z"/>
          </svg>
          <span>Kantor Pusat BI (KP)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color critical"></div>
          <span>{isInariskFilter ? 'Kerentanan Tinggi (>0.6)' : 'Critical Warning'}</span>
        </div>
        <div className="legend-item">
          <div className="legend-color warning"></div>
          <span>{isInariskFilter ? 'Kerentanan Sedang (0.3-0.6)' : 'Warning / Watch'}</span>
        </div>
        <div className="legend-item">
          <div className="legend-color watch"></div>
          <span>{isInariskFilter ? 'Kerentanan Rendah (>0-0.3)' : 'Alert Watch / Advisory'}</span>
        </div>
        <div className="legend-item" style={{ gap: '8px' }}>
          <svg viewBox="0 0 24 24" width="16" height="16" style={{ color: 'var(--accent-primary)', fill: 'currentColor', flexShrink: 0 }}>
            <path d="M12,17.27L18.18,21L16.54,13.97L22,9.24L14.81,8.62L12,2L9.19,8.62L2,9.24L7.45,13.97L5.82,21L12,17.27Z"/>
          </svg>
          <span>KPwBI Korwil Office</span>
        </div>
        <div className="legend-item">
          <div className="legend-color nearest-dot"></div>
          <span>KPwBI Terdekat</span>
        </div>
        <div className="legend-item">
          <div className="legend-color normal"></div>
          <span>KPwBI Office (Normal)</span>
        </div>
        <div className="legend-item" style={{ gap: '8px' }}>
          <svg viewBox="0 0 24 24" width="14" height="14" style={{ flexShrink: 0 }}>
            <polygon points="12,2 23,22 1,22" fill="#7c3aed" stroke="white" strokeWidth="1"/>
          </svg>
          <span>Data Center / DRC (BI)</span>
        </div>
      </div>

    </div>
  );
};

export default EwsMap;
export type { EwsMapProps };
