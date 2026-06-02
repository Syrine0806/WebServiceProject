'use client';
import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ── Types ────────────────────────────────────────────────────────────────────
export interface Vehicle {
  id: string;
  licensePlate: string;
  model: string;
  brand: string;
  type: string;
  status: string;
  lastPosition: { latitude: number; longitude: number; speed: number; timestamp: string } | null;
}
export interface TrafficZone {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  vehicleCount: number;
  density: number;
  congestionLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}
export interface Incident {
  id: string;
  type: string;
  status: string;
  description: string;
  latitude: number;
  longitude: number;
}
export interface MapProps {
  vehicles: Vehicle[];
  zones: TrafficZone[];
  incidents: Incident[];
}

// ── Visual constants ─────────────────────────────────────────────────────────
const ZONE_COLOR: Record<string, string> = {
  LOW: '#22c55e', MEDIUM: '#f59e0b', HIGH: '#ef4444',
};
const STATUS_COLOR: Record<string, string> = {
  REPORTED: '#f59e0b', IN_PROGRESS: '#818cf8', RESOLVED: '#22c55e',
};
const INC_EMOJI: Record<string, string> = {
  ACCIDENT: '💥', CONSTRUCTION: '🏗', ROAD_CLOSED: '🚧', TRAFFIC_JAM: '🚕',
};
const VEH_EMOJI: Record<string, string> = {
  CAR: '🚗', TRUCK: '🚛', BUS: '🚌', MOTORCYCLE: '🏍', EMERGENCY: '🚑',
};

// ── Spread overlapping markers ────────────────────────────────────────────────
// Items rounded to the same 3-decimal position (~100 m) are arranged in a
// circle so each one remains individually clickable.
function spreadPositions<T>(
  items: T[],
  getCoords: (item: T) => [number, number],
): Map<T, [number, number]> {
  const result = new Map<T, [number, number]>();
  const groups = new Map<string, T[]>();

  items.forEach((item) => {
    const [lat, lng] = getCoords(item);
    const key = `${lat.toFixed(3)},${lng.toFixed(3)}`;
    const existing = groups.get(key);
    if (existing) {
      existing.push(item);
    } else {
      groups.set(key, [item]);
    }
  });

  groups.forEach((group) => {
    const [baseLat, baseLng] = getCoords(group[0]);
    if (group.length === 1) {
      result.set(group[0], [baseLat, baseLng]);
      return;
    }
    // Radius grows slightly with group size (~130 m base)
    const spread = 0.0012 + 0.0003 * Math.max(0, group.length - 2);
    group.forEach((item, i) => {
      const angle = (2 * Math.PI * i) / group.length - Math.PI / 2;
      result.set(item, [
        baseLat + spread * Math.cos(angle),
        baseLng + spread * Math.sin(angle),
      ]);
    });
  });

  return result;
}

// ── Marker builders ───────────────────────────────────────────────────────────
function vehiclePin(emoji: string): L.DivIcon {
  return L.divIcon({
    html: `
      <svg width="40" height="50" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="18" fill="#4f46e5" stroke="white" stroke-width="3"
          filter="drop-shadow(0 3px 5px rgba(0,0,0,.5))"/>
        <polygon points="13,36 27,36 20,48" fill="#4f46e5" stroke="white" stroke-width="1.5"/>
        <text x="20" y="27" text-anchor="middle" font-size="16">${emoji}</text>
      </svg>`,
    className: '',
    iconSize: [40, 50], iconAnchor: [20, 50], popupAnchor: [0, -52],
  });
}

