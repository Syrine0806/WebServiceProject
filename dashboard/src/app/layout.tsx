import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Trafic Urbain — Dashboard',
  description: 'Plateforme de gestion du trafic urbain',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-[#0f172a] text-slate-200 antialiased">
        {children}
      </body>
    </html>
  );
}
