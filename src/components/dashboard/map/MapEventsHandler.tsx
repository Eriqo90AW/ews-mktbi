import React from 'react';
import { useMapEvents } from 'react-leaflet';

interface MapEventsHandlerProps {
  onClearSelection: () => void;
}

const MapEventsHandler: React.FC<MapEventsHandlerProps> = ({ onClearSelection }) => {
  useMapEvents({
    click: () => onClearSelection(),
  });
  return null;
};

export default MapEventsHandler;
