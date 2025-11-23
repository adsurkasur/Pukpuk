"use client";

import { useCallback, useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Dynamically import MapContainer to avoid SSR issues
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
);
const GeoJSON = dynamic(
  () => import('react-leaflet').then((mod) => mod.GeoJSON),
  { ssr: false }
);

interface ChoroplethMapProps {
  geoJsonData: any;
  data: { [key: string]: number };
  mode: 'stock' | 'forecast';
  onRegionClick?: (regionId: string) => void;
}

export default function ChoroplethMap({ geoJsonData, data, mode, onRegionClick }: ChoroplethMapProps) {
  const [isClient, setIsClient] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Ensure client-side rendering only
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Color scale based on data values
  const getColor = useCallback((value: number) => {
    if (mode === 'stock') {
      return value > 80 ? '#00ff00' : // Green - Safe
             value > 50 ? '#ffff00' : // Yellow - Warning
             value > 20 ? '#ff8000' : // Orange - Critical
             '#ff0000'; // Red - Empty
    } else {
      return value > 100 ? '#ff0000' : // Red - High demand
             value > 50 ? '#ff8000' : // Orange - Medium
             value > 20 ? '#ffff00' : // Yellow - Low
             '#00ff00'; // Green - Very low
    }
  }, [mode]);

  const style = (feature: any) => {
    const regionId = feature.properties.id || feature.properties.name;
    const value = data[regionId] || 0;

    return {
      fillColor: getColor(value),
      weight: 2,
      opacity: 1,
      color: 'white',
      dashArray: '3',
      fillOpacity: 0.7
    };
  };

  const onEachFeature = (feature: any, layer: L.Layer) => {
    const regionId = feature.properties.id || feature.properties.name;
    const value = data[regionId] || 0;

    layer.on({
      click: () => onRegionClick?.(regionId)
    });

    layer.bindPopup(`
      <div>
        <h3>${feature.properties.name || regionId}</h3>
        <p>${mode === 'stock' ? 'Stock Level' : 'Forecast Demand'}: ${value}${mode === 'stock' ? '%' : ' tons'}</p>
      </div>
    `);
  };

  // Generate a stable key based on data and mode to prevent unnecessary re-mounts
  const mapKey = `map-${mode}-${Object.keys(data).length}`;

  if (!isClient) {
    return (
      <div className="w-full h-96 rounded-lg overflow-hidden border bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">Loading map...</p>
      </div>
    );
  }

  if (mapError) {
    return (
      <div className="w-full h-96 rounded-lg overflow-hidden border bg-red-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-medium">Map Error</p>
          <p className="text-red-500 text-sm">{mapError}</p>
        </div>
      </div>
    );
  }

  try {
    return (
      <div className="w-full h-96 rounded-lg overflow-hidden border">
        {geoJsonData ? (
          <MapContainer
            key={mapKey}
            center={[-6.2, 106.816666]} // Jakarta coordinates
            zoom={8}
            style={{ height: '100%', width: '100%' }}
            zoomControl={true}
            scrollWheelZoom={true}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <GeoJSON
              key={`geojson-${mapKey}`}
              data={geoJsonData}
              style={style}
              onEachFeature={onEachFeature}
            />
          </MapContainer>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <p className="text-gray-500">Loading map data...</p>
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('Map rendering error:', error);
    setMapError('Failed to render map. Please refresh the page.');
    return (
      <div className="w-full h-96 rounded-lg overflow-hidden border bg-red-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 font-medium">Map Rendering Failed</p>
          <p className="text-red-500 text-sm">Please refresh the page to try again.</p>
        </div>
      </div>
    );
  }
}