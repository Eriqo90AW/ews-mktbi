import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, Polyline, CircleMarker, Marker, Circle, Tooltip, Polygon } from 'react-leaflet';
import L from 'leaflet';
import type { GeoJsonObject, Feature } from 'geojson';
import { PROVINCES } from '../../constants/provinces';
import { KPWBI_OFFICES } from '../../constants/kpwbiOffices';
import { BnpbInariskService } from '../../services/bnpbInariskService';
import { mapTextToProvinceId } from '../../utils/provinceMap';
import { MEGATHRUST_ZONES } from '../../constants/megathrustZones';
import { getPolylineBufferSegments } from '../../utils/geo';
import { RING_OF_FIRE_ARCS, VOLCANO_POINTS } from '../../constants/ringOfFire';
import { getEnsoElevatedProvinces } from '../../constants/ensoData';

import type { EnsoPhase } from '../../constants/ensoData';
import type { DisasterAlert } from '../../types';
import MapController from '../dashboard/map/MapController';
import MapEventsHandler from '../dashboard/map/MapEventsHandler';
import 'leaflet/dist/leaflet.css';

export type PerkiraanMapMode = 'mingguan' | 'iklim' | 'gempa';

interface PerkiraanMapProps {
  mode: PerkiraanMapMode;
  forecastAlerts?: DisasterAlert[];
  ensoPhase?: EnsoPhase;
  selectedProvinceId?: string | null;
  onProvinceSelect?: (id: string) => void;
  selectedMegathrustId?: string | null;
  onMegathrustSelect?: (id: string) => void;
}

const INDONESIA_CENTER: [number, number] = [-2.5489, 118.0149];

function getProvinceFloodRisk(provinceId: string): number {
  return KPWBI_OFFICES.filter((o) => o.provinceId === provinceId).reduce((max, o) => {
    const v = BnpbInariskService.getLocalHazardIndex(o.id, 'flood');
    return v > max ? v : max;
  }, 0);
}

function getForecastSeverityForProvince(provinceId: string, alerts: DisasterAlert[]): 'critical' | 'warning' | 'watch' | null {
  const matching = alerts.filter((a) => a.provinceId === provinceId && a.isForecast);
  if (matching.length === 0) return null;
  if (matching.some((a) => a.severity === 'critical')) return 'critical';
  if (matching.some((a) => a.severity === 'warning')) return 'warning';
  return 'watch';
}

