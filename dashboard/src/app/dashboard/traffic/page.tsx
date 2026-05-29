'use client';
import { useEffect, useState } from 'react';
import { gql } from '@apollo/client';
import { trafficClient } from '@/lib/apollo-client';

const GET_ZONES = gql`query { trafficZones { id name description latitude longitude radius vehicleCount density congestionLevel createdAt } }`;
const CREATE_ZONE = gql`
  mutation CreateZone($name: String!, $latitude: Float!, $longitude: Float!, $radius: Float!, $description: String) {
    createTrafficZone(input: { name: $name, latitude: $latitude, longitude: $longitude, radius: $radius, description: $description }) {
      id name congestionLevel
    }
  }
`;
const UPDATE_DENSITY = gql`
  mutation UpdateDensity($zoneId: String!, $vehicleCount: Float!) {
    updateTrafficDensity(input: { zoneId: $zoneId, vehicleCount: $vehicleCount }) {
      id name vehicleCount density congestionLevel
    }
  }
`;

const LEVEL_STYLES: Record<string, { bar: string; badge: string; label: string }> = {
  LOW:    { bar: 'bg-green-500',  badge: 'bg-green-900/40 text-green-400',  label: 'Faible' },
  MEDIUM: { bar: 'bg-yellow-500', badge: 'bg-yellow-900/40 text-yellow-400', label: 'Moyen' },
  HIGH:   { bar: 'bg-red-500',    badge: 'bg-red-900/40 text-red-400',      label: 'Élevé' },
};

export default function TrafficPage() {
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editZone, setEditZone] = useState<any>(null);
  const [vehicleCount, setVehicleCount] = useState('');
  const [form, setForm] = useState({ name: '', description: '', latitude: '36.8065', longitude: '10.1815', radius: '500' });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await trafficClient.query({ query: GET_ZONES, fetchPolicy: 'no-cache' });
      setZones(data.trafficZones);
    } catch { setZones([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await trafficClient.mutate({ mutation: CREATE_ZONE, variables: { ...form, latitude: parseFloat(form.latitude), longitude: parseFloat(form.longitude), radius: parseFloat(form.radius) } });
      setShowForm(false);
      load();
    } catch (err: any) { alert(err.message); }
  };

  const handleUpdateDensity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await trafficClient.mutate({ mutation: UPDATE_DENSITY, variables: { zoneId: editZone.id, vehicleCount: parseInt(vehicleCount) } });
      setEditZone(null);
      load();
    } catch (err: any) { alert(err.message); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">🚦 Zones de Trafic</h1>
          <p className="text-slate-400 text-sm mt-1">{zones.length} zone(s) · {zones.filter(z => z.congestionLevel === 'HIGH').length} congestionnée(s)</p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium">
          + Créer une zone
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1e293b] rounded-2xl p-6 w-full max-w-md border border-slate-700">
            <h2 className="text-lg font-semibold text-white mb-4">Créer une zone de circulation</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              {[['name', 'Nom', 'Centre-Ville Tunis', true], ['description', 'Description', 'Zone haute densité', false]].map(([k, l, p, r]) => (
                <div key={k as string}>
                  <label className="text-sm text-slate-400">{l as string}</label>
                  <input required={!!r} value={(form as any)[k as string]} onChange={e => setForm({ ...form, [k as string]: e.target.value })} placeholder={p as string}
                    className="w-full mt-1 bg-[#0f172a] border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
                </div>
              ))}
              <div className="grid grid-cols-3 gap-3">
                {[['latitude', 'Latitude'], ['longitude', 'Longitude'], ['radius', 'Rayon (m)']].map(([k, l]) => (
                  <div key={k}>
                    <label className="text-sm text-slate-400">{l}</label>
                    <input value={(form as any)[k]} onChange={e => setForm({ ...form, [k]: e.target.value })}
                      className="w-full mt-1 bg-[#0f172a] border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-xl border border-slate-600 text-slate-400 text-sm">Annuler</button>
                <button type="submit" className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium">Créer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editZone && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1e293b] rounded-2xl p-6 w-full max-w-sm border border-slate-700">
            <h2 className="text-lg font-semibold text-white mb-1">Mettre à jour la densité</h2>
            <p className="text-slate-400 text-sm mb-4">{editZone.name}</p>
            <form onSubmit={handleUpdateDensity} className="space-y-3">
              <div>
                <label className="text-sm text-slate-400">Nombre de véhicules dans la zone</label>
                <input type="number" min="0" required value={vehicleCount} onChange={e => setVehicleCount(e.target.value)}
                  className="w-full mt-1 bg-[#0f172a] border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" placeholder="0" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setEditZone(null)} className="flex-1 py-2 rounded-xl border border-slate-600 text-slate-400 text-sm">Annuler</button>
                <button type="submit" className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium">Mettre à jour</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-slate-500">Chargement...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {zones.map(z => {
            const s = LEVEL_STYLES[z.congestionLevel] || LEVEL_STYLES.LOW;
            const pct = z.congestionLevel === 'LOW' ? 25 : z.congestionLevel === 'MEDIUM' ? 65 : 95;
            return (
              <div key={z.id} className="bg-[#1e293b] rounded-2xl p-5 border border-slate-700">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-white">{z.name}</h3>
                    <p className="text-slate-400 text-xs mt-0.5">{z.description || `${z.radius}m radius`}</p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.badge}`}>{s.label}</span>
                </div>
                <div className="mb-3">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Densité</span>
                    <span>{z.vehicleCount} véhicules</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${s.bar}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-slate-500 text-xs">📍 {parseFloat(z.latitude).toFixed(4)}, {parseFloat(z.longitude).toFixed(4)}</p>
                  <button onClick={() => { setEditZone(z); setVehicleCount(String(z.vehicleCount)); }}
                    className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300">
                    Mettre à jour
                  </button>
                </div>
              </div>
            );
          })}
          {zones.length === 0 && (
            <div className="col-span-2 text-center py-20 text-slate-500 bg-[#1e293b] rounded-2xl border border-slate-700">Aucune zone créée</div>
          )}
        </div>
      )}
    </div>
  );
}
