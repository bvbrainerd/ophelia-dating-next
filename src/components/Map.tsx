'use client';

import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Set the access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '';

interface MapMarker {
  coordinates: [number, number];
  title?: string;
}

interface MapProps {
  markers: MapMarker[];
  center: [number, number];
  zoom: number;
}

const Map = ({ center, zoom, markers }: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!mapContainer.current || isInitialized.current) return;
    isInitialized.current = true;

    try {
      // Clear any existing content
      if (mapContainer.current) {
        mapContainer.current.innerHTML = '';
      }

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: center,
        zoom: zoom,
        attributionControl: false,
        pitch: 45,
        bearing: -17.6,
        interactive: true,
        preserveDrawingBuffer: true,
        antialias: true
      });

      // Add markers after map loads
      map.current.on('load', () => {
        const mapInstance = map.current;
        if (!mapInstance) return;

        // Add markers
        markers.forEach(marker => {
          const el = document.createElement('div');
          el.className = 'custom-marker';
          el.innerHTML = `<svg width="36" height="36" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C12 22 20 14 20 9C20 4.58172 16.4183 1 12 1C7.58172 1 4 4.58172 4 9C4 14 12 22 12 22Z" fill="#BA2525" stroke="#BA2525" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="12" cy="9" r="3" fill="white"/>
          </svg>`;
          el.style.width = '36px';
          el.style.height = '36px';

          new mapboxgl.Marker(el)
            .setLngLat(marker.coordinates)
            .addTo(mapInstance);
        });
      });

    } catch (error) {
      console.error('Error initializing map:', error);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
        isInitialized.current = false;
      }
    };
  }, [center, zoom, markers]);

  return (
    <div 
      ref={mapContainer} 
      className="w-full h-[400px] rounded-xl overflow-hidden shadow-lg relative"
      style={{ minHeight: '400px' }}
    />
  );
};

export default Map; 