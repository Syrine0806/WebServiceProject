import Sidebar from '@/components/layout/Sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#0f172a]">
      <Sidebar />
      <main className="ml-64 flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
