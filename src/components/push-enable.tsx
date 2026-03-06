'use client';

import { BellRing, CheckCircle2, Smartphone } from 'lucide-react';
import { useState } from 'react';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export function PushEnable() {
  const [status, setStatus] = useState('');

  async function subscribe() {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      setStatus('VAPID public key manquante.');
      return;
    }

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('Push non supporté sur cet appareil.');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      setStatus('Permission notification refusée.');
      return;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey)
    });

    const res = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    });

    setStatus(res.ok ? 'Push activé.' : 'Erreur activation push.');
  }

  return (
    <div className="card soft-appear-delayed">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="section-kicker">Notifications</p>
          <h3 className="mt-2 text-xl font-semibold text-stone-900">Recevoir les alertes DLC en temps réel</h3>
          <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600">
            Idéal pour les postes mobiles. Une fois la PWA installée sur iPhone, l’équipe reçoit les alertes urgentes sans ouvrir l’application.
          </p>
        </div>
        <div className="hidden rounded-[20px] bg-[var(--brand-soft)] p-3 text-[var(--brand)] md:block">
          <BellRing className="h-6 w-6" />
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <div className="card-muted">
          <Smartphone className="h-5 w-5 text-slate-700" />
          <p className="mt-3 text-sm font-semibold text-stone-900">Usage mobile</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">Pensé pour l’équipe en rayon et en réception.</p>
        </div>
        <div className="card-muted">
          <BellRing className="h-5 w-5 text-slate-700" />
          <p className="mt-3 text-sm font-semibold text-stone-900">Alerte immédiate</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">Lots sensibles signalés dès que l’action devient prioritaire.</p>
        </div>
        <div className="card-muted">
          <CheckCircle2 className="h-5 w-5 text-slate-700" />
          <p className="mt-3 text-sm font-semibold text-stone-900">Activation simple</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">Une seule autorisation suffit sur l’appareil concerné.</p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <button className="btn-primary" type="button" onClick={subscribe}>
          Activer les notifications push
        </button>
        {status && (
          <p className={`rounded-2xl px-4 py-3 text-sm ${status === 'Push activé.' ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-700'}`}>
            {status}
          </p>
        )}
      </div>
    </div>
  );
}
