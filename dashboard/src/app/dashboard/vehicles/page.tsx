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

const TYPE_COLORS: Record<string, string> = {
  CAR: 'bg-blue-900/40 text-blue-400',
  TRUCK: 'bg-orange-900/40 text-orange-400',
  BUS: 'bg-purple-900/40 text-purple-400',
  MOTORCYCLE: 'bg-pink-900/40 text-pink-400',
  EMERGENCY: 'bg-red-900/40 text-red-400',
};

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ licensePlate: '', model: '', brand: '', type: 'CAR' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await vehicleClient.query({ query: GET_VEHICLES, fetchPolicy: 'no-cache' });
      setVehicles(data.vehicles);
    } catch { setVehicles([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await vehicleClient.mutate({ mutation: ADD_VEHICLE, variables: form });
      setShowForm(false);
      setForm({ licensePlate: '', model: '', brand: '', type: 'CAR' });
      load();
    } catch (err: any) { alert(err.message); }
    setSaving(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">🚗 Véhicules</h1>
          <p className="text-slate-400 text-sm mt-1">{vehicles.length} véhicule(s) enregistré(s)</p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">
          + Ajouter
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1e293b] rounded-2xl p-6 w-full max-w-md border border-slate-700">
            <h2 className="text-lg font-semibold text-white mb-4">Ajouter un véhicule</h2>
            <form onSubmit={handleAdd} className="space-y-3">
              {[['licensePlate', 'Plaque d\'immatriculation', 'TN-123-456'], ['model', 'Modèle', 'Corolla'], ['brand', 'Marque', 'Toyota']].map(([key, label, ph]) => (
                <div key={key}>
                  <label className="text-sm text-slate-400">{label}</label>
                  <input required={key === 'licensePlate' || key === 'model'} value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}
                    placeholder={ph} className="w-full mt-1 bg-[#0f172a] border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
                </div>
              ))}
              <div>
                <label className="text-sm text-slate-400">Type</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                  className="w-full mt-1 bg-[#0f172a] border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500">
                  {['CAR', 'TRUCK', 'BUS', 'MOTORCYCLE', 'EMERGENCY'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-xl border border-slate-600 text-slate-400 text-sm hover:bg-slate-700">Annuler</button>
                <button type="submit" disabled={saving} className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium disabled:opacity-50">{saving ? 'Enregistrement...' : 'Ajouter'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-slate-500">Chargement...</div>
      ) : (
        <div className="bg-[#1e293b] rounded-2xl border border-slate-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                {['Plaque', 'Modèle', 'Marque', 'Type', 'Statut', 'Ajouté le'].map(h => (
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
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${TYPE_COLORS[v.type] || 'bg-slate-700 text-slate-300'}`}>{v.type}</span></td>
                  <td className="px-4 py-3"><span className={`text-xs px-2 py-1 rounded-full font-medium ${v.status === 'ACTIVE' ? 'bg-green-900/40 text-green-400' : 'bg-slate-700 text-slate-400'}`}>{v.status}</span></td>
                  <td className="px-4 py-3 text-slate-400 text-sm">{new Date(v.createdAt).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))}
              {vehicles.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-slate-500">Aucun véhicule enregistré</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
