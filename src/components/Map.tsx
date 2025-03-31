'use client';

import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Use a restricted token with only the necessary scopes
const MAPBOX_TOKEN = 'pk.eyJ1IjoiYm9icmFpbmVyZCIsImEiOiJjbHNpMXB5Y2cwMjJqMnFxbXB3ZWx0ZXlsIn0.HHePY4xUmR9gJ_JUkLnrjg';

mapboxgl.accessToken = MAPBOX_TOKEN;

interface MapMarker {
  coordinates: [number, number];
  title?: string;
}

interface MapProps {
  markers: Array<{
    coordinates: [number, number];
    title: string;
  }>;
  center: [number, number];
  zoom: number;
}

const Map = ({ markers, center, zoom }: MapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    try {
      if (!map.current) {
        map.current = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/navigation-day-v1',
          center: center,
          zoom: zoom,
          attributionControl: false,
          dragRotate: false,
          pitchWithRotate: false,
          touchZoomRotate: false
        });

        map.current.on('load', () => {
          if (!map.current) return;
          
          // Add markers after map loads
          markers.forEach(marker => {
            new mapboxgl.Marker({
              color: '#cc0000'
            })
              .setLngLat(marker.coordinates)
              .setPopup(
                new mapboxgl.Popup({ offset: 25, closeButton: false })
                  .setHTML(`<div style="padding: 8px; font-weight: 500;">${marker.title}</div>`)
              )
              .addTo(map.current!);
          });
        });

        map.current.on('error', (e) => {
          console.error('Mapbox error:', e);
          setError('Failed to load map');
        });
      }
    } catch (error) {
      console.error('Error initializing map:', error);
      setError('Failed to initialize map');
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [markers, center, zoom]);

  if (error) {
    return (
      <div className="w-full h-[300px] rounded-xl bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  return (
    <div 
      ref={mapContainer} 
      className="w-full h-[300px] rounded-xl overflow-hidden"
      style={{ position: 'relative' }}
    />
  );
};

export default Map; 