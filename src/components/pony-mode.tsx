'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'coccimarket_pony_mode';

export function PonyMode() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'on') setEnabled(true);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off');
    document.body.classList.toggle('pony-mode', enabled);

    return () => {
      document.body.classList.remove('pony-mode');
    };
  }, [enabled]);

  return (
    <>
      <button
        type="button"
        aria-pressed={enabled}
        className="pony-toggle"
        onClick={() => setEnabled((v) => !v)}
        title="Mode My Little Pony"
      >
        {enabled ? '🌈 Pony ON' : '🦄 Pony OFF'}
      </button>

      {enabled && (
        <div className="pony-overlay" aria-hidden="true">
          <div className="pony-rainbow" />
          <span className="pony-heart h1">💖</span>
          <span className="pony-heart h2">💗</span>
          <span className="pony-heart h3">💘</span>
          <span className="pony-heart h4">💝</span>
          <span className="pony-heart h5">💞</span>
          <span className="pony-heart h6">💕</span>
        </div>
      )}
    </>
  );
}
