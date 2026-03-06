'use client';

import { useEffect } from 'react';

export function PwaRegister() {
  useEffect(() => {
    // Temporary hard-disable of service workers to remove stale cached bundles on iPhone Safari/PWA.
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((reg) => reg.unregister());
      });
    }

    if ('caches' in window) {
      caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
    }
  }, []);

  return null;
}
