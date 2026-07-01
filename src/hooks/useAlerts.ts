import { useState, useMemo, useEffect } from 'react';
import type { DisasterAlert, AlertSeverity } from '../types';
import { fetchLatestEarthquakes, fetchExtremeWeather, fetchThreeDayForecast, fetchHighRainfallWarning, fetchEarlyWarning } from '../services/bmkgService';
import { MagmaService } from '../services/magmaService';
import { BnpbKarhutlaService } from '../services/bnpbKarhutlaService';

// InaRisk / BNPB data is shown in the Kerentanan screen, not as live alerts.
// This hook only aggregates real-time BMKG alert streams.

// Global cache variables to persist data across component mounts
const ALERTS_STORAGE_KEY = 'ews_cached_alerts';

let cachedAlerts: DisasterAlert[] = [];
try {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(ALERTS_STORAGE_KEY);
    if (stored) {
      cachedAlerts = JSON.parse(stored);
    }
  }
} catch (e) {
  console.error('Failed to parse cached alerts from localStorage', e);
}

let cachedIsLoading = cachedAlerts.length === 0;
let isFetching = false;
let lastCheckedTime: Date | null = null;
let pollingIntervalId: any = null;
let cachedLoadingSources: string[] = [];
const listeners = new Set<() => void>();

const notifyListeners = () => {
  listeners.forEach((listener) => listener());
};

const mergeAlerts = (existing: DisasterAlert[], incoming: DisasterAlert[]) => {
  const map = new Map(existing.map((a) => [a.id, a]));
  let hasChanges = false;
  
  incoming.forEach((a) => {
    if (!map.has(a.id)) {
      map.set(a.id, a);
      hasChanges = true;
    }
  });
  
  const merged = Array.from(map.values());
  
  if (hasChanges || existing.length === 0) {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(merged));
      }
    } catch (e) {
      console.error('Failed to save alerts to localStorage', e);
    }
  }
  
  return merged;
};

const fetchAllSources = async () => {
  if (isFetching) return;
  isFetching = true;
  cachedLoadingSources = ['Gempa BMKG', 'Cuaca Ekstrem BMKG', 'Peringatan Dini Cuaca BMKG', 'Prakiraan 3 Hari BMKG', 'Curah Hujan Tinggi BMKG', 'Live Gunung Api Magma', 'Karhutla BNPB'];
  notifyListeners();

  const apis = [
    { call: fetchLatestEarthquakes, name: 'Gempa BMKG' },
    { call: fetchExtremeWeather, name: 'Cuaca Ekstrem BMKG' },
    { call: fetchEarlyWarning, name: 'Peringatan Dini Cuaca BMKG' },
    { call: fetchThreeDayForecast, name: 'Prakiraan 3 Hari BMKG' },
    { call: fetchHighRainfallWarning, name: 'Curah Hujan Tinggi BMKG' },
    { call: () => MagmaService.fetchLiveAlerts(false), name: 'Live Gunung Api Magma' },
    { call: () => BnpbKarhutlaService.fetchKarhutlaAlerts(true), name: 'Karhutla BNPB' }
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
        if (name === 'Karhutla BNPB') {
          BnpbKarhutlaService.fetchKarhutlaAlerts(false)
            .then((data) => {
              if (data && data.length > 0) {
                cachedAlerts = mergeAlerts(cachedAlerts, data);
                notifyListeners();
              }
            })
            .catch((err) => console.error('Fallback fetch for Karhutla failed:', err));
        }
      })
      .finally(() => {
        cachedLoadingSources = cachedLoadingSources.filter((s) => s !== name);
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
  const [loadingSources, setLoadingSources] = useState<string[]>(cachedLoadingSources);

  useEffect(() => {
    const handleUpdate = () => {
      setAlerts(cachedAlerts);
      setIsLoading(cachedIsLoading);
      setFetching(isFetching);
      setLastChecked(lastCheckedTime);
      setLoadingSources(cachedLoadingSources);
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
        { 3: 0, 2: 0, 1: 0, total: 0 } as Record<AlertSeverity | 'total', number>
      ),
    [alerts]
  );

  return {
    alerts,
    stats,
    isLoading,
    isFetching: fetching,
    loadingSources,
    lastCheckedTime: lastChecked,
    criticalAlerts: useMemo(() => alerts.filter((a) => a.severity === 3), [alerts]),
    warningAlerts: useMemo(() => alerts.filter((a) => a.severity === 2), [alerts]),
    watchAlerts: useMemo(() => alerts.filter((a) => a.severity === 1), [alerts]),
    getAlertsByProvince: (provinceId: string) => alerts.filter((a) => a.provinceId === provinceId),
    getActiveAlertForProvince: (provinceId: string): DisasterAlert | undefined => {
      const list = alerts.filter((a) => a.provinceId === provinceId);
      if (list.length === 0) return undefined;
      return list.reduce((h, c) => (c.severity || 0) > (h.severity || 0) ? c : h);
    },
  };
};