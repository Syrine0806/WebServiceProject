'use client';
import { useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { gql } from '@apollo/client';
import { vehicleClient, trafficClient, incidentClient } from '@/lib/apollo-client';

// Dynamic import — Leaflet requires the DOM (no SSR)
const MapComponent = dynamic(
  () => import('@/components/map/MapComponent'),
  { ssr: false, loading: () => (
    <div className="flex items-center justify-center h-full text-slate-400">
      <div className="text-center">
        <div className="text-4xl mb-3">🗺️</div>
        <p>Chargement de la carte...</p>
      </div>
    </div>
  )}
);

const GET_VEHICLES_WITH_HISTORY = gql`
  query {
    vehicles {
      id licensePlate model brand type status
    }
  }
`;

const GET_VEHICLE_HISTORY = gql`
  query VehicleHistory($vehicleId: String!) {
    vehicleHistory(vehicleId: $vehicleId) {
      latitude longitude speed timestamp
    }
  }
`;

const GET_ZONES = gql`
  query {
    trafficZones {
      id name latitude longitude radius vehicleCount density congestionLevel
    }
  }
`;

const GET_INCIDENTS = gql`
  query {
    incidents {
      id type status description latitude longitude
    }
  }
`;

export default function MapPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [filter, setFilter] = useState({ vehicles: true, zones: true, incidents: true });

  const loadData = useCallback(async () => {
    try {
      const [vRes, zRes, iRes] = await Promise.all([
        vehicleClient.query({ query: GET_VEHICLES_WITH_HISTORY, fetchPolicy: 'no-cache' }).catch(() => ({ data: { vehicles: [] } })),
        trafficClient.query({ query: GET_ZONES, fetchPolicy: 'no-cache' }).catch(() => ({ data: { trafficZones: [] } })),
        incidentClient.query({ query: GET_INCIDENTS, fetchPolicy: 'no-cache' }).catch(() => ({ data: { incidents: [] } })),
      ]);

      // Fetch last GPS position for each active vehicle
      const vehiclesRaw: any[] = vRes.data.vehicles ?? [];
      const vehiclesWithPos = await Promise.all(
        vehiclesRaw.map(async (v) => {
          try {
            const h = await vehicleClient.query({
              query: GET_VEHICLE_HISTORY,
              variables: { vehicleId: v.id },
              fetchPolicy: 'no-cache',
            });
            const positions: any[] = h.data.vehicleHistory ?? [];
            return { ...v, lastPosition: positions.length > 0 ? positions[0] : null };
          } catch {
            return { ...v, lastPosition: null };
          }
        })
      );

      setVehicles(vehiclesWithPos.filter((v) => v.lastPosition !== null));
      setZones(zRes.data.trafficZones ?? []);
      setIncidents(iRes.data.incidents ?? []);
      setLastRefresh(new Date());
    } catch {
      // Services may not be running
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    // Auto-refresh every 15 seconds
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [loadData]);

  const activeIncidents = incidents.filter((i) => i.status !== 'RESOLVED');
  const highZones = zones.filter((z) => z.congestionLevel === 'HIGH');

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-white">🗺️ Carte Interactive</h1>
          <p className="text-slate-400 text-sm mt-1">
            Mis à jour à {lastRefresh.toLocaleTimeString('fr-FR')} — actualisation auto 15s
          </p>
        </div>
        <button
          onClick={loadData}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium"
        >
          ↻ Actualiser
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-[#1e293b] rounded-xl p-3 border border-slate-700 flex items-center gap-3">
          <span className="text-2xl">🚗</span>
          <div>
            <p className="text-white font-bold text-lg">{vehicles.length}</p>
            <p className="text-slate-400 text-xs">Véhicules localisés</p>
          </div>
        </div>
        <div className="bg-[#1e293b] rounded-xl p-3 border border-slate-700 flex items-center gap-3">
          <span className="text-2xl">🔴</span>
          <div>
            <p className="text-red-400 font-bold text-lg">{highZones.length}</p>
            <p className="text-slate-400 text-xs">Zones congestionnées</p>
          </div>
        </div>
        <div className="bg-[#1e293b] rounded-xl p-3 border border-slate-700 flex items-center gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="text-yellow-400 font-bold text-lg">{activeIncidents.length}</p>
            <p className="text-slate-400 text-xs">Incidents actifs</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4">
        {[
          { key: 'vehicles', label: '🚗 Véhicules', color: 'bg-indigo-600' },
          { key: 'zones', label: '🚦 Zones', color: 'bg-green-600' },
          { key: 'incidents', label: '⚠️ Incidents', color: 'bg-yellow-600' },
        ].map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => setFilter((f) => ({ ...f, [key]: !f[key as keyof typeof f] }))}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
              filter[key as keyof typeof filter]
                ? `${color} text-white border-transparent`
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Map container */}
      <div className="flex-1 rounded-2xl overflow-hidden border border-slate-700 min-h-[450px]">
        {loading ? (
          <div className="flex items-center justify-center h-full text-slate-400 bg-[#1e293b]">
            <div className="text-center">
              <div className="text-4xl mb-3">🗺️</div>
              <p>Chargement des données...</p>
            </div>
          </div>
        ) : (
          <MapComponent
            vehicles={filter.vehicles ? vehicles : []}
            zones={filter.zones ? zones : []}
            incidents={filter.incidents ? incidents : []}
          />
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 bg-[#1e293b] rounded-xl p-4 border border-slate-700">
        <p className="text-xs font-semibold text-slate-400 uppercase mb-3">Légende</p>
        <div className="flex flex-wrap gap-4 text-xs text-slate-300">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span> Zone faible
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-yellow-500 inline-block"></span> Zone moyenne
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500 inline-block"></span> Zone élevée
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded bg-indigo-600 inline-flex items-center justify-center text-xs">🚗</span> Véhicule
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-yellow-500 inline-flex items-center justify-center text-xs">⚠️</span> Incident signalé
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-5 h-5 rounded-full bg-indigo-500 inline-flex items-center justify-center text-xs">⚠️</span> En cours
          </span>
        </div>
      </div>
    </div>
  );
}
