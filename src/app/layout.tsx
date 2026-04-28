// src/app/layout.tsx

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/authContext'; // Ja ho tenies!

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'La Quinta Forca',
  description: 'Endevina on ets al món — multijugador en temps real',
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
        {/* Aquí és on passa la màgia: envoltem els 'children' amb l'AuthProvider.
          D'aquesta manera, qualsevol pàgina o component (Home, Stats, Room...)
          tindrà accés a la informació de l'usuari.
        */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}