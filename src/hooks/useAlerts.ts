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
const listeners = new Set<() => void>();

const notifyListeners = () => {
  listeners.forEach((listener) => listener());
};

export const useAlerts = () => {
  const [alerts, setAlerts] = useState<DisasterAlert[]>(cachedAlerts);
  const [isLoading, setIsLoading] = useState(cachedIsLoading);

  useEffect(() => {
    const handleUpdate = () => {
      setAlerts(cachedAlerts);
      setIsLoading(cachedIsLoading);
    };

    listeners.add(handleUpdate);

    // Only load if the cache is empty and we're not already fetching
    if (cachedAlerts.length === 0 && !isFetching) {
      isFetching = true;
      cachedIsLoading = true;
      notifyListeners();

      Promise.all([
        fetchLatestEarthquakes().catch((e) => { console.error(e); return [] as DisasterAlert[]; }),
        fetchExtremeWeather().catch((e) => { console.error(e); return [] as DisasterAlert[]; }),
        fetchThreeDayForecast().catch((e) => { console.error(e); return [] as DisasterAlert[]; }),
        BMKGGisService.fetchSignatureData().catch((e) => { console.error(e); return [] as DisasterAlert[]; }),
        BMKGGisService.fetchHotspotData().catch((e) => { console.error(e); return [] as DisasterAlert[]; }),
        MagmaService.fetchLiveAlerts().catch((e) => { console.error(e); return [] as DisasterAlert[]; }),
      ]).then(([liveEarthquakes, liveExtremeWeather, threeDayForecast, gisSignature, gisHotspot, liveVolcanoes]) => {
        cachedAlerts = [
          ...liveEarthquakes,
          ...liveExtremeWeather,
          ...threeDayForecast,
          ...gisSignature,
          ...gisHotspot,
          ...liveVolcanoes
        ];
        cachedIsLoading = false;
        isFetching = false;
        notifyListeners();
      });
    }

    return () => {
      listeners.delete(handleUpdate);
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
