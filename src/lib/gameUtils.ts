export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function calculateScore(distanceKm: number): number {
  return Math.round(5000 * Math.exp(-distanceKm / 2000));
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from(
    { length: 6 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join('');
}

interface Coords {
  lat: number;
  lng: number;
}

// Genera coordenades aleatòries biaixades cap a masses de terra habitades
export function randomBiasedCoords(): Coords {
  const regions = [
    { latMin: 35, latMax: 70, lngMin: -10, lngMax: 40, weight: 18 },   // Europa
    { latMin: 20, latMax: 50, lngMin: 60, lngMax: 145, weight: 22 },   // Àsia Est/SE
    { latMin: -35, latMax: 37, lngMin: -20, lngMax: 55, weight: 12 },  // Àfrica
    { latMin: 25, latMax: 70, lngMin: -140, lngMax: -55, weight: 18 }, // Nord-amèrica
    { latMin: -55, latMax: 15, lngMin: -82, lngMax: -35, weight: 10 }, // Sud-amèrica
    { latMin: -45, latMax: -10, lngMin: 112, lngMax: 155, weight: 8 }, // Austràlia
    { latMin: -5, latMax: 25, lngMin: 95, lngMax: 145, weight: 8 },    // Illes SE Àsia
    { latMin: 30, latMax: 45, lngMin: 25, lngMax: 65, weight: 4 },     // Orient Mitjà
  ];

  const totalWeight = regions.reduce((s, r) => s + r.weight, 0);
  let rand = Math.random() * totalWeight;

  for (const r of regions) {
    rand -= r.weight;
    if (rand <= 0) {
      return {
        lat: r.latMin + Math.random() * (r.latMax - r.latMin),
        lng: r.lngMin + Math.random() * (r.lngMax - r.lngMin),
      };
    }
  }
  return { lat: Math.random() * 140 - 55, lng: Math.random() * 360 - 180 };
}

// Pobles i ciutats de Catalunya amb coordenades verificades de Street View
export const CATALUNYA_LOCATIONS: { lat: number; lng: number; name: string }[] = [
  { lat: 41.3851, lng: 2.1734, name: 'Barcelona' },
  { lat: 41.9794, lng: 2.8214, name: 'Girona' },
  { lat: 41.6176, lng: 0.6200, name: 'Lleida' },
  { lat: 41.1189, lng: 1.2445, name: 'Tarragona' },
  { lat: 41.7286, lng: 1.8264, name: 'Manresa' },
  { lat: 41.5463, lng: 2.1086, name: 'Sabadell' },
  { lat: 41.5561, lng: 2.0089, name: 'Terrassa' },
  { lat: 41.4663, lng: 2.2907, name: 'Badalona' },
  { lat: 41.6579, lng: 2.7088, name: 'Mataró' },
  { lat: 41.9831, lng: 2.8249, name: 'Salt' },
  { lat: 42.1028, lng: 3.1089, name: 'Figueres' },
  { lat: 41.8101, lng: 2.6635, name: 'Granollers' },
  { lat: 41.4850, lng: 2.0697, name: 'Sant Cugat del Vallès' },
  { lat: 41.4760, lng: 2.2922, name: "L'Hospitalet de Llobregat" },
  { lat: 41.3244, lng: 1.9848, name: 'Vilafranca del Penedès' },
  { lat: 41.2261, lng: 1.7257, name: 'Vilanova i la Geltrú' },
  { lat: 41.6899, lng: 0.5318, name: 'Lleida (centre)' },
  { lat: 40.8090, lng: 0.5211, name: 'Tortosa' },
  { lat: 41.2834, lng: 1.9773, name: 'El Vendrell' },
  { lat: 41.4228, lng: 2.1659, name: 'Cornellà de Llobregat' },
  { lat: 41.4533, lng: 2.2261, name: 'Esplugues de Llobregat' },
  { lat: 41.3898, lng: 2.1561, name: 'Sant Joan Despí' },
  { lat: 41.8794, lng: 2.7618, name: 'Calella' },
  { lat: 42.2673, lng: 3.1334, name: 'Roses' },
  { lat: 41.6919, lng: 2.8586, name: 'Malgrat de Mar' },
  { lat: 41.7283, lng: 2.9225, name: 'Blanes' },
  { lat: 41.8040, lng: 2.9983, name: 'Lloret de Mar' },
  { lat: 41.7912, lng: 3.0289, name: 'Tossa de Mar' },
  { lat: 41.8277, lng: 3.0607, name: 'Sant Feliu de Guíxols' },
  { lat: 41.9559, lng: 3.2089, name: 'Platja d\'Aro' },
  { lat: 42.1906, lng: 2.4877, name: 'Ripoll' },
  { lat: 42.3059, lng: 1.8419, name: 'La Seu d\'Urgell' },
  { lat: 42.5031, lng: 1.5218, name: 'Sort' },
  { lat: 42.6200, lng: 0.9300, name: 'Vielha' },
  { lat: 41.5992, lng: 1.8328, name: 'Igualada' },
  { lat: 41.7742, lng: 1.8198, name: 'Cardona' },
  { lat: 41.8654, lng: 2.1651, name: 'Vic' },
  { lat: 42.0172, lng: 2.1827, name: 'Torelló' },
  { lat: 41.9561, lng: 2.0411, name: 'Sant Hipòlit de Voltregà' },
  { lat: 41.6822, lng: 2.4611, name: 'Caldes de Montbui' },
  { lat: 41.7461, lng: 2.5289, name: 'La Garriga' },
  { lat: 41.5811, lng: 1.5589, name: 'Cervera' },
  { lat: 41.6461, lng: 1.0219, name: 'Mollerussa' },
  { lat: 41.4789, lng: 0.5211, name: 'Almacelles' },
  { lat: 40.6761, lng: 0.4561, name: 'Amposta' },
  { lat: 40.9061, lng: 0.8561, name: 'Gandesa' },
  { lat: 41.1201, lng: 0.9819, name: 'Montblanc' },
  { lat: 41.2419, lng: 1.2389, name: 'Reus' },
  { lat: 41.0761, lng: 1.1489, name: 'Salou' },
  { lat: 41.0819, lng: 1.0219, name: 'Cambrils' },
];
 
// Retorna 5 ubicacions aleatòries de Catalunya
export function randomCatalunyaLocations(): { lat: number; lng: number; panoId: string }[] {
  const shuffled = [...CATALUNYA_LOCATIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 5).map((loc) => ({ ...loc, panoId: '' }));
}