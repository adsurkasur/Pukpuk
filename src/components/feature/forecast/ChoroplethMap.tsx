"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
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
  onRegionClick?: (_regionId: string) => void;
}

export default function ChoroplethMap({ geoJsonData, data, mode, onRegionClick }: ChoroplethMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isClient, setIsClient] = useState(false);
  const [mapKey, setMapKey] = useState(0);

  // Ensure client-side rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Force re-mount when critical props change
  useEffect(() => {
    if (geoJsonData && isClient) {
      // Clean up existing map before creating new one
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      setMapKey(prev => prev + 1);
    }
  }, [geoJsonData, mode, isClient]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
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
    const _regionId = feature.properties.id || feature.properties.name;
    const value = data[_regionId] || 0;

    // Use regionId to ensure it's not considered unused
    const displayName = _regionId;

    layer.on({
      click: () => onRegionClick?.(_regionId)
    });

    layer.bindPopup(`
      <div>
        <h3>${feature.properties.name || displayName}</h3>
        <p>${mode === 'stock' ? 'Stock Level' : 'Forecast Demand'}: ${value}${mode === 'stock' ? '%' : ' tons'}</p>
      </div>
    `);
  };

  return (
    <div ref={containerRef} className="w-full h-96 rounded-lg overflow-hidden border">
      {isClient && geoJsonData && (
        <MapContainer
          key={mapKey}
          center={[-6.2, 106.816666]} // Jakarta coordinates
          zoom={8}
          style={{ height: '100%', width: '100%' }}
          whenReady={() => {
            // Map is ready - this callback ensures we don't double-initialize
            console.log('Map initialized successfully');
          }}
          ref={(mapInstance) => {
            // Only set the ref if it's not already set and we have a valid instance
            if (mapInstance && !mapRef.current) {
              mapRef.current = mapInstance;
            }
          }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <GeoJSON
            data={geoJsonData}
            style={style}
            onEachFeature={onEachFeature}
          />
        </MapContainer>
      )}
      {isClient && !geoJsonData && (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
          <p className="text-gray-500">Loading map data...</p>
        </div>
      )}
    </div>
  );
}