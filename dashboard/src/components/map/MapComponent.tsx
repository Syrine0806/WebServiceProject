'use client';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icons broken by webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface Vehicle {
  id: string;
  licensePlate: string;
  model: string;
  brand: string;
  type: string;
  status: string;
  lastPosition?: { latitude: number; longitude: number; speed: number; timestamp: string };
}

interface TrafficZone {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  vehicleCount: number;
  density: number;
  congestionLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface Incident {
  id: string;
  type: string;
  status: string;
  description: string;
  latitude: number;
  longitude: number;
}

interface Props {
  vehicles: Vehicle[];
  zones: TrafficZone[];
  incidents: Incident[];
}

const CONGESTION_COLORS: Record<string, string> = {
  LOW: '#22c55e',
  MEDIUM: '#f59e0b',
  HIGH: '#ef4444',
};

const INCIDENT_ICONS: Record<string, string> = {
  ACCIDENT: '💥',
  CONSTRUCTION: '🏗️',
  ROAD_CLOSED: '🚧',
  TRAFFIC_JAM: '🚗',
};

const STATUS_COLORS: Record<string, string> = {
  REPORTED: '#f59e0b',
  IN_PROGRESS: '#6366f1',
  RESOLVED: '#22c55e',
};

export default function MapComponent({ vehicles, zones, incidents }: Props) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Initialize map centered on Tunis
    const map = L.map(containerRef.current, {
      center: [36.8065, 10.1815],
      zoom: 12,
      zoomControl: true,
    });
    mapRef.current = map;

    // OpenStreetMap tile layer (free, no API key)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update layers when data changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove all existing layers except tile layer
    map.eachLayer((layer) => {
      if (!(layer instanceof L.TileLayer)) map.removeLayer(layer);
    });

    // ── Traffic Zones (colored circles) ─────────────────────────────
    zones.forEach((zone) => {
      const color = CONGESTION_COLORS[zone.congestionLevel] ?? '#6366f1';
      L.circle([Number(zone.latitude), Number(zone.longitude)], {
        radius: Number(zone.radius),
        color,
        fillColor: color,
        fillOpacity: 0.15,
        weight: 2,
      })
        .addTo(map)
        .bindPopup(`
          <div style="font-family:sans-serif;min-width:160px">
            <strong>🚦 ${zone.name}</strong><br/>
            <span style="color:${color};font-weight:600">${zone.congestionLevel}</span><br/>
            Véhicules : ${zone.vehicleCount}<br/>
            Densité : ${Number(zone.density).toFixed(6)}<br/>
            Rayon : ${zone.radius}m
          </div>
        `);
    });

    // ── Incidents ───────────────────────────────────────────────────
    incidents
      .filter((i) => i.status !== 'RESOLVED')
      .forEach((inc) => {
        const icon = INCIDENT_ICONS[inc.type] ?? '⚠️';
        const color = STATUS_COLORS[inc.status] ?? '#94a3b8';
        const marker = L.divIcon({
          html: `<div style="
            background:${color};
            width:34px;height:34px;border-radius:50%;
            display:flex;align-items:center;justify-content:center;
            font-size:16px;border:2px solid white;
            box-shadow:0 2px 6px rgba(0,0,0,0.4)">
            ${icon}
          </div>`,
          className: '',
          iconSize: [34, 34],
          iconAnchor: [17, 17],
        });
        L.marker([Number(inc.latitude), Number(inc.longitude)], { icon: marker })
          .addTo(map)
          .bindPopup(`
            <div style="font-family:sans-serif;min-width:160px">
              <strong>${icon} ${inc.type.replace('_', ' ')}</strong><br/>
              <span style="color:${color};font-weight:600">${inc.status.replace('_', ' ')}</span><br/>
              ${inc.description}
            </div>
          `);
      });

    // ── Vehicles ─────────────────────────────────────────────────────
    vehicles.forEach((veh) => {
      if (!veh.lastPosition) return;
      const { latitude, longitude, speed } = veh.lastPosition;
      const vIcon = L.divIcon({
        html: `<div style="
          background:#6366f1;
          width:30px;height:30px;border-radius:6px;
          display:flex;align-items:center;justify-content:center;
          font-size:14px;border:2px solid white;
          box-shadow:0 2px 6px rgba(0,0,0,0.4)">
          🚗
        </div>`,
        className: '',
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });
      L.marker([Number(latitude), Number(longitude)], { icon: vIcon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family:sans-serif;min-width:150px">
            <strong>🚗 ${veh.licensePlate}</strong><br/>
            ${veh.brand ?? ''} ${veh.model}<br/>
            Type : ${veh.type}<br/>
            Vitesse : ${speed ?? 0} km/h
          </div>
        `);
    });
  }, [vehicles, zones, incidents]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
