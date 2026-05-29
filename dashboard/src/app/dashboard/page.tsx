'use client';
import { useEffect, useState } from 'react';
import { gql } from '@apollo/client';
import { vehicleClient, incidentClient, trafficClient, notifClient } from '@/lib/apollo-client';

const STATS_VEHICLES = gql`query { vehicles { id status } }`;
const STATS_INCIDENTS = gql`query { incidents { id status type } }`;
const STATS_ZONES = gql`query { trafficZones { id congestionLevel } }`;
const STATS_NOTIFS = gql`query { notifications { id isRead } }`;

function StatCard({ icon, label, value, sub, color }: any) {
  return (
    <div className={`bg-[#1e293b] rounded-2xl p-6 border border-slate-700`}>
      <div className="flex items-center justify-between mb-4">
        <span className="text-3xl">{icon}</span>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${color}`}>{sub}</span>
      </div>
      <p className="text-3xl font-bold text-white">{value}</p>
      <p className="text-slate-400 text-sm mt-1">{label}</p>
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState({ vehicles: 0, active: 0, incidents: 0, open: 0, zones: 0, high: 0, notifs: 0, unread: 0 });
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const u = localStorage.getItem('user');
      if (u) setUser(JSON.parse(u));
    }
    Promise.all([
      vehicleClient.query({ query: STATS_VEHICLES, fetchPolicy: 'no-cache' }).catch(() => ({ data: { vehicles: [] } })),
      incidentClient.query({ query: STATS_INCIDENTS, fetchPolicy: 'no-cache' }).catch(() => ({ data: { incidents: [] } })),
      trafficClient.query({ query: STATS_ZONES, fetchPolicy: 'no-cache' }).catch(() => ({ data: { trafficZones: [] } })),
      notifClient.query({ query: STATS_NOTIFS, fetchPolicy: 'no-cache' }).catch(() => ({ data: { notifications: [] } })),
    ]).then(([v, i, z, n]) => {
      const vehicles = v.data.vehicles || [];
      const incidents = i.data.incidents || [];
      const zones = z.data.trafficZones || [];
      const notifs = n.data.notifications || [];
      setStats({
        vehicles: vehicles.length,
        active: vehicles.filter((x: any) => x.status === 'ACTIVE').length,
        incidents: incidents.length,
        open: incidents.filter((x: any) => x.status !== 'RESOLVED').length,
        zones: zones.length,
        high: zones.filter((x: any) => x.congestionLevel === 'HIGH').length,
        notifs: notifs.length,
        unread: notifs.filter((x: any) => !x.isRead).length,
      });
    });
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Bonjour {user?.firstName || user?.email} 👋
        </h1>
        <p className="text-slate-400 mt-1">Vue d'ensemble de la plateforme de trafic urbain</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon="🚗" label="Véhicules" value={stats.vehicles} sub={`${stats.active} actifs`} color="bg-green-900/40 text-green-400" />
        <StatCard icon="⚠️" label="Incidents" value={stats.incidents} sub={`${stats.open} ouverts`} color="bg-red-900/40 text-red-400" />
        <StatCard icon="🚦" label="Zones trafic" value={stats.zones} sub={`${stats.high} élevées`} color="bg-orange-900/40 text-orange-400" />
        <StatCard icon="🔔" label="Notifications" value={stats.notifs} sub={`${stats.unread} non lues`} color="bg-indigo-900/40 text-indigo-400" />
      </div>

      <div className="bg-[#1e293b] rounded-2xl p-6 border border-slate-700">
        <h2 className="font-semibold text-white mb-4">Services actifs</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { name: 'Auth Service', port: 3001, color: 'bg-yellow-500' },
            { name: 'Vehicle Service', port: 3002, color: 'bg-green-500' },
            { name: 'Traffic Service', port: 3003, color: 'bg-red-500' },
            { name: 'Incident Service', port: 3004, color: 'bg-purple-500' },
            { name: 'Notification Service', port: 3005, color: 'bg-cyan-500' },
            { name: 'API Gateway', port: 3000, color: 'bg-indigo-500' },
          ].map(s => (
            <div key={s.port} className="flex items-center gap-3 bg-slate-800/50 rounded-xl px-4 py-3">
              <div className={`w-2 h-2 rounded-full ${s.color}`} />
              <div>
                <p className="text-sm text-white font-medium">{s.name}</p>
                <p className="text-xs text-slate-400">:{s.port}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
