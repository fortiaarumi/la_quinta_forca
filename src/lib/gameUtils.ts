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

export function calculateScore(distanceKm: number, mode: 'world' | 'catalunya' = 'world'): number {
  // 👈 AFEGIT: Tolerància de 50 metres (0.05 km) per la puntuació perfecta
  if (distanceKm <= 0.05) return 5000;

  if (mode === 'catalunya') {
    // Escala per a Catalunya: La caiguda de punts és molt ràpida (divisor 30)
    const score = Math.round(5000 * Math.exp(-distanceKm / 30));
    return Math.max(0, Math.min(5000, score));
  } else {
    // Escala per al Món: La caiguda de punts és més suau (divisor 2000)
    const score = Math.round(5000 * Math.exp(-distanceKm / 2000));
    return Math.max(0, Math.min(5000, score));
  }
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

// Genera coordenades aleatòries dins d'una caixa delimitadora (Bounding Box) per a Catalunya
export function randomCatalunyaCoords(): Coords {
  // Límits geogràfics aproximats de Catalunya
  const minLat = 40.52; // Sud (Montsià)
  const maxLat = 42.86; // Nord (Val d'Aran)
  const minLng = 0.15;  // Oest (Terra Alta)
  const maxLng = 3.33;  // Est (Cap de Creus)

  const lat = minLat + Math.random() * (maxLat - minLat);
  const lng = minLng + Math.random() * (maxLng - minLng);
  
  return { lat, lng };
}