const PerkiraanMap: React.FC<PerkiraanMapProps> = ({
  mode,
  forecastAlerts = [],
  ensoPhase = 'netral',
  selectedProvinceId = null,
  onProvinceSelect,
  selectedMegathrustId = null,
  onMegathrustSelect,
}) => {
  const [geoJsonData, setGeoJsonData] = useState<GeoJsonObject | null>(null);

  useEffect(() => {
    fetch('/indonesia-provinces.json')
      .then((r) => r.json())
      .then(setGeoJsonData)
      .catch(() => {});
  }, []);

  const getGeoJsonStyle = (feature?: Feature) => {
    if (!feature) return {};
    const provinceId = mapTextToProvinceId((feature.properties?.['Propinsi'] as string) || '');

    if (mode === 'mingguan') {
      const forecastSev = getForecastSeverityForProvince(provinceId, forecastAlerts);
      const floodRisk = getProvinceFloodRisk(provinceId);
      const isHighFlood = floodRisk > 0.5;

      if (forecastSev === 'critical') {
        return { fillColor: '#dc2626', fillOpacity: 0.35, color: '#b91c1c', weight: 2.5 };
      }
      if (forecastSev === 'warning') {
        return { fillColor: '#d97706', fillOpacity: 0.3, color: '#b45309', weight: 2 };
      }
      if (forecastSev === 'watch') {
        return { fillColor: '#0ea5e9', fillOpacity: 0.2, color: '#0284c7', weight: 1.5 };
      }
      if (isHighFlood) {
        return { fillColor: '#6366f1', fillOpacity: 0.15, color: '#4f46e5', weight: 1.5 };
      }
      return { fillColor: 'transparent', fillOpacity: 0, color: 'rgba(0,0,0,0.08)', weight: 0.5 };
    }

    if (mode === 'iklim') {
      const { flood: floodProvinces, drought: droughtProvinces } = getEnsoElevatedProvinces(ensoPhase);
      const baseFloodRisk = getProvinceFloodRisk(provinceId);
      const isDroughtElevated = droughtProvinces.includes(provinceId);
      const isFloodElevated = floodProvinces.includes(provinceId);

      if (isDroughtElevated) {
        return { fillColor: '#f97316', fillOpacity: 0.35, color: '#ea580c', weight: 2 };
      }
      if (isFloodElevated) {
        return { fillColor: '#3b82f6', fillOpacity: 0.35, color: '#2563eb', weight: 2 };
      }
      if (baseFloodRisk > 0.5) {
        return { fillColor: '#60a5fa', fillOpacity: 0.2, color: '#3b82f6', weight: 1.5 };
      }
      return { fillColor: 'transparent', fillOpacity: 0, color: 'rgba(0,0,0,0.08)', weight: 0.5 };
    }

    // gempa: no fill
    return { fillColor: 'transparent', fillOpacity: 0, color: 'rgba(255,255,255,0.15)', weight: 0.5 };
  };

  const onEachFeature = (feature: Feature, layer: L.Layer) => {
    const propName = (feature.properties?.['Propinsi'] as string) || '';
    const provinceId = mapTextToProvinceId(propName);

    if (mode === 'mingguan') {
      const floodRisk = getProvinceFloodRisk(provinceId);
      const forecastSev = getForecastSeverityForProvince(provinceId, forecastAlerts);
      if (!forecastSev && floodRisk <= 0) return;
      layer.bindTooltip(
        `<div style="font-size:12px;padding:4px">
          <strong>${propName}</strong><br/>
          ${forecastSev ? `Prakiraan: <strong>${forecastSev === 'critical' ? 'Siaga' : forecastSev === 'warning' ? 'Waspada' : 'Potensi'}</strong><br/>` : ''}
          Kerentanan Banjir: <strong>${(floodRisk * 100).toFixed(0)}</strong>/100
        </div>`,
        { sticky: true }
      );
    }

    if (mode === 'iklim') {
      const { flood: floodP, drought: droughtP } = getEnsoElevatedProvinces(ensoPhase);
      const isFlood = floodP.includes(provinceId);
      const isDrought = droughtP.includes(provinceId);
      if (!isFlood && !isDrought) return;
      layer.bindTooltip(
        `<div style="font-size:12px;padding:4px">
          <strong>${propName}</strong><br/>
          ${isDrought ? '<span style="color:#f97316">⚠️ Risiko Kekeringan meningkat</span>' : ''}
          ${isFlood ? '<span style="color:#3b82f6">⚠️ Risiko Banjir meningkat</span>' : ''}
        </div>`,
        { sticky: true }
      );
    }
  };

  // Province centroid severity icons for mingguan & iklim
  const provinceSeverityMarkers = PROVINCES.map((prov) => {
    let emoji = '';
    let color = '';

    if (mode === 'mingguan') {
      const sev = getForecastSeverityForProvince(prov.id, forecastAlerts);
      const floodRisk = getProvinceFloodRisk(prov.id);
      if (sev === 'critical') { emoji = '🔴'; color = '#dc2626'; }
      else if (sev === 'warning') { emoji = '🟡'; color = '#d97706'; }
      else if (sev === 'watch') { emoji = '🔵'; color = '#0ea5e9'; }
      else if (floodRisk > 0.5) { emoji = '💧'; color = '#6366f1'; }
    } else if (mode === 'iklim') {
      const { flood: fp, drought: dp } = getEnsoElevatedProvinces(ensoPhase);
      if (dp.includes(prov.id)) { emoji = '🌵'; color = '#f97316'; }
      else if (fp.includes(prov.id)) { emoji = '🌧️'; color = '#3b82f6'; }
    }

    if (!emoji) return null;

    const icon = L.divIcon({
      className: '',
      html: `<div style="font-size:18px;line-height:1;text-shadow:0 1px 3px rgba(0,0,0,0.6)">${emoji}</div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    return (
      <Marker key={`prov-icon-${prov.id}`} position={[prov.latitude, prov.longitude]} icon={icon} interactive={false}>
        <Tooltip direction="top" offset={[0, -8]} sticky>
          <span style={{ fontSize: 12 }}>{prov.name} — {color === '#dc2626' ? 'Siaga' : color === '#d97706' ? 'Waspada' : color === '#0ea5e9' ? 'Potensi Cuaca' : color === '#6366f1' ? 'Rentan Banjir' : color === '#f97316' ? 'Risiko Kekeringan' : 'Risiko Banjir'}</span>
        </Tooltip>
      </Marker>
    );
  }).filter(Boolean);

  const selectedOffice = selectedProvinceId
    ? KPWBI_OFFICES.find((o) => o.provinceId === selectedProvinceId) ?? null
    : null;
  const dummyAlert = null;
  const clearSelection = () => {
    onProvinceSelect?.('');
    onMegathrustSelect?.('');
  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <MapContainer
        center={INDONESIA_CENTER}
        zoom={5}
        style={{ width: '100%', height: '100%' }}
        zoomControl
        minZoom={4}
        maxZoom={18}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {geoJsonData && (
          <GeoJSON
            key={`perkiraan-geojson-${mode}-${ensoPhase}`}
            data={geoJsonData}
            style={getGeoJsonStyle}
            onEachFeature={onEachFeature}
          />
        )}

        <MapController
          selectedOffice={selectedOffice}
          selectedAlert={dummyAlert}
          resetTrigger={0}
          isSidebarCollapsed={false}
        />
        <MapEventsHandler onClearSelection={clearSelection} />

        {/* Province severity icons for mingguan & iklim */}
        {(mode === 'mingguan' || mode === 'iklim') && provinceSeverityMarkers}

        {/* KPW office dots */}
        {KPWBI_OFFICES.map((o) => (
          <CircleMarker
            key={`kpw-${o.id}`}
            center={[o.latitude, o.longitude]}
            radius={4}
            pathOptions={{ color: '#1e3a8a', fillColor: '#3b82f6', fillOpacity: 0.8, weight: 1 }}
          >
            <Tooltip direction="top" offset={[0, -4]}>{o.name}</Tooltip>
          </CircleMarker>
        ))}

        {/* Ring of Fire arcs */}
        {mode === 'gempa' && RING_OF_FIRE_ARCS.map((arc) => (
          <Polyline
            key={arc.id}
            positions={arc.path}
            pathOptions={{ color: arc.color, weight: 3, dashArray: '8, 4', opacity: 0.85 }}
          >
            <Tooltip sticky><strong>{arc.name}</strong><br/>Ring of Fire / Busur Vulkanik</Tooltip>
          </Polyline>
        ))}

        {/* Volcano points */}
        {mode === 'gempa' && VOLCANO_POINTS.map((v) => {
          const levelColor = v.level === 'III' ? '#dc2626' : v.level === 'II' ? '#d97706' : '#6b7280';
          const icon = L.divIcon({
            className: '',
            html: `<div style="font-size:16px;line-height:1;text-shadow:0 1px 3px rgba(0,0,0,0.8)">🌋</div>`,
            iconSize: [18, 18],
            iconAnchor: [9, 9],
          });
          return (
            <Marker key={`vol-${v.name}`} position={[v.lat, v.lng]} icon={icon}>
              <Tooltip direction="top" offset={[0, -8]}>
                <strong>G. {v.name}</strong><br/>
                <span style={{ color: levelColor }}>Level {v.level}</span>
              </Tooltip>
            </Marker>
          );
        })}

        {/* Megathrust zones */}
        {mode === 'gempa' && MEGATHRUST_ZONES.map((zone) => {
          const isSelected = zone.id === selectedMegathrustId;
          const bufferSegments = getPolylineBufferSegments(zone.path, zone.impactRadiusKm);

          const bufferStyle = isSelected
            ? {
                color: '#f59e0b',
                fillColor: '#f59e0b',
                fillOpacity: 0.08,
                weight: 1.5,
                opacity: 0.5,
                dashArray: '6, 4',
              }
            : {
                color: '#7c3aed',
                fillColor: '#7c3aed',
                fillOpacity: 0.02,
                weight: 0.5,
                opacity: 0.15,
                dashArray: '3, 4',
              };

          return (
            <React.Fragment key={zone.id}>
              {/* Buffer segments along the subduction line */}
              {bufferSegments.map((pts, idx) => (
                <Polygon
                  key={`${zone.id}-buf-seg-${idx}`}
                  positions={pts}
                  pathOptions={bufferStyle}
                  eventHandlers={{ click: () => onMegathrustSelect?.(zone.id) }}
                >
                  <Tooltip sticky>
                    <strong>{zone.name}</strong> (Area Dampak)<br/>
                    Maks: Mw {zone.maxMagnitude}<br/>
                    Radius Dampak: {zone.impactRadiusKm} km
                  </Tooltip>
                </Polygon>
              ))}

              {/* Buffer circles around each point of the subduction line to round joint corners */}
              {zone.path.map((pt, idx) => (
                <Circle
                  key={`${zone.id}-buf-circ-${idx}`}
                  center={pt}
                  radius={zone.impactRadiusKm * 1000}
                  pathOptions={bufferStyle}
                  eventHandlers={{ click: () => onMegathrustSelect?.(zone.id) }}
                >
                  <Tooltip sticky>
                    <strong>{zone.name}</strong> (Area Dampak)<br/>
                    Maks: Mw {zone.maxMagnitude}<br/>
                    Radius Dampak: {zone.impactRadiusKm} km
                  </Tooltip>
                </Circle>
              ))}

              {/* Trench Line */}
              <Polyline
                positions={zone.path}
                pathOptions={{
                  color: isSelected ? '#f59e0b' : '#7c3aed',
                  weight: isSelected ? 5 : 3,
                  opacity: 0.9,
                }}
                eventHandlers={{ click: () => onMegathrustSelect?.(zone.id) }}
              >
                <Tooltip sticky>
                  <strong>{zone.name}</strong><br/>
                  Maks: Mw {zone.maxMagnitude}<br/>
                  Radius Dampak: {zone.impactRadiusKm} km
                </Tooltip>
              </Polyline>
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default PerkiraanMap;
