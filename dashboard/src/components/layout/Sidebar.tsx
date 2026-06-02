'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const nav = [
  { href: '/dashboard', label: 'Vue d\'ensemble', icon: '🏠' },
  { href: '/dashboard/map', label: 'Carte Interactive', icon: '🗺️' },
  { href: '/dashboard/vehicles', label: 'Véhicules', icon: '🚗' },
  { href: '/dashboard/traffic', label: 'Trafic', icon: '🚦' },
  { href: '/dashboard/incidents', label: 'Incidents', icon: '⚠️' },
  { href: '/dashboard/notifications', label: 'Notifications', icon: '🔔' },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const logout = () => {
    localStorage.clear();
    router.push('/login');
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#1e293b] border-r border-slate-700 flex flex-col z-50">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🏙️</span>
          <div>
            <p className="font-bold text-white text-sm">Trafic Urbain</p>
            <p className="text-slate-400 text-xs">Dashboard</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {nav.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              pathname === item.href
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
            }`}
          >
            <span>{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:bg-red-900/30 hover:text-red-400 transition-all"
        >
          <span>🚪</span> Se déconnecter
        </button>
      </div>
    </aside>
  );
}
