'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';

export function Scanner({ onDetected }: { onDetected: (code: string) => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!videoRef.current) return;

    const codeReader = new BrowserMultiFormatReader();
    let controls: { stop: () => void } | undefined;
    let active = true;
    let detected = false;

    codeReader
      .decodeFromConstraints(
        {
          video: {
            facingMode: { ideal: 'environment' }
          }
        },
        videoRef.current!,
        (result, err) => {
        if (result && active && !detected) {
          detected = true;
          onDetected(result.getText());
        }
        if (err && err.name !== 'NotFoundException') {
          setError('Impossible de lire le code, essayer à nouveau.');
        }
        }
      )
      .then((c) => {
        controls = c;
      })
      .catch(() => setError('Accès caméra refusé ou indisponible.'));

    return () => {
      active = false;
      controls?.stop();
    };
  }, [onDetected]);

  return (
    <div className="space-y-2">
      <video autoPlay className="w-full rounded-xl border border-stone-300" muted playsInline ref={videoRef} />
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
