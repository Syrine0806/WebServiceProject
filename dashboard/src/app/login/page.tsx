'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { gql } from '@apollo/client';
import { authClient } from '@/lib/apollo-client';

const LOGIN = gql`
  mutation Login($email: String!, $password: String!) {
    login(input: { email: $email, password: $password }) {
      accessToken
      user { id email role firstName }
    }
  }
`;

const REGISTER = gql`
  mutation Register($email: String!, $password: String!, $firstName: String, $role: Role) {
    register(input: { email: $email, password: $password, firstName: $firstName, role: $role }) {
      accessToken
      user { id email role firstName }
    }
  }
`;

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', firstName: '', role: 'OPERATOR' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await authClient.mutate({
        mutation: isRegister ? REGISTER : LOGIN,
        variables: isRegister
          ? { email: form.email, password: form.password, firstName: form.firstName, role: form.role }
          : { email: form.email, password: form.password },
      });
      const result = isRegister ? data.register : data.login;
      localStorage.setItem('token', result.accessToken);
      localStorage.setItem('user', JSON.stringify(result.user));
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🏙️</div>
          <h1 className="text-2xl font-bold text-white">Trafic Urbain</h1>
          <p className="text-slate-400 text-sm mt-1">Plateforme de gestion du trafic</p>
        </div>

        {/* Card */}
        <div className="bg-[#1e293b] rounded-2xl p-8 border border-slate-700 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-6">
            {isRegister ? 'Créer un compte' : 'Se connecter'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-sm text-slate-400 mb-1">Prénom</label>
                <input
                  type="text"
                  value={form.firstName}
                  onChange={e => setForm({ ...form, firstName: e.target.value })}
                  className="w-full bg-[#0f172a] border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  placeholder="Votre prénom"
                />
              </div>
            )}

            <div>
              <label className="block text-sm text-slate-400 mb-1">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full bg-[#0f172a] border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                placeholder="admin@traffic.com"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">Mot de passe</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full bg-[#0f172a] border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                placeholder="••••••••"
              />
            </div>

            {isRegister && (
              <div>
                <label className="block text-sm text-slate-400 mb-1">Rôle</label>
                <select
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                  className="w-full bg-[#0f172a] border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="OPERATOR">OPERATOR</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
            )}

            {error && (
              <div className="bg-red-900/30 border border-red-500/40 rounded-lg px-4 py-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold rounded-lg py-2.5 transition-colors"
            >
              {loading ? 'Chargement...' : isRegister ? "S'inscrire" : 'Se connecter'}
            </button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-6">
            {isRegister ? 'Déjà un compte ?' : 'Pas encore de compte ?'}{' '}
            <button onClick={() => setIsRegister(!isRegister)} className="text-indigo-400 hover:underline">
              {isRegister ? 'Se connecter' : "S'inscrire"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
