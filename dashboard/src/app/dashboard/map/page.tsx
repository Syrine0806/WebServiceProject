'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { gql } from '@apollo/client';
import { vehicleClient, trafficClient, incidentClient } from '@/lib/apollo-client';

const MapComponent = dynamic(
  () => import('@/components/map/MapComponent'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-slate-900 text-slate-400">
        <div className="text-center">
          <div className="text-5xl mb-3 animate-pulse">🗺️</div>
          <p>Chargement de la carte...</p>
        </div>
      </div>
    ),
  }
);

const Q_VEHICLES = gql`query { vehicles { id licensePlate model brand type status } }`;
const Q_HISTORY  = gql`query VH($id: String!) { vehicleHistory(vehicleId: $id) { latitude longitude speed timestamp } }`;
const Q_ZONES    = gql`query { trafficZones { id name latitude longitude radius vehicleCount density congestionLevel } }`;
const Q_INCIDENTS = gql`query { incidents { id type status description latitude longitude } }`;

export default function MapPage() {
  const [vehicles,  setVehicles]  = useState<any[]>([]);
  const [zones,     setZones]     = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [filter, setFilter] = useState({ vehicles: true, zones: true, incidents: true });
  const isMounted = useRef(true);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const [vRes, zRes, iRes] = await Promise.allSettled([
        vehicleClient.query({ query: Q_VEHICLES,  fetchPolicy: 'no-cache' }),
        trafficClient.query({ query: Q_ZONES,     fetchPolicy: 'no-cache' }),
        incidentClient.query({ query: Q_INCIDENTS, fetchPolicy: 'no-cache' }),
      ]);

      const rawVehicles: any[] =
        vRes.status === 'fulfilled' ? (vRes.value.data.vehicles ?? []) : [];

      // Fetch latest GPS position for every vehicle in parallel
      const vehiclesWithPos = await Promise.all(
        rawVehicles.map(async (v) => {
          try {
            const h = await vehicleClient.query({
              query: Q_HISTORY,
              variables: { id: v.id },
              fetchPolicy: 'no-cache',
            });
            const positions: any[] = h.data.vehicleHistory ?? [];
            return { ...v, lastPosition: positions[0] ?? null };
          } catch {
            return { ...v, lastPosition: null };
          }
        })
      );

      if (!isMounted.current) return;

      // Show ALL vehicles — those without GPS appear in the list but not on the map
      setVehicles(vehiclesWithPos);
      setZones(zRes.status === 'fulfilled' ? (zRes.value.data.trafficZones ?? []) : []);
      setIncidents(iRes.status === 'fulfilled' ? (iRes.value.data.incidents ?? []) : []);
      setLastRefresh(new Date());
    } catch {
      // Services may be offline
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;
    loadData();
    // Auto-refresh every 5 seconds for near-real-time updates
    const interval = setInterval(() => loadData(true), 5000);
    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, [loadData]);

  const vehiclesOnMap  = vehicles.filter((v) => v.lastPosition);
  const activeIncidents = incidents.filter((i) => i.status !== 'RESOLVED');
  const highZones       = zones.filter((z) => z.congestionLevel === 'HIGH');

  return (
    <div className="h-full flex flex-col gap-4">

      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">🗺️ Carte Interactive</h1>
          <p className="text-slate-400 text-sm mt-1 flex items-center gap-2">
            {refreshing && (
              <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            )}
            Mis à jour à {lastRefresh.toLocaleTimeString('fr-FR')} — actualisation auto 5s
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => loadData()}
            disabled={refreshing}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            {refreshing ? '⏳...' : '↻ Actualiser'}
          </button>
        </div>
      </div>

      {/* ── Stats ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-[#1e293b] rounded-xl p-3 border border-slate-700 flex items-center gap-3">
          <span className="text-2xl">🚗</span>
          <div>
            <p className="text-white font-bold text-lg">{vehiclesOnMap.length}
              <span className="text-slate-500 text-sm font-normal"> / {vehicles.length}</span>
            </p>
            <p className="text-slate-400 text-xs">Véhicules localisés / total</p>
          </div>
        </div>
        <div className="bg-[#1e293b] rounded-xl p-3 border border-slate-700 flex items-center gap-3">
          <span className="text-2xl">🔴</span>
          <div>
            <p className="text-red-400 font-bold text-lg">{highZones.length}
              <span className="text-slate-500 text-sm font-normal"> / {zones.length}</span>
            </p>
            <p className="text-slate-400 text-xs">Zones congestionnées / total</p>
          </div>
        </div>
        <div className="bg-[#1e293b] rounded-xl p-3 border border-slate-700 flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="text-yellow-400 font-bold text-lg">{activeIncidents.length}
              <span className="text-slate-500 text-sm font-normal"> / {incidents.length}</span>
            </p>
            <p className="text-slate-400 text-xs">Incidents actifs / total</p>
          </div>
        </div>
      </div>

      {/* ── Filters ──────────────────────────────────────────────────── */}
      <div className="flex gap-2">
        {([
          { key: 'vehicles',  label: `🚗 Véhicules (${vehiclesOnMap.length})`,    active: 'bg-indigo-600' },
          { key: 'zones',     label: `🚦 Zones (${zones.length})`,               active: 'bg-emerald-600' },
          { key: 'incidents', label: `⚠️ Incidents (${activeIncidents.length})`,  active: 'bg-amber-600' },
        ] as const).map(({ key, label, active }) => (
          <button
            key={key}
            onClick={() => setFilter((f) => ({ ...f, [key]: !f[key] }))}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              filter[key]
                ? `${active} text-white border-transparent`
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {label}
          </button>
        ))}

        {vehicles.length > vehiclesOnMap.length && (
          <span className="ml-auto text-xs text-slate-500 self-center">
            ⚠️ {vehicles.length - vehiclesOnMap.length} véhicule(s) sans position GPS
          </span>
        )}
      </div>

      {/* ── Map ──────────────────────────────────────────────────────── */}
      <div className="flex-1 rounded-2xl overflow-hidden border border-slate-700 min-h-[420px] relative">
        {loading ? (
          <div className="flex items-center justify-center h-full bg-slate-900 text-slate-400">
            <div className="text-center">
              <div className="text-5xl mb-3 animate-pulse">🗺️</div>
              <p>Chargement des données...</p>
            </div>
          </div>
        ) : (
          <MapComponent
            vehicles={filter.vehicles ? vehiclesOnMap : []}
            zones={filter.zones ? zones : []}
            incidents={filter.incidents ? incidents : []}
          />
        )}
      </div>

      {/* ── Legend ───────────────────────────────────────────────────── */}
      <div className="bg-[#1e293b] rounded-xl p-4 border border-slate-700">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Légende</p>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-300">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-green-500" /> Zone faible (LOW)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-yellow-500" /> Zone moyenne (MEDIUM)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500" /> Zone élevée (HIGH)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-indigo-600 text-center text-xs">🚗</span> Véhicule
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-amber-500 text-center text-xs">!</span> Incident signalé
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-indigo-500 text-center text-xs">!</span> Incident en cours
          </span>
          <span className="text-slate-500">| Cliquer sur un élément pour plus de détails</span>
        </div>
      </div>
    </div>
  );
}
