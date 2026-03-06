'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Package,
  ScanLine,
  Settings,
  Sparkles,
  type LucideIcon
} from 'lucide-react';

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
  shortLabel: string;
  icon: LucideIcon;
  adminOnly?: boolean;
};

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Pilotage', shortLabel: 'Accueil', icon: LayoutDashboard },
  { href: '/reception', label: 'Réception', shortLabel: 'Réception', icon: ScanLine },
  { href: '/lots', label: 'Lots & stock', shortLabel: 'Lots', icon: Package },
  { href: '/settings', label: 'Paramètres', shortLabel: 'Réglages', icon: Settings, adminOnly: true }
];

function pageTitle(pathname: string) {
  if (pathname.startsWith('/reception')) return 'Réception fournisseur';
  if (pathname.startsWith('/lots')) return 'Suivi des lots';
  if (pathname.startsWith('/settings')) return 'Paramètres';
  return 'Pilotage DLC';
}

function pageSubtitle(pathname: string) {
  if (pathname.startsWith('/reception')) return 'Scannez, complétez et validez un lot sans friction.';
  if (pathname.startsWith('/lots')) return 'Priorisez les actions stock et les DLC sensibles en quelques gestes.';
  if (pathname.startsWith('/settings')) return 'Gérez les notifications et les préférences de l’équipe.';
  return 'Gardez une vision claire des urgences, des stocks et des décisions du jour.';
}

function parisDateLabel() {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    timeZone: 'Europe/Paris'
  }).format(new Date());
}

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

  const title = useMemo(() => pageTitle(pathname), [pathname]);
  const subtitle = useMemo(() => pageSubtitle(pathname), [pathname]);

  if (loading) {
    return (
      <main className="app-shell flex min-h-screen items-center justify-center px-6">
        <div className="glass-panel rounded-[28px] px-6 py-5 text-sm text-stone-700">
          Vérification de la session et chargement de l'espace équipe…
        </div>
      </main>
    );
  }

  if (!user) return null;

  const visibleNavItems = navItems.filter((item) => !item.adminOnly || user.role === 'ADMIN');

  return (
    <div className="app-shell md:grid md:min-h-screen md:grid-cols-[300px_1fr]">
      <aside className="hidden px-5 py-5 md:block">
        <div className="glass-panel sticky top-5 flex min-h-[calc(100vh-2.5rem)] flex-col rounded-[30px] px-5 py-5 text-white" style={{ background: 'linear-gradient(180deg, rgba(30,35,40,0.95) 0%, rgba(41,48,56,0.92) 100%)' }}>
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
            <Image alt="CocciMarket" className="h-auto w-44" height={166} priority src="/coccimarket-logo.png" width={500} />
            <div className="mt-4 flex items-center justify-between text-xs text-white/70">
              <span>Suivi traiteur</span>
              <span className="rounded-full border border-white/10 bg-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/80">
                {user.role === 'ADMIN' ? 'Admin' : 'Équipe'}
              </span>
            </div>
          </div>

          <div className="mt-6 rounded-[24px] border border-white/10 bg-white/5 p-4">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/45">
              <Sparkles className="h-4 w-4" />
              Focus du jour
            </div>
            <p className="mt-3 text-lg font-semibold leading-tight text-white">Réduire les lots à risque avant la fin de service.</p>
            <p className="mt-2 text-sm leading-6 text-white/65">Navigation pensée pour les usages terrain, avec accès rapide aux actions critiques.</p>
          </div>

          <nav className="mt-6 flex-1 space-y-2">
            {visibleNavItems.map((item) => {
              const active = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  className={`group flex items-center gap-3 rounded-[20px] px-4 py-3 text-sm transition duration-200 ${
                    active
                      ? 'bg-white text-stone-900 shadow-[0_18px_30px_-24px_rgba(0,0,0,0.9)]'
                      : 'text-white/78 hover:bg-white/8 hover:text-white'
                  }`}
                  href={item.href}
                  key={item.href}
                >
                  <span className={`rounded-2xl p-2 ${active ? 'bg-[#fff1e1] text-[#c25e15]' : 'bg-white/10 text-white/80'}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex-1 font-medium">{item.label}</span>
                  <ChevronRight className={`h-4 w-4 transition ${active ? 'text-stone-400' : 'text-white/35 group-hover:text-white/65'}`} />
                </Link>
              );
            })}
          </nav>

          <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
            <p className="truncate text-sm font-medium text-white">{user.email}</p>
            <p className="mt-1 text-xs text-white/55">Session sécurisée active</p>
            <button className="btn mt-4 w-full border border-white/10 bg-white/10 text-white hover:bg-white/16" onClick={logout} type="button">
              <LogOut className="h-4 w-4" />
              Déconnexion
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 px-3 pt-3 md:px-6 md:pt-5">
          <div className="glass-panel rounded-[26px] px-4 py-4 md:px-6">
            <div className="flex items-start gap-4 md:items-center">
              <div className="md:hidden">
                <Image alt="CocciMarket" className="h-auto w-28" height={166} priority src="/coccimarket-logo.png" width={500} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="section-kicker">{parisDateLabel()}</p>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <h1 className="text-xl font-semibold tracking-tight text-stone-900 md:text-2xl">{title}</h1>
                  <span className={`badge ${user.role === 'ADMIN' ? 'badge-warning' : 'badge-neutral'}`}>
                    {user.role === 'ADMIN' ? 'Accès administrateur' : 'Accès équipe'}
                  </span>
                </div>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{subtitle}</p>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 px-3 pb-[calc(7.5rem+env(safe-area-inset-bottom))] pt-4 md:px-6 md:pb-8 md:pt-6">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>

        <nav className="fixed bottom-0 left-0 right-0 z-40 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] md:hidden">
          <div className="glass-panel rounded-[28px] px-2 py-2">
            <div className={`grid gap-2 ${visibleNavItems.length >= 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
              {visibleNavItems.map((item) => {
                const active = pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    className={`flex flex-col items-center rounded-[20px] px-2 py-2.5 text-[11px] font-medium transition ${
                      active ? 'bg-[#1f2429] text-white shadow-[0_14px_24px_-18px_rgba(0,0,0,0.8)]' : 'text-slate-600'
                    }`}
                    href={item.href}
                    key={item.href}
                  >
                    <Icon className={`mb-1.5 h-4 w-4 ${active ? 'text-[#ffb16e]' : 'text-slate-500'}`} />
                    {item.shortLabel}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      </div>
    </div>
  );
}
