'use client';
import { useEffect, useState } from 'react';
import { gql } from '@apollo/client';
import { vehicleClient } from '@/lib/apollo-client';

const GET_VEHICLES = gql`query { vehicles { id licensePlate model brand type status createdAt } }`;

const ADD_VEHICLE = gql`
  mutation AddVehicle($licensePlate: String!, $model: String!, $brand: String, $type: VehicleType) {
    addVehicle(input: { licensePlate: $licensePlate, model: $model, brand: $brand, type: $type }) {
      id licensePlate model status
    }
  }
`;

const RECORD_GPS = gql`
  mutation RecordGPS($vehicleId: String!, $latitude: Float!, $longitude: Float!, $speed: Float) {
    recordGpsPosition(input: {
      vehicleId: $vehicleId
      latitude: $latitude
      longitude: $longitude
      speed: $speed
    }) {
      id latitude longitude speed timestamp
    }
  }
`;

const GET_HISTORY = gql`
  query History($vehicleId: String!) {
    vehicleHistory(vehicleId: $vehicleId) {
      id latitude longitude speed timestamp
    }
  }
`;

const TYPE_COLORS: Record<string, string> = {
  CAR:        'bg-blue-900/40 text-blue-400',
  TRUCK:      'bg-orange-900/40 text-orange-400',
  BUS:        'bg-purple-900/40 text-purple-400',
  MOTORCYCLE: 'bg-pink-900/40 text-pink-400',
  EMERGENCY:  'bg-red-900/40 text-red-400',
};

const TYPE_EMOJI: Record<string, string> = {
  CAR: '🚗', TRUCK: '🚛', BUS: '🚌', MOTORCYCLE: '🏍️', EMERGENCY: '🚑',
};

// Preset locations around Tunis for easy testing
const PRESETS = [
  { label: 'Centre-Ville',  lat: 36.8065,  lng: 10.1815 },
  { label: 'La Marsa',      lat: 36.8778,  lng: 10.3244 },
  { label: 'Ariana',        lat: 36.8625,  lng: 10.1956 },
  { label: 'Ben Arous',     lat: 36.7533,  lng: 10.2281 },
  { label: 'Carthage',      lat: 36.8528,  lng: 10.3264 },
  { label: 'El Menzah',     lat: 36.8487,  lng: 10.1933 },
];

