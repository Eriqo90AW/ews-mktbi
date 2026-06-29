import { useState, useMemo, useEffect } from 'react';
import type { DisasterAlert, AlertSeverity, DisasterType } from '../types';
import { fetchLatestEarthquakes, fetchExtremeWeather, fetchThreeDayForecast } from '../services/bmkgService';
import { BMKGGisService } from '../services/bmkgGisService';
import { BnpbInariskService } from '../services/bnpbInariskService';
import { KPWBI_OFFICES } from '../constants/kpwbiOffices';

export const useAlerts = () => {
  const [alerts, setAlerts] = useState<DisasterAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadAlerts() {
      setIsLoading(true);
      
      // Start BMKG fetches (these are typically faster, fetching direct XMLs/JSONs)
      const bmkgPromises = Promise.all([
        fetchLatestEarthquakes().catch(e => { console.error(e); return []; }),
        fetchExtremeWeather().catch(e => { console.error(e); return []; }),
        fetchThreeDayForecast().catch(e => { console.error(e); return []; }),
        BMKGGisService.fetchSignatureData().catch(e => { console.error(e); return []; }),
        BMKGGisService.fetchHotspotData().catch(e => { console.error(e); return []; })
      ]);

      // Start BNPB fetches (typically slower due to 4 multi-point external proxy API calls)
      const bnpbPromise = BnpbInariskService.fetchInaRiskAlerts(KPWBI_OFFICES).catch(e => { console.error(e); return []; });

      // Handle BMKG Data as soon as it resolves
      bmkgPromises.then(bmkgData => {
        if (!active) return;
        
        const [liveEarthquakes, liveExtremeWeather, threeDayForecast, gisSignature, gisHotspot] = bmkgData;
        
        setAlerts(prevAlerts => {
          // Check if we are updating from empty or merging (in case bnpb resolved exceptionally fast)
          // We use functional state update to guarantee we don't overwrite data
          return [
            ...prevAlerts,
            ...liveEarthquakes,
            ...liveExtremeWeather,
            ...threeDayForecast,
            ...gisSignature,
            ...gisHotspot
          ];
        });
        
        // Stop primary loading spinner as soon as BMKG is done
        setIsLoading(false);
      });

      // Handle BNPB Data as soon as it resolves
      bnpbPromise.then(inariskAlerts => {
        if (!active) return;
        
        setAlerts(prevAlerts => {
          return [
            ...prevAlerts,
            ...inariskAlerts
          ];
        });
      });
    }

    loadAlerts();

    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    return alerts.reduce(
      (acc, alert) => {
        acc[alert.severity]++;
        acc.total++;
        return acc;
      },
      { critical: 0, warning: 0, watch: 0, total: 0 }
    );
  }, [alerts]);

  const criticalAlerts = useMemo(() => {
    return alerts.filter((a) => a.severity === 'critical');
  }, [alerts]);

  const warningAlerts = useMemo(() => {
    return alerts.filter((a) => a.severity === 'warning');
  }, [alerts]);

  const watchAlerts = useMemo(() => {
    return alerts.filter((a) => a.severity === 'watch');
  }, [alerts]);

  // Helper to fetch all alerts for a specific province
  const getAlertsByProvince = (provinceId: string): DisasterAlert[] => {
    return alerts.filter((a) => a.provinceId === provinceId);
  };

  // Helper to fetch the highest severity alert for a province (for marker overrides)
  const getActiveAlertForProvince = (provinceId: string): DisasterAlert | undefined => {
    const provinceAlerts = getAlertsByProvince(provinceId);
    if (provinceAlerts.length === 0) return undefined;

    // Sort by severity weight: critical > warning > watch
    const severityWeight = { critical: 3, warning: 2, watch: 1 };
    return provinceAlerts.reduce((highest, current) => {
      const highestWeight = severityWeight[highest.severity] || 0;
      const currentWeight = severityWeight[current.severity] || 0;
      return currentWeight > highestWeight ? current : highest;
    });
  };

  // Filter alerts based on active filters
  const getFilteredAlerts = (
    severityFilter: AlertSeverity | 'all',
    typeFilter: DisasterType | 'all'
  ): DisasterAlert[] => {
    return alerts.filter((alert) => {
      const matchesSeverity = severityFilter === 'all' || alert.severity === severityFilter;
      const matchesType = typeFilter === 'all' || alert.type === typeFilter;
      return matchesSeverity && matchesType;
    });
  };

  return {
    alerts,
    stats,
    isLoading,
    criticalAlerts,
    warningAlerts,
    watchAlerts,
    getAlertsByProvince,
    getActiveAlertForProvince,
    getFilteredAlerts,
  };
};
