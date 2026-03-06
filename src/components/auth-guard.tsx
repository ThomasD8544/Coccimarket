'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, Package, ScanLine, Settings, LogOut, type LucideIcon } from 'lucide-react';

type User = {
  id: string;
  email: string;
  role: 'ADMIN' | 'EMPLOYEE';
  emailEnabled: boolean;
  pushEnabled: boolean;
};

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
};

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/reception', label: 'Réception', icon: ScanLine },
  { href: '/lots', label: 'Lots', icon: Package },
  { href: '/settings', label: 'Paramètres', icon: Settings, adminOnly: true }
];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then((data) => setUser(data.user))
      .catch(() => router.replace('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  async function logout() {
    await fetch('/api/auth/me', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'logout' })
    });
    router.replace('/login');
  }

  if (loading) {
    return <main className="p-4 text-sm">Chargement...</main>;
  }

  if (!user) return null;

  const visibleNavItems = navItems.filter((item) => !item.adminOnly || user.role === 'ADMIN');

  return (
    <div className="min-h-screen md:grid md:grid-cols-[260px_1fr]">
      <aside className="hidden border-r border-[#2d2f34] bg-[#18191d] text-white md:flex md:flex-col">
        <div className="border-b border-white/10 p-5">
          <Image alt="CocciMarket" className="h-auto w-44" height={166} priority src="/coccimarket-logo.png" width={500} />
          <p className="mt-2 text-xs text-white/70">Gestion DLC</p>
        </div>

        <nav className="flex-1 space-y-2 p-3">
          {visibleNavItems.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition ${
                  active ? 'bg-[#ff6a1a] text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'
                }`}
                href={item.href}
                key={item.href}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          <p className="mb-2 truncate text-xs text-white/70">{user.email}</p>
          <button className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm text-white" onClick={logout} type="button">
            <LogOut className="h-4 w-4" />
            Déconnexion
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 border-b border-stone-200 bg-[#fffaf2]/95 backdrop-blur md:bg-white/90">
          <div className="flex items-center gap-3 px-4 py-3 md:px-6">
            <Image alt="CocciMarket" className="h-auto w-28 md:hidden" height={166} src="/coccimarket-logo.png" width={500} />
            <div className="hidden text-lg font-semibold text-[#2e3137] md:block">Tableau de pilotage DLC</div>
            <div className="ml-auto rounded-full bg-[#f6f2e8] px-3 py-1 text-xs text-stone-700">{user.role === 'ADMIN' ? 'ADMIN' : 'EMPLOYÉ'}</div>
          </div>
        </header>

        <main className="flex-1 p-4 pb-[calc(7rem+env(safe-area-inset-bottom))] md:p-6 md:pb-6">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>

        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-stone-200 bg-[#fffaf2] p-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] md:hidden">
          <div className={`grid gap-2 ${visibleNavItems.length >= 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
            {visibleNavItems.map((item) => {
              const active = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  className={`flex flex-col items-center rounded-xl px-2 py-2 text-[11px] ${
                    active ? 'bg-[#ff6a1a] text-white' : 'text-stone-700'
                  }`}
                  href={item.href}
                  key={item.href}
                >
                  <Icon className="mb-1 h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