export default function VehiclesPage() {
  const [vehicles, setVehicles]   = useState<any[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showAdd,  setShowAdd]    = useState(false);
  const [gpsModal, setGpsModal]   = useState<any>(null);   // vehicle object
  const [histModal, setHistModal] = useState<any>(null);   // vehicle object
  const [history, setHistory]     = useState<any[]>([]);
  const [form, setForm]           = useState({ licensePlate: '', model: '', brand: '', type: 'CAR' });
  const [gpsForm, setGpsForm]     = useState({ latitude: '36.8065', longitude: '10.1815', speed: '0' });
  const [saving, setSaving]       = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await vehicleClient.query({ query: GET_VEHICLES, fetchPolicy: 'no-cache' });
      setVehicles(data.vehicles ?? []);
    } catch { setVehicles([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  // ── Add vehicle ──────────────────────────────────────────────────────
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await vehicleClient.mutate({ mutation: ADD_VEHICLE, variables: form });
      setShowAdd(false);
      setForm({ licensePlate: '', model: '', brand: '', type: 'CAR' });
      load();
    } catch (err: any) { alert(err.message); }
    setSaving(false);
  };

  // ── Record GPS position ──────────────────────────────────────────────
  const handleGps = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gpsModal) return;
    setSaving(true);
    try {
      await vehicleClient.mutate({
        mutation: RECORD_GPS,
        variables: {
          vehicleId: gpsModal.id,
          latitude:  Number.parseFloat(gpsForm.latitude),
          longitude: Number.parseFloat(gpsForm.longitude),
          speed:     Number.parseFloat(gpsForm.speed) || 0,
        },
      });
      setGpsModal(null);
      alert(`✅ Position GPS enregistrée pour ${gpsModal.licensePlate} — visible sur la carte dans 5s`);
    } catch (err: any) { alert(err.message); }
    setSaving(false);
  };

  // ── Load history ─────────────────────────────────────────────────────
  const openHistory = async (v: any) => {
    setHistModal(v);
    setHistory([]);
    try {
      const { data } = await vehicleClient.query({
        query: GET_HISTORY,
        variables: { vehicleId: v.id },
        fetchPolicy: 'no-cache',
      });
      setHistory(data.vehicleHistory ?? []);
    } catch { setHistory([]); }
  };

  return (
    <div>
      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">🚗 Véhicules</h1>
          <p className="text-slate-400 text-sm mt-1">{vehicles.length} véhicule(s) enregistré(s)</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium"
        >
          + Ajouter un véhicule
        </button>
      </div>

      {/* ── Add vehicle modal ────────────────────────────────────────── */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1e293b] rounded-2xl p-6 w-full max-w-md border border-slate-700">
            <h2 className="text-lg font-semibold text-white mb-4">Ajouter un véhicule</h2>
            <form onSubmit={handleAdd} className="space-y-3">
              {([['licensePlate','Plaque','TN-123-456',true],['model','Modèle','Corolla',true],['brand','Marque','Toyota',false]] as const).map(([k,l,p,r]) => (
                <div key={k}>
                  <label className="text-sm text-slate-400">{l}</label>
                  <input
                    required={r} value={(form as any)[k]}
                    onChange={e => setForm({ ...form, [k]: e.target.value })}
                    placeholder={p}
                    className="w-full mt-1 bg-[#0f172a] border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              ))}
              <div>
                <label className="text-sm text-slate-400">Type</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                  className="w-full mt-1 bg-[#0f172a] border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500">
                  {['CAR','TRUCK','BUS','MOTORCYCLE','EMERGENCY'].map(t => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-600 text-slate-400 text-sm">Annuler</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium disabled:opacity-50">
                  {saving ? 'Enregistrement...' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── GPS Position modal ───────────────────────────────────────── */}
      {gpsModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1e293b] rounded-2xl p-6 w-full max-w-md border border-slate-700">
            <h2 className="text-lg font-semibold text-white mb-1">📍 Enregistrer position GPS</h2>
            <p className="text-slate-400 text-sm mb-4">
              {TYPE_EMOJI[gpsModal.type] ?? '🚗'} {gpsModal.licensePlate} — {gpsModal.model}
            </p>

            {/* Presets */}
            <div className="mb-4">
              <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide">Positions rapides (Tunis)</p>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map(p => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setGpsForm(f => ({ ...f, latitude: String(p.lat), longitude: String(p.lng) }))}
                    className="px-2.5 py-1 rounded-lg text-xs bg-slate-700 hover:bg-indigo-700 text-slate-300 hover:text-white transition-colors"
                  >
                    📌 {p.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleGps} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="gps-lat" className="text-sm text-slate-400">Latitude</label>
                  <input
                    id="gps-lat" type="number" step="0.0001" required
                    value={gpsForm.latitude}
                    onChange={e => setGpsForm(f => ({ ...f, latitude: e.target.value }))}
                    className="w-full mt-1 bg-[#0f172a] border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label htmlFor="gps-lng" className="text-sm text-slate-400">Longitude</label>
                  <input
                    id="gps-lng" type="number" step="0.0001" required
                    value={gpsForm.longitude}
                    onChange={e => setGpsForm(f => ({ ...f, longitude: e.target.value }))}
                    className="w-full mt-1 bg-[#0f172a] border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-slate-400">Vitesse (km/h)</label>
                <input
                  type="number" min="0" max="300"
                  value={gpsForm.speed}
                  onChange={e => setGpsForm(f => ({ ...f, speed: e.target.value }))}
                  className="w-full mt-1 bg-[#0f172a] border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="bg-slate-800/50 rounded-lg px-3 py-2 text-xs text-slate-400">
                ℹ️ Le véhicule apparaîtra sur la carte dans <strong className="text-white">5 secondes</strong>
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setGpsModal(null)}
                  className="flex-1 py-2 rounded-xl border border-slate-600 text-slate-400 text-sm">Annuler</button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-2 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-medium disabled:opacity-50">
                  {saving ? 'Enregistrement...' : '📍 Placer sur la carte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── History modal ────────────────────────────────────────────── */}
      {histModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1e293b] rounded-2xl p-6 w-full max-w-lg border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                🗺️ Historique GPS — {histModal.licensePlate}
              </h2>
              <button onClick={() => setHistModal(null)} className="text-slate-400 hover:text-white text-xl">✕</button>
            </div>
            {history.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">Aucune position enregistrée</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {history.map((pos, i) => (
                  <div key={pos.id} className="flex items-center gap-3 bg-slate-800/50 rounded-lg px-3 py-2">
                    <span className="text-slate-500 text-xs w-5 text-right">{i + 1}</span>
                    <div className="flex-1 grid grid-cols-3 gap-2 text-xs">
                      <span className="text-slate-300">📍 {Number(pos.latitude).toFixed(4)}, {Number(pos.longitude).toFixed(4)}</span>
                      <span className="text-indigo-400">{pos.speed ?? 0} km/h</span>
                      <span className="text-slate-500">{new Date(pos.timestamp).toLocaleString('fr-FR')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Table ────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="text-center py-20 text-slate-500">Chargement...</div>
      ) : (
        <div className="bg-[#1e293b] rounded-2xl border border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                {['Plaque', 'Modèle', 'Marque', 'Type', 'Statut', 'Ajouté le', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vehicles.map(v => (
                <tr key={v.id} className="border-b border-slate-700/50 hover:bg-slate-700/20 transition-colors">
                  <td className="px-4 py-3 font-mono text-indigo-400 font-medium text-sm">{v.licensePlate}</td>
                  <td className="px-4 py-3 text-white text-sm">{v.model}</td>
                  <td className="px-4 py-3 text-slate-300 text-sm">{v.brand || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${TYPE_COLORS[v.type] ?? 'bg-slate-700 text-slate-300'}`}>
                      {TYPE_EMOJI[v.type]} {v.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${v.status === 'ACTIVE' ? 'bg-green-900/40 text-green-400' : 'bg-slate-700 text-slate-400'}`}>
                      {v.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-sm">{new Date(v.createdAt).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setGpsModal(v); setGpsForm({ latitude: '36.8065', longitude: '10.1815', speed: '0' }); }}
                        className="text-xs px-2.5 py-1.5 rounded-lg bg-green-900/40 hover:bg-green-800/60 text-green-400 font-medium transition-colors"
                        title="Enregistrer position GPS"
                      >
                        📍 GPS
                      </button>
                      <button
                        onClick={() => openHistory(v)}
                        className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                        title="Voir historique"
                      >
                        🗺️ Historique
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {vehicles.length === 0 && (
                <tr><td colSpan={7} className="text-center py-12 text-slate-500">Aucun véhicule enregistré</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
