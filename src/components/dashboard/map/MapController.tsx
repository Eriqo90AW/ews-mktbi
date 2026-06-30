import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import type { KpwbiOffice, DisasterAlert } from '../../../types';
import { KPWBI_OFFICES } from '../../../constants/kpwbiOffices';
import { isValidCoord } from '../../../utils/geo';

interface MapControllerProps {
  selectedOffice: KpwbiOffice | null;
  selectedAlert: DisasterAlert | null;
  resetTrigger?: number;
  isSidebarCollapsed?: boolean;
}

const INDONESIA_CENTER: [number, number] = [-2.5489, 118.0149];
const DEFAULT_ZOOM = 5;
const DETAIL_ZOOM = 9;

const MapController: React.FC<MapControllerProps> = ({ selectedOffice, selectedAlert, resetTrigger, isSidebarCollapsed }) => {
  const map = useMap();
  const prevResetTrigger = useRef(resetTrigger);

  useEffect(() => {
    // Force Leaflet to update its size when sidebar collapse toggles
    map.invalidateSize();
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 350); // matches standard sidebar CSS transitions
    return () => clearTimeout(timer);
  }, [isSidebarCollapsed, map]);

  useEffect(() => {
    try {
      if (resetTrigger !== prevResetTrigger.current) {
        prevResetTrigger.current = resetTrigger;
        map.flyTo(INDONESIA_CENTER, DEFAULT_ZOOM, { duration: 1.5, animate: true });
        return;
      }

      if (selectedAlert) {
        if (isValidCoord(selectedAlert.latitude, selectedAlert.longitude)) {
          map.flyTo(
            [Number(selectedAlert.latitude), Number(selectedAlert.longitude)],
            DETAIL_ZOOM,
            { duration: 1.5, animate: true }
          );
        } else {
          const office = KPWBI_OFFICES.find((o) => o.provinceId === selectedAlert.provinceId);
          if (office && isValidCoord(office.latitude, office.longitude)) {
            map.flyTo([office.latitude, office.longitude], DETAIL_ZOOM, { duration: 1.5, animate: true });
          }
        }
      } else if (selectedOffice) {
        if (isValidCoord(selectedOffice.latitude, selectedOffice.longitude)) {
          map.flyTo([selectedOffice.latitude, selectedOffice.longitude], DETAIL_ZOOM, { duration: 1.5, animate: true });
        }
      } else {
        map.flyTo(INDONESIA_CENTER, DEFAULT_ZOOM, { duration: 1.5, animate: true });
      }
    } catch (err) {
      console.error('MapController flyTo error:', err);
    }
  }, [selectedOffice, selectedAlert, resetTrigger, map]);

  return null;
};

export default MapController;
