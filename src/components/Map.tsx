'use client';

import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

interface MapProps {
  center: [number, number];
  zoom: number;
  markers?: Array<{
    coordinates: [number, number];
    title: string;
  }>;
  onMapLoad?: (map: mapboxgl.Map) => void;
}

const Map: React.FC<MapProps> = ({ center, zoom, markers = [], onMapLoad }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map if it doesn't exist
    if (!map.current) {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: markers.length === 1 ? markers[0].coordinates : center,
        zoom: markers.length === 1 ? 15 : zoom,
        accessToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN
      });
    }

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const addMarkersAndFitBounds = () => {
      if (!map.current) return;

      // Add markers
      markers.forEach(marker => {
        // Create a DOM element for the marker
        const el = document.createElement('div');
        el.className = 'custom-marker';
        el.style.width = '24px';
        el.style.height = '24px';
        el.style.backgroundColor = '#BA2525';
        el.style.border = '3px solid #ffffff';
        el.style.borderRadius = '50%';
        el.style.boxShadow = '0 2px 6px rgba(186, 37, 37, 0.4)';
        el.style.cursor = 'pointer';

        // Create and add marker
        const newMarker = new mapboxgl.Marker(el)
          .setLngLat(marker.coordinates)
          .setPopup(
            new mapboxgl.Popup({ offset: 25 })
              .setHTML(`<div style="padding: 8px; font-weight: 500;">${marker.title}</div>`)
          )
          .addTo(map.current);

        markersRef.current.push(newMarker);
      });

      // Fit bounds if there are multiple markers
      if (markers.length > 1) {
        const bounds = new mapboxgl.LngLatBounds();
        markers.forEach(marker => bounds.extend(marker.coordinates));
        map.current.fitBounds(bounds, {
          padding: { top: 50, bottom: 50, left: 50, right: 50 },
          maxZoom: 15
        });
      } else if (markers.length === 1) {
        // For single marker, center on it
        map.current.setCenter(markers[0].coordinates);
        map.current.setZoom(15);
      }
    };

    // Add markers after map is loaded
    if (map.current.loaded()) {
      addMarkersAndFitBounds();
    } else {
      map.current.on('load', addMarkersAndFitBounds);
    }

    if (onMapLoad && map.current && map.current.loaded()) {
      onMapLoad(map.current as mapboxgl.Map);
    }

    // Cleanup function
    return () => {
      // First remove all markers
      markersRef.current.forEach(marker => {
        if (marker) marker.remove();
      });
      markersRef.current = [];

      // Then remove the map instance if it exists
      if (map.current) {
        try {
          map.current.remove();
        } catch (error) {
          console.warn('Error removing map:', error);
        }
        map.current = null;
      }
    };
  }, [center, zoom, markers, onMapLoad]);

  return <div ref={mapContainer} style={{ width: '100%', height: '100%' }} />;
};

export default Map; 