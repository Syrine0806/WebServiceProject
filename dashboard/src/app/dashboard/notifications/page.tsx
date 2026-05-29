'use client';
import { useEffect, useState } from 'react';
import { gql } from '@apollo/client';
import { notifClient } from '@/lib/apollo-client';

const GET_NOTIFS = gql`query { notifications { id userId message type isRead createdAt } }`;
const SEND_NOTIF = gql`
  mutation Send($userId: String!, $message: String!, $type: NotificationType) {
    sendNotification(input: { userId: $userId, message: $message, type: $type }) {
      id message type isRead createdAt
    }
  }
`;
const MARK_READ = gql`mutation Mark($id: String!) { markNotificationAsRead(id: $id) { id isRead } }`;
const MARK_ALL = gql`mutation MarkAll($userId: String!) { markAllNotificationsAsRead(userId: $userId) }`;

const TYPE_ICONS: Record<string, string> = { INCIDENT: '⚠️', TRAFFIC: '🚦', SYSTEM: '💻', ALERT: '🔴' };
const TYPE_STYLES: Record<string, string> = {
  INCIDENT: 'bg-red-900/30 border-red-700/40',
  TRAFFIC:  'bg-orange-900/30 border-orange-700/40',
  SYSTEM:   'bg-slate-800 border-slate-700',
  ALERT:    'bg-red-900/50 border-red-600/40',
};

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ userId: '', message: '', type: 'SYSTEM' });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await notifClient.query({ query: GET_NOTIFS, fetchPolicy: 'no-cache' });
      setNotifs(data.notifications);
    } catch { setNotifs([]); }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const u = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (u) setForm(f => ({ ...f, userId: JSON.parse(u).id }));
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await notifClient.mutate({ mutation: SEND_NOTIF, variables: form });
      setShowForm(false);
      load();
    } catch (err: any) { alert(err.message); }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await notifClient.mutate({ mutation: MARK_READ, variables: { id } });
      load();
    } catch {}
  };

  const unread = notifs.filter(n => !n.isRead);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">🔔 Notifications</h1>
          <p className="text-slate-400 text-sm mt-1">{unread.length} non lue(s) · {notifs.length} au total</p>
        </div>
        <button onClick={() => setShowForm(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium">
          + Envoyer
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1e293b] rounded-2xl p-6 w-full max-w-md border border-slate-700">
            <h2 className="text-lg font-semibold text-white mb-4">Envoyer une notification</h2>
            <form onSubmit={handleSend} className="space-y-3">
              <div>
                <label className="text-sm text-slate-400">ID Utilisateur destinataire</label>
                <input required value={form.userId} onChange={e => setForm({ ...form, userId: e.target.value })}
                  className="w-full mt-1 bg-[#0f172a] border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500"
                  placeholder="uuid de l'utilisateur" />
              </div>
              <div>
                <label className="text-sm text-slate-400">Message</label>
                <textarea required value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}
                  className="w-full mt-1 bg-[#0f172a] border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500 resize-none h-20"
                  placeholder="Votre message..." />
              </div>
              <div>
                <label className="text-sm text-slate-400">Type</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                  className="w-full mt-1 bg-[#0f172a] border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-indigo-500">
                  {['SYSTEM', 'INCIDENT', 'TRAFFIC', 'ALERT'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-xl border border-slate-600 text-slate-400 text-sm">Annuler</button>
                <button type="submit" className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium">Envoyer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-20 text-slate-500">Chargement...</div>
      ) : (
        <div className="space-y-2">
          {notifs.map(n => (
            <div key={n.id} className={`flex items-start gap-4 p-4 rounded-xl border transition-opacity ${TYPE_STYLES[n.type] || TYPE_STYLES.SYSTEM} ${n.isRead ? 'opacity-50' : ''}`}>
              <span className="text-xl flex-shrink-0">{TYPE_ICONS[n.type] || '🔔'}</span>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${n.isRead ? 'text-slate-400' : 'text-white font-medium'}`}>{n.message}</p>
                <p className="text-slate-500 text-xs mt-1">{new Date(n.createdAt).toLocaleString('fr-FR')}</p>
              </div>
              {!n.isRead && (
                <button onClick={() => handleMarkRead(n.id)}
                  className="text-xs px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 flex-shrink-0">
                  Lue
                </button>
              )}
            </div>
          ))}
          {notifs.length === 0 && (
            <div className="text-center py-20 text-slate-500 bg-[#1e293b] rounded-2xl border border-slate-700">Aucune notification</div>
          )}
        </div>
      )}
    </div>
  );
}
