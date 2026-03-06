'use client';

import { FormEvent, useEffect, useState } from 'react';
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
      <div className="space-y-3">
        <form className="card space-y-3" onSubmit={saveSettings}>
          <h2 className="text-lg font-semibold">Paramètres alertes</h2>
          <label className="block text-sm">
            Alerter X jours avant
            <input
              className="input mt-1"
              value={alertDaysBefore}
              onChange={(e) => setAlertDaysBefore(Number(e.target.value))}
              type="number"
              min={1}
              max={14}
            />
          </label>
          <label className="block text-sm">
            Heure job quotidien
            <input
              className="input mt-1"
              value={dailyJobHour}
              onChange={(e) => setDailyJobHour(Number(e.target.value))}
              type="number"
              min={0}
              max={23}
            />
          </label>
          <label className="block text-sm">
            Fuseau
            <input className="input mt-1" value={timezone} onChange={(e) => setTimezone(e.target.value)} />
          </label>
          <button className="btn-primary" type="submit">
            Sauvegarder
          </button>
          <button className="btn-secondary ml-2" onClick={testNotifications} type="button">
            Lancer job maintenant
          </button>
        </form>

        <form className="card space-y-3" onSubmit={createUser}>
          <h2 className="text-lg font-semibold">Créer un utilisateur</h2>
          <label className="block text-sm">
            Email
            <input className="input mt-1" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </label>
          <label className="block text-sm">
            Mot de passe
            <input
              className="input mt-1"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
            />
          </label>
          <label className="block text-sm">
            Rôle
            <select className="input mt-1" value={role} onChange={(e) => setRole(e.target.value as 'ADMIN' | 'EMPLOYEE')}>
              <option value="EMPLOYEE">EMPLOYÉ</option>
              <option value="ADMIN">ADMIN</option>
            </select>
          </label>
          <button className="btn-primary" type="submit">
            Créer
          </button>
        </form>

        <section className="card space-y-3">
          <h2 className="text-lg font-semibold">Test notifications email</h2>
          <label className="block text-sm">
            Adresse email de test
            <input
              className="input mt-1"
              value={testEmailTo}
              onChange={(e) => setTestEmailTo(e.target.value)}
              type="email"
              placeholder="exemple@domaine.com"
            />
          </label>
          <button className="btn-primary" disabled={!testEmailTo} onClick={testEmail} type="button">
            Envoyer un email de test
          </button>
        </section>

        {message && <p className="text-sm">{message}</p>}
      </div>
    </AuthGuard>
  );
}