function incidentPin(emoji: string, color: string): L.DivIcon {
  return L.divIcon({
    html: `
      <svg width="54" height="60" viewBox="0 0 54 60" xmlns="http://www.w3.org/2000/svg">
        <!-- Pulsing outer ring -->
        <circle cx="27" cy="27" r="26" fill="${color}" opacity="0.22"/>
        <!-- Main circle -->
        <circle cx="27" cy="27" r="21" fill="${color}" stroke="white" stroke-width="3.5"
          filter="drop-shadow(0 3px 7px rgba(0,0,0,.55))"/>
        <!-- Tail -->
        <polygon points="20,46 34,46 27,58" fill="${color}" stroke="white" stroke-width="2"/>
        <!-- Emoji centred -->
        <text x="27" y="35" text-anchor="middle" font-size="20">${emoji}</text>
      </svg>`,
    className: '',
    iconSize: [54, 60], iconAnchor: [27, 60], popupAnchor: [0, -62],
  });
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function MapComponent({ vehicles, zones, incidents }: Readonly<MapProps>) {
  const containerRef    = useRef<HTMLDivElement>(null);
  const mapRef          = useRef<L.Map | null>(null);
  const zonesGrp        = useRef<L.LayerGroup | null>(null);
  const incGrp          = useRef<L.LayerGroup | null>(null);
  const vehGrp          = useRef<L.LayerGroup | null>(null);
  const initialFitDone  = useRef(false);
  const [mapReady, setMapReady] = useState(false);

  // ── 1. Initialise map once ─────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    // Verified center: Avenue Habib Bourguiba, Tunis
    const map = L.map(containerRef.current, {
      center: [36.7988, 10.1806],
      zoom: 12,
    });
    mapRef.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Panes control render order: zones < incidents < vehicles
    map.createPane('zonesPane').style.zIndex = '350';
    map.createPane('incPane').style.zIndex   = '450';
    map.createPane('vehPane').style.zIndex   = '500';

    zonesGrp.current = L.layerGroup().addTo(map);
    incGrp.current   = L.layerGroup().addTo(map);
    vehGrp.current   = L.layerGroup().addTo(map);

    setMapReady(true);

    return () => { map.remove(); mapRef.current = null; setMapReady(false); };
  }, []);

  // ── 2. Zones ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const grp = zonesGrp.current;
    if (!grp || !mapReady) return;
    grp.clearLayers();

    zones.forEach((zone) => {
      const lat = Number(zone.latitude);
      const lng = Number(zone.longitude);
      const r   = Number(zone.radius);
      if (Number.isNaN(lat) || Number.isNaN(lng)) return;

      const color = ZONE_COLOR[zone.congestionLevel] ?? '#6366f1';

      L.circle([lat, lng], {
        radius: r, color, fillColor: color,
        fillOpacity: 0.15, weight: 2.5, pane: 'zonesPane',
      }).addTo(grp).bindPopup(
        `<div style="font-family:sans-serif;min-width:160px;line-height:1.7">
           <b>🚦 ${zone.name}</b><br>
           Congestion : <b style="color:${color}">${zone.congestionLevel}</b><br>
           Véhicules : ${zone.vehicleCount} &nbsp;|&nbsp; Rayon : ${r} m
         </div>`
      );
      // Visible centre dot
      L.circleMarker([lat, lng], {
        radius: 6, color: 'white', fillColor: color,
        fillOpacity: 1, weight: 2, pane: 'zonesPane',
      }).addTo(grp);
    });
  }, [zones, mapReady]);

  // ── 3. Incidents ───────────────────────────────────────────────────────────
  useEffect(() => {
    const grp = incGrp.current;
    if (!grp || !mapReady) return;
    grp.clearLayers();

    const active = incidents.filter((i) => i.status !== 'RESOLVED');
    const pos    = spreadPositions(active, (i) => [Number(i.latitude), Number(i.longitude)]);

    active.forEach((inc) => {
      const coords = pos.get(inc);
      if (!coords) return;
      const [lat, lng] = coords;
      if (Number.isNaN(lat) || Number.isNaN(lng)) return;

      const color = STATUS_COLOR[inc.status] ?? '#94a3b8';
      const emoji = INC_EMOJI[inc.type]  ?? '⚠️';

      L.marker([lat, lng], {
        icon: incidentPin(emoji, color),
        zIndexOffset: 100,
        pane: 'incPane',
      }).addTo(grp).bindPopup(
        `<div style="font-family:sans-serif;min-width:185px;line-height:1.7">
           <b style="font-size:14px">${emoji} ${inc.type.replaceAll('_', ' ')}</b><br>
           Statut : <b style="color:${color}">${inc.status.replaceAll('_', ' ')}</b><br>
           ${inc.description}
         </div>`
      );
    });
  }, [incidents, mapReady]);

  // ── 4. Vehicles ────────────────────────────────────────────────────────────
  useEffect(() => {
    const grp = vehGrp.current;
    if (!grp || !mapReady) return;
    grp.clearLayers();

    type VehicleWithPos = Vehicle & { lastPosition: NonNullable<Vehicle['lastPosition']> };
    const withPos = vehicles.filter(
      (v): v is VehicleWithPos => v.lastPosition !== null
    );
    const pos = spreadPositions(
      withPos,
      (v) => [Number(v.lastPosition.latitude), Number(v.lastPosition.longitude)]
    );

    withPos.forEach((veh) => {
      const coords = pos.get(veh);
      if (!coords) return;
      const [lat, lng] = coords;
      if (Number.isNaN(lat) || Number.isNaN(lng)) return;

      const speed = veh.lastPosition.speed ?? 0;
      const emoji = VEH_EMOJI[veh.type] ?? '🚗';

      L.marker([lat, lng], {
        icon: vehiclePin(emoji),
        zIndexOffset: 200,
        pane: 'vehPane',
      }).addTo(grp).bindPopup(
        `<div style="font-family:sans-serif;min-width:165px;line-height:1.7">
           <b>${emoji} ${veh.licensePlate}</b><br>
           ${veh.brand ?? ''} ${veh.model}<br>
           Type : ${veh.type} &nbsp;|&nbsp; Vitesse : <b>${speed} km/h</b>
         </div>`
      );
    });
  }, [vehicles, mapReady]);

  // ── 5. Auto-fit bounds once after first data load ──────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady || initialFitDone.current) return;

    const points: L.LatLngExpression[] = [];

    vehicles.forEach((v) => {
      if (v.lastPosition) {
        const lat = Number(v.lastPosition.latitude);
        const lng = Number(v.lastPosition.longitude);
        if (!Number.isNaN(lat) && !Number.isNaN(lng)) points.push([lat, lng]);
      }
    });
    incidents
      .filter((i) => i.status !== 'RESOLVED')
      .forEach((i) => {
        const lat = Number(i.latitude);
        const lng = Number(i.longitude);
        if (!Number.isNaN(lat) && !Number.isNaN(lng)) points.push([lat, lng]);
      });
    zones.forEach((z) => {
      const lat = Number(z.latitude);
      const lng = Number(z.longitude);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) points.push([lat, lng]);
    });

    if (points.length > 0) {
      map.fitBounds(L.latLngBounds(points), { padding: [50, 50], maxZoom: 14 });
      initialFitDone.current = true;
    }
  }, [vehicles, incidents, zones, mapReady]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: 420 }} />;
}
