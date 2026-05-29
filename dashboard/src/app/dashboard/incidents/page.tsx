'use client';
import { useEffect, useState } from 'react';
import { gql } from '@apollo/client';
import { incidentClient } from '@/lib/apollo-client';

const GET_INCIDENTS = gql`query { incidents { id type status description latitude longitude reportedBy createdAt resolvedAt } }`;
const DECLARE = gql`
  mutation DeclareIncident($type: IncidentType!, $description: String!, $latitude: Float!, $longitude: Float!) {
    declareIncident(input: { type: $type, description: $description, latitude: $latitude, longitude: $longitude }) {
      id type status createdAt
    }
  }
`;
const UPDATE_STATUS = gql`
  mutation UpdateStatus($incidentId: String!, $status: IncidentStatus!) {
    updateIncidentStatus(input: { incidentId: $incidentId, status: $status }) {
      id status
    }
  }
`;

const STATUS_STYLES: Record<string, string> = {
  REPORTED: 'bg-yellow-900/40 text-yellow-400',
  IN_PROGRESS: 'bg-blue-900/40 text-blue-400',
  RESOLVED: 'bg-green-900/40 text-green-400',
};
const TYPE_ICONS: Record<string, string> = {
  ACCIDENT: '💥', CONSTRUCTION: '🏗️', ROAD_CLOSED: '🚧', TRAFFIC_JAM: '🚗',
};

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ type: 'ACCIDENT', description: '', latitude: '36.8065', longitude: '10.1815' });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await incidentClient.query({ query: GET_INCIDENTS, fetchPolicy: 'no-cache' });
      setIncidents(data.incidents);
    } catch { setIncidents([]); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleDeclare = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await incidentClient.mutate({
        mutation: DECLARE,
        variables: { ...form, latitude: parseFloat(form.latitude), longitude: parseFloat(form.longitude) },
      });
      setShowForm(false);
      load();
    } catch (err: any) { alert(err.message); }
  };

  const handleStatus = async (id: string, status: string) => {
    try {
      await incidentClient.mutate({ mutation: UPDATE_STATUS, variables: { incidentId: id, status } });
      load();
    } catch (err: any) { alert(err.message); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">⚠️ Incidents</h1>
          <p className="text-slate-400 text-sm mt-1">{incidents.filter(i => i.status !== 'RESOLVED').length} incident(s) actif(s)</p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-medium">
          + Déclarer
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1e293b] rounded-2xl p-6 w-full max-w-md border border-slate-700">
            <h2 className="text-lg font-semibold text-white mb-4">Déclarer un incident</h2>
            <form onSubmit={handleDeclare} className="space-y-3">
              <div>
                <label className="text-sm text-slate-400">Type</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                  className="w-full mt-1 bg-[#0f172a] border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500">
                  {['ACCIDENT', 'CONSTRUCTION', 'ROAD_CLOSED', 'TRAFFIC_JAM'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm text-slate-400">Description</label>
                <textarea required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full mt-1 bg-[#0f172a] border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none h-20"
                  placeholder="Description de l'incident..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[['latitude', 'Latitude'], ['longitude', 'Longitude']].map(([k, l]) => (
                  <div key={k}>
                    <label className="text-sm text-slate-400">{l}</label>
                    <input value={(form as any)[k]} onChange={e => setForm({ ...form, [k]: e.target.value })}
                      className="w-full mt-1 bg-[#0f172a] border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500" />
                  </div>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-xl border border-slate-600 text-slate-400 text-sm">Annuler</button>
                <button type="submit" className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium">Déclarer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-slate-500">Chargement...</div>
      ) : (
        <div className="space-y-3">
          {incidents.map(i => (
            <div key={i.id} className="bg-[#1e293b] rounded-2xl p-5 border border-slate-700 flex items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <span className="text-2xl">{TYPE_ICONS[i.type]}</span>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-white text-sm">{i.type.replace('_', ' ')}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[i.status]}`}>{i.status}</span>
                  </div>
                  <p className="text-slate-400 text-sm">{i.description}</p>
                  <p className="text-slate-500 text-xs mt-1">📍 {i.latitude}, {i.longitude} · {new Date(i.createdAt).toLocaleString('fr-FR')}</p>
                </div>
              </div>
              {i.status !== 'RESOLVED' && (
                <div className="flex gap-2 flex-shrink-0">
                  {i.status === 'REPORTED' && (
                    <button onClick={() => handleStatus(i.id, 'IN_PROGRESS')} className="text-xs px-3 py-1.5 rounded-lg bg-blue-900/40 text-blue-400 hover:bg-blue-800/40">En cours</button>
                  )}
                  <button onClick={() => handleStatus(i.id, 'RESOLVED')} className="text-xs px-3 py-1.5 rounded-lg bg-green-900/40 text-green-400 hover:bg-green-800/40">Résoudre</button>
                </div>
              )}
            </div>
          ))}
          {incidents.length === 0 && (
            <div className="text-center py-20 text-slate-500 bg-[#1e293b] rounded-2xl border border-slate-700">Aucun incident déclaré</div>
          )}
        </div>
      )}
    </div>
  );
}
