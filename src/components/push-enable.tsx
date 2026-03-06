'use client';

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
    <div className="card">
      <h3 className="font-semibold">Notifications push (optionnel)</h3>
      <p className="mb-2 text-sm text-stone-600">Activez les push pour recevoir les alertes DLC sur iPhone (PWA installée).</p>
      <button className="btn-secondary" type="button" onClick={subscribe}>
        Activer les push
      </button>
      {status && <p className="mt-2 text-sm">{status}</p>}
    </div>
  );
}
