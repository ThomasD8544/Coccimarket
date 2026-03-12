import type { Metadata } from 'next';
import './globals.css';
import { PwaRegister } from '@/components/pwa-register';
import { PonyMode } from '@/components/pony-mode';

export const metadata: Metadata = {
  title: 'Coccimarket DLC',
  description: 'Gestion des DLC banc traiteur',
  manifest: '/manifest.json'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <PwaRegister />
        <PonyMode />
        {children}
      </body>
    </html>
  );
}
