'use client';

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

interface MapProps {
  markers?: Array<{
    coordinates: [number, number];
    title: string;
  }>;
  center?: [number, number];
  zoom?: number;
  onMapLoad?: (map: mapboxgl.Map) => void;
}

export default function Map({ markers = [], center = [-71.0589, 42.3601], zoom = 13, onMapLoad }: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/bobrainerd/cm5hw1fvj002h01qfbev0e2qe',
      center: center,
      zoom: zoom,
      attributionControl: false,
      maxPitch: 45
    });

    if (onMapLoad) {
      onMapLoad(map.current);
    }

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update markers when they change
  useEffect(() => {
    if (!map.current) return;

    // Remove existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    markers.forEach(marker => {
      const el = document.createElement('div');
      el.className = 'marker';
      
      const newMarker = new mapboxgl.Marker({
        element: el,
        color: '#BA2525'
      })
        .setLngLat(marker.coordinates)
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
              <div class="p-1">
                <h3 class="font-semibold text-[#BA2525] mb-1">${marker.title}</h3>
                <p class="text-xs text-gray-600">[${marker.coordinates[0].toFixed(4)}, ${marker.coordinates[1].toFixed(4)}]</p>
              </div>
            `)
        )
        .addTo(map.current!);

      markersRef.current.push(newMarker);
    });

    // If there are markers, fit the map to show them all with less zoom
    if (markers.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      markers.forEach(marker => bounds.extend(marker.coordinates));
      map.current.fitBounds(bounds, {
        padding: { top: 100, bottom: 100, left: 100, right: 100 },
        maxZoom: 13 // Limit maximum zoom level
      });
    }
  }, [markers]);

  return (
    <div ref={mapContainer} className="w-full h-full rounded-xl overflow-hidden" />
  );
} 