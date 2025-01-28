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
        center: center,
        zoom: zoom,
        accessToken: process.env.NEXT_PUBLIC_MAPBOX_TOKEN
      });
    } else {
      // Update center and zoom if map exists
      map.current.setCenter(center);
      map.current.setZoom(zoom);
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
        el.style.transition = 'transform 0.2s';
        el.style.animation = 'pulse 2s infinite';

        // Add pulse animation
        if (!document.querySelector('#marker-pulse-animation')) {
          const style = document.createElement('style');
          style.id = 'marker-pulse-animation';
          style.textContent = `
            @keyframes pulse {
              0% { transform: scale(1); box-shadow: 0 2px 6px rgba(186, 37, 37, 0.4); }
              50% { transform: scale(1.1); box-shadow: 0 3px 8px rgba(186, 37, 37, 0.6); }
              100% { transform: scale(1); box-shadow: 0 2px 6px rgba(186, 37, 37, 0.4); }
            }
          `;
          document.head.appendChild(style);
        }

        // Add popup with improved styling
        const popup = new mapboxgl.Popup({ 
          offset: 25,
          className: 'custom-popup'
        })
          .setHTML(`
            <h3 style="
              font-weight: 600; 
              padding: 12px;
              color: #BA2525;
              font-size: 14px;
              text-align: center;
            ">${marker.title}</h3>
          `);

        // Create and add marker
        const newMarker = new mapboxgl.Marker(el)
          .setLngLat(marker.coordinates)
          .setPopup(popup)
          .addTo(map.current!);

        markersRef.current.push(newMarker);
      });

      // Fit bounds if there are markers
      if (markers.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        markers.forEach(marker => bounds.extend(marker.coordinates));
        map.current.fitBounds(bounds, {
          padding: 50,
          maxZoom: 15
        });
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