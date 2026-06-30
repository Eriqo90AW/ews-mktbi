import { useState, useMemo, useEffect } from 'react';
import type { DisasterAlert } from '../types';
import { fetchLatestEarthquakes, fetchExtremeWeather, fetchThreeDayForecast } from '../services/bmkgService';
import { BMKGGisService } from '../services/bmkgGisService';
import { MagmaService } from '../services/magmaService';

// InaRisk / BNPB data is shown in the Kerentanan screen, not as live alerts.
// This hook only aggregates real-time BMKG alert streams.

// Global cache variables to persist data across component mounts
let cachedAlerts: DisasterAlert[] = [];
let cachedIsLoading = true;
let isFetching = false;
let lastCheckedTime: Date | null = null;
let pollingIntervalId: any = null;
const listeners = new Set<() => void>();

const notifyListeners = () => {
  listeners.forEach((listener) => listener());
};

const mergeAlerts = (existing: DisasterAlert[], incoming: DisasterAlert[]) => {
  const map = new Map(existing.map((a) => [a.id, a]));
  incoming.forEach((a) => map.set(a.id, a));
  return Array.from(map.values());
};

const fetchAllSources = async () => {
  if (isFetching) return;
  isFetching = true;
  notifyListeners();

  const apis = [
    { call: fetchLatestEarthquakes, name: 'Gempa BMKG' },
    { call: fetchExtremeWeather, name: 'Cuaca Ekstrem BMKG' },
    { call: fetchThreeDayForecast, name: 'Prakiraan 3 Hari BMKG' },
    { call: BMKGGisService.fetchSignatureData, name: 'Signature ArcGIS' },
    { call: BMKGGisService.fetchHotspotData, name: 'Hotspot ArcGIS' },
    { call: () => MagmaService.fetchLiveAlerts(false), name: 'Live Gunung Api Magma' }
  ];

  let pending = apis.length;

  apis.forEach(({ call, name }) => {
    call()
      .then((data) => {
        if (data && data.length > 0) {
          cachedAlerts = mergeAlerts(cachedAlerts, data);
          notifyListeners();
        }
      })
      .catch((e) => {
        console.error(`Failed to fetch ${name}:`, e);
        // Fallback for Magma live alerts if direct scraping fails
        if (name === 'Live Gunung Api Magma') {
          MagmaService.fetchLiveAlerts(true)
            .then((data) => {
              if (data && data.length > 0) {
                cachedAlerts = mergeAlerts(cachedAlerts, data);
                notifyListeners();
              }
            })
            .catch((err) => console.error('Fallback fetch for Magma failed:', err));
        }
      })
      .finally(() => {
        pending--;
        if (pending === 0) {
          cachedIsLoading = false;
          isFetching = false;
          lastCheckedTime = new Date();
          notifyListeners();
        }
      });
  });
};

const startGlobalPolling = () => {
  if (pollingIntervalId) return;
  fetchAllSources();
  pollingIntervalId = setInterval(() => {
    fetchAllSources();
  }, 60000); // Poll every 60 seconds
};

const stopGlobalPolling = () => {
  if (pollingIntervalId) {
    clearInterval(pollingIntervalId);
    pollingIntervalId = null;
  }
};

export const useAlerts = () => {
  const [alerts, setAlerts] = useState<DisasterAlert[]>(cachedAlerts);
  const [isLoading, setIsLoading] = useState(cachedIsLoading);
  const [fetching, setFetching] = useState(isFetching);
  const [lastChecked, setLastChecked] = useState<Date | null>(lastCheckedTime);

  useEffect(() => {
    const handleUpdate = () => {
      setAlerts(cachedAlerts);
      setIsLoading(cachedIsLoading);
      setFetching(isFetching);
      setLastChecked(lastCheckedTime);
    };

    listeners.add(handleUpdate);

    if (listeners.size === 1) {
      startGlobalPolling();
    }

    return () => {
      listeners.delete(handleUpdate);
      if (listeners.size === 0) {
        stopGlobalPolling();
      }
    };
  }, []);

  const stats = useMemo(
    () =>
      alerts.reduce(
        (acc, alert) => { acc[alert.severity]++; acc.total++; return acc; },
        { critical: 0, warning: 0, watch: 0, total: 0 }
      ),
    [alerts]
  );

  return {
    alerts,
    stats,
    isLoading,
    isFetching: fetching,
    lastCheckedTime: lastChecked,
    criticalAlerts: useMemo(() => alerts.filter((a) => a.severity === 'critical'), [alerts]),
    warningAlerts: useMemo(() => alerts.filter((a) => a.severity === 'warning'), [alerts]),
    watchAlerts: useMemo(() => alerts.filter((a) => a.severity === 'watch'), [alerts]),
    getAlertsByProvince: (provinceId: string) => alerts.filter((a) => a.provinceId === provinceId),
    getActiveAlertForProvince: (provinceId: string): DisasterAlert | undefined => {
      const list = alerts.filter((a) => a.provinceId === provinceId);
      if (list.length === 0) return undefined;
      const w = { critical: 3, warning: 2, watch: 1 } as const;
      return list.reduce((h, c) => (w[c.severity] || 0) > (w[h.severity] || 0) ? c : h);
    },
  };
};
