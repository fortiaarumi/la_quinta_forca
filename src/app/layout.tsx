// src/app/layout.tsx
// ─── FIX HIDRATACIÓ ───────────────────────────────────────────────────────────
// L'error que surts a la foto és causat per extensions del navegador (com Bitwarden,
// LastPass, Grammarly...) que injecten atributs al <body> ABANS que React s'hidrati.
// La solució és afegir suppressHydrationWarning al <body>.
// ─────────────────────────────────────────────────────────────────────────────

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

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
      {/*
        suppressHydrationWarning al <body> elimina l'error d'hidratació.
        Això és segur: només suprimeix warnings causats per extensions del
        navegador que modifiquen el DOM (bis_register, __processed_, etc.)
        i no afecta el comportament del teu codi.
      */}
      <body
        className={`${inter.className} antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
