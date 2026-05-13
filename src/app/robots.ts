import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',      // Zona privada d'administració
        '/room/',      // Sales de joc dinàmiques i temporals
        '/api/',       // Endpoints de l'API
        '/_next/',     // Fitxers interns de Next.js
      ],
    },
    sitemap: 'https://la-quinta-forca.vercel.app/sitemap.xml',
  };
}
