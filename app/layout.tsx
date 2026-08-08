import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TrippieMe — Itinéraires intelligents',
  description: 'Préparez un voyage réaliste, étape par étape.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="fr"><body>{children}</body></html>;
}
