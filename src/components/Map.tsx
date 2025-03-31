'use client';

import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Use the correct access token
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoiYm9icmFpbmVyZCIsImEiOiJjbHNodnRtdXYwOWQ1Mm1vczZnOGtmZ2FqIn0.e86zwambUDUkVsxlf4LGQA';

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

  useEffect(() => {
    if (!mapContainer.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12', // Use streets style instead of satellite
      center: center,
      zoom: zoom
    });

    // Add markers
    markers.forEach(marker => {
      new mapboxgl.Marker()
        .setLngLat(marker.coordinates)
        .setPopup(new mapboxgl.Popup().setHTML(marker.title))
        .addTo(map.current!);
    });

    return () => {
      map.current?.remove();
    };
  }, [markers, center, zoom]);

  return <div ref={mapContainer} className="w-full h-full" />;
};

export default Map; 