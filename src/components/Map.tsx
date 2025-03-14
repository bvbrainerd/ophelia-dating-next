'use client';

import React, { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { Feature, Point, FeatureCollection } from 'geojson';
import 'mapbox-gl/dist/mapbox-gl.css';

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
    // Clear any existing content in the container
    if (mapContainer.current) {
      mapContainer.current.innerHTML = '';
    }

    if (!mapContainer.current || isInitialized.current) return;
    isInitialized.current = true;

    // Create and load pin images
    const pinImage = new Image();
    const shadowImage = new Image();
    
    pinImage.src = "data:image/svg+xml,%3Csvg width='40' height='60' viewBox='0 0 40 60' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 0C9 0 0 9 0 20C0 35 20 60 20 60C20 60 40 35 40 20C40 9 31 0 20 0Z' fill='%23cc0000'/%3E%3Ccircle cx='20' cy='20' r='8' fill='white'/%3E%3C/svg%3E";
    shadowImage.src = "data:image/svg+xml,%3Csvg width='40' height='10' viewBox='0 0 40 10' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cellipse cx='20' cy='5' rx='20' ry='5' fill='black' fill-opacity='0.3'/%3E%3C/svg%3E";

    // Wait for images to load before initializing map
    Promise.all([
      new Promise(resolve => { pinImage.onload = resolve; }),
      new Promise(resolve => { shadowImage.onload = resolve; })
    ]).then(() => {
      if (!mapContainer.current) return;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: center,
        zoom: zoom,
        pitch: 60,
        bearing: -17.6,
        antialias: true,
        attributionControl: false
      });

      // Add loading indicator
      const loadingIndicator = document.createElement('div');
      loadingIndicator.className = 'absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10';
      loadingIndicator.innerHTML = '<div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#cc0000]"></div>';
      mapContainer.current.appendChild(loadingIndicator);

      // Wait for both style and source to load
      map.current.on('style.load', () => {
        const map3D = map.current!;
        
        // Remove loading indicator
        loadingIndicator.remove();

        // Load pin images
        map3D.addImage('pin', pinImage);
        map3D.addImage('shadow', shadowImage);

        // Add 3D buildings layer with enhanced settings
        if (!map3D.getLayer('3d-buildings')) {
          map3D.addLayer({
            'id': '3d-buildings',
            'source': 'composite',
            'source-layer': 'building',
            'filter': ['==', 'extrude', 'true'],
            'type': 'fill-extrusion',
            'minzoom': 12,
            'paint': {
              'fill-extrusion-color': '#aaa',
              'fill-extrusion-height': [
                'interpolate',
                ['linear'],
                ['zoom'],
                15,
                0,
                15.05,
                ['get', 'height']
              ],
              'fill-extrusion-base': [
                'interpolate',
                ['linear'],
                ['zoom'],
                15,
                0,
                15.05,
                ['get', 'min_height']
              ],
              'fill-extrusion-opacity': 0.8
            }
          }, 'waterway-label');
        }

        // Add terrain with enhanced settings
        map3D.addSource('mapbox-dem', {
          'type': 'raster-dem',
          'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
          'tileSize': 512,
          'maxzoom': 14
        });
        
        map3D.setTerrain({ 
          'source': 'mapbox-dem', 
          'exaggeration': 1.8
        });

        // Add enhanced fog effect
        map3D.setFog({
          'range': [0.5, 10],
          'color': '#242B4B',
          'horizon-blend': 0.2
        });

        // Add markers as a GeoJSON source
        const markerPoints: FeatureCollection<Point> = {
          'type': 'FeatureCollection',
          'features': markers.map(marker => ({
            'type': 'Feature',
            'geometry': {
              'type': 'Point',
              'coordinates': marker.coordinates
            },
            'properties': {
              'title': marker.title
            }
          }))
        };

        map3D.addSource('markers', {
          'type': 'geojson',
          'data': markerPoints
        });

        // Add enhanced shadow layer
        map3D.addLayer({
          'id': 'marker-shadow',
          'type': 'symbol',
          'source': 'markers',
          'layout': {
            'icon-image': 'shadow',
            'icon-size': 0.8,
            'icon-allow-overlap': true,
            'icon-ignore-placement': true
          },
          'paint': {
            'icon-opacity': 0.6
          }
        });

        // Add enhanced pin layer
        map3D.addLayer({
          'id': 'marker-pin',
          'type': 'symbol',
          'source': 'markers',
          'layout': {
            'icon-image': 'pin',
            'icon-size': 1,
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
            'icon-anchor': 'bottom'
          },
          'paint': {
            'icon-translate': [0, -5],
          }
        });

        // Add enhanced glow effect
        map3D.addLayer({
          'id': 'marker-glow',
          'type': 'circle',
          'source': 'markers',
          'paint': {
            'circle-radius': 20,
            'circle-color': '#cc0000',
            'circle-opacity': 0.15,
            'circle-blur': 1.5
          }
        }, 'marker-shadow');

        // Add click interaction
        map3D.on('click', 'marker-pin', (e) => {
          if (!e.features?.[0]?.geometry || e.features[0].geometry.type !== 'Point') return;
          
          const coordinates = e.features[0].geometry.coordinates as [number, number];
          map3D.flyTo({
            center: coordinates,
            zoom: Math.max(map3D.getZoom(), 16),
            duration: 1000
          });
        });

        // Change cursor on hover
        map3D.on('mouseenter', 'marker-pin', () => {
          map3D.getCanvas().style.cursor = 'pointer';
        });
        
        map3D.on('mouseleave', 'marker-pin', () => {
          map3D.getCanvas().style.cursor = '';
        });
      });

      // Add minimal navigation controls
      map.current.addControl(
        new mapboxgl.NavigationControl({
          showCompass: false,
          showZoom: true,
          visualizePitch: true
        }),
        'top-right'
      );
    });

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
      className="w-full h-48 min-h-[12rem] rounded-xl overflow-hidden shadow-lg relative"
      style={{ minHeight: '192px' }}
    />
  );
};

export default Map; 