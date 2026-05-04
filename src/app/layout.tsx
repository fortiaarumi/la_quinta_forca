// src/app/layout.tsx

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/authContext';
import { AudioProvider } from '@/lib/AudioContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  // 1. Títol i descripció millorats pel SEO
  title: 'La Quinta Forca | El joc de geografia en català',
  description: 'Endevina on ets al món amb La Quinta Forca, el GeoGuessr en català. Descobreix indrets del món, estadis de futbol, monuments culturals i racons de Catalunya en mode multijugador en temps real.',

  // 2. Paraules clau per als cercadors
  keywords: ['la quinta forca', 'geografia', 'joc en català', 'geoguessr català', 'endevinar llocs', 'estadis de futbol', 'monuments', 'multijugador', 'Siuuu', 'Cristiano Ronaldo'],

  // 3. OpenGraph per compartir bé l'enllaç per WhatsApp/Xarxes Socials
  openGraph: {
    title: 'La Quinta Forca - Quin lloc del món és?',
    description: 'Demostra els teus coneixements de geografia explorant mapes del món, estadis, cultura i Catalunya. Juga-hi gratis!',
    url: 'https://la-quinta-forca.vercel.app',
    siteName: 'La Quinta Forca',
    locale: 'ca_ES',
    type: 'website',
  },

  // 4. El teu codi exclusiu de verificació de Google Search Console
  verification: {
    google: 'fUuJHjL2IjEfzQfHH8ctRaJnumXrxI2G6zOXWskDE-s',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ca">
      <body
        className={`${inter.className} antialiased`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <AudioProvider>
            {children}
          </AudioProvider>
        </AuthProvider>
      </body>
    </html>
  );
}