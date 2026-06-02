'use client';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface Vehicle {
  id: string;
  licensePlate: string;
  model: string;
  brand: string;
  type: string;
  status: string;
  lastPosition?: { latitude: number; longitude: number; speed: number; timestamp: string } | null;
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

const ZONE_COLORS: Record<string, string> = {
  LOW:    '#22c55e',
  MEDIUM: '#f59e0b',
  HIGH:   '#ef4444',
};

const STATUS_COLORS: Record<string, string> = {
  REPORTED:    '#f59e0b',
  IN_PROGRESS: '#6366f1',
  RESOLVED:    '#22c55e',
};

const INCIDENT_EMOJI: Record<string, string> = {
  ACCIDENT:    '💥',
  CONSTRUCTION:'🏗',
  ROAD_CLOSED: '🚧',
  TRAFFIC_JAM: '🚕',
};

const VEHICLE_EMOJI: Record<string, string> = {
  CAR:        '🚗',
  TRUCK:      '🚛',
  BUS:        '🚌',
  MOTORCYCLE: '🏍',
  EMERGENCY:  '🚑',
};

/** Build a pin-shaped SVG marker */
function pinIcon(emoji: string, bg: string, size = 40): L.DivIcon {
  return L.divIcon({
    html: `
      <svg width="${size}" height="${size + 8}" viewBox="0 0 ${size} ${size + 8}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 2}" fill="${bg}" stroke="white" stroke-width="3"/>
        <polygon points="${size / 2 - 6},${size - 2} ${size / 2 + 6},${size - 2} ${size / 2},${size + 6}"
                 fill="${bg}" stroke="white" stroke-width="1.5"/>
        <text x="${size / 2}" y="${size / 2 + 6}" text-anchor="middle" font-size="${size * 0.42}">${emoji}</text>
      </svg>`,
    className: '',
    iconSize:    [size, size + 8],
    iconAnchor:  [size / 2, size + 8],
    popupAnchor: [0, -(size + 8)],
  });
}

export default function MapComponent({ vehicles, zones, incidents }: Props) {
  const containerRef  = useRef<HTMLDivElement>(null);
  const mapRef        = useRef<L.Map | null>(null);
  const zonesGroupRef    = useRef<L.LayerGroup | null>(null);
  const incGroupRef      = useRef<L.LayerGroup | null>(null);
  const vehGroupRef      = useRef<L.LayerGroup | null>(null);

  // ── 1. Initialise the map once ──────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [36.8065, 10.1815],
      zoom: 13,
      zoomControl: true,
    });
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Separate layer groups — order matters: zones → incidents → vehicles (top)
    zonesGroupRef.current   = L.layerGroup().addTo(map);
    incGroupRef.current     = L.layerGroup().addTo(map);
    vehGroupRef.current     = L.layerGroup().addTo(map);

    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // ── 2. Update zones ─────────────────────────────────────────────────────
  useEffect(() => {
    const grp = zonesGroupRef.current;
    if (!grp) return;
    grp.clearLayers();

    zones.forEach((zone) => {
      const color = ZONE_COLORS[zone.congestionLevel] ?? '#6366f1';
      const lat   = Number(zone.latitude);
      const lng   = Number(zone.longitude);
      const r     = Number(zone.radius);

      // Filled circle for the zone
      L.circle([lat, lng], {
        radius:      r,
        color,
        fillColor:   color,
        fillOpacity: 0.18,
        weight:      2.5,
      }).addTo(grp).bindPopup(
        `<b>🚦 ${zone.name}</b><br>
         Congestion : <b style="color:${color}">${zone.congestionLevel}</b><br>
         Véhicules : ${zone.vehicleCount}<br>
         Rayon : ${r} m`
      );

      // Central dot so the zone is visible at any zoom
      L.circleMarker([lat, lng], {
        radius:      7,
        color,
        fillColor:   color,
        fillOpacity: 1,
        weight:      2,
      }).addTo(grp);
    });
  }, [zones]);

  // ── 3. Update incidents ─────────────────────────────────────────────────
  useEffect(() => {
    const grp = incGroupRef.current;
    if (!grp) return;
    grp.clearLayers();

    incidents
      .filter((i) => i.status !== 'RESOLVED')
      .forEach((inc) => {
        const lat   = Number(inc.latitude);
        const lng   = Number(inc.longitude);
        const color = STATUS_COLORS[inc.status] ?? '#94a3b8';
        const emoji = INCIDENT_EMOJI[inc.type] ?? '⚠️';

        if (Number.isNaN(lat) || Number.isNaN(lng)) return;

        // Big pulsing circle so the incident is always visible
        L.circleMarker([lat, lng], {
          radius:      18,
          color:       color,
          fillColor:   color,
          fillOpacity: 0.25,
          weight:      3,
        }).addTo(grp);

        // Pin icon on top
        L.marker([lat, lng], { icon: pinIcon(emoji, color, 38), zIndexOffset: 500 })
          .addTo(grp)
          .bindPopup(
            `<b>${emoji} ${inc.type.replaceAll('_', ' ')}</b><br>
             Statut : <b style="color:${color}">${inc.status.replaceAll('_', ' ')}</b><br>
             ${inc.description}`
          );
      });
  }, [incidents]);

  // ── 4. Update vehicles ──────────────────────────────────────────────────
  useEffect(() => {
    const grp = vehGroupRef.current;
    if (!grp) return;
    grp.clearLayers();

    vehicles.forEach((veh) => {
      if (!veh.lastPosition) return;
      const lat   = Number(veh.lastPosition.latitude);
      const lng   = Number(veh.lastPosition.longitude);
      const speed = veh.lastPosition.speed ?? 0;
      const emoji = VEHICLE_EMOJI[veh.type] ?? '🚗';

      if (Number.isNaN(lat) || Number.isNaN(lng)) return;

      L.marker([lat, lng], { icon: pinIcon(emoji, '#4f46e5', 38), zIndexOffset: 1000 })
        .addTo(grp)
        .bindPopup(
          `<b>${emoji} ${veh.licensePlate}</b><br>
           ${veh.brand ?? ''} ${veh.model}<br>
           Type : ${veh.type}<br>
           Vitesse : <b>${speed} km/h</b><br>
           Statut : ${veh.status}`
        );
    });
  }, [vehicles]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
