'use client';

import { FormEvent, useEffect, useState } from 'react';
import { BellRing, MailCheck, PlayCircle, Settings2, ShieldPlus, Users } from 'lucide-react';
import { AuthGuard } from '@/components/auth-guard';

export default function SettingsPage() {
  const [alertDaysBefore, setAlertDaysBefore] = useState(2);
  const [dailyJobHour, setDailyJobHour] = useState(7);
  const [timezone, setTimezone] = useState('Europe/Paris');
  const [email, setEmail] = useState('');
  const [testEmailTo, setTestEmailTo] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'EMPLOYEE'>('EMPLOYEE');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        setAlertDaysBefore(data.settings.alertDaysBefore);
        setDailyJobHour(data.settings.dailyJobHour);
        setTimezone(data.settings.timezone);
      });
  }, []);

  async function saveSettings(event: FormEvent) {
    event.preventDefault();
    setMessage('');

    const res = await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alertDaysBefore, dailyJobHour, timezone })
    });

    setMessage(res.ok ? 'Paramètres sauvegardés.' : 'Erreur paramètres.');
  }

  async function createUser(event: FormEvent) {
    event.preventDefault();
    setMessage('');

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role })
    });

    setMessage(res.ok ? 'Utilisateur créé.' : 'Erreur création utilisateur.');
    if (res.ok) {
      setEmail('');
      setPassword('');
      setRole('EMPLOYEE');
    }
  }

  async function testNotifications() {
    const res = await fetch('/api/notifications/test', { method: 'POST' });
    setMessage(res.ok ? 'Job notifications exécuté.' : 'Erreur job notifications.');
  }

  async function testEmail() {
    setMessage('');
    const res = await fetch('/api/notifications/test-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: testEmailTo })
    });

    setMessage(res.ok ? 'Email de test envoyé.' : 'Erreur envoi email test (vérifier SMTP).');
  }

  return (
    <AuthGuard>
      <div className="space-y-4 md:space-y-6">
        <section className="card soft-appear">
          <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr] xl:items-end">
            <div>
              <p className="section-kicker">Réglages d’exploitation</p>
              <h2 className="section-title mt-3 text-stone-900">Pilotez les alertes, les tests et les accès équipe sans quitter l’interface.</h2>
              <p className="section-subtitle mt-3 max-w-2xl">
                Cette page regroupe les paramètres critiques du cycle d’alerte DLC, les vérifications de notifications et la gestion des comptes internes.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="card-muted">
                <Settings2 className="h-5 w-5 text-[var(--brand)]" />
                <p className="mt-3 text-sm font-semibold text-stone-900">Configuration</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">Rythme des alertes et fuseau de travail.</p>
              </div>
              <div className="card-muted">
                <BellRing className="h-5 w-5 text-[var(--brand)]" />
                <p className="mt-3 text-sm font-semibold text-stone-900">Tests</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">Validation rapide des envois et du job quotidien.</p>
              </div>
              <div className="card-muted">
                <Users className="h-5 w-5 text-[var(--brand)]" />
                <p className="mt-3 text-sm font-semibold text-stone-900">Équipe</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">Création des accès selon le rôle terrain ou admin.</p>
              </div>
            </div>
          </div>
        </section>

        {message && <p className="rounded-[20px] bg-white/75 px-4 py-3 text-sm text-slate-700 shadow-[0_18px_40px_-34px_rgba(39,24,11,0.8)]">{message}</p>}

        <section className="grid gap-4 xl:grid-cols-[1.02fr_0.98fr]">
          <form className="card soft-appear space-y-5" onSubmit={saveSettings}>
            <div className="flex items-center gap-3">
              <span className="rounded-2xl bg-[var(--brand-soft)] p-2 text-[var(--brand)]">
                <BellRing className="h-5 w-5" />
              </span>
              <div>
                <p className="section-kicker">Alertes</p>
                <h3 className="mt-1 text-xl font-semibold text-stone-900">Paramètres de notification</h3>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="text-sm font-medium text-stone-800">
                Alerter X jours avant
                <input
                  className="input mt-2"
                  value={alertDaysBefore}
                  onChange={(e) => setAlertDaysBefore(Number(e.target.value))}
                  type="number"
                  min={1}
                  max={14}
                />
              </label>
              <label className="text-sm font-medium text-stone-800">
                Heure job quotidien
                <input
                  className="input mt-2"
                  value={dailyJobHour}
                  onChange={(e) => setDailyJobHour(Number(e.target.value))}
                  type="number"
                  min={0}
                  max={23}
                />
              </label>
            </div>

            <label className="text-sm font-medium text-stone-800">
              Fuseau
              <input className="input mt-2" value={timezone} onChange={(e) => setTimezone(e.target.value)} />
            </label>

            <p className="text-sm leading-6 text-slate-600">
              Conseil: gardez l'exécution quotidienne alignée sur l'ouverture ou la préparation du banc pour que les alertes arrivent avant le rush.
            </p>

            <div className="flex flex-wrap gap-3">
              <button className="btn-primary" type="submit">
                Sauvegarder les réglages
              </button>
              <button className="btn-secondary" onClick={testNotifications} type="button">
                <PlayCircle className="h-4 w-4" />
                Lancer le job maintenant
              </button>
            </div>
          </form>

          <div className="space-y-4">
            <form className="card soft-appear space-y-5" onSubmit={createUser}>
              <div className="flex items-center gap-3">
                <span className="rounded-2xl bg-[#eef6ff] p-2 text-sky-700">
                  <ShieldPlus className="h-5 w-5" />
                </span>
                <div>
                  <p className="section-kicker">Gestion équipe</p>
                  <h3 className="mt-1 text-xl font-semibold text-stone-900">Créer un utilisateur</h3>
                </div>
              </div>

              <label className="text-sm font-medium text-stone-800">
                Email
                <input className="input mt-2" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
              </label>
              <label className="text-sm font-medium text-stone-800">
                Mot de passe
                <input className="input mt-2" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
              </label>
              <label className="text-sm font-medium text-stone-800">
                Rôle
                <select className="select mt-2" value={role} onChange={(e) => setRole(e.target.value as 'ADMIN' | 'EMPLOYEE')}>
                  <option value="EMPLOYEE">EMPLOYÉ</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </label>
              <button className="btn-primary" type="submit">
                Créer l’accès
              </button>
            </form>

            <section className="card soft-appear space-y-5">
              <div className="flex items-center gap-3">
                <span className="rounded-2xl bg-emerald-50 p-2 text-emerald-700">
                  <MailCheck className="h-5 w-5" />
                </span>
                <div>
                  <p className="section-kicker">Vérification</p>
                  <h3 className="mt-1 text-xl font-semibold text-stone-900">Tester l’emailing</h3>
                </div>
              </div>

              <label className="text-sm font-medium text-stone-800">
                Adresse email de test
                <input
                  className="input mt-2"
                  value={testEmailTo}
                  onChange={(e) => setTestEmailTo(e.target.value)}
                  type="email"
                  placeholder="exemple@domaine.com"
                />
              </label>
              <button className="btn-primary" disabled={!testEmailTo} onClick={testEmail} type="button">
                Envoyer un email de test
              </button>
              <p className="text-sm leading-6 text-slate-600">
                Utilisez une boîte réelle pour vérifier à la fois la délivrabilité et le rendu du message reçu par l'équipe.
              </p>
            </section>
          </div>
        </section>
      </div>
    </AuthGuard>
  );
}
