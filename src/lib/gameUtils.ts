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

export function calculateScore(distanceKm: number, mode: string = 'world'): number {
  // 👈 AFEGIT: Tolerància de 50 metres (0.05 km) per la puntuació perfecta
  if (distanceKm <= 0.05) return 5000;

  if (distanceKm <= 0.05) return 5000;

  if (mode === 'pixapins') {
    // Escala per a Barcelona: La caiguda de punts és moltíssim més ràpida (divisor 3)
    const score = Math.round(5000 * Math.exp(-distanceKm / 3));
    return Math.max(0, Math.min(5000, score));
  } else if (mode === 'catalunya') {
    // Escala per a Catalunya: La caiguda de punts és molt ràpida (divisor 30)
    const score = Math.round(5000 * Math.exp(-distanceKm / 30));
    return Math.max(0, Math.min(5000, score));
  } else {
    // Escala per al Món, Estadis i Cultural: La caiguda de punts és més suau (divisor 2000)
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

// Genera coordenades aleatòries dins d'una caixa delimitadora per a Barcelona (Pixapins)
export function randomPixapinsCoords(): Coords {
  // Límits geogràfics aproximats de Barcelona ciutat i àrea molt propera
  const minLat = 41.34;
  const maxLat = 41.45;
  const minLng = 2.10;
  const maxLng = 2.22;

  const lat = minLat + Math.random() * (maxLat - minLat);
  const lng = minLng + Math.random() * (maxLng - minLng);

  return { lat, lng };
}

// ── CONSTANTS CLAU ──
export const CAMP_NOU_COORDS = { lat: 41.380896, lng: 2.1228198 };
export const SAGRADA_FAMILIA_COORDS = { lat: 41.4036299, lng: 2.1743558 };

// ── NOU: LLISTES DE COORDENADES TEMÀTIQUES ──
export const ESTADIS_FUTBOL = [
  { lat: 49.980858, lng: 36.261703 }, // Metalist Stadium
  { lat: 45.72408056, lng: 4.82815833 }, // Palais des Sports de Gerland
  { lat: 45.724016, lng: 4.880987 }, // Stade Vuillermet
  { lat: 45.721328, lng: 4.876014 }, // Matmut Stadium
  { lat: 41.890277777, lng: 12.492222222 }, // Colosseu
  { lat: 51.649928, lng: -0.401606 }, // Vicarage Road
  { lat: 33.203611111, lng: -97.159444444 }, // Apogee Stadium
  { lat: 48.924444444, lng: 2.36 }, // Stade de France
  { lat: 54.961111111, lng: -1.579722222 }, // Gateshead International Stadium
  { lat: -34.914444, lng: -54.955278 }, // Estadi Domingo Burgueño
  { lat: -33.878333, lng: 151.202778 }, // Sydney Entertainment Centre
  { lat: 46.67131, lng: -1.44065 }, // Stade Henri Desgrange
  { lat: 47.65178, lng: -2.76104 }, // Stade de la Rabine
  { lat: 51.422222222, lng: -0.982777777 }, // Madejski Stadium
  { lat: 55.781044444, lng: 37.626425 }, // Olympiysky Sports Complex
  { lat: 55.702469, lng: 12.572203 }, // Parken Stadium
  { lat: -34.86213611, lng: -56.20163889 }, // Estadio Saroldi
  { lat: -34.893108, lng: -56.245413 }, // Pedro Arispe Olympic Stadium
  { lat: -34.46694444, lng: -57.84527778 }, // Estadio Suppici
  { lat: 42.346388888, lng: -71.0975 }, // Fenway Park
  { lat: 30.732392, lng: 121.335756 }, // Jinshan Sports Centre
  { lat: 40.45592222, lng: 19.48898611 }, // Estadi Flamurtari
  { lat: 46.768333, lng: 23.572222 }, // Cluj Arena
  { lat: 25.42, lng: 51.4 }, // Umm Salal Stadium
  { lat: 53.3961, lng: -1.4258 }, // Don Valley Stadium
  { lat: 40.291111, lng: 44.352222 }, // Kasakhi Marzik Stadium
  { lat: 45.570556, lng: 10.236944 }, // Stadio Mario Rigamonti
  { lat: 45.81388889, lng: 9.07222222 }, // Stadio Giuseppe Sinigaglia
  { lat: 45.813782, lng: 9.072363 }, // Stadio Giuseppe Sinigaglia
  { lat: 45.432222, lng: 11.858333 }, // Stadio Euganeo
  { lat: 37.2789, lng: 9.86558 }, // Stade Ahmed Bsiri
  { lat: 35.8549, lng: 10.5986 }, // Estadi Bou Ali-Lahouar
  { lat: 43.725278, lng: 10.4 }, // Arena Garibaldi – Stadio Romeo Anconetani
  { lat: 35.510044, lng: 139.606247 }, // Estadi Internacional de Yokohama
  { lat: 43.407277, lng: 5.04935 }, // Stade Francis Turcan
  { lat: 52.622222222, lng: 1.309166666 }, // Carrow Road
  { lat: 19.078056, lng: -98.164444 }, // Estadi Cuauhtémoc
  { lat: 41.933699, lng: 12.457874 }, // Stadio dei Marmi
  { lat: 48.218775, lng: 11.624752777 }, // Allianz Arena
  { lat: 29.623865, lng: 52.556062 }, // Hafezieh Stadium
  { lat: 51.555555555, lng: -0.279444444 }, // Wembley Stadium
  { lat: 42.126944, lng: -80.08 }, // UPMC Park
  { lat: 34.6693, lng: 135.476102777 }, // Kyocera Dome Osaka
  { lat: 53.559722222, lng: -113.476111111 }, // Commonwealth Stadium
  { lat: 48.173055555, lng: 11.546666666 }, // Estadi Olímpic de Múnic
  { lat: 39.991544, lng: 116.390478 }, // Estadi Nacional de Pequín
  { lat: 37.434984, lng: 126.690699 }, // Estadi Munhak d'Incheon
  { lat: 37.434984, lng: 126.690699 }, // Estadi Munhak d'Incheon
  { lat: 53.586944, lng: 9.898611 }, // Volksparkstadion
  { lat: 53.586944, lng: 9.898611 }, // Volksparkstadion
  { lat: 51.554502777, lng: 7.067588888 }, // Veltins-Arena
  { lat: 41.644444, lng: -4.761111 }, // Estadi José Zorrilla
  { lat: 48.792222, lng: 9.231944 }, // MHPArena
  { lat: 52.36, lng: 9.731111 }, // AWD-Arena
  { lat: 38.89, lng: -76.971944444 }, // Robert F. Kennedy Memorial Stadium
  { lat: 39.096666666, lng: -84.508333333 }, // Riverfront Stadium
  { lat: -22.912166666, lng: -43.230163888 }, // Estadi Maracanã
  { lat: -26.234806, lng: 27.982378 }, // FNB Stadium
  { lat: 40.45306, lng: -3.68835 }, // Estadi Santiago Bernabéu
  { lat: 13.105, lng: -59.6225 }, // Kensington Oval
  { lat: 24.416088888, lng: 54.453591666 }, // Estadi Xeic Zayed
  { lat: -33.903461111, lng: 18.411152777 }, // Estadi Green Point
  { lat: 55.586111111, lng: 12.989166666 }, // Estadi de Malmö
  { lat: 29.7522, lng: -95.3524 }, // Shell Energy Stadium
  { lat: 52.239444, lng: 21.045556 }, // Estadi Nacional de Polònia
  { lat: 48.020833, lng: 37.809722 }, // Donbass Arena
  { lat: -33.937778, lng: 25.598889 }, // Estadi Nelson Mandela Bay
  { lat: -8.523889, lng: 179.198611 }, // Tuvalu Sports Ground
  { lat: -22.26417143, lng: 166.4679427 }, // Stade Numa-Daly Magenta
  { lat: 48.207222222, lng: 16.420833333 }, // Estadi Ernst Happel
  { lat: -23.924689, lng: 29.468765 }, // Estadi Peter Mokaba
  { lat: -25.461888888, lng: 30.929777777 }, // Estadi Mbombela
  { lat: -25.578611111, lng: 27.160833333 }, // Estadi Royal Bafokeng
  { lat: 41.655202, lng: 41.637246 }, // Estadi Central de Batumi
  { lat: 42.111213, lng: 43.02568 }, // David Abashidze Stadium
  { lat: 48.734444, lng: 44.548333 }, // Central Stadium
  { lat: 55.078, lng: 24.2717 }, // Jonava City Stadium
  { lat: 55.078, lng: 24.2717 }, // Jonava City Stadium
  { lat: 55.078, lng: 24.2717 }, // Jonava City Stadium
  { lat: 43.238331, lng: 76.92435 }, // Estadi Central d'Almati
  { lat: 52.276383, lng: 76.949712 }, // Pavlodar Central Stadium
  { lat: 55.825863888, lng: -4.252002777 }, // Hampden Park
  { lat: 46.962778, lng: 7.465 }, // Estadi Wankdorf
  { lat: 49.553056, lng: 25.609167 }, // Roman Shukhevych Ternopil city stadium
  { lat: 26.620721, lng: 106.605749 }, // Guiyang Olympic Sports Center
  { lat: 25.0695, lng: 121.521056 }, // Zhongshan Soccer Stadium
  { lat: 28.539166666, lng: -81.402777777 }, // Estadi Citrus Bowl
  { lat: 33.864444444, lng: -118.261111111 }, // Dignity Health Sports Park
  { lat: -15.371064, lng: 28.269631 }, // Independence Stadium
  { lat: 52.915, lng: -1.447222222 }, // Pride Park Stadium
  { lat: 43.269241, lng: 5.394907 }, // Stade Vélodrome
  { lat: 39.474722, lng: -0.358333 }, // Estadi de Mestalla
  { lat: 50.60564167, lng: 13.621375 }, // Ivan Hlinka Stadion
  { lat: 49.060556, lng: 20.311111 }, // Poprad Ice Stadium
  { lat: 51.478055555, lng: -3.1825 }, // Millennium Stadium
  { lat: 40.7424, lng: -74.2174 }, // Newark Velodrome
  { lat: 52.314166666, lng: 4.941944444 }, // Johan Cruijff Arena
  { lat: 47.382791, lng: 8.503801 }, // Estadi Letzigrund
  { lat: 55.853055555, lng: -4.309166666 }, // Ibrox Stadium
  { lat: 51.456111111, lng: -0.341666666 }, // Twickenham Stadium
  { lat: 42.645833333, lng: -83.255 }, // Pontiac Silverdome
  { lat: 46.177778, lng: 6.1275 }, // Estadi de Genève
  { lat: 49.775278055, lng: 24.027778055 }, // Arena Lviv
  { lat: 46.608847, lng: 14.278281 }, // Estadi Wörthersee
  { lat: 53.580555555, lng: -2.535555555 }, // Reebok Stadium
  { lat: 43.264205, lng: -2.949369 }, // Antic estadi de San Mamés
  { lat: 45.146111, lng: 10.794167 }, // Stadio Danilo Martelli
  { lat: 34.073611111, lng: -118.24 }, // Dodger Stadium
  { lat: 35.388056, lng: 0.159444 }, // Stade de l'Unité Africaine
  { lat: 43.30197222, lng: -5.68984167 }, // Estadio Ganzábal
  { lat: 40.4501, lng: -3.6532 }, // Campo de Ciudad Lineal
  { lat: 47.490919444, lng: 19.106725 }, // estadi Nándor Hidegkuti
  { lat: 43.5575, lng: -5.9306 }, // Estadi Román Suárez Puerta
  { lat: 43.391944, lng: -5.704167 }, // Estadi Alejandro Ortea
  { lat: 32.570556, lng: 131.640556 }, // Nobeoka Nishishina Athletic Stadium
  { lat: 45.521388888, lng: -122.691666666 }, // Jeld-Wen Field
  { lat: 50.834167, lng: 4.298333 }, // Lotto Park
  { lat: 35.881253, lng: 128.588231 }, // Daegu Civic Stadium
  { lat: 51.211944, lng: 51.350833 }, // Petr Atoyan Stadium
  { lat: 41.161758, lng: -8.583933 }, // Estádio do Dragão
  { lat: 44.416431, lng: 8.952428 }, // Estadi Luigi Ferraris
  { lat: -34.545277777, lng: -58.449722222 }, // Estadi Monumental Antonio Vespucio Liberti
  { lat: -34.643494, lng: -58.396511 }, // Estadi Tomás Adolfo Ducó
  { lat: 57.4577062, lng: 9.9984598 }, // Hjørring Stadion
  { lat: 14.60334, lng: -61.0462 }, // Stade Pierre-Aliker
  { lat: 28.181756, lng: 112.977303 }, // Helong Stadium
  { lat: 24.452764, lng: 54.392019 }, // Mohammed Bin Zayed Stadium
  { lat: 51.232222, lng: 4.471667 }, // Bosuilstadion
  { lat: 25.159777777, lng: 51.574083333 }, // Al Janoub Stadium
  { lat: 25.159777777, lng: 51.574083333 }, // Al Janoub Stadium
  { lat: 33.324906, lng: 44.435438 }, // Al-Shaab Stadium
  { lat: 35.475, lng: 139.462778 }, // Yamato Sports Center Stadium
  { lat: 38.761194444, lng: -9.160783333 }, // Estádio José Alvalade
  { lat: 17.399333, lng: 78.473333 }, // Lal Bahadur Shastri Stadium
  { lat: 6.682681, lng: -1.605111 }, // Estadi Baba Yara
  { lat: 56.684166666, lng: 12.866388888 }, // Örjans vall
  { lat: 37.778333333, lng: -122.389444444 }, // Oracle Park
  { lat: 33.52286, lng: 36.32004 }, // Abbasiyyin Stadium
  { lat: 50.93843, lng: 6.9829 }, // Lanxess Arena
  { lat: -36.875277777, lng: 174.745 }, // Eden Park
  { lat: 51.409033, lng: 6.778664 }, // Wedaustadion
  { lat: 47.7144, lng: 12.6475 }, // Chiemgau-Arena
  { lat: -34.1046737, lng: -56.2073784 }, // Estadio Campeones Olímpicos
  { lat: -34.897864, lng: -56.153556 }, // Parque Palermo
  { lat: -34.873333, lng: -56.234444 }, // estadi Abraham Paladino
  { lat: -34.87338056, lng: -56.21235833 }, // Estadio Parque Capurro
  { lat: -37.819943, lng: 144.983447 }, // Melbourne Cricket Ground
  { lat: 60.18689398, lng: 24.92606242 }, // Estadi Olímpic de Hèlsinki
  { lat: -9.436667, lng: 159.971389 }, // Lawson Tama Stadium
  { lat: -9.436667, lng: 159.971389 }, // Lawson Tama Stadium
  { lat: 10.31472222, lng: 11.13791667 }, // Abubakar Umar Memorial Stadium
  { lat: -15.7835, lng: -47.899164 }, // Estadi Mané Garrincha
  { lat: 5.551388888, lng: -0.191944444 }, // Estadi Esportiu d'Accra
  { lat: 5.5516, lng: -0.19184 }, // Estadi Esportiu d'Accra
  { lat: 13.41425, lng: 99.999865 }, // Samut Songkhram Stadium
  { lat: 42.0927, lng: -71.267441666 }, // Foxboro Stadium
  { lat: 51.630555555, lng: -0.800277777 }, // Adams Park
  { lat: -25.29207222, lng: -57.65738056 }, // Estadi Defensores del Chaco
  { lat: 52.319444444, lng: 4.854166666 }, // Wagener Stadium
  { lat: 25.718516666, lng: -100.31575 }, // Estadio de Béisbol Monterrey
  { lat: 25.718517, lng: -100.31575 }, // Estadio de Béisbol Monterrey
  { lat: 42.090944444, lng: -71.264344444 }, // Gillette Stadium
  { lat: 48.55942, lng: 7.75738 }, // Estadi de la Meinau
  { lat: 40.813726, lng: -74.074433 }, // Giants Stadium
  { lat: 39.111119, lng: 117.198754 }, // Minyuan Stadium
  { lat: 67.2775, lng: 14.384166666 }, // Aspmyra Stadion
  { lat: -3.083056, lng: -60.028056 }, // Estadi Vivaldo Lima
  { lat: 34.52, lng: 69.196667 }, // Estadi de la Federación de Futbol d'Afganistan
  { lat: 40.821022711, lng: -96.705499407 }, // Memorial Stadium
  { lat: -9.465, lng: 147.191667 }, // PMRL Stadium
  { lat: 14.780751, lng: -88.782272 }, // Estadio Sergio Antonio Reyes
  { lat: 44.829167, lng: -0.598056 }, // Stade Jacques Chaban-Delmas
  { lat: 35.441337, lng: 136.766052 }, // Gifu Nagaragawa Stadium
  { lat: 47.234762, lng: 16.607117 }, // Rohonci Street Stadium
  { lat: 42.565985, lng: 27.636656 }, // Pomorie Stadium
  { lat: 48.566111, lng: 19.120556 }, // Zvolen Ice Stadium
  { lat: 48.740836, lng: 21.244497 }, // Lokomotíva Stadium
  { lat: 54.6933, lng: 25.2903 }, // Estadi Žalgiris de Vílnius
  { lat: 10.49944444, lng: 7.43138889 }, // Ahmadu Bello Stadium
  { lat: 23.137656, lng: 113.403519 }, // Estadi Olímpic de Guangdong
  { lat: 23.139216, lng: 113.260739 }, // Yuexiushan Stadium
  { lat: 25.330538, lng: 51.341279 }, // Estadi Ahmad bin Ali
  { lat: 23.057986, lng: 113.38617 }, // Guangzhou Higher Education Mega Center Central Stadium
  { lat: 35.664278, lng: 139.527139 }, // estadi Ajinomoto
  { lat: 36.893611111, lng: 30.646666666 }, // Akdeniz University Stadium
  { lat: 38.916575, lng: 27.83811667 }, // Akhisar Şehir Stadium
  { lat: 38.916575, lng: 27.83811667 }, // Akhisar Şehir Stadium
  { lat: 25.25189167, lng: 51.53536111 }, // Hamad bin Khalifa Stadium
  { lat: 40.60194444, lng: 19.74083333 }, // Adush Muça Stadium
  { lat: -0.540555555, lng: 166.930277777 }, // Meneng Stadium
  { lat: 52.514722, lng: 13.239167 }, // Deutsches Stadion
  { lat: 48.835265565, lng: 2.256179755 }, // Stade Pierre de Coubertin
  { lat: 52.063056, lng: 8.348889 }, // OWL Arena
  { lat: 51.060923, lng: 13.726233 }, // Heinz-Steyer-Stadion
  { lat: 40.625497222, lng: 22.967002777 }, // Estadi Kaftanzoglio
  { lat: 49.422197, lng: 11.114142 }, // Deutsches Stadion
  { lat: 32.709722222, lng: -97.368055555 }, // Amon G. Carter Stadium
  { lat: 44.783333333, lng: 20.464722222 }, // Rajko Mitić Stadium
  { lat: 53.360833333, lng: -6.251111111 }, // Croke Park
  { lat: 35.829739, lng: 128.690205 }, // Estadi de Daegu
  { lat: 33.200556, lng: 131.6575 }, // Estadi del Gran Ull d'Oita
  { lat: 34.743222, lng: 137.970503 }, // Estadi Shizuoka
  { lat: 37.300122, lng: 127.009635 }, // Suwon Baseball Stadium
  { lat: 35.23402, lng: 128.664753 }, // Changwon Stadium
  { lat: 37.676422, lng: 126.743056 }, // Goyang Stadium
  { lat: 35.645239, lng: 140.030922 }, // ZOZO Marine Stadium
  { lat: 35.562396, lng: 129.34802 }, // Ulsan Stadium
  { lat: 37.6617, lng: 128.6806 }, // Alpensia Ski Jumping Stadium
  { lat: 34.93312, lng: 127.727478 }, // Gwangyang Football Stadium
  { lat: 37.56758, lng: 127.010595 }, // Dongdaemun Stadium
  { lat: 35.880975, lng: 128.586572 }, // Daegu Baseball Stadium
  { lat: 37.437111, lng: 126.693306 }, // Incheon SSG Landers Field
  { lat: 35.168889, lng: 126.887222 }, // Gwangju Mudeung Baseball Stadium
  { lat: 38.25620556, lng: 140.9025 }, // Miyagi Baseball Stadium
  { lat: 36.316944, lng: 127.429444 }, // Daejeon Hanbat Baseball Stadium
  { lat: 35.194278, lng: 129.061306 }, // Sajik Baseball Stadium
  { lat: 37.530706, lng: 126.880978 }, // Mokdong Baseball Stadium
  { lat: 37.512389, lng: 127.071972 }, // Jamsil Baseball Stadium
  { lat: 35.168189, lng: 126.88914 }, // Gwangju Mudeung Stadium
  { lat: 35.966, lng: 126.748 }, // Gunsan Wallmyeong Baseball Stadium
  { lat: 35.223406, lng: 128.705707 }, // Changwon Football Center
  { lat: 37.8825, lng: 139.059166666 }, // Estadi del Gran Cigne de Niigata
  { lat: 37.286421, lng: 127.036855 }, // Estadi de la Copa del Món de Suwon
  { lat: 34.613889, lng: 135.518333 }, // Estadi Nagai
  { lat: 36.812694, lng: 127.162348 }, // Cheonan Oryong Stadium
  { lat: 37.410166, lng: 127.121273 }, // Tancheon Sports Complex
  { lat: 37.547675, lng: 126.666682 }, // Incheon Asiad Main Stadium
  { lat: -34.894444, lng: -56.152778 }, // Estadio Centenario
  { lat: 57.783333333, lng: 14.141944444 }, // Stadsparksvallen
  { lat: 56.881111111, lng: 14.771944444 }, // Värendsvallen
  { lat: 52.343419, lng: 4.854192 }, // Estadi Olímpic d'Amsterdam
  { lat: -15.595333333, lng: -56.098666666 }, // Estadi Verdão
  { lat: 38.022777777, lng: -84.505277777 }, // Kroger Field
  { lat: 36.1615, lng: 1.30902 }, // Stade Mohamed Boumezrag
  { lat: 38.8725, lng: -77.007777777 }, // Nationals Park
  { lat: -22.60763611, lng: 17.090975 }, // Independence Stadium
  { lat: 33.800277777, lng: -117.882777777 }, // Angel Stadium of Anaheim
  { lat: 48.793056, lng: 9.228333 }, // Porsche-Arena
  { lat: 12.134416666, lng: -86.269333333 }, // Dennis Martínez National Stadium
  { lat: -8.106655, lng: -79.030977 }, // Estadio Mansiche
  { lat: -25.2357966, lng: -57.5577479 }, // Estadio Hugo Bogado Vaceque
  { lat: 48.81716, lng: 2.34511 }, // Stade Charléty
  { lat: -3.254467, lng: -79.962497 }, // Estadi 9 de Mayo
  { lat: 10.26047, lng: -67.611626 }, // Estadio José Pérez Colmenares
  { lat: 34.678611111, lng: -82.843055555 }, // Memorial Stadium, Clemson
  { lat: 39.048888888, lng: -94.483888888 }, // Arrowhead Stadium
  { lat: 46.6335, lng: 27.733319 }, // Stadionul Municipal
  { lat: 10.404187, lng: -75.495334 }, // Estadio Once de Noviembre
  { lat: 31.858851719, lng: 54.328629111 }, // Nassiri Stadium
  { lat: 46.56, lng: -87.393611111 }, // Superior Dome
  { lat: 3.100536111, lng: 101.721372222 }, // KLFA Stadium
  { lat: 14.916111, lng: -23.512222 }, // Estadi de Várzea
  { lat: -14.808403712, lng: -39.278887532 }, // Estádio Luiz Viana Filho, Itabuna
  { lat: 58.584166666, lng: 16.173055555 }, // Nya Parken
  { lat: 40.892014, lng: 29.191017 }, // Kartal Stadium
  { lat: 46.886, lng: 12.1525 }, // Arena Tirol del Sud
  { lat: 51.6422, lng: -3.9351 }, // Liberty Stadium
  { lat: -16.723444, lng: -43.860056 }, // Q580709
  { lat: 44.934015, lng: 10.517757 }, // Luigi Zaffanella Stadium
  { lat: 38.907777777, lng: -76.864444444 }, // FedEx Field
  { lat: 36.8144, lng: -119.758 }, // Valley Children's Stadium
  { lat: 47.094085, lng: 51.908324 }, // Munayshy Stadium
  { lat: -17.185731, lng: -70.930052 }, // Estadio 25 de Noviembre
  { lat: 41.580277777, lng: -93.615833333 }, // Principal Park
  { lat: -34.66791944, lng: -58.4996 }, // Estadio Nueva Chicago
  { lat: -33.464444444, lng: -70.610555555 }, // Estadio Nacional de Xile
  { lat: 31.63, lng: -8 }, // Sidi-Youssef-Ben-Ali stadium
  { lat: -9.315775, lng: -35.944467 }, // Estádio José Gomes da Costa
  { lat: 39.487130555, lng: -6.412347222 }, // Estadio Príncipe Felipe
  { lat: 42.335, lng: -71.166388888 }, // Alumni Stadium
  { lat: -26.193822222, lng: 28.062513888 }, // Johannesburg Stadium
  { lat: 50.288333, lng: 18.973056 }, // Estadi de Silèsia
  { lat: 53.335005555, lng: -6.229202777 }, // Lansdowne Road
  { lat: 32.839769444, lng: -96.910911111 }, // Texas Stadium
  { lat: -1.048486, lng: -80.45395 }, // Estadi Reales Tamarindos
  { lat: 25.374202777, lng: 55.423058333 }, // Khalid Bin Mohammed Stadium
  { lat: -25.448333, lng: -49.276944 }, // Estadi Joaquim Américo Guimarães
  { lat: 32.329639, lng: -90.179778 }, // Mississippi Veterans Memorial Stadium
  { lat: 53.285278, lng: 69.391667 }, // Okzhetpes Stadium
  { lat: 28.118125, lng: -15.438525 }, // Estadio Pepe Gonçalvez
  { lat: 40.749886111, lng: -73.847033333 }, // Arthur Ashe Stadium
  { lat: 44.794916666, lng: 10.338444444 }, // Estadi Ennio Tardini
  { lat: 49.276666666, lng: -123.111944444 }, // Estadi BC Place
  { lat: 47.595277777, lng: -122.331666666 }, // Lumen Field
  { lat: 42.149722, lng: 24.719722 }, // Estadi Plovdiv
  { lat: 39.0953, lng: 121.7191 }, // Dalian Jinzhou Stadium
  { lat: 56.475264, lng: -2.973194 }, // Dens Park
  { lat: 7.74166667, lng: 8.51805556 }, // Aper Aku Stadium
  { lat: 59.3437, lng: 26.3584 }, // Rakvere Linnastaadion
  { lat: 59.36347, lng: 28.18465 }, // Narva Kreenholmi Stadium
  { lat: 50.543611111, lng: 7.151388888 }, // Apollinarisstadion
  { lat: 51.6984, lng: -2.233233 }, // The New Lawn
  { lat: 53.758856, lng: -1.776203 }, // Horsfall Stadium
  { lat: 52.976786, lng: -0.019117 }, // York Street
  { lat: 8.02887, lng: -2.78903 }, // Q3495630
  { lat: 48.6359, lng: 2.45182 }, // Q3495632
  { lat: 37.7681, lng: 30.5611 }, // Isparta Atatürk Stadium
  { lat: 48.44152, lng: 0.10198 }, // Q3495634
  { lat: -21.04641, lng: 55.717699 }, // Q3495638
  { lat: 42.68732, lng: 2.87622 }, // estadi Jean Laffon
  { lat: 33.491667, lng: 11.110556 }, // Abdessalem Kazouz sports complex
  { lat: 14.332069444, lng: -89.449002777 }, // Estadio Jorge 'Calero' Suárez
  { lat: 50.8178, lng: 4.32917 }, // estadi Joseph Marien
  { lat: 14.042669444, lng: -88.967897222 }, // Estadio José Gregorio Martínez
  { lat: 50.638, lng: 3.10052 }, // Stade Jules Lemaire
  { lat: 13.482576, lng: -88.169038 }, // Estadio Juan Francisco Barraza
  { lat: 16.981944, lng: -89.903889 }, // Estadio Julián Tesucún
  { lat: -21.27166, lng: 55.5215 }, // Stade Klébert Picard
  { lat: 43.6601, lng: -1.29629 }, // Stade La Fougère
  { lat: 21.1163, lng: -101.666 }, // Q3495685
  { lat: 11.586389, lng: 104.915 }, // RCAF Old Stadium
  { lat: 33.5971, lng: -7.54667 }, // Estadi Larbi Zaouli
  { lat: 14.64, lng: -89.98583333 }, // Las Flores Stadium
  { lat: 15.779845, lng: -87.450421 }, // Estadio León Gómez
  { lat: 15.320833, lng: -91.481667 }, // Estadio Los Cuchumatanes
  { lat: 50.6259, lng: 3.40829 }, // Q3495709
  { lat: 49.10398, lng: -1.06346 }, // Stade Louis Villemer
  { lat: -22.801636, lng: -43.207775 }, // Estádio Luso-Brasileiro
  { lat: 12.6488, lng: -8.0154 }, // Stade Mamadou Konaté
  { lat: -22.863, lng: -43.3775 }, // Q3495723
  { lat: 47.86695, lng: 1.92686 }, // Q3495728
  { lat: 46.1583, lng: -1.17836 }, // Stade Marcel-Deflandre
  { lat: 46.21002, lng: 5.2371 }, // Stade Marcel-Verchère
  { lat: 47.212733, lng: -1.538563 }, // Stade Marcel Saupin
  { lat: 13.333056, lng: -87.846111 }, // Estadio Marcelino Imbers
  { lat: 14.841944, lng: -91.517222 }, // Estadio Mario Camposeco
  { lat: 14.967045, lng: -91.7917 }, // Estadio Marquesa de la Ensenada
  { lat: 49.915, lng: 1.08722 }, // Q3495753
  { lat: 43.92391, lng: 2.16393 }, // Stade Maurice Rigaud
  { lat: 43.52764, lng: 5.42284 }, // stade Maurice-David
  { lat: 43.22076, lng: 0.07234 }, // Stade Maurice Trélut
  { lat: 36.1443, lng: 5.72245 }, // Stade Messaoud-Zougar
  { lat: 43.61981, lng: 1.3273 }, // Stade Michel Bendichou
  { lat: 50.468, lng: 4.8855 }, // Michel Soulier Stadium
  { lat: 36.7295, lng: 3.09002 }, // Mohamed Benhaddad Stadium
  { lat: 35.246944, lng: -3.933333 }, // Stade Mimoun Al Arsi
  { lat: 27.1463, lng: -13.1924 }, // Moulay Rachid Stadium
  { lat: 27.1462, lng: -13.1917 }, // Moulay Rachid Stadium
  { lat: 14.48722222, lng: -90.61611111 }, // Estadio Municipal Amatitlán
  { lat: 8.95777778, lng: -79.55916667 }, // Estadio Municipal de Balboa
  { lat: 49.8044, lng: 18.2558 }, // Městský stadion
  { lat: 50.417169, lng: 2.932963 }, // Stade Octave-Birembaut
  { lat: 15.786107, lng: -86.785945 }, // Estadio Nilmo Edwards
  { lat: 15.786107, lng: -86.785945 }, // Estadio Nilmo Edwards
  { lat: 47.7745613, lng: 29.0043086 }, // Stadionul Orășenesc
  { lat: 36.7289, lng: 4.01404 }, // Q3495803
  { lat: 43.3267, lng: 45.6952 }, // Uvays Akhtayev Stadium
  { lat: -20.98243, lng: 55.29014 }, // Stade Paul Julius Bénard
  { lat: 43.61799, lng: 3.86825 }, // Philippidès Stadium
  { lat: 45.59043, lng: 5.28783 }, // Stade Pierre Rajon
  { lat: 33.5574, lng: -7.65149 }, // Stade Pere Jego
  { lat: 50.429138, lng: 2.949808 }, // Q3495829
  { lat: -21.37836, lng: 55.61466 }, // Stade Raphaël Babet
  { lat: 47.6244, lng: 6.16828 }, // René-Hologne stadium
  { lat: 43.602222, lng: 3.898056 }, // Stade Richter
  { lat: 48.62217, lng: 2.39294 }, // stade Robert-Bobin
  { lat: 14.59008, lng: -87.841342 }, // Estadio Roberto Martínez Ávila
  { lat: 14.321416, lng: -87.670764 }, // Estadio Roberto Suazo Cordoba
  { lat: 47.65654, lng: 6.85463 }, // Stade Roger Serzian
  { lat: 10.993889, lng: -74.806944 }, // Estadio Romelio Martínez
  { lat: 14.842502, lng: -85.886591 }, // Estadio Rubén Guifarro
  { lat: 9.32611111, lng: 13.39916667 }, // Estadi Roumdé Adjia
  { lat: 43.59804, lng: 3.86961 }, // Stade Sabathé
  { lat: 16.00539, lng: -61.74174 }, // Estadi Saint-Claude
  { lat: 45.8139, lng: 1.29253 }, // Q3495859
  { lat: 42.70734, lng: 3.0013 }, // estadi Sant Miquel
  { lat: 42.7067, lng: 3.0038 }, // estadi Sant Miquel
  { lat: 48.88676, lng: 2.45807 }, // Q3495861
  { lat: 44.87036, lng: -0.61829 }, // Stade Sainte-Germain
  { lat: 8.420278, lng: -82.4425 }, // Estadio San Cristóbal
  { lat: 44.01021, lng: 1.35174 }, // Stade Sapiac
  { lat: 14.91194444, lng: -92.06 }, // Estadio Santa Lucía
  { lat: 35.5578, lng: 6.18022 }, // Stade Seffouhi
  { lat: 36.468889, lng: 7.446111 }, // Stade Souidani Boujemaa
  { lat: 13.349722, lng: -88.437778 }, // Sergio Torres Stadium
  { lat: 46.7838, lng: -71.2797 }, // Telus Stadium
  { lat: 46.9844, lng: 28.667 }, // Suruceni Stadium
  { lat: 33.5829, lng: -7.64682 }, // Tessema stadium
  { lat: -4.33806, lng: 15.3222 }, // Stade Tata Raphaël
  { lat: -21.28852, lng: 55.40467 }, // Stade Théophile Hoarau
  { lat: 47.38251, lng: 0.66702 }, // Tonnellé Stadium
  { lat: 6.12322, lng: -5.95483 }, // Q3495900
  { lat: 33.9357, lng: -6.93129 }, // Q3495903
  { lat: 49.5625, lng: 5.53059 }, // Stade Yvan Georges
  { lat: 48.5717, lng: -3.14833 }, // Stade Yves-Jaguin
  { lat: 15.495556, lng: -87.999167 }, // Estadio Yankel Rosenthal Cuello
  { lat: -4.322865, lng: 15.312485 }, // Stade 24 Novembre
  { lat: 50.464167, lng: 4.860833 }, // Stade communal de Namur
  { lat: 33.0115, lng: -7.62094 }, // Q3495949
  { lat: 30.960556, lng: 31.172778 }, // Estadi El Mahalla
  { lat: 6.49017, lng: -6.59169 }, // Stade d'Issia
  { lat: 32.3394, lng: -6.36083 }, // Q3495955
  { lat: 35.72848, lng: -0.54941 }, // Miloud Hadefi Stadium
  { lat: 44.90287, lng: 2.43898 }, // Q3495958
  { lat: 1.300555555, lng: 103.874444444 }, // Singapore Indoor Stadium
  { lat: 51.437172, lng: 0.2308 }, // Princes Park
  { lat: 55.76, lng: -2.01583 }, // Shielfield Park
  { lat: 50.619906, lng: -2.485203 }, // Bob Lucas Stadium
  { lat: 51.449539, lng: 0.322272 }, // Stonebridge Road
  { lat: 53.4506, lng: -2.068114 }, // Ewen Fields
  { lat: 53.638089, lng: -2.978856 }, // Haig Avenue
  { lat: 53.189181, lng: -2.923814 }, // Deva Stadium
  { lat: 15.507455555, lng: -88.033416666 }, // Estadio General Francisco Morazán
  { lat: 50.861822222, lng: -0.083277777 }, // Brighton Community Stadium
  { lat: 52.235197, lng: -0.93345 }, // Sixfields Stadium
  { lat: 44.7761, lng: 17.1996 }, // Estadi Gradski Banja Luka
  { lat: 50.895705555, lng: 4.334083333 }, // estadi Rei Balduí
  { lat: 35.220797, lng: 128.581058 }, // Masan Baseball Stadium
  { lat: 35.194278, lng: 129.061306 }, // Gudeok Baseball Stadium
  { lat: 36.638611, lng: 127.47 }, // Cheongju Baseball Stadium
  { lat: 57.73457, lng: 12.934334 }, // Borås Arena
  { lat: 37.264627, lng: 49.589072 }, // Shahid Dr. Azodi Stadium
  { lat: 33.756, lng: -84.4088 }, // Herndon Stadium
  { lat: -23.67013889, lng: -70.40458333 }, // Estadi Regional d'Antofagasta
  { lat: 35.672603, lng: 139.718169 }, // Chichibunomiya Rugby Stadium
  { lat: 22.404167, lng: -79.955 }, // Estadio Augusto César Sandino
  { lat: 41.83, lng: -87.633888888 }, // Guaranteed Rate Field
  { lat: 30.323889, lng: -81.6375 }, // EverBank Field
  { lat: -14.52395, lng: -40.368233 }, // Q635513
  { lat: 39.821111, lng: 46.753056 }, // Khankendi Stadium
  { lat: 33.101026, lng: -96.819624 }, // Comerica Center
  { lat: 56.049444444, lng: 12.706944444 }, // Olympia
  { lat: -34.57125, lng: -58.42672222 }, // Argentine Polo Ground
  { lat: -29.245183, lng: -51.539033 }, // Q639696
  { lat: 44.90799, lng: -0.23501 }, // Stade Jean-Antoine Moueix
  { lat: 41.880555555, lng: -87.674166666 }, // United Center
  { lat: 35.138333333, lng: -90.050555555 }, // FedEx Forum
  { lat: 33.73944444, lng: -84.38944444 }, // Atlanta-Fulton County Stadium
  { lat: -15.603056, lng: -56.120556 }, // Arena Pantaloneta
  { lat: -3.083056, lng: -60.028056 }, // Arena da Amazônia
  { lat: 31.974994, lng: 34.752839 }, // Haberfeld Stadium
  { lat: 53.411388888, lng: -1.500555555 }, // Estadi Hillsborough
  { lat: -22.539167, lng: -55.745556 }, // Monumental Río Parapití
  { lat: -27.464722222, lng: 153.009444444 }, // Lang Park
  { lat: 51.23888889, lng: 22.565 }, // Motor Stadium
  { lat: 37.088333, lng: -7.974722 }, // Estádio do Algarve
  { lat: 41.57, lng: 14.630833 }, // Stadio Antonio Molinari
  { lat: 41.5701, lng: 14.6309 }, // Stadio Antonio Molinari
  { lat: 29.271427777, lng: 47.918611111 }, // Jaber Al-Ahmad International Stadium
  { lat: 6.49944, lng: 3.36083 }, // Teslim Balogun Stadium
  { lat: -23.548639, lng: -46.665111 }, // Estadi municipal de Pacaembu
  { lat: -29.973444, lng: -51.194403 }, // Arena do Grêmio
  { lat: 52.543056, lng: 13.405278 }, // Friedrich-Ludwig-Jahn-Sportpark
  { lat: -33.014444444, lng: -71.535 }, // Estadi Sausalito
  { lat: 46.370711, lng: 6.226201 }, // Centre sportif de Colovray
  { lat: 14.60278, lng: -61.08418 }, // Stade Louis Achille
  { lat: 47.411389, lng: 8.551667 }, // Hallenstadion
  { lat: 46.534, lng: 6.625 }, // Estadi de La Pontaise
  { lat: 42.996388888, lng: 141.343055555 }, // Makomanai Open Stadium
  { lat: 6.44247222, lng: 3.40219444 }, // Onikan Stadium
  { lat: 5.10194444, lng: 7.37583333 }, // Enyimba International Stadium
  { lat: 6.398611, lng: 5.611944 }, // Samuel Ogbemudia Stadium
  { lat: 5.483889, lng: 7.043889 }, // Dan Anyiam Stadium
  { lat: -34.741778, lng: -58.251889 }, // Estadio Centenario Ciudad de Quilmes
  { lat: 4.76556, lng: 7.02194 }, // Sharks Stadium
  { lat: -34.912, lng: -57.9389 }, // Estadi Jorge Luis Hirschi
  { lat: -25.395917, lng: -57.340694 }, // Estadi Juan Canuto Pettengill
  { lat: -25.39591667, lng: -57.34069444 }, // Estadi Juan Canuto Pettengill
  { lat: -22.460278, lng: -68.920556 }, // Estadio Municipal de Calama
  { lat: 53.789064, lng: -2.230225 }, // Turf Moor
  { lat: -36.815278, lng: -73.023333 }, // Estadi Municipal de Concepción
  { lat: -36.618056, lng: -72.1075 }, // Estadio Municipal Nelson Oyarzún Arenas
  { lat: -33.540833, lng: -70.578333 }, // Estadio Bicentenario de La Florida
  { lat: -29.911111, lng: -71.251944 }, // Estadio La Portada
  { lat: -25.23638889, lng: -57.56875 }, // Estadio Roberto Bettega
  { lat: -33.52083333, lng: -70.67277778 }, // Estadio Municipal de La Cisterna
  { lat: 51.409028, lng: 6.778639 }, // Schauinsland-Reisen-Arena
  { lat: -11.276944, lng: -37.791667 }, // Q685936
  { lat: 17.252177777, lng: -88.786366666 }, // Isidoro Beaton Stadium
  { lat: 37.434444444, lng: -122.161111111 }, // Stanford Stadium
  { lat: 40.812222222, lng: -77.856111111 }, // Beaver Stadium
  { lat: 36.734092, lng: -4.426422 }, // Estadi La Rosaleda
  { lat: 13.141861111, lng: -61.211805555 }, // Arnos Vale Stadium
  { lat: 59.62044722, lng: 16.54104444 }, // Arosvallen
  { lat: 25.041158, lng: 121.447718 }, // Xinzhuang Baseball Stadium
  { lat: 38.991547222, lng: 125.743525 }, // Estadi Yanggakdo
  { lat: 22.702778, lng: 120.295 }, // National Stadium
  { lat: -32.913997, lng: -60.674567 }, // Estadi Gigante de Arroyito
  { lat: 52.062778, lng: 4.383056 }, // WerkTalent Stadion
  { lat: 45.818858333, lng: 16.018077777 }, // Estadi Maksimir
  { lat: 37.92805556, lng: 58.35027778 }, // Ashgabat Stadium
  { lat: 59.345278, lng: 18.078889 }, // Estadi Olímpic d'Estocolm
  { lat: 50.063611, lng: 19.911944 }, // Estadi Henryk Reyman
  { lat: 36.656646, lng: 117.110052 }, // Jinan Olympic Sports Center Stadium
  { lat: 45.510083333, lng: -73.580666666 }, // Percival Molson Memorial Stadium
  { lat: 54.798087698, lng: -7.779730672 }, // Finn Park
  { lat: 15.34927222, lng: 38.92125556 }, // Estadi Cicero
  { lat: 41.27638889, lng: -8.33944444 }, // Complexo Desportivo do Sport Clube de Freamunde
  { lat: 45.435356, lng: 10.968647 }, // Estadi Marcantonio Bentegodi
  { lat: -5.073611, lng: 39.100556 }, // Mkwakwani Stadium
  { lat: 31.1835, lng: 121.437278 }, // Estadi de Xanghai
  { lat: 53.44305556, lng: -2.21555556 }, // Fallowfield Stadium
  { lat: 49.174722, lng: -123.151389 }, // Oval Olímpic de Richmond
  { lat: -19.032322, lng: -65.257912 }, // Estadi Olímpic Patria
  { lat: 41.447996, lng: 44.535185 }, // Tamaz Stephania Stadium
  { lat: 48.93145, lng: 2.24961 }, // Estadi Olímpic Yves-du-Manoir
  { lat: 33.885353, lng: -84.2484 }, // Atlanta Silverbacks Park
  { lat: 33.5275, lng: -112.2625 }, // State Farm Stadium
  { lat: 29.950833333, lng: -90.081111111 }, // Caesars Superdome
  { lat: 44.4922, lng: 11.3098 }, // estadi Renato Dall'Ara
  { lat: 10.42472222, lng: -61.41722222 }, // Ato Boldon Stadium
  { lat: 40.736666666, lng: -74.150277777 }, // Sports Illustrated Stadium
  { lat: 54.0615, lng: -2.86716 }, // Globe Arena
  { lat: 29.342827777, lng: 47.952236111 }, // Kuwait National Stadium
  { lat: 6.44416667, lng: 7.49638889 }, // Nnamdi Azikiwe Stadium
  { lat: 30.552356, lng: 47.778155 }, // Al Mina'a Stadium
  { lat: 30.5273, lng: -97.6305 }, // Dell Diamond
  { lat: -34.6185, lng: -58.447639 }, // Ferro Carril Oeste Stadium
  { lat: 41.343611, lng: 21.561944 }, // Estadi Goce Delčev
  { lat: -33.8775, lng: 151.193333 }, // Wentworth Park
  { lat: 38.618139, lng: 66.259139 }, // G'uzor Stadium
  { lat: 41.570556, lng: 64.207222 }, // Progress Stadium
  { lat: 41.361111, lng: 69.395 }, // Lokomotiv Stadium
  { lat: 41.23456944, lng: -8.61821944 }, // Estádio Prof. Dr. José Vieira de Carvalho
  { lat: 18.10470278, lng: -15.98545556 }, // Estadi Olímpic de Nouakchott
  { lat: 25.263611111, lng: 51.448055555 }, // Estadi Internacional Khalifa
  { lat: 40.001667, lng: -83.019722 }, // Ohio Stadium
  { lat: 61.995, lng: -6.80277778 }, // Argir Stadium
  { lat: 51.75875, lng: 19.42675 }, // Estadi Municipal Władysław Król
  { lat: 34.743741, lng: 135.360644 }, // Hankyu Nishinomiya Stadium
  { lat: 5.30527778, lng: -3.99244444 }, // Stade Robert Champroux
  { lat: 53.998944, lng: -6.416917 }, // Oriel Park
  { lat: 53.998944, lng: -6.416917 }, // Oriel Park
  { lat: 44.559444444, lng: -123.281388888 }, // Reser Stadium
  { lat: 53.015556, lng: 18.551111 }, // MotoArena Toruń
  { lat: 29.340833333, lng: 48.088333333 }, // Thamir Stadium
  { lat: -34.8845, lng: -56.159 }, // Estadio Gran Parque Central
  { lat: 40.345755, lng: -74.65003 }, // Palmer Stadium
  { lat: -21.205972222, lng: -159.806777777 }, // National Stadium
  { lat: -26.251944, lng: -69.628611 }, // Estadio El Cobre
  { lat: 33.735555555, lng: -84.389444444 }, // Centennial Olympic Stadium
  { lat: 26.158333333, lng: -80.325555555 }, // Amerant Bank Arena
  { lat: 40.213367, lng: 69.27919 }, // Metallurg Bekabad Stadium
  { lat: 42.335493, lng: 69.593568 }, // Estadi Kazhimukan Munaitpasov (Şymkent)
  { lat: 1.32916, lng: 172.97694 }, // Estadi nacional Bairiki
  { lat: 23.72801, lng: 90.41353 }, // Estadi Nacional Bangabandhu
  { lat: 51.361244, lng: 6.633591 }, // Stadion am Löschenhofweg
  { lat: 14.070556, lng: -60.931389 }, // Daren Sammy Cricket Ground
  { lat: 43.62061, lng: 3.81279 }, // Stade de la Mosson
  { lat: 29.65, lng: -82.348611 }, // Ben Hill Griffin Stadium
  { lat: 52.475702777, lng: -1.868188888 }, // St Andrew's Stadium
  { lat: 57.705833333, lng: 11.987222222 }, // Estadi Ullevi
  { lat: 39.073444, lng: 117.169389 }, // Estadi Olímpic de Tianjin
  { lat: 22.3261, lng: 114.173 }, // Mong Kok Stadium
  { lat: 41.674824, lng: 44.859751 }, // Sinatle Stadium
  { lat: 40.0115, lng: 32.5024 }, // Osmanlı Stadyumu
  { lat: 37.897597, lng: 23.729256 }, // Hellinikon Stadium
  { lat: 29.9575, lng: 32.5425 }, // Estadi de Suez
  { lat: 13.7375, lng: 100.525833 }, // Chulalongkorn University Stadium
  { lat: 51.549444, lng: -0.020556 }, // Riverbank Arena
  { lat: 52.448056, lng: -1.495556 }, // Ricoh Arena
  { lat: 22.267434, lng: 114.249063 }, // Siu Sai Wan Sports Ground
  { lat: 49.818618, lng: 73.075122 }, // Shakhtyor Stadium
  { lat: 41.69833, lng: -86.23389 }, // Notre Dame Stadium
  { lat: 41.69833, lng: -86.23389 }, // Notre Dame Stadium
  { lat: 34.680658, lng: 135.073417 }, // Kobe Sports Park Baseball Stadium
  { lat: 41.5624, lng: -8.4308 }, // Estádio Municipal de Braga
  { lat: 34.014167, lng: -118.287778 }, // Los Angeles Memorial Coliseum
  { lat: 39.907222222, lng: 119.547777777 }, // Estadi Olímpic de Qinhuangdao
  { lat: 41.739037, lng: 123.457484 }, // Estadi Olímpic de Shenyang
  { lat: 50.4329, lng: 2.81491 }, // Stade Félix Bollaert
  { lat: 46.3449029, lng: 13.9222079 }, // Pokljuka Biathlon Stadium
  { lat: 46.3449029, lng: 13.9222079 }, // Pokljuka Biathlon Stadium
  { lat: -33.891666666, lng: 151.224722222 }, // Sydney Cricket Ground
  { lat: -21.151496, lng: 27.478742 }, // Obed Itani Chilume Stadium
  { lat: 44.501388888, lng: -88.062222222 }, // Lambeau Field
  { lat: 34.66147, lng: 135.5018 }, // Osaka Stadium
  { lat: 25.958055555, lng: -80.238888888 }, // Hard Rock Stadium
  { lat: 25.958055555, lng: -80.238888888 }, // Hard Rock Stadium
  { lat: 33.524, lng: -86.812 }, // Birmingham–Jefferson Convention Complex
  { lat: 59.924722, lng: 10.733333 }, // Estadi Bislett
  { lat: 39.760056, lng: -86.163806 }, // Lucas Oil Stadium
  { lat: 55.583611111, lng: 12.987777777 }, // Eleda Stadion
  { lat: 51.472778, lng: -3.203056 }, // Cardiff City Stadium
  { lat: 42.339166666, lng: -83.048611111 }, // Comerica Park
  { lat: 41.511388888, lng: -81.644166666 }, // League Park
  { lat: 47.822778, lng: 16.255278 }, // Stadion Wiener Neustadt
  { lat: 51.513619444, lng: -0.2274 }, // White City Stadium
  { lat: 16.78386389, lng: -62.18632222 }, // Blakes Estate Stadium
  { lat: 17.25213791, lng: -88.78634334 }, // FFB Stadium
  { lat: 16.783861, lng: 96.160725 }, // Bogyoke Aung San Stadium
  { lat: -24.6568, lng: 25.932892 }, // Estadi Nacional de Botswana
  { lat: -24.6568, lng: 25.932892 }, // Estadi Nacional de Botswana
  { lat: 13.45638889, lng: -16.58166667 }, // Box Bar Stadium
  { lat: 55.875987, lng: -4.364843 }, // Braehead Arena
  { lat: 54.990633, lng: -7.336 }, // estadi de Brandywell
  { lat: 53.433981, lng: -2.959614 }, // Stanley Park Stadium
  { lat: 48.099444, lng: 20.717222 }, // DVTK Stadion
  { lat: 47.17369444, lng: 18.41536111 }, // Sóstói Stadion
  { lat: 38.996944, lng: -104.842222 }, // Falcon Stadium
  { lat: 40.2575, lng: -111.654444 }, // LaVell Edwards Stadium
  { lat: 51.485833, lng: -0.050833 }, // The Den
  { lat: -19.865833, lng: -43.970833 }, // Mineirão
  { lat: -38.742778, lng: -72.619722 }, // Estadi Municipal Germán Becker
  { lat: 5.3593, lng: -3.88967 }, // Q3495964
  { lat: 6.98692, lng: -5.75424 }, // Q3495965
  { lat: 50.625, lng: 5.52807 }, // Buraufosse stadium
  { lat: 43.293199, lng: 5.56236 }, // Q3495974
  { lat: 48.1779, lng: 6.46339 }, // Stade de la Colombière
  { lat: 9.624167, lng: -13.626667 }, // General Lansana Conté Stadium
  { lat: -12.80175, lng: 45.2097 }, // Q3495983
  { lat: 44.5485, lng: 6.07014 }, // Q3495984
  { lat: -12.84882, lng: 45.10663 }, // Q3495986
  { lat: 6.54994, lng: -5.02403 }, // Q3495988
  { lat: 49.17616, lng: -0.39034 }, // Stade de Venoix
  { lat: 49.17616, lng: -0.39034 }, // Stade de Venoix
  { lat: -1.67797, lng: 29.227 }, // Stade de Virunga
  { lat: 48.60534, lng: 7.76162 }, // Q3496000
  { lat: 47.79048, lng: 3.58378 }, // Q3496002
  { lat: 46.77117, lng: -1.50036 }, // Stade de l'Idonnière
  { lat: 43.261944, lng: 5.376944 }, // Stade de l'Huveaune
  { lat: 45.374722, lng: -71.930556 }, // Université de Sherbrooke Stadium
  { lat: 49.5025, lng: 0.10641 }, // Stade de la Cavée Verte
  { lat: 45.78786, lng: 4.7975 }, // Stadium of La Duchère
  { lat: 14.58666667, lng: -90.54805556 }, // Estadio Revolución Ciudad de Guatemala
  { lat: 46.59474, lng: 0.36716 }, // Stade Michel-Amand
  { lat: 47.84069, lng: 1.94169 }, // Stade de la Source
  { lat: 20.115, lng: -98.7398 }, // Estadio Revolución Mexicana
  { lat: 44.4283, lng: 26.0819 }, // Estadi Republicii
  { lat: 45.75954, lng: 3.10635 }, // Q3496044
  { lat: 50.656874, lng: 2.991252 }, // Ormes Stadium
  { lat: 49.90308, lng: 1.07 }, // Q3496058
  { lat: 30.4055, lng: -9.19372 }, // Q3496063
  { lat: 33.8177, lng: -6.07642 }, // Stade du 18 novembre
  { lat: 36.734444, lng: 3.131389 }, // Stade 1er Novembre 1954
  { lat: 31.63, lng: -8 }, // Q3496072
  { lat: 36.706944, lng: 4.056111 }, // 1 November 1954 Stadium
  { lat: 12.604444, lng: -7.921667 }, // Estadi 26 de Març
  { lat: 34.0099, lng: -6.84028 }, // Stade de FUS
  { lat: -22.9536, lng: -43.1778 }, // Estadi General Severiano
  { lat: 5.25634, lng: -3.98977 }, // Q3496088
  { lat: 50.605277777, lng: 5.545833333 }, // Q3496091
  { lat: 49.1808011, lng: 6.9042224 }, // Schlossberg Stadium
  { lat: 50.4783, lng: 4.20103 }, // Stade du Tivoli
  { lat: 38.336558, lng: 140.378558 }, // ND Soft Stadium Yamagata
  { lat: 9.50282, lng: -7.57523 }, // Stade Municipal
  { lat: 30.3342, lng: -9.49722 }, // Municipal Stadium of Ait Melloul
  { lat: 5.341944, lng: -4.018889 }, // Stade Municipal d'Abidjan
  { lat: 5.20176, lng: -3.73524 }, // Q3496151
  { lat: 45.8482, lng: 1.24117 }, // Stade Municipal de Beaublanc
  { lat: 34.9274, lng: -2.32611 }, // Stade Municipal de Berkane
  { lat: 33.4667, lng: -7.98333 }, // Stade Municipal de Berrechid
  { lat: 7.05023, lng: -3.95643 }, // Q3496164
  { lat: 9.27314, lng: -2.98926 }, // Stade Municipal
  { lat: 6.88845, lng: -6.45677 }, // Stade Municipal
  { lat: 36.4941, lng: 8.78214 }, // Stade Municipal de Jendouba
  { lat: 32.9394, lng: -5.6675 }, // Q3496172
  { lat: 36.7273, lng: 10.3462 }, // Stade Bou Kornine
  { lat: 5.34189, lng: -4.01882 }, // Q3496177
  { lat: 35.17696, lng: -2.92143 }, // Q3496179
  { lat: 34.2527, lng: -6.57155 }, // Stade Municipal
  { lat: 53.0213, lng: 18.5906 }, // City Stadium in Toruń
  { lat: 47.58045, lng: 1.29916 }, // Allées Jean Leroi Municipal Stadium
  { lat: 14.091212, lng: -87.165318 }, // Estadio El Birichiche
  { lat: 34.4225, lng: 8.771667 }, // Stade du 7 Novembre de Gafsa
  { lat: 48.82143, lng: 2.32741 }, // Stade Élisabeth
  { lat: 48.57922, lng: 7.78004 }, // Stadium Emile-Stahl
  { lat: 49.492222222, lng: 5.989722222 }, // Estadi Émile Mayrisch
  { lat: 14.54, lng: -91.680556 }, // Estadio Dr. Óscar Monterroso Izaguirre
  { lat: 42.8852, lng: 74.8681 }, // Stadion Sportkompleks Abdysh-Ata
  { lat: 45.955931, lng: 13.641563 }, // Nova Gorica Sports Park
  { lat: 45.75761, lng: 3.1064 }, // Jean-Pellez Stadium
  { lat: 43.92326, lng: 2.16645 }, // Stadium Municipal d'Albi
  { lat: 43.362349, lng: 19.362245 }, // Estadi Ciutat de Pljevlja
  { lat: 38.004858, lng: 23.689756 }, // Peristeri Stadium
  { lat: 43.588056, lng: 16.574167 }, // Stadion Hrvatski vitezovi
  { lat: 40.785833, lng: 43.833333 }, // Estadi Ciutat de Gyumri
  { lat: 54.5745, lng: 23.3654 }, // Estadi de Futbol de Marijampolė
  { lat: 33.7531, lng: -84.4111 }, // Panther Stadium
  { lat: 31.773, lng: -106.508 }, // Sun Bowl Stadium
  { lat: 43.449367, lng: 17.2149 }, // Stadion Gospin dolac
  { lat: 40.5207, lng: 72.8048 }, // Suyumbayev Stadion
  { lat: 44.976389, lng: -93.224444 }, // Huntington Bank Stadium
  { lat: 41.38872222, lng: -8.30751111 }, // Estádio do Futebol Clube de Vizela
  { lat: 37.763708, lng: -25.622589 }, // Estádio de São Miguel
  { lat: 41.2117, lng: -8.277919 }, // Estádio Municipal 25 de Abril
  { lat: 32.922489, lng: 35.084678 }, // Napoleon Stadium
  { lat: 32.907897, lng: 35.086067 }, // Acre Municipal Stadium
  { lat: 23.09166667, lng: 72.5975 }, // Narendra Modi Stadium
  { lat: 12.05905556, lng: -61.75211111 }, // National Cricket Stadium
  { lat: 25.730064, lng: -80.323036 }, // Tropical Park Stadium
  { lat: 36.148889, lng: -95.997222 }, // Arvest Convention Center
  { lat: 47.026665, lng: 28.8191128 }, // Dinamo Stadium
  { lat: 42.843342, lng: 19.866285 }, // Estadi Ciutat de Berane
  { lat: 12.2317, lng: -68.3298 }, // Stadion Antonio Trenidat
  { lat: 26.20583333, lng: 50.57472222 }, // Al Ahli Stadium
  { lat: 38.43589722, lng: 22.88284444 }, // Levadia Municipal Stadium
  { lat: -9.198056, lng: -171.851111 }, // Hemoana Stadium
  { lat: 45.043639, lng: 23.270056 }, // Stadionul Tudor Vladimirescu
  { lat: 46.668611, lng: 16.1575 }, // Fazanerija City Stadium
  { lat: 42.1425, lng: 41.66555556 }, // Fazisi Stadium
  { lat: 19.420058, lng: -70.732633 }, // Estadio La Barranquita
  { lat: -34.1556, lng: -70.7483 }, // Q5848193
  { lat: -33.37155, lng: -71.66608056 }, // Algarrobo Municipal Stadium
  { lat: 40.483, lng: -3.34722 }, // Municipal Stadium
  { lat: 42.56714, lng: -2.85017 }, // Estadio Municipal de Deportes El Mazo
  { lat: 42.7697, lng: -6.63083 }, // Q5848212
  { lat: -12.93601, lng: -74.242215 }, // Estadio Municipal Manuel Eloy Molina Robles
  { lat: -12.085284, lng: -76.890655 }, // Q5848217
  { lat: -37.4704, lng: -72.3615 }, // Estadio Municipal de Los Ángeles
  { lat: -23.1046, lng: -70.4463 }, // Q5848227
  { lat: 37.581083015, lng: -4.657988732 }, // Estadi Municipal de Montilla
  { lat: 14.680246388, lng: -90.624520277 }, // San Pedro Municipal Stadium
  { lat: 28.046222222, lng: -15.490694444 }, // Q5848261
  { lat: -25.392543, lng: -57.346167 }, // Q5848277
  { lat: 19.246111, lng: -103.701389 }, // Estadio Olímpico Universitario de Colima
  { lat: -32.9837, lng: -68.79277778 }, // Estadio Omar Higinio Sperdutti
  { lat: -25.279107, lng: -57.627501 }, // Q5848298
  { lat: -2.16949, lng: -79.8403 }, // Pablo Sandiford Stadium
  { lat: 9.9, lng: -67.35 }, // Estadio Pancho Pepe Cróquer
  { lat: -23.5688, lng: -70.3899 }, // Q5848312
  { lat: -39.8207, lng: -73.2335 }, // Estadio Parque Municipal
  { lat: -25.192954, lng: -57.534922 }, // Q5848323
  { lat: -19.582861111, lng: -65.750666666 }, // Q5848327
  { lat: -33.19334, lng: -66.31337 }, // Estadio Juan Gilberto Funes
  { lat: -25.273421, lng: -57.587757 }, // Rafael Giménez Stadium
  { lat: 18.134444444, lng: -94.458611111 }, // Estadio Rafael Hernández Ochoa
  { lat: -25.275848, lng: -57.5516543 }, // Estadio Ricardo Gregor
  { lat: -25.3051282, lng: -57.5981715 }, // Estadio Jardines del Kelito
  { lat: -25.509056, lng: -57.355512 }, // Q5848374
  { lat: 42.0005, lng: -1.51817 }, // Q5848381
  { lat: -25.276592, lng: -57.168652 }, // Q5848384
  { lat: 4.42639, lng: -75.6694 }, // Q5848386
  { lat: 5.3186, lng: -72.39172 }, // Santiago de las Atalayas Stadium
  { lat: 40.4297, lng: -3.52083 }, // Q5848397
  { lat: -12.063972222, lng: -77.130708333 }, // Estadio Telmo Carbajo
  { lat: -25.770951, lng: -57.247514 }, // Q5848414
  { lat: -25.279934, lng: -57.62559 }, // Estadio Tomás Beggan Correa
  { lat: 6.334736111, lng: -75.546277777 }, // Q5848423
  { lat: -0.201981, lng: -78.5041 }, // Q5848441
  { lat: -25.607491, lng: -57.52239 }, // Q5848450
  { lat: -25.471456, lng: -57.499919 }, // Q5848469
  { lat: -34.5381, lng: -58.5257 }, // Estadio Libertarios Unidos
  { lat: 42.660722222, lng: -2.029255555 }, // Estadio Merkatondoa
  { lat: 36.6728, lng: -6.13889 }, // Pedro S. Garrido football stadium
  { lat: 36.6728, lng: -6.13889 }, // Pedro S. Garrido football stadium
  { lat: 36.6728, lng: -6.13889 }, // Pedro S. Garrido football stadium
  { lat: 36.6728, lng: -6.13889 }, // Pedro S. Garrido football stadium
  { lat: -25.4093, lng: -57.279163 }, // Q5848501
  { lat: 28.391863888, lng: -16.516633333 }, // Estadio municipal Los Cuartos
  { lat: 36.57575, lng: 140.648639 }, // Hitachi Athletic Stadium
  { lat: 36.391944, lng: 140.586111 }, // Hitachinaka City Stadium
  { lat: -28.75494444, lng: 24.75800833 }, // Hoffe Park Stadium
  { lat: 55.709, lng: 11.724 }, // Holbæk Stadion
  { lat: 43.19201, lng: -77.6575 }, // Holleder Memorial Stadium
  { lat: 43.193, lng: -77.657 }, // Holleder Memorial Stadium
  { lat: 27.644444, lng: -80.426667 }, // Holman Stadium
  { lat: 31.625556, lng: -94.644444 }, // Homer Bryce Stadium
  { lat: 39.333611111, lng: -76.620833333 }, // Homewood Field
  { lat: 22.2744, lng: 114.182 }, // Hong Kong Football Club Stadium
  { lat: 33.89027778, lng: 130.73166667 }, // Honjō Athletic Stadium
  { lat: 28.9592, lng: -95.3747 }, // Hopper Field
  { lat: 42.74155, lng: -87.80096 }, // Horlick Field
  { lat: 32.363889, lng: -86.290556 }, // Hornet Stadium
  { lat: 36.9847, lng: -86.4594 }, // Houchens Industries–L. T. Smith Stadium
  { lat: 1.36912, lng: 103.886 }, // Hougang Stadium
  { lat: 22.58341667, lng: 88.33488889 }, // Sailen Manna Stadium
  { lat: 35.823333, lng: 10.612778 }, // Estadi Olímpic de Sussa
  { lat: 49.2308, lng: -123.021 }, // Swangard Stadium
  { lat: -9.587275, lng: -35.772756 }, // Q921743
  { lat: 40.76, lng: -111.848888888 }, // Rice-Eccles Stadium
  { lat: 55.9448, lng: -4.03709 }, // Broadwood Stadium
  { lat: 38.913933, lng: -6.336406 }, // Estadio Romano
  { lat: 23.14052, lng: 113.31934 }, // Estadi Tianhe
  { lat: 43.536111, lng: -5.637222 }, // Estadi El Molinón-Enrique Castro Quini
  { lat: 39.671785, lng: 66.96572 }, // Dynamo Samarkand Stadium
  { lat: 39.387511, lng: 22.931067 }, // Estadi Panthessaliko
  { lat: -30.044961, lng: -52.887631 }, // Q935064
  { lat: 58.21666667, lng: 11.94388889 }, // Skarsjövallen
  { lat: 35.066944, lng: -106.628333 }, // University Stadium
  { lat: 40.777014, lng: 30.386558 }, // Sakarya Atatürk Stadium
  { lat: 47.541389, lng: 7.62 }, // Estadi St. Jakob
  { lat: 36.745633, lng: 3.078511 }, // Estadi 20 d'agost de 1955
  { lat: 41.6376, lng: -4.74074 }, // Estadi José Zorrilla (1940)
  { lat: 36.743889, lng: 3.091944 }, // Stade Frères Zioui
  { lat: 33.973055555, lng: -81.019166666 }, // Williams-Brice Stadium
  { lat: 14.7107147, lng: -17.4584434 }, // Estadi Demba Diop
  { lat: -18.4875, lng: -70.299166666 }, // Estadi Carlos Dittborn
  { lat: 35.674572, lng: 139.717136 }, // Meiji Jingu Stadium
  { lat: 38.357222, lng: -0.4925 }, // Estadi José Rico Pérez
  { lat: 35.800833333, lng: -78.719444444 }, // Carter–Finley Stadium
  { lat: 30.60992, lng: -96.34052 }, // Kyle Field
  { lat: 32.602222222, lng: -85.489166666 }, // Jordan–Hare Stadium
  { lat: 7.889, lng: 98.3716 }, // Surakul Stadium
  { lat: -24.820889, lng: -65.419189 }, // Estadio Padre Ernesto Martearena
  { lat: -7.44772, lng: 112.705929 }, // Gelora Delta Stadium
  { lat: -41.4915, lng: -72.98705 }, // Estadio Bicentenario de Chinquihue
  { lat: 33.456389, lng: -88.793611 }, // Davis Wade Stadium
  { lat: 46.079078, lng: 23.566553 }, // Stadionul Cetate
  { lat: 17.160277777, lng: -89.069722222 }, // Norman Broaster Stadium
  { lat: 25.433653, lng: -100.978806 }, // Estadio de Béisbol Francisco I. Madero
  { lat: 48.76762, lng: 2.45944 }, // Stade Dominique Duvauchelle
  { lat: 60.983056, lng: 25.634167 }, // Lahti Stadium
  { lat: 38.266944, lng: -0.663333 }, // Estadi Martínez Valero
  { lat: 8.62443, lng: -70.207401 }, // Estadi Agustín Tovar
  { lat: 21.983333, lng: 96.1 }, // Bahtoo Stadium
  { lat: 32.783055555, lng: -117.119444444 }, // San Diego Stadium
  { lat: -6.900833, lng: -38.566111 }, // Q957258
  { lat: -3.807267, lng: -38.522481 }, // Estadi Aderaldo Plácido Castelo
  { lat: 13.76657, lng: 100.552823 }, // Thai-Japanese Stadium
  { lat: 51.487489, lng: 0.035632 }, // The Valley
  { lat: -11.807778, lng: -39.379167 }, // Q959705
  { lat: 51.9296, lng: 15.5301 }, // Zielona Góra Speedway Stadium
  { lat: 35.78944444, lng: -5.82222222 }, // Stade de Marchan
  { lat: -36.755556, lng: -73.107222 }, // club real pollin estadio
  { lat: 12.36869444, lng: -1.55344444 }, // Estadi 4 d'Agost
  { lat: 54.6685, lng: 25.2947 }, // Estadi Local del FK Žalgiris
  { lat: -33.428333, lng: 151.338056 }, // Central Coast Stadium
  { lat: 14.33777778, lng: -89.71444444 }, // Estadio La Asunción
  { lat: 50.354083, lng: 30.952167 }, // Kolos Stadium
  { lat: 35.184916666, lng: -0.621638888 }, // Estadi 24 de febrer de 1956
  { lat: 40.813663, lng: 72.329307 }, // Soghlom Avlod Stadium
  { lat: 50.0088, lng: 20.925 }, // Jaskółcze Gniazdo Municipal Stadium
  { lat: 53.48805556, lng: 18.75944444 }, // City Stadium Grudziądz
  { lat: 51.0961, lng: 16.9969 }, // Stadion Oporowska
  { lat: 47.696419, lng: 17.664428 }, // Stadion ETO
  { lat: -31.945751164, lng: 115.869923754 }, // Perth Rectangular Stadium
  { lat: 39.097222222, lng: -84.506944444 }, // Great American Ball Park
  { lat: 58.418055555, lng: 15.649166666 }, // Linköping Arena
  { lat: 41.7562, lng: 123.426 }, // Wulihe Stadium
  { lat: 23.12711, lng: 113.278672 }, // Guangdong Provincial People's Stadium
  { lat: 29.55714444, lng: 106.5413 }, // Datianwan Stadium
  { lat: 36.425944, lng: 59.383829 }, // emam reeza  Stadium
  { lat: 22.3371, lng: 114.152 }, // Sham Shui Po Sports Ground
  { lat: 35.708527777, lng: 51.314833333 }, // Rah Ahan Stadium
  { lat: 47.595555555, lng: -122.333055555 }, // Kingdome
  { lat: -34.177777777, lng: -70.7375 }, // Estadi El Teniente
  { lat: 22.272861111, lng: 114.188444444 }, // Hong Kong Stadium
  { lat: 33.207777777, lng: -87.550555555 }, // Bryant–Denny Stadium
  { lat: 22.311292, lng: 114.263417 }, // Tseung Kwan O Sports Ground
  { lat: -18.15007222, lng: 178.44908611 }, // HFC Bank Stadium
  { lat: 41.764722222, lng: -87.806111111 }, // Toyota Park
  { lat: 48.811583, lng: 2.322038 }, // Stade Buffalo
  { lat: 44.826029, lng: 65.503439 }, // Gany Muratbayev Stadium
  { lat: 53.8583, lng: 10.6813 }, // Buniamshof
  { lat: 36.058847, lng: 120.344389 }, // Qingdao Tiantai Stadium
  { lat: 38.623888888, lng: -90.1925 }, // Busch Memorial Stadium
  { lat: 43.86414444, lng: 125.33686111 }, // Estadi de Nanling
  { lat: 55.8716, lng: 9.8576 }, // CASA Arena Horsens
  { lat: 55.942231, lng: -3.240921 }, // Murrayfield Stadium
  { lat: 29.685, lng: -95.407777777 }, // Astrodome
  { lat: 57.494722, lng: -4.2175 }, // Caledonian Stadium
  { lat: 37.871111111, lng: -122.250833333 }, // California Memorial Stadium
  { lat: 56.005136, lng: -3.754269 }, // Falkirk Stadium
  { lat: 36.130556, lng: -80.254722 }, // Allegacy Federal Credit Union Stadium
  { lat: 43.07, lng: -89.412777777 }, // Camp Randall Stadium
  { lat: 43.07, lng: -89.412777777 }, // Camp Randall Stadium
  { lat: 43.07, lng: -89.412777777 }, // Camp Randall Stadium
  { lat: 43.07, lng: -89.412777777 }, // Camp Randall Stadium
  { lat: 43.07, lng: -89.412777777 }, // Camp Randall Stadium
  { lat: 43.07, lng: -89.412777777 }, // Camp Randall Stadium
  { lat: 43.07, lng: -89.412777777 }, // Camp Randall Stadium
  { lat: 43.07, lng: -89.412777777 }, // Camp Randall Stadium
  { lat: 43.07, lng: -89.412777777 }, // Camp Randall Stadium
  { lat: 43.07, lng: -89.412777777 }, // Camp Randall Stadium
  { lat: 43.07, lng: -89.412777777 }, // Camp Randall Stadium
  { lat: 43.07, lng: -89.412777777 }, // Camp Randall Stadium
  { lat: 6.136022222, lng: 100.371763888 }, // Darul Aman Stadium
  { lat: -12.396389, lng: 130.880833 }, // Darwin Football Stadium
  { lat: 31.221392, lng: 107.469976 }, // Dazhou Xiwai Stadium
  { lat: 41.840373, lng: 59.971619 }, // Daşoguz Stadium
  { lat: 40.5063, lng: -78.6372 }, // DeGol Field
  { lat: 52.559117, lng: -1.3404 }, // De Montfort Park
  { lat: 43.218611, lng: 27.9125 }, // Spartak Stadium
  { lat: 35.324433102, lng: 40.146233964 }, // Deir ez-Zor Municipal Stadium
  { lat: 29.803611, lng: -95.456111 }, // Delmar Stadium
  { lat: 27.84810833, lng: -15.44813889 }, // Estadio Municipal de Vecindario
  { lat: -42.824167, lng: 147.282778 }, // Derwent Entertainment Centre
  { lat: 54.648056, lng: -3.555556 }, // Derwent Park
  { lat: 32.663056, lng: -114.636389 }, // Desert Sun Stadium
  { lat: 31.143056, lng: 30.6525 }, // Desouk Stadium
  { lat: 44.765156, lng: 20.472153 }, // Detelinara Stadium
  { lat: 20.135612385, lng: 92.890470528 }, // Dhanyawaddy Stadium
  { lat: 26.930833, lng: 80.982778 }, // Dhyan Chand Astroturf Stadium
  { lat: 36.438228, lng: 28.228233 }, // Diagoras Stadium
  { lat: 41.753783, lng: -72.661061 }, // Trinity Health Stadium
  { lat: 43.23572, lng: 26.5726 }, // Dimitar Burkov Stadium
  { lat: 30.26132, lng: -97.75473 }, // Disch Field
  { lat: -34.8425, lng: 138.608333 }, // State Hockey Centre
  { lat: 41.139167, lng: -81.313333 }, // Dix Stadium
  { lat: -26.226667, lng: 27.864167 }, // Dobsonville Stadium
  { lat: 35.92865, lng: -94.967575 }, // Doc Wadley Stadium
  { lat: 30.713107, lng: -95.540221 }, // Don Sanders Stadium
  { lat: 44.868097, lng: -91.928648 }, // Don and Nona Williams Stadium
  { lat: 5.884444, lng: -10.0375 }, // Doris Williams Stadium
  { lat: 36.681666666, lng: 2.961666666 }, // Ali La Pointe Stadium
  { lat: 33.7154, lng: -78.8665 }, // Doug Shaw Memorial Stadium
  { lat: -22.244167, lng: -54.781944 }, // Douradão
  { lat: 40.793889, lng: -73.924167 }, // Downing Stadium
  { lat: 37.77547222, lng: 29.03777778 }, // Doğan Seyfi Atlı Stadium
  { lat: 33.098333333, lng: -96.82 }, // Riders Field
  { lat: 32.601944, lng: -85.4875 }, // Drake Field
  { lat: 41.605, lng: -93.655 }, // Drake Stadium
  { lat: 34.072, lng: -118.448 }, // UCLA Drake Track and Field Stadium
  { lat: 53.39756, lng: -2.99164 }, // Liverpool Arena
  { lat: 36.139647, lng: -95.923667 }, // Drillers Stadium
  { lat: 43.556028, lng: 27.826806 }, // Druzhba Stadium
  { lat: 32.6103, lng: -85.4469 }, // Duck Samford Stadium
  { lat: 58.0083, lng: -3.85764 }, // Dudgeon Park
  { lat: 15.59849, lng: 73.816147 }, // Duler Stadium
  { lat: -45.9077, lng: 170.505 }, // Dunedin Ice Stadium
  { lat: 36.035427, lng: -78.903165 }, // Durham County Stadium
  { lat: 37.5809, lng: -77.5368 }, // E. Claiborne Robins Stadium
  { lat: 33.114167, lng: -96.658889 }, // Eagle Stadium
  { lat: 39.0016, lng: 125.8328 }, // East Pyongyang Stadium
  { lat: 32.5209, lng: -92.7213 }, // Eddie Robinson Stadium
  { lat: 46.235, lng: -119.113 }, // Edgar Brown Memorial Stadium
  { lat: 41.6706, lng: 26.5544 }, // Edirne 25 Kasım Stadium
  { lat: 35.655278, lng: 139.8525 }, // Edogawa Stadium
  { lat: 30.091111, lng: -95.994444 }, // Edward L. Blackshear Field
  { lat: 24.268244444, lng: 55.756397222 }, // Tahnoun bin Mohammed Stadium
  { lat: -33.843056, lng: 151.067778 }, // Sydney Showground Stadium
  { lat: 34.680714, lng: 133.919494 }, // Kanko Stadium
  { lat: 51.502944444, lng: 0.003194444 }, // The O2 Arena
  { lat: 18.487587, lng: -77.660465 }, // Elleston Wakeland Stadium
  { lat: 36.54362222, lng: 139.983975 }, // Kiyohara Baseball Stadium
  { lat: 32.45367, lng: -98.6842 }, // Ellis Burks Field
  { lat: 34.570325, lng: 135.590708 }, // Fujiidera Stadium
  { lat: 35.634436, lng: 51.327383 }, // Emam Reza Stadium
  { lat: 35.147354, lng: 136.88673 }, // Nagoya Baseball Stadium
  { lat: 17.978728, lng: -76.784107 }, // Emmett Park
  { lat: 49.282638888, lng: -123.033222222 }, // Empire Stadium
  { lat: 59.6325, lng: 17.06777778 }, // Enavallen
  { lat: 35.850556, lng: 50.958333 }, // Enghelab Stadium
  { lat: -37.625, lng: 145.024722 }, // Epping Stadium
  { lat: -37.9708, lng: -57.5628 }, // Q5390264
  { lat: 14.312791666, lng: -90.783305555 }, // Estadio Armando Barillas
  { lat: -33.3543, lng: -70.4982 }, // Estadio Municipal de Lo Barnechea
  { lat: 35.2456, lng: -81.6732 }, // Ernest W. Spangler Stadium
  { lat: 40.333333, lng: 20.683333 }, // Ersekë Stadium
  { lat: -32.890786, lng: -68.862777 }, // autista Tragantini Stadium
  { lat: 21.182051, lng: -86.830544 }, // Estadio Cancun 86
  { lat: 40.457558333, lng: -3.860286111 }, // Estadi Cerro del Espino
  { lat: -34.878424, lng: -56.08932 }, // Estadio Charrúa
  { lat: 38.682847222, lng: -4.088722222 }, // Estadio Ciudad de Puertollano
  { lat: 43.3506, lng: -4.06389 }, // Estadio El Malecón
  { lat: -35.419722, lng: -71.673889 }, // Estadio Bicentenario Iván Azócar Bernales
  { lat: -35.855425, lng: -71.591033 }, // Estadio Fiscal de Linares
  { lat: 18.002422, lng: -66.631785 }, // Estadi Francisco Montaner
  { lat: -9.940567, lng: -76.252778 }, // Estadio Heraclio Tapia
  { lat: 3.7496826, lng: 8.7808979 }, // Estadio Internacional
  { lat: -18.005, lng: -70.253056 }, // Estadio Jorge Basadre
  { lat: -32.90753056, lng: -60.68376667 }, // José Martín Olaeta Stadium
  { lat: -17.805378, lng: -63.16573 }, // Estadio Juan Carlos Durán
  { lat: -34.974356, lng: -71.230707 }, // Estadio La Granja
  { lat: 28.49152, lng: -13.8673 }, // Estadio Los Pozos
  { lat: -27.376667, lng: -70.320833 }, // Estadio Luis Valenzuela Hermosilla
  { lat: -9.10001, lng: -78.560207 }, // Estadio Manuel Rivera Sanchez
  { lat: -15.5348407, lng: -70.1212907 }, // Estadio Monumental Universidad Andina de Juliaca
  { lat: -32.784167, lng: -71.199444 }, // Estadio Municipal Nicolás Chahuán
  { lat: -32.8876, lng: -71.252 }, // Estadio Municipal Lucio Fariña Fernández
  { lat: -12.1719524, lng: -77.0274801 }, // Estadio Municipal de Chorrillos
  { lat: -33.586667, lng: -70.635833 }, // Estadio Municipal de La Pintana
  { lat: -32.746944, lng: -70.73 }, // Estadio Municipal de San Felipe
  { lat: -34.743056, lng: -58.252222 }, // National Hockey Stadium of Argentina
  { lat: 18.97041389, lng: -99.24660833 }, // Estadio Nido del Colibri
  { lat: -31.26362, lng: -61.49721 }, // Estadio Parque Barrio Ilolay
  { lat: 43.07, lng: -89.412777777 }, // Camp Randall Stadium
  { lat: 43.07, lng: -89.412777777 }, // Camp Randall Stadium
  { lat: 43.07, lng: -89.412777777 }, // Camp Randall Stadium
  { lat: 43.07, lng: -89.412777777 }, // Camp Randall Stadium
  { lat: 43.07, lng: -89.412777777 }, // Camp Randall Stadium
  { lat: 43.07, lng: -89.412777777 }, // Camp Randall Stadium
  { lat: 43.07, lng: -89.412777777 }, // Camp Randall Stadium
  { lat: 40.6475, lng: -8.593611 }, // Estádio Municipal de Aveiro
  { lat: 37.713611111, lng: -122.386111111 }, // Candlestick Park
  { lat: -45.893611111, lng: 170.490555555 }, // Carisbrook
  { lat: 16.971215252, lng: -88.22133944 }, // Carl Ramos Stadium
  { lat: -2.530556, lng: 140.723611 }, // Mandala Stadium
  { lat: 25.310595, lng: 51.424274 }, // Estadi Ciutat de l'Educació
  { lat: 25.65222168, lng: 51.48777771 }, // Estadi Al Bayt
  { lat: -30.065614, lng: -51.236086 }, // Estadi Beira-Rio
  { lat: 41.948055555, lng: -87.655555555 }, // Wrigley Field
  { lat: -33.889166666, lng: 151.225277777 }, // Sydney Football Stadium
  { lat: 47.2561, lng: -1.52466 }, // Stade de la Beaujoire
  { lat: 32.465167, lng: -93.673578 }, // CenturyLink Center
  { lat: 39.748611111, lng: -8.813055555 }, // Estádio Dr. Magalhães Pessoa
  { lat: 41.445833333, lng: -8.300972222 }, // Estádio D. Afonso Henriques
  { lat: 41.162222222, lng: -8.642777777 }, // Estádio do Bessa
  { lat: 29.684722222, lng: -95.410833333 }, // NRG Stadium
  { lat: 33.7575, lng: -84.400833333 }, // Georgia Dome
  { lat: 43.299305555, lng: 13.45625 }, // Sferisterio di Macerata
  { lat: 33.371944, lng: 130.520278 }, // Tosu Stadium
  { lat: -31.368956, lng: -64.246244 }, // Estadi Mario Alberto Kempes
  { lat: 38.90693889, lng: 121.60414722 }, // Dalian People's Stadium
  { lat: 40.446666666, lng: -80.015833333 }, // Heinz Field
  { lat: 51.9625, lng: 5.893056 }, // GelreDome
  { lat: 51.9625, lng: 5.893056 }, // GelreDome
  { lat: 40.203333333, lng: -8.407777777 }, // Estádio Cidade de Coimbra
  { lat: 30.66555556, lng: 104.06472222 }, // Chengdu Sports Centre
  { lat: 42.328611, lng: 19.240556 }, // Estadi Trešnjica
  { lat: 35.343608, lng: 139.341263 }, // Shonan BMW Stadium Hiratsuka
  { lat: 44.973888888, lng: -93.258055555 }, // Hubert H. Humphrey Metrodome
  { lat: -32.889564, lng: -68.879994 }, // Estadi Malvinas Argentinas
  { lat: 22.969828, lng: 113.114296 }, // Century Lotus Stadium
  { lat: 42.356389, lng: 13.403889 }, // Stadio Tommaso Fattori
  { lat: 41.506111111, lng: -81.699444444 }, // Huntington Bank Field
  { lat: 40.009444444, lng: -82.991111111 }, // Columbus Crew Stadium
  { lat: 41.6484, lng: -72.7727 }, // Veterans Stadium
  { lat: 52.066389, lng: -9.508056 }, // Fitzgerald Stadium
  { lat: 12.513055555, lng: -70.023611111 }, // Estadi Guillermo Prospero Trinidad
  { lat: 36.0681, lng: -94.1789 }, // Donald W. Reynolds Razorback Stadium
  { lat: 35.882861111, lng: 14.513027777 }, // Estadi Tony Bezzina
  { lat: 45.81584, lng: 3.12162 }, // Stade Gabriel Montpied
  { lat: 45.81584, lng: 3.12162 }, // Stade Gabriel Montpied
  { lat: 34.422222222, lng: 35.821944444 }, // International Olympic Stadium
  { lat: 32.104197, lng: 34.865078 }, // Estadi HaMoshava
  { lat: 39.756111111, lng: -104.994166666 }, // Coors Field
  { lat: 47.7676, lng: 19.1382 }, // Ligeti Stadion
  { lat: 53.895138888, lng: 27.560277777 }, // Estadi Dinamo
  { lat: 41.8625, lng: -87.616666666 }, // Soldier Field
  { lat: 41.8625, lng: -87.616666666 }, // Soldier Field
  { lat: 7.68277778, lng: -5.04472222 }, // Estadi de Bouaké
  { lat: 36.828863, lng: 10.170121 }, // Estadi Chedly Zouiten
  { lat: 47.736376, lng: 7.32183 }, // Stade de l'Ill
  { lat: 38.031111111, lng: -78.513611111 }, // Scott Stadium
  { lat: 25.288695, lng: 51.566465 }, // Estadi 974
  { lat: 7.33333333, lng: -2.325 }, // Coronation Park
  { lat: 26.14, lng: 51.22 }, // Al-Shamal Stadium
  { lat: 47.650277777, lng: -122.301666666 }, // Husky Stadium
  { lat: 32.779722222, lng: -96.759722222 }, // Estadi Cotton Bowl
  { lat: -19.056111111, lng: -169.909166666 }, // Niue High School Oval
  { lat: 39.043722222, lng: 125.757694444 }, // Kim Il-sung Stadium
  { lat: 59.3725, lng: 18 }, // Friends Arena
  { lat: 39.994780555, lng: 116.383958333 }, // Estadi Cobert Nacional de Pequín
  { lat: 38.647777777, lng: -90.313611111 }, // Francis Field
  { lat: 39.283888888, lng: -76.621666666 }, // Oriole Park at Camden Yards
  { lat: 39.278055555, lng: -76.622777777 }, // M&T Bank Stadium
  { lat: 27.975833333, lng: -82.503333333 }, // Raymond James Stadium
  { lat: 42.34, lng: -83.045555555 }, // Ford Field
  { lat: 42.34, lng: -83.045555555 }, // Ford Field
  { lat: 36.166388888, lng: -86.771388888 }, // Nissan Stadium
  { lat: 56.29202778, lng: 43.9791 }, // Culture and Entertainment Complex Nagorny
  { lat: 50.414609, lng: 4.453787 }, // Stade du Pays de Charleroi
  { lat: 35.443428, lng: 139.6401 }, // Yokohama Stadium
  { lat: 21.020555555, lng: 105.763805555 }, // My Dinh National Stadium
  { lat: 40.446944444, lng: -80.005833333 }, // PNC Park
  { lat: 25.317155, lng: 51.512366 }, // Estadi Suheim bin Hamad
  { lat: 50.708031166, lng: 10.693198 }, // Lotto Thüringen Arena am Rennsteig
  { lat: 44.981667, lng: -93.278333 }, // Target Field
  { lat: 45.740556, lng: 21.244167 }, // Estadi Dan Păltinişanu (1963)
  { lat: 42.005733, lng: 21.425592 }, // Estadi Filip II
  { lat: 43.61092, lng: 2.25271 }, // Stade Pierre-Antoine
  { lat: 59.6275, lng: 16.530555555 }, // Hitachi Energy Arena
  { lat: 59.6275, lng: 16.530555555 }, // Hitachi Energy Arena
  { lat: 30.283666666, lng: -97.732555555 }, // Darrell K Royal–Texas Memorial Stadium
  { lat: 41.551111111, lng: -8.622777777 }, // Estádio Cidade de Barcelos
  { lat: 47.506111, lng: 19.094722 }, // Millenáris Sporttelep
  { lat: 39.650277777, lng: -79.954722222 }, // Mountaineer Field at Milan Puskar Stadium
  { lat: 25.2804, lng: 51.5225 }, // Sports City Stadium
  { lat: 25.420861111, lng: 51.490388888 }, // Estadi Icònic de Lusail
  { lat: 51.679167, lng: -4.129167 }, // Parc y Scarlets
  { lat: 40.446666666, lng: -80.012777777 }, // Three Rivers Stadium
  { lat: 35.122721, lng: 136.944301 }, // Mizuho Athletic Stadium
  { lat: 40.11402778, lng: 67.82897222 }, // Markaziy Stadium
  { lat: -12.978806, lng: -38.504194 }, // Estádio Fonte Nova
  { lat: 47.591388888, lng: -122.3325 }, // Safeco Field
  { lat: 35.710278, lng: 51.4275 }, // Shahid Shiroudi Stadium
  { lat: 2.04194444, lng: 45.35666667 }, // Estadi Banadir
  { lat: 36.144166666, lng: -86.808888888 }, // FirstBank Stadium
  { lat: 43.667060521, lng: -79.397193132 }, // Varsity Stadium
  { lat: 34.361944, lng: -89.534167 }, // Vaught–Hemingway Stadium
  { lat: 34.361944, lng: -89.534167 }, // Vaught–Hemingway Stadium
  { lat: 34.361944, lng: -89.534167 }, // Vaught–Hemingway Stadium
  { lat: 34.361944, lng: -89.534167 }, // Vaught–Hemingway Stadium
  { lat: 34.361944, lng: -89.534167 }, // Vaught–Hemingway Stadium
  { lat: 34.361944, lng: -89.534167 }, // Vaught–Hemingway Stadium
  { lat: 34.361944, lng: -89.534167 }, // Vaught–Hemingway Stadium
  { lat: 34.361944, lng: -89.534167 }, // Vaught–Hemingway Stadium
  { lat: 34.361944, lng: -89.534167 }, // Vaught–Hemingway Stadium
  { lat: 34.361944, lng: -89.534167 }, // Vaught–Hemingway Stadium
  { lat: 34.361944, lng: -89.534167 }, // Vaught–Hemingway Stadium
  { lat: 17.956389, lng: -76.717222 }, // Harbour View Stadium
  { lat: 39.355461, lng: 22.967747 }, // Volos Municipal Stadium
  { lat: 35.995278, lng: -78.941667 }, // Wallace Wade Stadium
  { lat: 41.311667, lng: -105.568333 }, // War Memorial Stadium
  { lat: 53.3825, lng: -2.588056 }, // Wilderspool Stadium
  { lat: -6.85568, lng: 39.2727 }, // Uhuru Stadium
  { lat: 44.001694, lng: -73.176969 }, // Youngman Field at Alumni Stadium
  { lat: 23.666627777, lng: 53.696686111 }, // Al Dhafra Stadium
  { lat: -34.896869, lng: -56.153317 }, // Parque Luis Méndez Piana
  { lat: 43.398611, lng: 23.225278 }, // Ogosta Stadium
  { lat: 43.077222, lng: 25.620556 }, // Ivaylo Stadium
  { lat: 42.275556, lng: 23.135556 }, // Bonchuk Stadium
  { lat: 43.848056, lng: 25.963056 }, // Gradski Stadium
  { lat: 42.133889, lng: 24.771667 }, // Lokomotiv Stadium
  { lat: 42.026389, lng: 23.1 }, // Hristo Botev Stadium
  { lat: 43.53361111, lng: 26.5275 }, // Ludogorets Arena
  { lat: 43.56511389, lng: 39.75264722 }, // Sochi Central Stadium
  { lat: 42.50888889, lng: 41.87388889 }, // Gulia Tutberidze Stadium
  { lat: 41.91165, lng: 45.480824 }, // Estadi Givi Chokheli
  { lat: 41.78083333, lng: 44.77611111 }, // Olimpi Stadium
  { lat: 43.9149, lng: 12.4821 }, // Campo sportivo di Montegiardino
  { lat: -33.457288, lng: -70.609445 }, // Campos de Sports de Ñuñoa
  { lat: 40.268409, lng: 44.635241 }, // Estadi Ciutat d'Abovian
  { lat: 54.174167, lng: 37.603056 }, // Arsenal Stadium
  { lat: 56.123528, lng: 40.392478 }, // Torpedo Stadium
  { lat: 47.27166667, lng: 39.72777778 }, // SKA SKVO Stadium
  { lat: 40.736944444, lng: 44.856388888 }, // Dilijan City Stadium
  { lat: 43.86069444, lng: 25.98222222 }, // Lokomotiv Stadium
  { lat: 42.131667, lng: 24.743611 }, // Todor Diev Stadium
  { lat: 39.544091, lng: 54.349521 }, // Balkanabat Stadium
  { lat: 42.962222, lng: 23.35 }, // Chavdar Tsvetkov Stadium
  { lat: 54.573314, lng: -5.983994 }, // Casement Park
  { lat: 54.0675, lng: -2.847222 }, // Christie Park, Morecambe
  { lat: 42.0574, lng: -1.612 }, // Estadio Ciudad de Tudela
  { lat: 28.107830555, lng: -15.442527777 }, // Estadio Alfonso Silva
  { lat: -34.581905, lng: -58.397368 }, // Estadi Alvear y Tagle
  { lat: 5.668611, lng: -67.618611 }, // Estadio Antonio José de Sucre
  { lat: -34.6675, lng: -58.368333333 }, // Estadi Racing Club
  { lat: -34.63501667, lng: -58.42352222 }, // Estadi Gasómetro
  { lat: 51.073436, lng: -114.120636 }, // Foothills Stadium
  { lat: 53.263333, lng: -9.084167 }, // Pearse Stadium
  { lat: 54.613889, lng: -7.296111 }, // Healy Park
  { lat: 39.5808, lng: 2.6407 }, // estadi Lluís Sitjar
  { lat: 61.134107, lng: 10.506368 }, // Birkebeineren Skistadion
  { lat: 44.261305555, lng: -73.966055555 }, // Estadi eqüestre de Lake Placid
  { lat: 53.401179, lng: -6.245063 }, // Morton Stadium
  { lat: 4.96755556, lng: 8.32686111 }, // U. J. Esuene Stadium
  { lat: 14.556667, lng: 100.905 }, // Saraburi Stadium
  { lat: 30.5889, lng: 114.268 }, // Xinhua Road Sports Center
  { lat: 54.185556, lng: -7.232778 }, // St Tiernach's Park
  { lat: 44.46243056, lng: 11.38077778 }, // Gianni Falchi Stadium
  { lat: 45.576263888, lng: 9.274091666 }, // Stadio Gino Alfonso Sada
  { lat: 45.576084, lng: 9.274179 }, // Stadio Gino Alfonso Sada
  { lat: 43.7786, lng: 11.2804 }, // Stadio Luigi Ridolfi
  { lat: 46.416825, lng: 15.87558611 }, // Ptuj City Stadium
  { lat: 38.2243, lng: 15.5582 }, // Stadio Primo Nebiolo
  { lat: 45.857831, lng: 9.398919 }, // Stadio Rigamonti
  { lat: 45.6391, lng: 12.5449 }, // Stadio Romolo Pacifici
  { lat: 44.0582, lng: 12.4501 }, // Stadio Valentino Mazzola
  { lat: 44.05836111, lng: 12.44988889 }, // Stadio Valentino Mazzola
  { lat: 42.031111111, lng: 13.939222222 }, // Q3967944
  { lat: 50.108611111, lng: 18.548055555 }, // Rybnik municipal stadium
  { lat: 50.0978, lng: 18.2175 }, // OSiR stadium in Racibórz
  { lat: 50.7198, lng: 23.2454 }, // Zamość Stadion
  { lat: 52.42725, lng: 16.888167 }, // Q3967962
  { lat: 53.772778, lng: 20.508056 }, // OSiR Stadium in Olsztyn
  { lat: 53.103889, lng: 18.031389 }, // Chemik Bydgoszcz Stadium
  { lat: 52.2186, lng: 18.2556 }, // Q3967967
  { lat: 51.39010278, lng: 0.02108333 }, // Hayes Lane
  { lat: 51.3787, lng: -2.3951 }, // Twerton Park
  { lat: 53.310277777, lng: -6.228055555 }, // UCD Bowl
  { lat: 38.1732, lng: 13.3134 }, // Velodromo Paolo Borsellino
  { lat: 53.377358, lng: -6.251681 }, // Whitehall Stadium
  { lat: 41.023775, lng: 28.87981389 }, // Güngören M.Yahya Baş Stadium
  { lat: 40.400163, lng: 49.944019 }, // Neftçi Arena
  { lat: 50.616111, lng: 26.240833 }, // Avanhard Stadium
  { lat: 50.26, lng: 127.501 }, // Amur Stadium
  { lat: 40.893333, lng: 45.151111 }, // Estadi Arnar
  { lat: 40.534111111, lng: 22.202361111 }, // Veria Stadium
  { lat: 42.8129, lng: 132.858 }, // Q4113981
  { lat: 29.27194444, lng: 47.92444444 }, // Ali Al-Salem Al-Sabah Stadium
  { lat: 26.3699, lng: 50.2052 }, // Prince Saud bin Jalawi Stadium
  { lat: 18.310556, lng: 42.598333 }, // Prince Sultan bin Abdulaziz Sports City
  { lat: 25.305833333, lng: 49.612777777 }, // Prince Abdullah bin Jalawi Sports City
  { lat: 25.305833, lng: 49.612778 }, // Prince Abdullah bin Jalawi Sports City
  { lat: -42.77802222, lng: -65.03839444 }, // Raúl Conti Stadium
  { lat: 39.869, lng: -4.018088888 }, // Estadi Salto del Caballo
  { lat: -40.583333, lng: -73.131667 }, // Estadio Rubén Marcos Peralta
  { lat: -33.507458, lng: -70.749122 }, // Estadio Santiago Bueras
  { lat: -34.651236196, lng: -58.386917991 }, // Estadi Sportivo Barracas
  { lat: 18.465278, lng: -66.088889 }, // Estadi Sixto Escobar
  { lat: 20.7277, lng: -103.381 }, // Estadio Panamericano de Béisbol
  { lat: 20.7277, lng: -103.381 }, // Estadio Panamericano de Béisbol
  { lat: 23.2358723, lng: -106.4323417 }, // Estadio Teodoro Mariscal
  { lat: -20.242413, lng: -70.132937 }, // Estadio Tierra de Campeones
  { lat: -27.1475, lng: -109.42972222 }, // Hanga Roa Stadium
  { lat: 10.4125, lng: -66.8886 }, // Estadio de Fútbol de la Universidad Simón Bolívar
  { lat: 38.102995, lng: -3.622964 }, // Estadio Municipal de Linarejos
  { lat: 40.441667, lng: -3.71 }, // Estadio de Vallehermoso
  { lat: 37.77522, lng: -3.76734 }, // Estadio de la Victoria
  { lat: 35.0803, lng: -92.4603 }, // Estes Stadium
  { lat: 43.7756, lng: -79.4467 }, // Esther Shiner Stadium
  { lat: 41.533611111, lng: -8.610277777 }, // Estádio Adelino Ribeiro Novo
  { lat: -8.757222, lng: -63.910556 }, // Estádio Aluízio Ferreira
  { lat: -20.834722, lng: -49.401111 }, // Estádio Anísio Haddad
  { lat: 41.193, lng: -8.146 }, // Estádio Municipal do Marco de Canaveses
  { lat: -19.002778, lng: -57.664444 }, // Estádio Arthur Marinho
  { lat: -22.219478, lng: -49.939406 }, // Estádio Bento de Abreu
  { lat: 40.8419, lng: -8.4703 }, // Estádio Carlos Osório
  { lat: -3.746389, lng: -38.545278 }, // Estádio Carlos de Alencar Pinto
  { lat: 40.898239, lng: -8.499072 }, // Estadi Conde Dias Garcia
  { lat: -19.9875, lng: -43.844722222 }, // Estádio Castor Cifuentes
  { lat: -22.869767, lng: -43.337275 }, // Estádio Conselheiro Galvão
  { lat: -8.075833, lng: -39.119444 }, // Estádio Cornélio de Barros
  { lat: -5.598056, lng: -36.908333 }, // Estadi Edgar Borges Montenegro
  { lat: -22.734428, lng: -47.348008 }, // Estádio Décio Vitta
  { lat: -20.334444, lng: -40.355833 }, // Estádio Engenheiro Alencar Araripe
  { lat: -6.13333, lng: 12.35 }, // Estádio Imbomdeiro
  { lat: -22.795278, lng: -43.419722 }, // Estádio Giulite Coutinho
  { lat: -3.121944, lng: -60.037778 }, // Estadi Ismael Benigno
  { lat: -2.443853, lng: -54.714661 }, // Estádio Jader Barbalho
  { lat: -23.188308, lng: -46.859281 }, // Estádio Jayme Cintra
  { lat: -15.20138889, lng: 12.15805556 }, // Estádio Joaquim Morais
  { lat: -19.395, lng: -40.06388889 }, // Estádio Joaquim Calmon
  { lat: -12.244583, lng: -38.97235 }, // Estádio Joia da Princesa
  { lat: -16.346347, lng: -48.955761 }, // Estádio Jonas Duarte
  { lat: -16.346499, lng: -48.955584 }, // Estádio Jonas Duarte
  { lat: -20.332778, lng: -40.385278 }, // Estádio Kléber Andrade
  { lat: -9.970278, lng: -67.8075 }, // Estádio José de Melo
  { lat: -19.922339773, lng: -43.949874051 }, // Estádio Juscelino Kubitschek de Oliveira
  { lat: -18.91233611, lng: -48.27213611 }, // Estádio Juca Ribeiro
  { lat: 16.753258333, lng: -22.938833333 }, // Estadi Marcelo Leitão
  { lat: -23.188517, lng: -45.870331 }, // Estádio Martins Pereira
  { lat: 14.880666666, lng: -24.298083333 }, // Estádio Monte Pe Largo
  { lat: -22.872497, lng: -43.456575 }, // Estádio Proletário Guilherme da Silveira
  { lat: -24.723889, lng: -53.754444 }, // Estádio Municipal 14 de Dezembro
  { lat: -24.723889, lng: -53.754444 }, // Estádio Municipal 14 de Dezembro
  { lat: 16.8825, lng: -24.985277777 }, // Estadi Adérito Sena
  { lat: -7.2242, lng: -39.3178 }, // Estádio Mauro Sampaio
  { lat: -22.8072, lng: -45.1853 }, // Estádio Municipal Professor Dario Rodrigues Leite
  { lat: 40.18683056, lng: -8.50968333 }, // Estádio Municipal Sérgio Conceição
  { lat: -23.489556, lng: -47.449056 }, // Estádio Municipal Walter Ribeiro
  { lat: -12.59361111, lng: 13.39 }, // Estádio Municipal de Benguela
  { lat: 40.633611111, lng: -8.652222222 }, // Estádio Mário Duarte
  { lat: 41.75064, lng: -7.464985 }, // Estádio Municipal de Chaves
  { lat: -27.651011, lng: -52.265039 }, // Estádio Olímpico Colosso da Lagoa
  { lat: -16.670833, lng: -49.2625 }, // Estadi Olímpic Pedro Ludovico
  { lat: -24.975015, lng: -53.502538 }, // Estádio Olímpico Regional Arnaldo Busatto
  { lat: -22.009435, lng: -47.892929 }, // Estádio Paulista
  { lat: -29.153889, lng: -51.536389 }, // Estádio Parque Esportivo Montanha dos Vinhedos
  { lat: -22.585503, lng: -43.305108 }, // Estádio Romário de Souza Faria
  { lat: -21.2025, lng: -47.789167 }, // Estádio Santa Cruz
  { lat: -9.670556, lng: -35.759167 }, // Estádio Rei Pelé
  { lat: -25.521661, lng: -49.231036 }, // Estádio Vila Olímpica
  { lat: -13.87635, lng: -40.0838 }, // Estádio Waldomiro Pereira
  { lat: -23.414167, lng: -51.938056 }, // Estádio Willie Davids
  { lat: -16.2466, lng: -47.9411 }, // Estádio Zequinha Roriz
  { lat: -18.983889, lng: -49.464722 }, // Estádio da Fazendinha
  { lat: -18.983889, lng: -49.464722 }, // Estádio da Fazendinha
  { lat: 38.724124, lng: -9.16328 }, // Estádio das Amoreiras
  { lat: 38.759158, lng: -9.159573 }, // Estádio do Campo Grande
  { lat: -22.463811, lng: -44.456122 }, // Estádio do Trabalhador
  { lat: 41.38783611, lng: -8.772575 }, // Estádio do Varzim Sport Club
  { lat: -12.75557237, lng: 15.762489083 }, // Estádio dos Kuricutelas
  { lat: -23.578166666, lng: -46.654472222 }, // Estádio Ícaro de Castro Melo
  { lat: 51.785278, lng: -3.206389 }, // Eugene Cross Park
  { lat: -37.539528, lng: 143.848028 }, // Eureka Stadium
  { lat: 49.1704, lng: -121.967 }, // Exhibition Stadium
  { lat: 49.077248, lng: 33.428628 }, // FC Kremin Stadium
  { lat: 50.215569, lng: 13.466236 }, // FK Chmel Blšany
  { lat: 27.789893, lng: -97.651028 }, // Fairgrounds Field
  { lat: 46.903036, lng: -96.80155 }, // Fargodome
  { lat: 32.7457, lng: -97.3602 }, // Farrington Field
  { lat: 29.318, lng: 30.84 }, // Fayoum Stadium
  { lat: 22.62138889, lng: 120.35402778 }, // Fengshan Stadium, Kaohsiung City
  { lat: 17.9527, lng: -76.9028 }, // Ferdi Neita Sports Complex
  { lat: 42.26875, lng: -83.741778 }, // Ferry Field
  { lat: 35.036374, lng: -85.315762 }, // Finley Stadium
  { lat: 56.005, lng: -3.778889 }, // Firs Park
  { lat: 32.568611111, lng: 117.009166666 }, // Huainan Sports Stadium
  { lat: 40.845429, lng: 69.600019 }, // AGMK Stadium
  { lat: 40.999618, lng: 71.593834 }, // Markaziy Stadium
  { lat: 5.372777777, lng: 103.106388888 }, // Sultan Ismail Nasiruddin Shah Stadium
  { lat: 28.210133, lng: 112.983699 }, // Hunan Provincial People's Stadium
  { lat: 42.760554, lng: 129.3761 }, // Hailanjiang Stadium
  { lat: 22.5072, lng: 113.389 }, // Zhongshan Sports Center Stadium
  { lat: 10.536111, lng: 106.408333 }, // Long An Stadium
  { lat: 23.117341, lng: 113.451047 }, // Huangpu Sports Center
  { lat: 1.3529, lng: 103.941 }, // Our Tampines Hub
  { lat: 38.51761, lng: 68.2162 }, // Stadium Metallurg 1st District
  { lat: 30.270857, lng: 56.986629 }, // Shahid Bahonar Stadium
  { lat: 32.743267, lng: 51.686203 }, // Naghsh-e-Jahan Stadium
  { lat: 31.797805, lng: 117.22264 }, // Hefei Olympic Sports Center Stadium
  { lat: 39.3436, lng: -76.5831 }, // Hughes Stadium
  { lat: 23.0333, lng: 114.447 }, // Huizhou Olympic Stadium
  { lat: 35.288708333, lng: -2.941027777 }, // Pabelló Javier Imbroda Ortiz
  { lat: 36.1527, lng: -95.9508 }, // Hurricane Soccer & Track Stadium
  { lat: 41.9339, lng: -88.7778 }, // Huskie Stadium
  { lat: 44.631069, lng: -63.579531 }, // Huskies Stadium
  { lat: 29.691567, lng: -95.513356 }, // Husky Field
  { lat: 38.496666666, lng: 125.7575 }, // Hwangju Riverside Stadium
  { lat: 53.4639, lng: -2.19472 }, // Hyde Road
  { lat: 14.945915, lng: 103.103482 }, // Khao Kradong Stadium
  { lat: 24.148642, lng: 120.68875 }, // Taichung Baseball Field
  { lat: 30.197777777, lng: 71.474166666 }, // Ibn-e-Qasim Bagh Stadium
  { lat: 40.116, lng: -88.2285 }, // Illinois Field
  { lat: 41.57222222, lng: 35.91194444 }, // Bafra Stadium
  { lat: 26.115669, lng: 91.760297 }, // Sarusajai Stadium (Guwahati)
  { lat: 41.0723, lng: -81.508 }, // InfoCision Stadium – Summa Field
  { lat: 41.101638888, lng: 29.023277777 }, // ITU Stadium
  { lat: 36.6254, lng: 29.1213 }, // Fethiye District Stadium
  { lat: 16.975134, lng: 99.789532 }, // Institute of Physical Education Sukhothai Stadium
  { lat: 39.4183, lng: 29.9917 }, // Dumlupinar Stadium
  { lat: 38.420138888, lng: -6.408194444 }, // Nou Estadi de Zafra
  { lat: 36.939666669, lng: 34.870055561 }, // Burhanettin Kocamaz Stadium
  { lat: 36.5851, lng: 36.1553 }, // İskenderun 5 Temmuz Stadium
  { lat: 41.659722222, lng: -91.539861111 }, // Iowa Field
  { lat: 35.727222, lng: 51.194167 }, // Iran Khodro Stadium
  { lat: 41.30861111, lng: 36.33555556 }, // İlkadım Athletics Stadium
  { lat: -18.03111111, lng: 178.53555556 }, // Ratu Cakobau Park
  { lat: 39.739072, lng: 141.120887 }, // Iwate Athletic Stadium
  { lat: 33.8203, lng: -85.7664 }, // JSU Stadium
  { lat: 31.873545, lng: -91.134918 }, // Jack Spinks Stadium
  { lat: 3.098708333, lng: 101.593769444 }, // Petaling Jaya Stadium
  { lat: -6.124444444, lng: 106.860277777 }, // Jakarta International Stadium
  { lat: 47.579444444, lng: -122.297777777 }, // Sick's Stadium
  { lat: 42.7849, lng: 18.9517 }, // Stadion Željezare
  { lat: 29.6493, lng: -82.355107 }, // James G. Pressly Stadium
  { lat: 33.7957, lng: -84.2337 }, // James R. Hallford Stadium
  { lat: 6.2568, lng: -75.590172 }, // Estadi Atanasio Girardot
  { lat: 27.528889, lng: -97.88 }, // Javelina Stadium
  { lat: 6.182433, lng: 6.524141 }, // Jay Jay Okocha Stadium
  { lat: 31.632556, lng: -94.664512 }, // Jaycees Field
  { lat: 38.1919, lng: -83.4253 }, // Phil Simms Stadium
  { lat: 33.495722222, lng: 126.514388888 }, // Jeju Baseball Stadium
  { lat: 33.497169, lng: 126.51367 }, // Jeju Sports Complex
  { lat: 41.843055555, lng: 43.388611111 }, // Jemal Zeinklishvili Stadium
  { lat: 35.837807, lng: 127.124679 }, // Jeonju Baseball Stadium
  { lat: 25.372711, lng: 51.469267 }, // Lekhwiya Sports Stadium
  { lat: 31.859306, lng: 35.465389 }, // Jericho International Stadium
  { lat: 40.0124, lng: -83.0276 }, // Jesse Owens Memorial Stadium
  { lat: 28.674444, lng: 116.023333 }, // Jiangxi Olympic Sports Center
  { lat: 31.926232, lng: 120.288276 }, // Jiangyin Sports Centre
  { lat: 30.743226, lng: 120.75648 }, // Jiaxing Stadium
  { lat: 30.786797, lng: 116.577401 }, // Jining Stadium
  { lat: 35.188498, lng: 128.067315 }, // Jinju Public Stadium
  { lat: 35.182943, lng: 128.135836 }, // Jinju Stadium
  { lat: 7.020601, lng: 100.471718 }, // Chira Nakhon Stadium
  { lat: 6.91138889, lng: 122.06222222 }, // Joaquin F. Enriquez Memorial Stadium
  { lat: 32.532222, lng: -92.655833 }, // Joe Aillet Stadium
  { lat: 32.532222, lng: -92.655833 }, // Joe Aillet Stadium
  { lat: 47.705, lng: -117.483 }, // Joe Albi Stadium
  { lat: 40.5212, lng: -80.2163 }, // Joe Walton Stadium
  { lat: 38.345, lng: -97.1986 }, // Joel Wiens Stadium
  { lat: 39.937, lng: -75.6012 }, // Farrell Stadium
  { lat: 37.0738, lng: -76.4961 }, // John B. Todd Stadium
  { lat: 41.1884, lng: -73.2035 }, // John F. Kennedy Stadium
  { lat: 42.681722, lng: -73.825829 }, // John Fallon Field
  { lat: 30.351558, lng: -81.608006 }, // John Sessions Stadium
  { lat: 39.3885, lng: -76.6159 }, // Johnny Unitas Stadium
  { lat: 45.258058, lng: 27.94715 }, // Stadionul Municipal
  { lat: 37.0205, lng: -76.3551 }, // Joseph S. Darling Memorial Stadium
  { lat: 1.338309, lng: 103.694123 }, // Jurong West Stadium
  { lat: 37.465615, lng: 49.455385 }, // Sirous Ghayeghran Arena
  { lat: -25.4649, lng: 31.1819 }, // KaNyamazane Stadium
  { lat: 63.082778, lng: 21.641111 }, // Kaarlen kenttä
  { lat: -25.341, lng: 31.136 }, // Kabokweni Stadium
  { lat: -13.13989, lng: 28.38084 }, // Kafubu Stadium
  { lat: 34.808056, lng: 134.826111 }, // Kakogawa Athletic Stadium
  { lat: 37.02725, lng: 22.124167 }, // Kalamata Municipal Stadium
  { lat: 20.290916666, lng: 85.825 }, // Kalinga Sports Complex, Bhubaneswar
  { lat: 40.7008, lng: -75.2106 }, // Fisher Stadium
  { lat: 42.241014, lng: -71.810667 }, // Fitton Field
  { lat: 58.40416667, lng: 15.63166667 }, // Folkungavallen
  { lat: 36.8889, lng: -76.3049 }, // Kornblau Field at S.B. Ballard Stadium
  { lat: 48.3867, lng: -89.2636 }, // Fort William Stadium
  { lat: 51.5587, lng: 0.7212 }, // Fossetts Farm Stadium
  { lat: 51.5587, lng: 0.7212 }, // Fossetts Farm Stadium
  { lat: 50.510642, lng: 13.646883 }, // Fotbalový stadion Josefa Masopusta
  { lat: 33.987611, lng: 35.638643 }, // Fouad Chehab Stadium
  { lat: 33.208333, lng: -97.157778 }, // Fouts Field
  { lat: -2.1353, lng: -79.5901 }, // Estadio Los Chirijos
  { lat: 46.2758, lng: -119.286 }, // Fran Rish Stadium
  { lat: 38.5021, lng: -0.239586 }, // Estadi Nou Pla
  { lat: 39.95, lng: -75.19 }, // Franklin Field
  { lat: -33.53361, lng: -56.90103 }, // Q5494193
  { lat: 62.245018, lng: -6.814399 }, // Í Fløtugerði
  { lat: 25.130122222, lng: 56.343480555 }, // Estadi Fujairah Club
  { lat: 34.440833, lng: 133.395278 }, // Fukuyama Takegahana Stadium
  { lat: 29.701548, lng: 107.387012 }, // Fuling Stadium
  { lat: 41.042472, lng: 19.752772 }, // Fusha Sportive Peqin
  { lat: 26.11362, lng: 119.298883 }, // Fujian Provincial Sports Centre Stadium
  { lat: 38.096319, lng: 23.651244 }, // Fyli Municipal Stadium
  { lat: 17.446241, lng: 78.344214 }, // G. M. C. Balayogi Athletic Stadium
  { lat: 17.446783, lng: 78.344697 }, // G. M. C. Balayogi Athletic Stadium
  { lat: 26.375278, lng: -80.100278 }, // FAU Stadium
  { lat: 32.859722, lng: 13.136944 }, // GMR Stadium
  { lat: 24.660278, lng: 46.726111 }, // GPYW Indoor Stadium
  { lat: 37.980941666, lng: 126.561083333 }, // Kaesong Youth Stadium
  { lat: 54.9938, lng: -3.26174 }, // Galabank
  { lat: 29.8083, lng: -95.1764 }, // Galena Park ISD Stadium
  { lat: 51.28, lng: 0.515833 }, // Gallagher Stadium
  { lat: 40.706111111, lng: 46.361944444 }, // Ganja City Stadium
  { lat: -12.79138889, lng: 28.21972222 }, // Garden Park
  { lat: 55.7153, lng: 21.4044 }, // Gargždai Stadium
  { lat: 36.434, lng: -77.0985 }, // Garrison Stadium
  { lat: 54.958483, lng: -1.605875 }, // Gateshead F.C. new stadium
  { lat: 30.324166666, lng: -81.636944444 }, // Gator Bowl Stadium
  { lat: 30.324166666, lng: -81.636944444 }, // Gator Bowl Stadium
  { lat: 30.324166666, lng: -81.636944444 }, // Gator Bowl Stadium
  { lat: 30.324166666, lng: -81.636944444 }, // Gator Bowl Stadium
  { lat: 30.324166666, lng: -81.636944444 }, // Gator Bowl Stadium
  { lat: 30.324166666, lng: -81.636944444 }, // Gator Bowl Stadium
  { lat: 29.4675, lng: -98.4701 }, // Gayle and Tom Benson Stadium
  { lat: -6.958611, lng: 107.711389 }, // Gelora Bandung Lautan Api Stadium
  { lat: -6.583517, lng: 110.66369 }, // Gelora Bumi Kartini Stadium
  { lat: -33.914, lng: 25.56 }, // Gelvandale Stadium
  { lat: 38.8337, lng: -77.3166 }, // George Mason Stadium
  { lat: 6.80821, lng: -58.14893 }, // Georgetown Football Stadium
  { lat: 38.028156, lng: 23.741033 }, // Georgios Kamaras Stadium
  { lat: -25.296375, lng: -57.647675 }, // Q5549081
  { lat: 46.2666, lng: -119.172 }, // Gesa Stadium
  { lat: 31.320278, lng: 48.669167 }, // Ghadir Stadium
  { lat: -34.5589, lng: -58.443 }, // Excursionistas Stadium
  { lat: 34.9618, lng: -81.9329 }, // Gibbs Stadium
  { lat: 35.440376, lng: 136.762919 }, // Gifu Prefectural Baseball Stadium
  { lat: -23.32222222, lng: 30.71888889 }, // Giyani Stadium
  { lat: 41.6569, lng: -83.6136 }, // Glass Bowl
  { lat: 37.859275, lng: 23.755333 }, // Glyfada Indoor Hall
  { lat: 10.970043, lng: 106.672 }, // Go Dau Stadium
  { lat: 49.191, lng: -2.1 }, // Springfield Stadium
  { lat: 42.112718, lng: -72.513384 }, // Golden Bear Stadium
  { lat: 34.2533, lng: -92.0211 }, // Golden Lion Stadium
  { lat: 40.5889, lng: -75.3553 }, // Goodman Stadium
  { lat: 33.41566667, lng: -111.93413333 }, // Goodwin Stadium
  { lat: 34.6893, lng: -79.2049 }, // Grace P. Johnson Stadium
  { lat: 43.030388888, lng: 19.742416666 }, // Gradski stadion
  { lat: 45.142222222, lng: 17.256388888 }, // Gradski stadion
  { lat: 44.411214, lng: 17.084974 }, // Gradski stadion Luke
  { lat: 41.7428, lng: 22.1906 }, // Estadi Gradski Štip
  { lat: 36.34489, lng: -88.861091 }, // Graham Stadium
  { lat: 36.693784, lng: 3.122006 }, // Nelson Mandela Stadium
  { lat: 31.9884, lng: -102.1522 }, // Astound Broadband Stadium
  { lat: 26.482184, lng: 80.347878 }, // Green Park Stadium
  { lat: 38.9175, lng: -77.020277777 }, // Griffith Stadium
  { lat: 52.127, lng: -106.63 }, // Griffiths Stadium
  { lat: 37.9601, lng: 23.7151 }, // Municipal Stadium of Kallithea 'Grigoris Lambrakis'
  { lat: -37.198299, lng: 174.908411 }, // Navigation Homes Stadium
  { lat: 32.130248, lng: 34.858986 }, // Grundman Stadium
  { lat: 22.767, lng: 108.388 }, // Guangxi Sports Center
  { lat: 26.56511, lng: 106.696644 }, // Guizhou Provincial Stadium
  { lat: 31.313056, lng: 75.581389 }, // Guru Gobind Singh Stadium
  { lat: 30.910961, lng: 75.845082 }, // Guru Nanak Stadium
  { lat: -0.676904, lng: 34.769298 }, // Gusii Stadium
  { lat: 33.64504, lng: -95.53068 }, // H. L. 'Hub' Hollis Field
  { lat: -25.708056, lng: 28.338889 }, // HM Pitje Stadium
  { lat: 32.078819, lng: 34.8107 }, // HaMakhtesh Stadium
  { lat: 32.533180555, lng: 35.155788888 }, // HaShalom Stadium
  { lat: -33.6062, lng: -70.5722 }, // Q5638927
  { lat: 20.036083, lng: 110.314187 }, // Haikou City Stadium
  { lat: 39.965597222, lng: -4.821888888 }, // Estadi El Prado
  { lat: -2.25883, lng: -79.8985 }, // Estadio Alejandro Ponce Noboa
  { lat: 25.8532, lng: 119.609 }, // Haixia Olympic Center Stadium
  { lat: -34.7587, lng: -58.1971 }, // Estadio Norman Lee
  { lat: 33.584506, lng: 130.465717 }, // Hakatanomori Athletic Stadium
  { lat: 59.122671, lng: 11.374369 }, // Halden Stadion
  { lat: 35.11724, lng: 36.76216 }, // Hama Municipal Stadium
  { lat: 39.919597222, lng: 127.538858333 }, // Hamhung Stadium
  { lat: 10.9634168, lng: -74.7830892 }, // Estadio Moderno Julio Torres
  { lat: 38.378611111, lng: -0.486944444 }, // Estadi Alacant CF
  { lat: -33.346111, lng: 115.642778 }, // Hands Oval
  { lat: 2.289080555, lng: 102.233094444 }, // Hang Jebat Stadium
  { lat: 0.526656, lng: 101.452728 }, // Hang Tuah Stadium
  { lat: 40.4684, lng: -90.6842 }, // Hanson Field
  { lat: -5.700905, lng: -78.807464 }, // Q5653937
  { lat: 45.752066, lng: 126.701074 }, // Harbin Sports City Center Stadium
  { lat: 34.4204, lng: -119.854 }, // Harder Stadium
  { lat: 45.528779, lng: -122.973361 }, // Hare Field
  { lat: 38.7866, lng: -90.5019 }, // Hunter Stadium
  { lat: 58.4325, lng: -3.092778 }, // Harmsworth Park
  { lat: -29.617388, lng: 30.385641 }, // Harry Gwala Stadium
  { lat: -23.472289, lng: -57.266008 }, // Q5673723
  { lat: 38.940556, lng: -95.230278 }, // Haskell Memorial Stadium
  { lat: 32.049986, lng: 34.786956 }, // Hatikva Neighborhood Stadium
  { lat: -25.263291, lng: -57.518724 }, // Q5685464
  { lat: 21.4925, lng: -104.801 }, // Estadio Arena Cora
  { lat: 31.875833, lng: -91.138333 }, // Henderson Stadium
  { lat: 26.88825, lng: 112.676916666 }, // Hengyang Stadium
  { lat: 35.907336, lng: -79.042597 }, // Henry Stadium
  { lat: 32.66754, lng: -97.283099 }, // Herman Clark Stadium
  { lat: 29.536862, lng: -98.397826 }, // Heroes Stadium
  { lat: 29.536862, lng: -98.397826 }, // Heroes Stadium
  { lat: 39.976944444, lng: -0.043333333 }, // Camp del Sequiol
  { lat: 39.86972222, lng: 48.06 }, // Heydar Aliyev Stadium
  { lat: 40.436111, lng: -80.009444 }, // Highmark Stadium
  { lat: 45.554569, lng: -122.906628 }, // Hillsboro Stadium
  { lat: 53.5025, lng: -2.5225 }, // Hilton Park
  { lat: 37.66692, lng: -1.70361 }, // Q5805617
  { lat: 39.813055555, lng: -0.23 }, // Estadi José Mangriñán
  { lat: -31.7192, lng: -61.0928 }, // Q5847720
  { lat: -25.300953, lng: -57.545432 }, // Q5847727
  { lat: -25.276676, lng: -57.520382 }, // Q5847733
  { lat: -33.679033, lng: -70.9863753 }, // Q5847764
  { lat: 40.39692222, lng: -3.73565278 }, // Antiguo canódromo de Carabanchel
  { lat: -26.190696227, lng: -58.195889728 }, // Q5847768
  { lat: 9.280111111, lng: -75.410172222 }, // Q5847777
  { lat: -24.18898, lng: -56.592048 }, // Q5847781
  { lat: -34.7907, lng: -54.9008 }, // Estadio Ateniense
  { lat: -33.605318, lng: -70.871729 }, // Q5847785
  { lat: 9.030676566, lng: -79.498604857 }, // Q5847796
  { lat: -28.4466, lng: -65.7538 }, // Estadio Bicentenario Ciudad de Catamarca
  { lat: 3.258583333, lng: -76.55025 }, // Q5847814
  { lat: -32.9203, lng: -68.8394 }, // Q5847850
  { lat: 2.45444, lng: -76.5917 }, // Estadio Ciro López
  { lat: -34.6898, lng: -58.6869 }, // Estadio Ciudad de Libertad
  { lat: -33.1153, lng: -64.3478 }, // City of Río Cuarto Stadium
  { lat: -51.62911, lng: -69.22681 }, // Estadio Ciudad del Centenario
  { lat: -38.93673, lng: -69.22112 }, // Q5847880
  { lat: -25.32474, lng: -57.581915 }, // Estadio Dr. Ruben Ramirez
  { lat: 43.38444444, lng: -5.66022222 }, // Estadio El Bayu
  { lat: -0.329136, lng: -78.4451 }, // Q5847915
  { lat: 37.9217, lng: -1.19333 }, // Q5847924
  { lat: -36.7226, lng: -73.1072 }, // Estadio El Morro
  { lat: 37.4043, lng: -1.59004 }, // Estadio El Rubial
  { lat: -25.457718, lng: -56.026646 }, // Q5847942
  { lat: -33.4716, lng: -70.6752 }, // Q5847946
  { lat: -25.297015, lng: -57.639012 }, // Flaviano Díaz Stadium
  { lat: -25.7609333, lng: -57.235052 }, // Q5847952
  { lat: 3.52638889, lng: -76.30638889 }, // Estadio Francisco Rivera Escobar
  { lat: -24.798165979, lng: -65.40748289 }, // Fray Honorato Pistoia Stadium
  { lat: -34.69313889, lng: -58.38638889 }, // Estadio Gildo Francisco Ghersinich
  { lat: 25.582361111, lng: -108.478472222 }, // Guasave 89
  { lat: -15.502666666, lng: -70.123333333 }, // Estadio Guillermo Briceño Rosamedina
  { lat: -27.356202, lng: -55.860319 }, // Hugo Stroessner Stadium
  { lat: -12.784679, lng: -74.967996 }, // Estadio IPD de Huancavelica
  { lat: -33.0336, lng: -71.3719 }, // Q5848017
  { lat: -18.052611, lng: -70.246345 }, // Estadio Joel Gutiérrez
  { lat: 44.2276, lng: -76.5158 }, // Richardson Memorial Stadium
  { lat: 13.4208, lng: -6.29167 }, // Estadi Amari Daou
  { lat: -29.310975, lng: 27.501339 }, // Setsoto Stadium
  { lat: 0.34720833, lng: 32.65888889 }, // Estadi Nacional Mandela
  { lat: 32.363317, lng: 15.045969 }, // Misurata Stadium
  { lat: 29.091111111, lng: 48.078333333 }, // Al-Ahmadi Stadium
  { lat: 5.411698, lng: 100.314505 }, // City Stadium
  { lat: 23.387654872, lng: 113.214260461 }, // Huadu Sports Centre
  { lat: 30.5927, lng: 32.2925 }, // Suez Canal Stadium
  { lat: 36.6812, lng: -4.45875 }, // Ciudad de Málaga Stadium
  { lat: 36.1391, lng: -5.44833 }, // El Mirador
  { lat: 32.083333, lng: 20.266667 }, // Martyrs of February Stadium
  { lat: 26.3789, lng: 43.9478 }, // King Abdullah Sport City Stadium
  { lat: 33.501944, lng: 36.253889 }, // Al-Jalaa Stadium
  { lat: 30.0622, lng: 31.2028 }, // Mit Okba Stadium
  { lat: 33.344244, lng: 44.368173 }, // Al-Zawraa Stadium
  { lat: 33.328019237, lng: 44.424366039 }, // Al Jaish Stadium
  { lat: 27.50398, lng: 41.697589 }, // Prince Abdulaziz bin Musa'ed Sports City
  { lat: 32.099916666, lng: 36.112952777 }, // Prince Mohammed Stadium
  { lat: 18.223043, lng: 42.490069 }, // Prince Mohammed bin Abdul Aziz Stadium
  { lat: 26.25777778, lng: 50.62777778 }, // Al Muharraq Stadium
  { lat: 18.472852, lng: -77.631283 }, // Trelawny Stadium
  { lat: 32.753889, lng: 12.739167 }, // Zaawia Stadium
  { lat: 52.124, lng: 26.1284 }, // Q4123576
  { lat: 49.969924, lng: 82.586921 }, // Vostok Stadium
  { lat: 51.785063888, lng: 55.221080555 }, // Gazovik Stadium
  { lat: 37.5359, lng: -5.07806 }, // Estadi San Pablo
  { lat: 49.946, lng: 36.1812 }, // Nova Bavaria Stadium
  { lat: 57.1617, lng: 65.5139 }, // Geolog Stadium
  { lat: 41.096389, lng: 44.648611 }, // Alaverdi City Stadium
  { lat: 56.847, lng: 60.5978 }, // Sports palace Jekaterinburg
  { lat: 47.85444, lng: 106.78417 }, // Buyant Ukhaa Sport Palace
  { lat: 60.0017, lng: 30.4 }, // Zenit (sports palace)
  { lat: 59.2138, lng: 39.885 }, // Dinamo stadium (Vologda)
  { lat: 53.336028, lng: 83.793358 }, // Dynamo Stadium
  { lat: 53.244986, lng: 34.359617 }, // Dynamo Stadium
  { lat: 54.7186, lng: 55.9387 }, // Dynamo Stadium
  { lat: 45.0424, lng: 41.97 }, // Dynamo Stadium
  { lat: 56.6411, lng: 47.8747 }, // Q4168742
  { lat: 40.602777777, lng: 47.161388888 }, // Yevlakh City Stadium
  { lat: 45.019716, lng: 78.365103 }, // Zhetysu Stadium
  { lat: 3.564722, lng: 98.695556 }, // Teladan Stadium
  { lat: 1.3044065, lng: 103.8742626 }, // National Stadium
  { lat: 0.48363, lng: 101.38962 }, // Riau Main Stadium
  { lat: 36.1033, lng: 120.44 }, // Qingdao Conson Stadium
  { lat: 55.73207778, lng: 52.41781944 }, // KAMAZ Stadium
  { lat: 45.0136, lng: 34.0608 }, // KT Sport Arena
  { lat: 49.7908, lng: 73.1361 }, // Karagandy Arena
  { lat: -7.71953, lng: 110.359 }, // Tridadi Stadium
  { lat: -0.929444, lng: 100.358333 }, // Haji Agus Salim Sport Complex
  { lat: -7.148188, lng: 111.900886 }, // Letjen Haji Sudirman Stadium
  { lat: 43.692297, lng: 40.324845 }, // Complex d'esquí i biatló Laura
  { lat: 49.566667, lng: 22.75 }, // Lafort Arena
  { lat: 37.766944444, lng: -122.456111111 }, // Kezar Stadium
  { lat: 0.57261, lng: 101.430684 }, // Kaharudin Nasution Rumbai Stadium
  { lat: 49.243333, lng: 28.489722 }, // Central City Stadium, Vynnytsia
  { lat: 51.539215, lng: 45.998533 }, // Lokomotiv Stadium
  { lat: 1.316847, lng: 124.91371 }, // Maesa Stadium
  { lat: -4.099473, lng: 138.948319 }, // Pendidikan Stadium
  { lat: -6.595651, lng: 110.65979 }, // Kamal Djunaedi Stadium
  { lat: -1.243852, lng: 116.830137 }, // Persiba Stadium
  { lat: 54.351111, lng: -7.633889 }, // Brewster Park
  { lat: 34.261632, lng: 133.78592 }, // Kagawa Marugame Stadium
  { lat: 52.6017, lng: 39.5897 }, // Q4291573
  { lat: 55.588333, lng: 38.124722 }, // Meteor Stadium
  { lat: 55.7915, lng: 49.2274 }, // Q4295536
  { lat: 55.7915, lng: 49.2274 }, // Q4295536
  { lat: 29.0636, lng: -111.052 }, // Estadio Sonora
  { lat: 54.7083, lng: 25.2578 }, // Lithuania National Stadium
  { lat: 55.6334, lng: 51.8025 }, // Neftekhimik Stadium
  { lat: -16.711111, lng: -49.261389 }, // Estádio da Serrinha
  { lat: -29.682, lng: -51.053 }, // Estádio Sady Arnildo Schmidt
  { lat: -7.22777778, lng: -35.89472222 }, // Estádio Presidente Vargas
  { lat: -9.6378, lng: -35.747708 }, // Estádio Mutange
  { lat: 22.2498, lng: 114.172 }, // Aberdeen Sports Ground
  { lat: -22.298611, lng: -42.541389 }, // Estádio Eduardo Guinle
  { lat: -27.062783, lng: -49.520703 }, // Estádio da Baixada
  { lat: -27.062783, lng: -49.520703 }, // Estádio da Baixada
  { lat: -21.202964, lng: -41.889081 }, // Estádio Jair Bittencourt
  { lat: 42.86, lng: 25.319722 }, // Hristo Botev Stadium
  { lat: -23.163706, lng: -45.88995 }, // Estádio ADC Parahyba
  { lat: 43.276667, lng: 26.944167 }, // Panayot Volov Stadium
  { lat: 48.7346, lng: 44.5481 }, // Volgograd Arena
  { lat: 38.969603899, lng: 117.074194786 }, // Tianjin Tuanbo Football Stadium
  { lat: 39.904774, lng: 116.195376 }, // Shijingshan Stadium
  { lat: 52.43722, lng: 104.335 }, // Rekord Stadium
  { lat: 55.903, lng: 37.459 }, // Rodina Stadium
  { lat: 55.998333333, lng: 92.884722222 }, // Central Stadium
  { lat: -10.926667, lng: -37.049167 }, // Batistão
  { lat: 50.602689, lng: 36.579206 }, // Salyut Stadium
  { lat: 44.6026, lng: 33.542 }, // Sevastopol Sports Complex
  { lat: 53.641672, lng: 55.976225 }, // Sodovik Stadium
  { lat: 55.8097, lng: 37.7131 }, // Spartakovets Stadium
  { lat: 50.4149, lng: 80.2412 }, // Spartak
  { lat: 53.500016, lng: 49.391086 }, // Stadium of Anatoly Stepanov
  { lat: 56.3375, lng: 43.963333333 }, // Estadi de Nijni Nóvgorod
  { lat: 47.801261, lng: 35.193328 }, // JSC ZAZ Stadium
  { lat: 54.698055555, lng: 20.533888888 }, // Estadi de Kaliningrad
  { lat: 53.277534, lng: 50.23769 }, // Estadi de Samara
  { lat: 47.20833333, lng: 39.74166667 }, // Rostov Arena
  { lat: 29.756944444, lng: -95.355555555 }, // Daikin Park
  { lat: 30.502313, lng: 114.166253 }, // Wuhan Sports Center
  { lat: 32.707333, lng: -117.156944 }, // Petco Park
  { lat: 37.94303333, lng: 23.709225 }, // Estadi de Nea Smirni
  { lat: -34.635375, lng: -58.520711 }, // Estadi José Amalfitani
  { lat: 27.325281, lng: -80.404494 }, // First Data Field
  { lat: 9.581944, lng: 41.858056 }, // Estadi de Dire Dawa
  { lat: 30.438055555, lng: -84.304444444 }, // Doak Campbell Stadium
  { lat: 40.441666666, lng: -79.99 }, // Mellon Arena
  { lat: 60.495, lng: 15.434166666 }, // Domnarvsvallen
  { lat: 8.477585, lng: 4.545364 }, // Kwara State Stadium
  { lat: -29.965278, lng: -71.338333 }, // Estadio Francisco Sánchez Rumoroso
  { lat: 46.49234, lng: 11.345385 }, // Stadio Druso
  { lat: 12.16407248, lng: 6.66845441 }, // Sardauna Memorial Stadium
  { lat: 32.645561, lng: -16.928331 }, // Estádio dos Barreiros
  { lat: 62.506388888, lng: 17.349166666 }, // SCA Arena
  { lat: 3.058969444, lng: 101.693597222 }, // Malaysia National Hockey Stadium
  { lat: 53.399722222, lng: -2.166388888 }, // Edgeley Park
  { lat: 38.632777777, lng: -90.188611111 }, // The Dome at America's Center
  { lat: 30.2683, lng: 120.129 }, // Huanglong Sports Center
  { lat: 27.719567, lng: 85.282564 }, // Halchowk Stadium
  { lat: 38.935833, lng: -92.333056 }, // Faurot Field
  { lat: 38.319167, lng: 140.881944 }, // Yurtec Stadium Sendai
  { lat: 47.7982, lng: 10.9301 }, // Q1320570
  { lat: 39.90984, lng: 116.27474 }, // Palau d'esports de Wukesong
  { lat: 47.168056, lng: 20.199722 }, // Tiszaligeti Stadion
  { lat: 11.84611111, lng: 13.14583333 }, // El-Kanemi Stadium
  { lat: 57.718888888, lng: 11.930833333 }, // Rambergsvallen
  { lat: 38.708806, lng: -9.260833 }, // Estádio Nacional
  { lat: 40.601389, lng: 49.674722 }, // Estadi Mehdi Huseynzade
  { lat: 52.2081, lng: 5.996367 }, // Omnisport Apeldoorn
  { lat: 48.696, lng: 6.21222 }, // Estadi Marcel Picot
  { lat: -5.82681, lng: -35.21236 }, // Arena das Dunas
  { lat: 50.080336111, lng: 14.387861111 }, // Great Strahov Stadium
  { lat: 15.301944, lng: -61.384167 }, // Windsor Park
  { lat: 18.34462778, lng: -64.92754444 }, // Lionel Roberts Park
  { lat: 12.131667, lng: -86.285 }, // Estadio Olímpico del IND Managua
  { lat: 9.54575, lng: 138.16641667 }, // Yap Sports Complex
  { lat: 47.438055, lng: 9.396388 }, // Espenmoos
  { lat: 47.4381, lng: 9.39639 }, // Espenmoos
  { lat: -8.040555555, lng: -35.008333333 }, // Estadi Itaipava Arena Pernambuco
  { lat: 34.440778, lng: 132.39425 }, // Hiroshima Big Arch
  { lat: 25.778056, lng: -80.219722 }, // Marlins Park
  { lat: 26.078825, lng: -98.312292 }, // Estadio Adolfo López Mateos
  { lat: -31.663217, lng: -60.725394 }, // Estadi Brigadier General Estanislao López
  { lat: -34.91375, lng: -57.989028 }, // Estadi Único Diego Armando Maradona
  { lat: -31.3866205, lng: -57.9359638 }, // Estadio Ernesto Dickinson
  { lat: 18.416666666, lng: -66.073055555 }, // Estadi Hiram Bithorn
  { lat: 34.725217, lng: 137.875006 }, // Yamaha Stadium
  { lat: -38.017944, lng: -57.582333 }, // Estadi José María Minella
  { lat: -36.755556, lng: -73.107222 }, // Estadio Las Higueras
  { lat: 23.118333, lng: -82.376111 }, // Estadio Latinoamericano
  { lat: 17.07, lng: -96.713 }, // Eduardo Vasconcelos Stadium
  { lat: -25.3485, lng: -57.59308333 }, // Estadio Luciano Zacarías
  { lat: 26.906914, lng: -101.444117 }, // Estadio De Béisbol Monclova
  { lat: 28.625833, lng: -106.022222 }, // Estadio Chihuahua
  { lat: -26.812778, lng: -65.199167 }, // Estadio Monumental José Fierro
  { lat: -37.00777778, lng: -73.17027778 }, // Estadio Federico Schwager
  { lat: -37.00777778, lng: -73.17027778 }, // Estadio Federico Schwager
  { lat: 19.40764085, lng: -99.09493893 }, // Municipal Stadium
  { lat: -33.696944, lng: -71.216667 }, // Estadio Municipal Roberto Bravo Santibáñez
  { lat: 27.480278, lng: -99.591944 }, // Estadio Nuevo Laredo
  { lat: 31.75305, lng: -106.467814 }, // Estadio Olímpico Benito Juárez
  { lat: 10.491278, lng: -66.885492 }, // Estadi Olímpic de la UCV
  { lat: 23.10733056, lng: -82.41283889 }, // Estadio Pedro Marrero
  { lat: 8.3125, lng: -62.696667 }, // Estadi Poliesportiu Cachamay
  { lat: -33.02227778, lng: -71.64 }, // Estadi Elías Figueroa Brander
  { lat: 7.787166666, lng: -72.197944444 }, // Estadi Polideportivo de Pueblo Nuevo
  { lat: -38.38116667, lng: -60.2635 }, // Estadio Roberto Lorenzo Bottino
  { lat: -33.395944, lng: -70.500656 }, // Claro Arena
  { lat: 20.6845, lng: -101.3563 }, // Estadi Sergio León Chávez
  { lat: 25.65225, lng: -100.286417 }, // Estadi Tecnológico
  { lat: 40.65944444, lng: -7.90083333 }, // Estádio do Fontelo
  { lat: -31.611946, lng: -68.527479 }, // Estadio San Juan del Bicentenario
  { lat: 38.6575, lng: -9.053611111 }, // Estádio Alfredo da Silva
  { lat: -8.062888888, lng: -34.902888888 }, // Estadi Adelmar da Costa Carvalho
  { lat: -18.913889, lng: -48.2325 }, // Estadi Municipal Parque do Sabiá
  { lat: 38.70965278, lng: -9.18087778 }, // Estádio da Tapadinha
  { lat: 38.53138889, lng: -8.89111111 }, // Estádio do Bonfim
  { lat: 38.702778, lng: -9.207778 }, // Estádio do Restelo
  { lat: -37.825278, lng: 144.983889 }, // Melbourne Rectangular Stadium
  { lat: 18.061944, lng: 102.703889 }, // New Laos National Stadium
  { lat: 18.06194444, lng: 102.70388889 }, // New Laos National Stadium
  { lat: 42.094722, lng: 42.047778 }, // Evgrapi Shevardnadze Stadium
  { lat: 53.5346, lng: 8.095 }, // Nordfrost-Arena
  { lat: 25.7525, lng: -80.377778 }, // Pitbull Stadium
  { lat: 49.69433, lng: 4.93834 }, // Stade Louis Dugauguez
  { lat: 15.28972222, lng: 73.9625 }, // Fatorda Stadium
  { lat: -0.534444444, lng: 166.911944444 }, // Linkbelt Oval
  { lat: 44.854444444, lng: -93.241944444 }, // Metropolitan Stadium
  { lat: 61.4659, lng: -6.83651 }, // Á Eiðinum
  { lat: 55.881556, lng: -4.269639 }, // Estadi Firhill
  { lat: 61.4925, lng: 23.764167 }, // Estadi Ratina
  { lat: 56.69070278, lng: 16.31523333 }, // Guldfågeln Arena
  { lat: 44.455931, lng: 26.056831 }, // Stadionul Giulești-Valentin Stănescu
  { lat: 51.372238888, lng: 7.478072222 }, // Ischelandstadion
  { lat: -36.918333333, lng: 174.8125 }, // Mount Smart Stadium
  { lat: 13.16333333, lng: 100.94083333 }, // Princess Sirindhorn Stadium
  { lat: 36.172582, lng: 44.011483 }, // Estadi Franso Hariri
  { lat: 47.90214444, lng: 106.91625 }, // National Sports Stadium
  { lat: 6.58638889, lng: 79.96305556 }, // Kalutara Stadium
  { lat: -6.09607, lng: 106.722125 }, // Kamal Muara Stadium
  { lat: 31.564553, lng: 130.557953 }, // Kamoike Ballpark
  { lat: 41.384722, lng: 19.761389 }, // Kamëz Stadium
  { lat: 36.596194444, lng: 136.657361111 }, // Kanazawa Soccer Stadium
  { lat: 14.049855, lng: 99.502743055 }, // Kanchanaburi Stadium
  { lat: 12.968819, lng: 77.591308 }, // Kanteerava Indoor Stadium
  { lat: 61.124, lng: 10.49 }, // Kanthaugen Freestyle Arena
  { lat: 35.677975, lng: 51.281428 }, // Karegaran Stadium
  { lat: 42.008119, lng: 44.104567 }, // Kartli Stadium
  { lat: 36.457262, lng: 140.538343 }, // Kasamatsu Stadium
  { lat: 14.021246, lng: 99.984243 }, // Kasetsat Kamphengsaen University Stadium
  { lat: 35.897802, lng: 139.936252 }, // Kashiwanoha Park Stadium
  { lat: 41.365504, lng: 33.767113 }, // Kastamonu Gazi Stadium
  { lat: 29.638478, lng: -82.364929 }, // Katie Seashole Pressly Softball Stadium
  { lat: 60.993611, lng: 24.441944 }, // Kaurialan kenttä
  { lat: 48.7428, lng: 21.9083 }, // Zemplin Stadium
  { lat: 48.7428, lng: 21.9083 }, // Zemplin Stadium
  { lat: 48.750061111, lng: 21.936230555 }, // Zemplin Stadium
  { lat: 48.750061111, lng: 21.936230555 }, // Zemplin Stadium
  { lat: 35.929167, lng: 139.529722 }, // Kawagoe Sports Park Athletic Stadium
  { lat: 35.527083, lng: 139.709722 }, // Kawasaki Stadium
  { lat: 39.911, lng: 41.238 }, // Kazım Karabekir Stadium
  { lat: 22.80574722, lng: 86.19137778 }, // Keenan Stadium
  { lat: 45.3886, lng: -75.6942 }, // TAGG Park
  { lat: 43.5775, lng: -84.770833 }, // Kelly/Shorts Stadium
  { lat: 7.87676, lng: -11.1842 }, // Kenema Town Field
  { lat: 34.028938888, lng: -84.567611111 }, // Fifth Third Stadium
  { lat: 34.028938888, lng: -84.567611111 }, // Fifth Third Stadium
  { lat: 40.918889, lng: -73.124167 }, // Kenneth P. LaValle Stadium
  { lat: 16.412716944, lng: 102.82816 }, // Khon Kaen Stadium
  { lat: 36.2117, lng: -81.6856 }, // Kidd Brewer Stadium
  { lat: 35.011944, lng: -101.916667 }, // Kimbrough Memorial Stadium
  { lat: 40.683333333, lng: 129.196666666 }, // Kimchaek Municipal Stadium
  { lat: 34.166667, lng: 135.190833 }, // Kimiidera Athletic Stadium
  { lat: 21.435972, lng: 40.480371 }, // King Fahd Sports City
  { lat: -29.971389, lng: 30.9 }, // King Zwelithini Stadium
  { lat: 51.306333, lng: -0.558811 }, // Kingfield Stadium
  { lat: 57.4757, lng: -4.2134 }, // Kingsmills Park
  { lat: 0.525779357, lng: 35.279876716 }, // Kipchoge Keino Stadium
  { lat: 33.207894, lng: 35.575629 }, // Kiryat Shmona Municipal Stadium
  { lat: 39.25804, lng: 141.09608 }, // Kitakami Stadium
  { lat: 1.458653, lng: 124.835764 }, // Klabat Stadium
  { lat: 38.0468, lng: -78.5125 }, // Klöckner Stadium
  { lat: -37.762208, lng: 144.845397 }, // Tompsett Stadium
  { lat: 34.656744, lng: 135.168967 }, // Kobe Central Stadium
  { lat: 33.511111, lng: 133.502778 }, // Kochi Haruno Athletic Stadium
  { lat: 8.649056, lng: -10.971528 }, // Koidu Sports Stadium
  { lat: 44.383863888, lng: 20.266086111 }, // Kolubara Stadium
  { lat: 41.11416667, lng: 25.39666667 }, // Komotini Municipal Stadium
  { lat: 34.698508333, lng: 135.829194444 }, // Kōnoike Athletic Stadium
  { lat: 36.068611, lng: 139.519722 }, // Konosu Stadium
  { lat: -37.838333, lng: 145.031944 }, // Kooyong Stadium
  { lat: 34.37783333, lng: 132.423 }, // Hiroshima Sogo Ground Baseball Park
  { lat: 37.395972, lng: 140.301222 }, // Koriyama West Soccer Stadium
  { lat: 38.261667, lng: 21.745833 }, // Kostas Davourlis Stadium
  { lat: 40.293725, lng: 21.78275556 }, // Kozani Stadium
  { lat: 43.7297, lng: 20.6942 }, // Kraljevo City Stadium
  { lat: 43.7297, lng: 20.6942 }, // Kraljevo City Stadium
  { lat: 36.164, lng: 139.411002 }, // Kumagaya Athletic Stadium
  { lat: 34.988611, lng: 138.430278 }, // Kusanagi Athletic Stadium
  { lat: 34.990629, lng: 138.429065 }, // Kusanagi Stadium
  { lat: 55.2995, lng: 23.9873 }, // Kėdainiai Stadium
  { lat: 37.397694, lng: 140.360417 }, // Kōriyama Kaiseizan Athletic Stadium
  { lat: 32.769022, lng: -97.33675 }, // LaGrave Field
  { lat: -38.216111, lng: 146.428056 }, // LaTrobe City Stadium
  { lat: 13.7062, lng: 100.784 }, // Lad Krabang 54 Stadium
  { lat: 44.8067, lng: 15.864 }, // Stadion pod Borićima
  { lat: -3.00651, lng: 120.193878 }, // Lagaligo Stadium
  { lat: 28.095, lng: -81.822222 }, // Lake Myrtle Sports Complex
  { lat: -4.90194444, lng: 29.66194444 }, // Lake Tanganyika Stadium
  { lat: 43.6389, lng: -79.4231 }, // Lamport Stadium
  { lat: 39.65889, lng: 66.94833 }, // Langari Langarieva Stadium
  { lat: 37.915917, lng: 69.800944 }, // Langari Langarieva Stadium
  { lat: 27.5583, lng: -99.4527 }, // Laredo Energy Arena
  { lat: 52.5115, lng: -3.32288 }, // Latham Park
  { lat: -12.978819444, lng: -38.504252777 }, // Itaipava Arena Fonte Nova
  { lat: 41.64248, lng: 19.711672 }, // Stadiumi Laçi
  { lat: 41.075, lng: -81.4994 }, // League Park
  { lat: 38.2903, lng: -86.9451 }, // League Stadium
  { lat: -24.3143, lng: 29.4904 }, // Lebowakgomo Stadium
  { lat: 53.491, lng: -2.529 }, // Leigh Sports Village
  { lat: 6.208611, lng: -1.677222 }, // Estadi Len Clay
  { lat: 41.7184, lng: -73.934 }, // Leonidoff Field
  { lat: 55.8256, lng: -4.25547 }, // Lesser Hampden
  { lat: 32.181115, lng: 34.927071 }, // Levita Stadium
  { lat: 38.866389, lng: -99.339167 }, // Lewis Field
  { lat: 35.8489, lng: -90.6672 }, // Centennial Bank Stadium
  { lat: 51.5903, lng: -3.81889 }, // Lido Ground
  { lat: 29.65, lng: -82.356667 }, // Linder Stadium at Ring Tennis Complex
  { lat: 38.5825, lng: -97.6708 }, // Lindstrom Field
  { lat: 56.7139, lng: -2.45908 }, // Links Park
  { lat: 32.0438, lng: 34.76146944 }, // Gaon Stadium
  { lat: 31.416, lng: 34.5885 }, // Netivot Municipal Stadium
  { lat: 19.956944, lng: 99.874722 }, // United Stadium of Chiangrai
  { lat: 32.7656, lng: 35.0541 }, // Nesher Municipal Stadium
  { lat: 14.000623, lng: 100.67921 }, // BG Stadium
  { lat: 41.1095, lng: -80.6493 }, // Stambaugh Stadium
  { lat: 33.4986, lng: -80.8446 }, // Oliver C. Dawson Stadium
  { lat: 38.067403, lng: 46.301515 }, // Takhti Stadium (Tabriz)
  { lat: 42.773611111, lng: -78.786944444 }, // Highmark Stadium
  { lat: 15.598392, lng: 32.515603 }, // Estadi de Khartum
  { lat: 11.999722, lng: 8.529167 }, // Estadi Sani Abacha
  { lat: 55.697777777, lng: 13.179722222 }, // Sparbanken Skåne Arena
  { lat: 4.825, lng: 7.02194 }, // Estadi Yakubu Gowon
  { lat: 54.493136, lng: 18.531214 }, // Stadion Miejski
  { lat: 31.513333, lng: 74.333333 }, // Gaddafi Stadium
  { lat: 35.205833333, lng: -97.4425 }, // Gaylord Family Oklahoma Memorial Stadium
  { lat: -8.557944, lng: 125.580611 }, // National Stadium
  { lat: 53.1275, lng: 18.024167 }, // Polonia Bydgoszcz Stadium
  { lat: 8.479556, lng: -13.249056 }, // Estadi Nacional de Sierra Leone
  { lat: 50.805833, lng: 12.934722 }, // Sportforum Chemnitz
  { lat: 3.725, lng: 8.769167 }, // Estadio de Malabo
  { lat: 40.5829, lng: -111.893 }, // Rio Tinto Stadium
  { lat: 41.983019, lng: 44.103828 }, // Estadi Tenguiz Burdjanadze
  { lat: 34.518611111, lng: 69.193888888 }, // Ghazi Stadium
  { lat: 42.255141666, lng: 42.683086111 }, // Estadi Ramaz Shengelia
  { lat: 41.313056, lng: -72.960556 }, // Yale Bowl
  { lat: 41.709617, lng: 44.746247 }, // Estadi Mikheil Meskhi
  { lat: 29.942778, lng: -90.1175 }, // Tulane Stadium
  { lat: 7.207222, lng: 100.598611 }, // Tinsulanonda Stadium
  { lat: 52.674167, lng: -8.6425 }, // Thomond Park
  { lat: 6.866799, lng: 3.002312 }, // Ilaro Stadium
  { lat: 12.06, lng: -61.75361111 }, // Kirani James Athletic Stadium
  { lat: 39.906666666, lng: -75.171111111 }, // Veterans Stadium
  { lat: -17.5339, lng: -149.552 }, // Stade Hamuta
  { lat: -17.533895, lng: -149.551628 }, // Stade Hamuta
  { lat: 51.446091666, lng: 7.360266666 }, // Wullen Stadium
  { lat: 31.296538888, lng: 120.573083333 }, // Suzhou Sports Center
  { lat: 26.153594, lng: 50.543664 }, // Bahrain National Stadium
  { lat: 33.585555555, lng: 35.384722222 }, // Saida Municipal Stadium
  { lat: 4.174083333, lng: 73.513083333 }, // Galolhu National Stadium
  { lat: 4.1684, lng: 73.5368 }, // Galolhu National Stadium
  { lat: 4.93358, lng: -52.31175 }, // Stade de Baduel
  { lat: 18.02872222, lng: -63.06669444 }, // Raoul Illidge Sports Complex
  { lat: 18.02875, lng: -63.06666667 }, // Raoul Illidge Sports Complex
  { lat: 51.765, lng: 19.511667 }, // Estadi Widzew Łódź
  { lat: 49.89422, lng: 2.2633 }, // Estadi de la Licorne
  { lat: -22.60763611, lng: 17.090975 }, // Hage Geingob Rugby Stadium
  { lat: 44.0423, lng: -123.071 }, // Hayward Field
  { lat: 59.187558701, lng: 17.570436431 }, // Södertälje fotbollsarena
  { lat: 59.187558701, lng: 17.570436431 }, // Södertälje fotbollsarena
  { lat: 30.427213888, lng: -9.540425 }, // Estadi Adrar
  { lat: 54.508425, lng: -1.534394 }, // The Darlington Arena
  { lat: 56.879722222, lng: 14.776388888 }, // Spiris Arena
  { lat: 54.8972, lng: 23.9369 }, // Estadi Darius i Girėnas
  { lat: 9.951389, lng: 8.866389 }, // Rwang Pam Stadium
  { lat: -3.383333, lng: 29.373778 }, // Estadi Prince Louis Rwagasore
  { lat: 42.366389, lng: -71.127222 }, // Harvard Stadium
  { lat: 50.795576, lng: 6.094255 }, // Hauptstadion
  { lat: -12.2201, lng: -76.9349 }, // Hugo Sotil Stadium
  { lat: 30.411944, lng: -91.185556 }, // Tiger Stadium
  { lat: -22.65328, lng: 14.53802 }, // Q1609455
  { lat: 51.884166666, lng: -0.431666666 }, // Kenilworth Road
  { lat: 1.434591, lng: 103.780788 }, // Woodlands Stadium
  { lat: 29.416944444, lng: -98.478888888 }, // Alamodome
  { lat: 29.416944444, lng: -98.478888888 }, // Alamodome
  { lat: 53.279, lng: -9.0397 }, // Dexcom Stadium
  { lat: 35.906944, lng: -79.047778 }, // Kenan Memorial Stadium
  { lat: 60.608888888, lng: 16.773055555 }, // Jernvallen
  { lat: 39.982222, lng: 116.393056 }, // National Olympic Sports Centre Stadium
  { lat: 39.095444444, lng: -84.516038888 }, // Paycor Stadium
  { lat: 29.721944444, lng: -95.349166666 }, // Robertson Stadium
  { lat: -9.46694444, lng: 147.15666667 }, // Sir Hubert Murray Stadium
  { lat: 32.751388888, lng: -97.082777777 }, // Choctaw Stadium
  { lat: 64.180833, lng: -51.7325 }, // Nuuk Stadium
  { lat: 12.15274444, lng: -68.88754722 }, // Estadi Ergilio Hato
  { lat: -14.333611, lng: -170.722222 }, // Veterans Memorial Stadium
  { lat: 7.3432, lng: 134.4726 }, // National Stadium
  { lat: 45.680278, lng: 12.213333 }, // Stadio di Monigo
  { lat: 41.114086, lng: -85.118992 }, // Memorial Stadium
  { lat: 42.265833333, lng: -83.748611111 }, // Michigan Stadium
  { lat: 17.29861111, lng: -62.72194444 }, // Warner Park Sporting Complex
  { lat: 49.80118333, lng: 73.08466944 }, // Ak Zholtaj Ice Palace
  { lat: -17.8214, lng: 30.9947 }, // Estadi Nacional de Zimbàbue
  { lat: 49.807778, lng: -97.143056 }, // Princess Auto Stadium
  { lat: 51.716419, lng: -1.208067 }, // Kassam Stadium
  { lat: 22.154523, lng: 113.553266 }, // Estádio Campo Desportivo
  { lat: -26.573611, lng: 18.124444 }, // J. Stephanus Stadium
  { lat: -12.36055556, lng: 27.82416667 }, // Estadi Konkola
  { lat: -15.41666667, lng: 28.28333333 }, // Sunset Stadium
  { lat: 21.372777777, lng: -157.93 }, // Aloha Stadium
  { lat: -22.931964, lng: 14.528641 }, // Kuisebmund Stadium
  { lat: 51.016111111, lng: 3.734166666 }, // Ghelamco Arena
  { lat: 46.136967, lng: 14.602343 }, // Domžale Sports Park
  { lat: -28.066944, lng: 153.378889 }, // Robina Stadium
  { lat: 48.7727, lng: 12.87 }, // Karl-Weinberger-Stadion
  { lat: 17.717777777, lng: -64.8825 }, // Paul E. Joseph Stadium
  { lat: 39.051388888, lng: -94.480555555 }, // Kauffman Stadium
  { lat: -22.54111111, lng: 17.05972222 }, // Khomasdal Stadium
  { lat: 42.331944444, lng: -83.068888888 }, // Tiger Stadium
  { lat: -37.781111, lng: 175.268333 }, // Waikato Stadium
  { lat: 12.3603768, lng: -1.5290332 }, // Estadi Municipal d'Ouagadougou
  { lat: 22.355841, lng: 91.767769 }, // District Stadium, Chattogram
  { lat: 11.239826, lng: -74.195126 }, // Estadio Eduardo Santos
  { lat: 38.83823, lng: 65.81354 }, // Markaziy Stadium
  { lat: 52.670139, lng: -8.654194 }, // Gaelic Grounds
  { lat: 53.325611111, lng: -6.229388888 }, // RDS Arena
  { lat: 53.723336, lng: -6.357222 }, // Hunky Dorys Park
  { lat: 53.723336, lng: -6.357222 }, // Hunky Dorys Park
  { lat: 38.618128, lng: 66.259119 }, // Shurtan Stadium
  { lat: -13.95361111, lng: 33.76972222 }, // Silver Stadium, Lilongwe
  { lat: 40.110525, lng: 124.414083333 }, // Sinuiju Stadium
  { lat: 34.8382, lng: -82.3976 }, // Sirrine Stadium
  { lat: 31.193525, lng: 16.597819 }, // Sirte Stadium
  { lat: 59.186389, lng: 9.595833 }, // Skien Fritidspark
  { lat: 65.59930833, lng: 22.16183333 }, // Skogsvallen
  { lat: 24.334584, lng: 56.743017 }, // Sohar Regional Sports Complex
  { lat: 42.3679, lng: -71.1297 }, // Jordan Field
  { lat: 51.583603, lng: -2.965144 }, // Somerton Park
  { lat: 38.7286, lng: -82.9783 }, // Spartan Municipal Stadium
  { lat: 42.3166, lng: -122.87 }, // Spiegelberg Stadium
  { lat: 49.689739, lng: -112.80545 }, // Spitz Stadium
  { lat: 49.42055556, lng: 26.99555556 }, // Sport Complex Podillia
  { lat: 54.7083, lng: 25.2364 }, // Sportima Arena
  { lat: 47.700361, lng: 8.623139 }, // Sportplatz Bühl
  { lat: 37.5699, lng: -77.4624 }, // Sports Backers Stadium
  { lat: 7.086828, lng: 171.375753 }, // Sports Stadium
  { lat: 12.969556, lng: 77.593469 }, // Estadi Sree Kanteerava
  { lat: 15.101036, lng: 104.340581 }, // Sri Nakhon Lamduan Stadium
  { lat: -33.947222, lng: 151.155 }, // St George Stadium
  { lat: 36.260559071, lng: 6.687453131 }, // Stade Abed Hamdani
  { lat: 35.3619, lng: 1.33117 }, // Stade Ahmed Kaïd
  { lat: 4.04462, lng: 9.69398 }, // Stade Mbappé Léppé
  { lat: 36.83974, lng: 10.18518 }, // Stade Ameur El-Gargouri
  { lat: -20.1875, lng: 57.725278 }, // Stade Auguste Vollaire
  { lat: 12.2481, lng: -2.36667 }, // Stade Balibiè
  { lat: 10.651944, lng: -4.745833 }, // Stade Banfora
  { lat: -4.2075, lng: 12.6856 }, // Stade Paul Sayal Moukila
  { lat: 49.6939, lng: 4.93887 }, // Stade Emile Albeau
  { lat: 36.4793, lng: 2.81107 }, // Stade Frères Brakni
  { lat: 36.4903, lng: 2.84667 }, // Stade Frères Brakni
  { lat: 6.366667, lng: 2.433333 }, // Stade Gbegamey
  { lat: 49.9674, lng: 5.9274 }, // Estadi Geitz
  { lat: -2.59619, lng: 29.7421 }, // Huye Stadium
  { lat: 50.720278, lng: 4.618611 }, // Stade Justin Peeters
  { lat: 50.720278, lng: 4.618611 }, // Stade Justin Peeters
  { lat: 45.6342, lng: -72.9538 }, // Stade L.P. Gaucher
  { lat: 50.608889, lng: 5.946389 }, // Stade Lambert Fourir
  { lat: 0.521216, lng: 25.186576 }, // Stade Lumumba
  { lat: 0.521216, lng: 25.186576 }, // Stade Lumumba
  { lat: 14.7887, lng: -16.9316 }, // Stade Maniang Soumaré
  { lat: 35.9333, lng: 0.083333 }, // Stade Mohamed Bensaïd
  { lat: 49.557211111, lng: 5.856486111 }, // Estadi Municipal de Pétange
  { lat: 9.5509, lng: 1.1906 }, // Stade Municipal
  { lat: 9.551, lng: 1.19057 }, // Stade Municipal
  { lat: 8.9816, lng: 1.14711 }, // Stade Municipal
  { lat: 6.5683, lng: 2.6503 }, // Stade Municipal de Avrankou
  { lat: 5.14167, lng: 10.5347 }, // Stade Municipal de Bangangté
  { lat: 7.1953001, lng: 2.05789995 }, // Stade Municipal de Bohicon
  { lat: 9.7, lng: 1.66667 }, // Stade Municipal de Djougou
  { lat: 33.8658741, lng: 10.1056385 }, // Stade Municipal de Gabès
  { lat: 9.35, lng: 2.61667 }, // Stade Municipal de Parakou
  { lat: 14.72743, lng: -17.28088 }, // Stade Ngalandou Diouf
  { lat: -18.933333, lng: 47.516667 }, // Stade Olympique l'Emyrne
  { lat: 35.2895, lng: -1.14099 }, // Stade Omar Oucief
  { lat: 6.36639, lng: 2.44889 }, // Stade René Pleven d'Akpakpa
  { lat: 11.3128, lng: -12.2705 }, // Stade Régional Saifoullaye Diallo
  { lat: 11.312835, lng: -12.270581944 }, // Stade Régional Saifoullaye Diallo
  { lat: -1.978106, lng: 30.044125 }, // Stade Régional Nyamirambo
  { lat: 33.6041, lng: -7.5049 }, // Stade Sidi Bernoussi
  { lat: -11.678373, lng: 27.489241 }, // Stade TP Mazembe
  { lat: 46.817, lng: 7.154 }, // Stade Universitaire Saint-Léonard
  { lat: 46.6162, lng: 7.0666 }, // Stade de Bouleyres
  { lat: -11.70841667, lng: 43.24805556 }, // Stade de Beaumer
  { lat: 13.50355, lng: 7.0979 }, // Stade de Maradi
  { lat: 15.623611, lng: 32.477222 }, // Stade de Omdurman
  { lat: 46.350567, lng: -72.576297 }, // stade de l’UQTR
  { lat: 12.293611, lng: -1.493056 }, // Stade de l'USFA
  { lat: -2.5174, lng: 28.851 }, // Stade de la Concorde
  { lat: 18.0824, lng: -15.9716 }, // Estadi Cheikha Ould Boïdiya
  { lat: 12.304167, lng: -1.527778 }, // Estadi de la SONABEL
  { lat: -5.8972, lng: 22.3859 }, // Stade des Jeunes
  { lat: 45.19, lng: 9.796944 }, // Stadio Comunale
  { lat: 41.828722, lng: 12.425472 }, // AS Roma Stadium
  { lat: 45.466389, lng: 7.884167 }, // Stadio Gino Pistoni
  { lat: 52.3962, lng: 16.9293 }, // Edmund Szyc Stadium
  { lat: 43.849482, lng: 19.852582 }, // Stadion Krčagovo
  { lat: 44.43134, lng: 20.68714 }, // Stadion Selters
  { lat: 45.289361, lng: 19.82225 }, // Stadion Slana Bara
  { lat: 50.066111, lng: 20.057222 }, // Stadion Suche Stawy
  { lat: 49.212691, lng: 16.611607 }, // Stadion Za Lužánkami
  { lat: 44.5606, lng: 27.3727 }, // Stadionul 1 Mai
  { lat: 47.639274, lng: 26.24626 }, // Stadionul Areni
  { lat: 44.4575, lng: 26.1025 }, // Stadionul Florea Dumitrache
  { lat: 46.1925, lng: 21.3114 }, // Stadionul Francisc von Neumann
  { lat: 46.192575, lng: 21.311442 }, // Stadionul Francisc von Neumann
  { lat: 44.940278, lng: 26.033333 }, // Stadionul Ilie Oană
  { lat: 45.408333, lng: 23.3675 }, // Stadionul Petre Libardi
  { lat: 46.557222, lng: 26.913333 }, // Stadionul Municipal
  { lat: 45.146028, lng: 26.803333 }, // Municipal Stadium in Buzău
  { lat: 45.103056, lng: 24.352222 }, // Stadionul Municipal
  { lat: 44.846675, lng: 24.866422 }, // Stadionul Nicolae Dobrin
  { lat: 45.420722, lng: 28.023681 }, // Nicolae Rainea Stadium
  { lat: 46.77638889, lng: 23.66536111 }, // Stadionul Victoria Someșeni
  { lat: 47.267056, lng: -122.449125 }, // Stadium Bowl
  { lat: 48.119722222, lng: 17.133333333 }, // Stadium FC Petržalka 1898
  { lat: 48.119765, lng: 17.133374 }, // Stadium FC Petržalka 1898
  { lat: 48.8167, lng: 19.535 }, // Stadium Kolkáreň
  { lat: 35.670127, lng: 51.511953 }, // Takhti Stadium (Tehran)
  { lat: 36.3007, lng: 59.59036389 }, // Takhti Stadium (Mashhad)
  { lat: 40.345755, lng: -74.65003 }, // Princeton University Stadium
  { lat: 36.11, lng: -79.5078 }, // Rhodes Stadium
  { lat: 29.4614, lng: 60.8381 }, // Zahedan Stadium
  { lat: 37.20386111, lng: 49.54366667 }, // Sardar Jangal Stadium
  { lat: 36.650556, lng: 51.510278 }, // Shohada Stadium (Nowshahr)
  { lat: 35.48333333, lng: 51.08333333 }, // Shahid Derakhshan Stadium
  { lat: 36.4662, lng: 52.8611 }, // Vatani Stadium
  { lat: 33.874722222, lng: 35.491944444 }, // Safa Stadium
  { lat: 29.291433333, lng: 48.068983333 }, // Mishref Stadium
  { lat: 39.1875, lng: -96.584333 }, // World War I Memorial Stadium
  { lat: 47.622811, lng: -122.349886 }, // Memorial Stadium
  { lat: 39.546944, lng: -119.8175 }, // Mackay Stadium
  { lat: 42.3773, lng: -72.536 }, // Warren McGuirk Alumni Stadium
  { lat: 32.832755, lng: -97.136374 }, // Pennington Field
  { lat: 37.977906, lng: -121.317097 }, // Stagg Memorial Stadium
  { lat: 34.5435, lng: 50.75022 }, // Yadegar-e Emam Stadium (Qom)
  { lat: 27.5552, lng: -99.452 }, // Uni-Trade Stadium
  { lat: 31.6201, lng: 34.7642 }, // Kiryat Gat Municipal Stadium
  { lat: 33.546111, lng: -111.885278 }, // Salt River Fields at Talking Stick
  { lat: 13.9512, lng: 100.625 }, // Thupatemee Stadium
  { lat: 9.134, lng: 99.3473 }, // Surat Thani Stadium
  { lat: 13.411302, lng: 100.993618 }, // Institute of Physical Education Chonburi Campus Stadium
  { lat: 13.745602, lng: 100.527595 }, // Thephasadin Stadium
  { lat: 35.749046, lng: -83.963726 }, // Lloyd L. Thornton Stadium
  { lat: -25.22043611, lng: 25.68933333 }, // Lobatse Stadium
  { lat: 42.9178, lng: -81.2072 }, // London Ice House
  { lat: 40.72083056, lng: 19.55223889 }, // Loni Papuçiu Stadium
  { lat: 40.797222, lng: 44.493889 }, // Lori Stadium
  { lat: 34.783672, lng: -86.578444 }, // Louis Crews Stadium
  { lat: 19.8713, lng: 102.1318 }, // Luang Prabang Stadium
  { lat: 52.408586, lng: 30.949213 }, // Luch Stadium
  { lat: 34.621124, lng: 112.423526 }, // Luoyang Stadium
  { lat: 35.0754, lng: -78.8966 }, // Luther 'Nick' Jeralds Stadium
  { lat: 9.9409, lng: 78.1381 }, // MGR Race Course Stadium
  { lat: 7.1325, lng: 3.35527778 }, // MKO Abiola Stadium
  { lat: 49.99833333, lng: 18.45694444 }, // Estadi MOSiR
  { lat: 22.421111111, lng: 114.2275 }, // Ma On Shan Sports Ground
  { lat: 22.1525, lng: 113.56805556 }, // Macau University of Science and Technology Sports Field
  { lat: -5.82562, lng: -35.2138 }, // Machadão
  { lat: 35.5925, lng: 139.438889 }, // Machida Athletic Stadium
  { lat: 40.1163, lng: -85.6612 }, // Macholtz Stadium
  { lat: 42.2005, lng: -72.6219 }, // Mackenzie Stadium
  { lat: 57.530833, lng: -3.204722 }, // Mackessack Park
  { lat: 36.378361, lng: 139.161889 }, // Maebashi Athletic Stadium
  { lat: 20.1433, lng: 94.9258 }, // Magway Stadium
  { lat: 29.149716, lng: 75.717269 }, // Mahabir Stadium
  { lat: 18.9375, lng: 72.826111 }, // Mahindra Hockey Stadium
  { lat: 40.677778, lng: 22.950278 }, // Makedonikos Stadium
  { lat: 46.8404, lng: 29.5579 }, // Malaya Sportivnaya Arena
  { lat: 55.595, lng: 12.995556 }, // Malmö IP
  { lat: 53.483889, lng: -2.203889 }, // Manchester Regional Arena
  { lat: -33.863485, lng: 150.880362 }, // Marconi Stadium
  { lat: -1.87972222, lng: 136.22777778 }, // Marora Stadium
  { lat: 43.035833333, lng: -87.960833333 }, // Marquette Stadium
  { lat: 31.333047, lng: 45.288852 }, // As Samawah Stadium
  { lat: 37.58833333, lng: 61.84222222 }, // Mary Stadium
  { lat: 35.437139, lng: 133.065972 }, // Matsue Athletic Stadium
  { lat: -3.316666666, lng: 114.58 }, // May 17th Stadium
  { lat: 18.191086, lng: -67.155794 }, // Mayagüez Athletics Stadium
  { lat: 40.9269, lng: -73.7856 }, // Mazzella Field
  { lat: 37.7128, lng: -89.2167 }, // McAndrew Stadium
  { lat: 40.0375, lng: -75.1542 }, // McCarthy Stadium
  { lat: 44.9298, lng: -123.038 }, // McCulloch Stadium
  { lat: 38.373889, lng: -97.642778 }, // McPherson Stadium
  { lat: 55.9569, lng: -3.15861 }, // Meadowbank Stadium
  { lat: 35.678056, lng: 139.714722 }, // Meiji Jingu Gaien Stadium
  { lat: 43.5052, lng: -112.038 }, // Melaleuca Field
  { lat: -37.86, lng: 144.780556 }, // Melbourne Ballpark
  { lat: 59.42083333, lng: 10.67138889 }, // Melløs Stadion
  { lat: -21.57, lng: -45.414167 }, // Melão
  { lat: 43.701111, lng: -72.284167 }, // Memorial Field
  { lat: 35.5866, lng: -82.5479 }, // Memorial Stadium, Asheville
  { lat: 35.407222, lng: -118.969444 }, // Memorial Stadium
  { lat: 41.147905, lng: -81.343535 }, // Memorial Stadium
  { lat: 32.7644, lng: -96.6348 }, // Memorial Stadium
  { lat: 31.9932, lng: -81.0798 }, // Memorial Stadium
  { lat: 47.575825, lng: -52.702175 }, // Memorial Stadium
  { lat: 39.4747, lng: -87.3669 }, // Memorial Stadium
  { lat: 44.975409, lng: -93.228575 }, // Memorial Stadium
  { lat: 33.8542, lng: -98.5825 }, // Memorial Stadium
  { lat: 0.551581, lng: 123.056542 }, // Merdeka Stadium
  { lat: 49.1175, lng: 18.32 }, // Estadi Mestský Púchov
  { lat: 51.0461, lng: -114.092 }, // Mewata Stadium
  { lat: 31.450529, lng: 104.749964 }, // Mianyang Stadium
  { lat: 41.4035, lng: -81.5239 }, // Middlefield Cheese Stadium
  { lat: 32.4658, lng: -96.9848 }, // Midlothian Stadium
  { lat: 41.641388888, lng: 42.989166666 }, // Mikheil Iadze Stadium
  { lat: 40.6135, lng: -79.1623 }, // Miller Stadium
  { lat: 34.707, lng: -86.604 }, // Milton Frank Stadium
  { lat: 29.393611, lng: -98.490556 }, // Mission Stadium
  { lat: 59.92701944, lng: 10.709575 }, // Estadi Frogner
  { lat: 59.295833333, lng: 18.081944444 }, // Söderstadion
  { lat: 58.1475, lng: 8.021389 }, // Kristiansand Stadion
  { lat: 34.682139, lng: 135.080272 }, // Kobe Universiade Memorial Stadium
  { lat: 62.394166666, lng: 17.301111111 }, // NP3 Arena
  { lat: 60.29045, lng: 5.319314 }, // Fana Stadion
  { lat: 60.793, lng: 11.1009 }, // Vikingskipet
  { lat: -13.836756, lng: -171.75195 }, // Estadi Nacional de Futbol de Samoa
  { lat: -17.7339, lng: 168.337 }, // Korman Stadium
  { lat: 57.5959, lng: -4.41891 }, // Victoria Park
  { lat: 39.1218, lng: -94.8237 }, // Q1787141
  { lat: 39.1218, lng: -94.8237 }, // Q1787141
  { lat: 51.117802, lng: 17.096804 }, // Estadi Olímpic de Wrocław
  { lat: 51.119444, lng: 17.096667 }, // Estadi Olímpic de Wrocław
  { lat: 47.4758, lng: 12.6379 }, // Hochfilzen Ski and Biathlon Stadium
  { lat: 59.9204, lng: 10.8061 }, // Vallhall Arena
  { lat: 27.768333333, lng: -82.653333333 }, // Tropicana Field
  { lat: 51.070327777, lng: -114.121388888 }, // McMahon Stadium
  { lat: -33.961944, lng: 18.516667 }, // Athlone Stadium
  { lat: 7.39638889, lng: 3.88583333 }, // Lekan Salami Stadium
  { lat: 21.029722, lng: 105.833056 }, // Hàng Đẫy Stadium
  { lat: 48.56516, lng: -3.16552 }, // Stade du Roudourou
  { lat: 17.069667, lng: -96.713111 }, // Estadio Benito Juárez
  { lat: 7.36611111, lng: 3.87416667 }, // Estadi Obafemi Awolowo
  { lat: 52.5297, lng: 13.5044 }, // Stadium Lichtenberg
  { lat: 47.32616, lng: 5.06757 }, // Stade Gaston Gérard
  { lat: 47.3261, lng: 5.06793 }, // Stade Gaston Gérard
  { lat: 36.747777777, lng: 10.272777777 }, // Estadi Olímpic Hammadi Agrebi
  { lat: 32.1018, lng: 20.0724 }, // Estadi 28 de Març
  { lat: 56.409686, lng: -3.476928 }, // McDiarmid Park
  { lat: 32.294397, lng: 34.864433 }, // Estadi Miriam
  { lat: -33.844444, lng: 151.061944 }, // Sydney SuperDome
  { lat: 45.582778, lng: 9.308056 }, // Stadio Brianteo
  { lat: 34.733611111, lng: 10.746111111 }, // Estadi Taïeb Mhiri
  { lat: 6.757611, lng: -58.177806 }, // Providence Stadium
  { lat: 54.367942, lng: 18.621053 }, // MOSiR Stadium
  { lat: 29.716388888, lng: -95.409166666 }, // Rice Stadium
  { lat: 51.1794, lng: 4.19841 }, // Q1865388
  { lat: 26.193055555, lng: -80.161111111 }, // Lockhart Stadium
  { lat: 38.352178, lng: 38.330494 }, // Malatya İnönü Stadium
  { lat: 49.522158333, lng: 5.875475 }, // Estadi de Thillenberg
  { lat: 35.338056, lng: 25.114722 }, // Estadi Theódoros Vardinogiannis
  { lat: -7.795926, lng: 110.38407 }, // Mandala Krida Stadium
  { lat: 35.350555555, lng: 24.457777777 }, // Gallos Stadium
  { lat: -26.187781, lng: 28.028431 }, // Bidvest Stadium
  { lat: 38.221805555, lng: 21.752188888 }, // Estadi Pampeloponnisiako
  { lat: 39.746111111, lng: -105.021666666 }, // Mile High Stadium
  { lat: 9.621667, lng: 6.549167 }, // Minna Township Stadium
  { lat: -20.45861944, lng: 16.65865278 }, // Mokati Stadium
  { lat: -7.975513, lng: 112.624975 }, // Gajayana Stadium
  { lat: 46.1083, lng: -64.7833 }, // Moncton Stadium
  { lat: 14.501944, lng: -90.557778 }, // Estadio Municipal de San Miguel Petapa
  { lat: 55.57722222, lng: 38.22694444 }, // Saturn Stadium
  { lat: 23.573055555, lng: 58.399444444 }, // Sultan Qaboos Sports Complex
  { lat: 36.85187, lng: 42.996154 }, // Duhok Stadium
  { lat: 56.894297, lng: 60.578786 }, // Uralmash Stadium
  { lat: 53.5044, lng: 49.2669 }, // Torpedo Stadium
  { lat: 43.4052, lng: 39.9492 }, // Sirius Arena
  { lat: 54.535925, lng: -6.003733 }, // New Grosvenor Stadium
  { lat: 35.955, lng: -83.925 }, // Neyland Stadium
  { lat: 46.9714, lng: 31.9604 }, // Mykolaiv Central City Stadium
  { lat: 55.7328, lng: 12.4968 }, // Gladsaxe Stadium
  { lat: 50.845, lng: 3.311111 }, // Forestiersstadion
  { lat: 5.32825, lng: -4.018417 }, // Estadi Félix Houphouët-Boigny
  { lat: 5.32825, lng: -4.018417 }, // Estadi Félix Houphouët-Boigny
  { lat: 24.207291666, lng: 55.766333333 }, // Estadi Khalifa bin Zayed
  { lat: 60.442778, lng: 22.291667 }, // Veritas Stadion
  { lat: 51.8325, lng: 16.585556 }, // Alfred Smoczyk Stadium
  { lat: 52.720833, lng: 15.228056 }, // Edward Jancarz Stadium
  { lat: -6.996667, lng: 107.529722 }, // Si Jalak Harupat Stadium
  { lat: -17.946211, lng: -67.111564 }, // Estadi Jesús Bermúdez
  { lat: -0.177528, lng: -78.476583 }, // Estadi Olímpic Atahualpa
  { lat: 47.4889, lng: 11.0956 }, // Garmisch Olympia Stadium
  { lat: 11.558361, lng: 104.912083 }, // Olympic Stadium
  { lat: 49.852778, lng: 24.013722 }, // Army Sports Club Stadium
  { lat: 46.38194444, lng: 48.05083333 }, // Central Stadium
  { lat: 54.614444, lng: 39.736111 }, // TSK stadion
  { lat: 44.960947, lng: 34.104856 }, // Fiolent Stadium
  { lat: -31.948333333, lng: 115.851944444 }, // Perth Arena
  { lat: 46.468389, lng: 30.748444 }, // Spartak Stadium
  { lat: 48.515833333, lng: 32.266666666 }, // Zirka Stadium
  { lat: 47.120278, lng: 37.515278 }, // Zakhidnyi Stadium
  { lat: 41.639361111, lng: 46.652805555 }, // Zaqatala City Stadium
  { lat: 40.985194444, lng: 47.8425 }, // Estadi Ciutat de Qabala
  { lat: 41.6962, lng: -86.2282 }, // Frank Eck Stadium
  { lat: 10.760703, lng: 106.663331 }, // Thong Nhat Stadium
  { lat: 24.989444444, lng: 55.463055555 }, // The Sevens
  { lat: 51.824, lng: 12.25157 }, // Paul Greifzu Stadium
  { lat: 50.021889, lng: 36.239917 }, // Dynamo Stadium
  { lat: -7.75051, lng: 110.418 }, // Maguwoharjo Stadium
  { lat: 52.04059, lng: 113.4728 }, // Lokomotiv Stadium
  { lat: 50.806111, lng: 4.411667 }, // stade des Trois Tilleuls
  { lat: 48.474167, lng: 38.797778 }, // Stal Stadium
  { lat: 50.298611, lng: 34.889722 }, // Naftovyk Stadium
  { lat: 48.47888889, lng: 135.04638889 }, // Lenin Stadium
  { lat: 42.16084, lng: 42.33064 }, // Erosi Manjgaladze Stadium
  { lat: 32.866692, lng: 35.31085 }, // Doha Stadium
  { lat: 42.6334, lng: -71.2767 }, // Cawley Memorial Stadium
  { lat: 50.768258333, lng: 4.537330555 }, // Q2080116
  { lat: 25.748527777, lng: 55.928113888 }, // Emirates Club Stadium
  { lat: 40.715833, lng: -73.596389 }, // James M. Shuart Stadium
  { lat: -7.225142, lng: 112.621708 }, // Gelora Bung Tomo Stadium
  { lat: -7.225142, lng: 112.621708 }, // Gelora Bung Tomo Stadium
  { lat: 54.9021, lng: -5.01248 }, // Stair Park
  { lat: 56.6522, lng: -2.885 }, // Station Park
  { lat: 57.735724, lng: 12.934921 }, // Ryavallen
  { lat: -4.001025, lng: -79.196536111 }, // Estadio Federativo Reina del Cisne
  { lat: 45.563055555, lng: -73.5525 }, // Stade Saputo
  { lat: 40.492222, lng: 50.138889 }, // Dalga Arena
  { lat: 27.978888888, lng: -82.503611111 }, // Tampa Stadium
  { lat: 51.686944, lng: 5.088611 }, // Sportpark Olympia
  { lat: 50.683795, lng: 4.200436 }, // Stade Leburton
  { lat: 41.505833333, lng: -81.699722222 }, // estadi de Cleveland
  { lat: 33.595556, lng: -7.608333 }, // Stade Larbi Benbarek
  { lat: 50.793333, lng: 4.377778 }, // Stade du Vivier d'Oie
  { lat: -45.869167, lng: 170.524444 }, // Forsyth Barr Stadium
  { lat: 33.344603, lng: 44.438984 }, // Q2117452
  { lat: 14.403611, lng: 33.537778 }, // Estadi de Wad Madani
  { lat: 6.939667, lng: 79.872028 }, // R. Premadasa Stadium
  { lat: 45.184444, lng: 5.7375 }, // Anneau de vitesse de Grenoble
  { lat: -18.9197, lng: 47.5262 }, // Estadi Municipal de Mahamasina
  { lat: -22.59018056, lng: 17.070725 }, // Ramblers Stadium
  { lat: 10.520556, lng: 7.438889 }, // Ranchers Bees Stadium
  { lat: 53.625975, lng: -1.367844 }, // Kinsley Greyhound Stadium
  { lat: 45.3046, lng: -66.0875 }, // Canada Games Stadium
  { lat: 30.41497, lng: -9.5956 }, // Stade Al Inbiaâte
  { lat: 42.728056, lng: -84.484722 }, // Spartan Stadium
  { lat: 37.319722222, lng: -121.868333333 }, // CEFCU Stadium
  { lat: 32.929444, lng: -97.111944 }, // Dragon Stadium, Southlake
  { lat: 50.950278, lng: 4.044444 }, // Estadi Pierre Cornelis
  { lat: -3.743611, lng: -73.252778 }, // Estadio Max Augustín
  { lat: 5.5225, lng: 95.323611 }, // Harapan Bangsa Stadium
  { lat: -25.97452, lng: 32.577955 }, // Maxaquene Stadium
  { lat: 46.765701, lng: 23.564304 }, // Horia Demian Sports Hall
  { lat: 33.949722222, lng: -83.373333333 }, // Sanford Stadium
  { lat: 10.66738611, lng: -61.5237 }, // Queen's Park Oval, Port of Spain
  { lat: 48.792222, lng: 9.231944 }, // Scharrena Stuttgart
  { lat: 45.433876, lng: 11.899481 }, // Stadio Plebiscito
  { lat: 43.404478, lng: 39.949933 }, // Palau de Gel Bolxoi
  { lat: 50.855, lng: 4.310556 }, // Edmond Machtens Stadium
  { lat: -0.5864, lng: 117.13142 }, // Palaran Stadium
  { lat: 50.866494, lng: 3.825914 }, // Stedelijk sportstadion Jules Matthijs
  { lat: -9.44, lng: 147.18361111 }, // Sir John Guise Stadium
  { lat: -22.936861, lng: -43.184472 }, // Estádio das Laranjeiras
  { lat: 4.929028, lng: 114.945444 }, // Hassanal Bolkiah National Stadium
  { lat: 45.187474, lng: 5.740194 }, // Stade des Alpes
  { lat: 60.673055555, lng: 17.1275 }, // Strömvallen
  { lat: -7.159533, lng: 112.638965 }, // Petrokimia Stadium
  { lat: -17.60666667, lng: 177.45222222 }, // Churchill Park
  { lat: 45.16611, lng: 5.70954 }, // Estadi Lesdiguières
  { lat: 18.06156, lng: -63.09191 }, // Stade Alberic Richards
  { lat: 49.4316, lng: 2.11382 }, // Stade Pierre Brisson
  { lat: 16.26888, lng: -61.50881 }, // Estadi René Serge Nabajoth
  { lat: -13.27938, lng: -176.18632 }, // Stade de Mata Utu
  { lat: 47.4953, lng: 8.74639 }, // Stadion Deutweg
  { lat: 19.61778889, lng: 37.2119 }, // Stade Port Sudan
  { lat: -33.855, lng: 151.068056 }, // Sydney Olympic Park Hockey Centre
  { lat: 37.94935, lng: 58.37021 }, // Estadi Köpetdag
  { lat: 22.560988, lng: 113.876292 }, // Bao'an Sports Center
  { lat: 5.811475, lng: -55.207308 }, // Dr. Ir. Franklin Essed Stadion
  { lat: 37.904425, lng: 58.377086111 }, // Olympic Stadium
  { lat: 45.6641, lng: 6.3709 }, // L'anneau de vitesse
  { lat: 45.926747222, lng: 6.874011111 }, // Estadi Olímpic de Chamonix
  { lat: 48.674722, lng: 33.103611 }, // CSC Nika Stadium
  { lat: -15.83691, lng: -70.022028 }, // Estadio E. Torres Belón
  { lat: -15.83691, lng: -70.022028 }, // Estadio E. Torres Belón
  { lat: 14.474082, lng: 100.086596 }, // Suphanburi Municipality Stadium
  { lat: 12.924339, lng: 100.937163 }, // Nongprue Stadium
  { lat: -33.888056, lng: 151.223333 }, // Sydney Sports Ground
  { lat: 47.0125, lng: 28.83944 }, // Stadionul Republican
  { lat: 51.130792, lng: 4.559594 }, // Lyrastadion
  { lat: 13.976397222, lng: -89.569036111 }, // Estadio Óscar Quiteño
  { lat: 48.93728, lng: 2.05869 }, // Léo-Lagrange stadium
  { lat: -12.975, lng: 28.611389 }, // Levy Mwanawasa Stadium
  { lat: 50.94605, lng: 1.88156 }, // Q2386935
  { lat: 43.4023417, lng: 39.9519528 }, // Shayba Arena
  { lat: 50.754167, lng: 25.3375 }, // Avanhard Stadium
  { lat: 39.9014, lng: -75.1719 }, // John F. Kennedy Stadium
  { lat: -21.14138889, lng: -175.20738889 }, // Teufaiva Sport Stadium
  { lat: -19.578611, lng: -65.761111 }, // Estadi Victor Agustín Ugarte
  { lat: 14.067778, lng: 100.598611 }, // Thammasat Stadium
  { lat: 46.732, lng: -117.16 }, // Martin Stadium
  { lat: 34.0478, lng: -4.99934 }, // Q2410882
  { lat: 3.139086, lng: 101.700581 }, // Stadium Merdeka
  { lat: 40.79330556, lng: -73.92534167 }, // Icahn Stadium
  { lat: 52.682222222, lng: -7.825 }, // Semple Stadium
  { lat: 53.367514, lng: -6.251983 }, // Tolka Park
  { lat: -33.94, lng: 18.87361111 }, // Danie Craven Stadium
  { lat: 8.98777778, lng: -79.53416667 }, // Estadio Javier Cruz
  { lat: 13.725556, lng: 100.5475 }, // Lumpinee Boxing Stadium
  { lat: 53.284658, lng: -9.056258 }, // Eamonn Deacy Park
  { lat: 41.576133, lng: 2.011142 }, // Estadi Olímpic de Terrassa
  { lat: -13.84270833, lng: -171.80330833 }, // Q2439101
  { lat: 53.383436, lng: -2.335158 }, // Moss Lane
  { lat: 52.2114, lng: 0.153 }, // Abbey Stadium
  { lat: 41.486389, lng: -5.748056 }, // Estadi Ruta de la Plata
  { lat: -11.7046, lng: 27.484 }, // Stade Frederic Kibassa Maliba
  { lat: 53.503611, lng: -2.198889 }, // North Road
  { lat: 51.50166667, lng: 31.32722222 }, // Chernihiv Stadium
  { lat: 55.7572, lng: 37.8497 }, // Start
  { lat: 59.85, lng: 17.644444 }, // Studenternas IP
  { lat: 57.0185, lng: 40.9503 }, // Q4453874
  { lat: 58.207, lng: 68.2785 }, // Tobol
  { lat: 56.0828, lng: 63.6281 }, // Q4461291
  { lat: 53.8694, lng: 27.6583 }, // Tarpeda Stadium
  { lat: 52.0101, lng: 47.7643 }, // Trud Stadium
  { lat: 52.2764, lng: 104.282 }, // Trud Stadium
  { lat: 55.4231, lng: 37.5328 }, // Trud Stadium
  { lat: 49.793416666, lng: 30.123583333 }, // Trudovi Reservy Stadium
  { lat: 51.7404, lng: 36.1916 }, // Trudovye Rezervy Stadium
  { lat: 56.849, lng: 53.2316 }, // Q4504243
  { lat: 55.1662, lng: 61.3761 }, // Central Stadium
  { lat: 44.03110833, lng: 43.06414167 }, // Central Stadium
  { lat: 54.1828, lng: 45.2014 }, // Mordovia Arena
  { lat: 44.995944444, lng: 41.116527777 }, // Yunost Stadium
  { lat: 45.5978, lng: 34.2254 }, // Yunist Stadium, Kalinine
  { lat: 61.787, lng: 34.3764 }, // Yunost
  { lat: 50.487487, lng: 19.432551 }, // 1000th-Anniversary of Polish State Stadium
  { lat: 57.67777778, lng: 11.93944444 }, // Slottsskogsvallen
  { lat: 40.292222, lng: 69.614167 }, // 20 Years of Independence Stadium
  { lat: 30.0199, lng: 31.3737 }, // Estadi 30 Juny
  { lat: 32.8883, lng: 13.1652 }, // Estadi 7 d'Octubre
  { lat: 36.0043, lng: -80.0308 }, // A.J. Simeon Stadium
  { lat: 54.5756, lng: 23.3675 }, // ARVI Football Indoor Arena
  { lat: 40.4968, lng: 50.1964 }, // AZAL Arena
  { lat: 34.156278, lng: 73.261557 }, // Abbottabad Cricket Stadium
  { lat: 40.707, lng: 72.872 }, // Abdygany Radzhapov Central Stadium
  { lat: 9.043055555, lng: 38.723888888 }, // Abebe Bikila Stadium
  { lat: 6.704, lng: -1.64573 }, // Abrankese Stadium
  { lat: -22.841369, lng: -43.266747 }, // Estádio da Rua Bariri
  { lat: -25.869515, lng: 29.176458 }, // Ackerville Stadium
  { lat: 37.678333, lng: -97.368611 }, // Adair–Austin Stadium
  { lat: 55.937386, lng: -4.171275 }, // Adamslie Park
  { lat: 52.380472222, lng: -2.242652777 }, // Aggborough
  { lat: 38.5417, lng: -121.756 }, // Aggie Field
  { lat: 32.279722, lng: -106.741111 }, // Aggie Memorial Stadium
  { lat: 18.378, lng: -67.197 }, // Aguada Stadium
  { lat: 7.26522222, lng: -2.86536111 }, // Agyeman Badu Stadium
  { lat: 42.685278, lng: 23.368611 }, // Akademik Stadium
  { lat: 39.726081, lng: 140.069592 }, // Akita Prefectural Baseball Stadium
  { lat: 39.720833, lng: 140.095556 }, // Soyu Stadium
  { lat: 36.50377, lng: 40.74105 }, // Hasakah Municipal Stadium
  { lat: 33.528365, lng: 36.298259 }, // Al-Fayhaa Stadium
  { lat: 31.70443333, lng: 35.160675 }, // Al-Khader Stadium
  { lat: 25.33225, lng: 51.494278 }, // Al-Markhiya Stadium
  { lat: 26.095278, lng: 44.048056 }, // Al-Najma Club Stadium
  { lat: 17.082711, lng: 54.143789 }, // Al-Saada Stadium
  { lat: 26.118028, lng: 51.221028 }, // Al-Shamal SC Stadium
  { lat: 17.590278, lng: 44.244722 }, // Estadi de l'Al Okhdood Club
  { lat: 25.860278, lng: 43.502222 }, // Al-Hazem Club Stadium
  { lat: 33.316641, lng: 44.365014 }, // Al Karkh Stadium
  { lat: 33.894444, lng: 35.469444 }, // Al Manara Stadium
  { lat: 29.345, lng: 47.69583333 }, // Al Shabab Mubarak Alaiar Stadium
  { lat: 31.0375, lng: 30.456944 }, // Estadi Ala'ab Damanhūr
  { lat: 29.462764, lng: -98.479031 }, // Alamo Stadium
  { lat: 29.46280493, lng: -98.47786241 }, // Alamo Stadium
  { lat: 37.29116, lng: -76.732957 }, // Martin Family Stadium
  { lat: 35.069494, lng: -106.629535 }, // Albuquerque Sports Stadium
  { lat: 51.264722, lng: -0.755556 }, // Aldershot Military Stadium
  { lat: 36.200833, lng: 37.135556 }, // Aleppo 7 April Stadium
  { lat: 47.916111, lng: -97.090833 }, // Alerus Center
  { lat: 4.640356, lng: -74.086458 }, // Alfonso López Pumarejo Stadium
  { lat: 38.318361, lng: 48.350014 }, // Ali Daei Stadium
  { lat: 42.943069, lng: -78.831007 }, // All-High Stadium
  { lat: 57.1027, lng: -2.0797 }, // Allan Park, Aberdeen
  { lat: 38.1931, lng: -84.8528 }, // Alumni Field
  { lat: 35.6706, lng: -80.4869 }, // Alumni Memorial Stadium
  { lat: 34.871, lng: -82.3625 }, // Alumni Stadium
  { lat: 54.392, lng: 24.0552 }, // Estadi Municipal d'Alytus
  { lat: -6.165944444, lng: 39.223805555 }, // Amaan Stadium
  { lat: 34.730278, lng: 135.421944 }, // Amagasaki Memorial Park Stadium
  { lat: -26.102, lng: 27.778 }, // Amakhosi Stadium
  { lat: 35.206334, lng: -101.799649 }, // Amarillo National Bank Sox Stadium
  { lat: -6.173718, lng: 106.638574 }, // Benteng Stadium
  { lat: 0.7445, lng: 124.3184 }, // Ambang Stadium
  { lat: 35.2182, lng: -80.8283 }, // American Legion Memorial Stadium
  { lat: 33.80972, lng: 35.65528 }, // Amin AbdelNour Stadium
  { lat: 42.400277777, lng: 41.558055555 }, // Ganmukhuri Central Stadium
  { lat: 40.43694444, lng: 49.95388889 }, // Ismat Gayibov Stadium
  { lat: 42.816944, lng: -75.5452 }, // Crown Field at Andy Kerr Stadium
  { lat: 55.98333333, lng: 37.22444444 }, // Angstrem Stadium
  { lat: 33.65, lng: -117.850833 }, // Anteater Stadium
  { lat: 40.82861111, lng: 140.77777778 }, // Aomori Stadium
  { lat: 46.5348, lng: 12.1369 }, // Estadi Apollonio
  { lat: 49.8865, lng: -119.458 }, // Apple Bowl
  { lat: 37.975410374, lng: -87.531645811 }, // Arad McCutchan Stadium
  { lat: -31.734167, lng: 115.763056 }, // Arena Joondalup
  { lat: 37.0205, lng: -76.3335 }, // Armstrong Stadium
  { lat: 33.589556, lng: 73.054331 }, // Army Stadium, Rawalpindi
  { lat: 43.1359, lng: -80.2775 }, // Arnold Anderson Stadium at Cockshutt Park
  { lat: -12.84388889, lng: 28.23277778 }, // Arthur Davies Stadium
  { lat: 40.4356, lng: -79.99 }, // Rooney Athletic Field
  { lat: 38.3697, lng: -75.5294 }, // Arthur W. Perdue Stadium
  { lat: 41.6951, lng: -72.7616 }, // Arute Field
  { lat: 27.189167, lng: 31.176389 }, // Asiut University Stadium
  { lat: -7.026052, lng: 110.409524 }, // Jatidiri Stadium
  { lat: -6.910312, lng: 107.619367 }, // Siliwangi Stadium
  { lat: 33.58740278, lng: 130.3828028 }, // Heiwadai Athletic Stadium
  { lat: 37.93879722, lng: 139.355475 }, // Green Stadium Shibata
  { lat: 43.05272222, lng: 141.3041389 }, // Maruyama Track & Field Stadium
  { lat: 35.46999722, lng: 139.6015444 }, // Mitsuzawa Park Main Stadium
  { lat: 36.345278, lng: 140.412222 }, // K's denki Stadium Mito
  { lat: 29.3457, lng: 105.933 }, // Yongchuan Sports Center
  { lat: 29.3457, lng: 105.933 }, // Yongchuan Sports Center
  { lat: 29.3458, lng: 105.934 }, // Yongchuan Sports Center
  { lat: 29.3458, lng: 105.934 }, // Yongchuan Sports Center
  { lat: 39.64791389, lng: 141.1375056 }, // Iwagin Stadium
  { lat: 35.36166667, lng: 139.4763889 }, // Kanagawa Prefectural Sports Centre Stadium
  { lat: 36.0534, lng: 136.185 }, // Fukui Prefectural Athletic Stadium
  { lat: 39.62388889, lng: 140.2061111 }, // Akita Prefectural Central Park Athletic Stadium
  { lat: 34.88146944, lng: 138.2327639 }, // Fujieda Soccer Stadium
  { lat: 36.3448, lng: 139.461 }, // Ashikaga Athletic stadium
  { lat: 40.80656111, lng: 140.7075889 }, // Aomori Stadium
  { lat: 31.564831, lng: 130.560186 }, // Kagoshima Kamoike Stadium
  { lat: 14.6299, lng: 121.023201 }, // Amoranto Sports Complex
  { lat: 37.9459, lng: 58.3438 }, // Nisa-Çandybil Stadium
  { lat: 62.0998, lng: -6.73617 }, // Lilit Svangaskarð
  { lat: -21.1415, lng: -175.207 }, // Mangweni Stadium
  { lat: 45.5371, lng: 13.6653 }, // Izola City Stadium
  { lat: 45.5371, lng: 13.6653 }, // Izola City Stadium
  { lat: 45.537125, lng: 13.665311 }, // Izola City Stadium
  { lat: 45.537125, lng: 13.665311 }, // Izola City Stadium
  { lat: 50.6828, lng: 21.7372 }, // Q11780236
  { lat: 50.7767, lng: 19.1592 }, // Stadion Miejski
  { lat: 26.860806, lng: 89.385833 }, // PSA Phuentsholing Stadium
  { lat: -17.545602, lng: -149.580125 }, // Q11836154
  { lat: 52.2928, lng: 21.1219 }, // Dolcan Arena
  { lat: 50.8957, lng: 4.33408 }, // Q11836159
  { lat: 51.12, lng: 15.299166666 }, // Q11836160
  { lat: 63.0846, lng: 21.6215 }, // Hietalahti baseball stadium
  { lat: 64.2125, lng: 27.7156 }, // Kajaanin jäähalli
  { lat: 22.588694, lng: 113.08382 }, // Jiangmen Stadium
  { lat: 62.721111111, lng: 29.816111111 }, // Kontiolahti Biathlon Stadium
  { lat: 62.602659, lng: 29.740868 }, // Kerubi Stadion
  { lat: 60.63861111, lng: 24.86666667 }, // Pihkala baseball stadium
  { lat: 64.693194444, lng: 24.561805555 }, // MiiluAreena
  { lat: -41.320278, lng: 174.7825 }, // Newtown Park
  { lat: 59.871461, lng: 10.819172 }, // Lambertseter Stadion
  { lat: 56.02824444, lng: -3.81465833 }, // Ochilview Park
  { lat: 42.4836, lng: 26.4939 }, // Q12007864
  { lat: 4.6075, lng: 101.1 }, // Azlan Shah Stadium
  { lat: 49.402, lng: 15.5735 }, // Stadion v Jiráskově ulici
  { lat: 48.7189, lng: 37.5493 }, // Prapor Stadium
  { lat: 23.033349, lng: 113.108255 }, // New Plaza Stadium
  { lat: 23.0312, lng: 113.113 }, // New Plaza Stadium
  { lat: 48.73218, lng: 2.29627 }, // Stade Jules-Ladoumègue
  { lat: 51.663469, lng: -3.797161 }, // The Gnoll
  { lat: 53.224167, lng: -4.131389 }, // Farrar Road Stadium
  { lat: 47.993611111, lng: 33.435833333 }, // Hirnyk Stadium, Kryvyi Rih
  { lat: 48.0819, lng: 39.6461 }, // Mykola Horiushkin Stadium
  { lat: 34.71638889, lng: 36.68888889 }, // Bassel al-Assad Stadium (Homs)
  { lat: -29.174167, lng: 26.233611 }, // Seisa Ramabodu Stadium
  { lat: 43.0526, lng: -2.1726 }, // Altamira Municipal Stadium
  { lat: 43.9939, lng: 22.7769 }, // Q12276294
  { lat: 41.64111, lng: 25.37806 }, // Arena Arda
  { lat: 42.5003, lng: 26.0158 }, // Q12280264
  { lat: 43.3439, lng: 26.2353 }, // Q12294980
  { lat: 43.7789, lng: 23.7356 }, // Q12298238
  { lat: 22.276, lng: 113.531 }, // Centre Esportiu de Zhuhai
  { lat: 37.412735668, lng: -4.505059288 }, // Q12388103
  { lat: -6.73141, lng: 108.534482 }, // Bima Stadium
  { lat: -3.436583333, lng: 114.876777777 }, // Demang Lehman Stadium
  { lat: -8.602550684, lng: 116.151229496 }, // Gelora 17 December Stadium
  { lat: -0.453234, lng: 117.156131 }, // Madya Sempaja Stadium
  { lat: -6.577165, lng: 106.797661 }, // Pajajaran Stadium
  { lat: 37.465679, lng: 126.64342 }, // Sungui Sports Complex
  { lat: 47.3744, lng: 28.8192 }, // C.E. Districte d'Orhei
  { lat: 44.336667, lng: 23.801667 }, // Stadionul CFR
  { lat: 45.1825, lng: 28.779722 }, // Stadionul Delta
  { lat: 27.55, lng: 90.7333 }, // Q12872496
  { lat: 39.1516, lng: 20.9843 }, // Arta Stadium
  { lat: 39.552089, lng: 21.777019 }, // Trikala Municipal Stadium
  { lat: 37.968679, lng: 23.673745 }, // Pavelló Melina Merkouri
  { lat: 42.006575, lng: 21.46137 }, // Avtokomanda Stadium
  { lat: 33.55, lng: 68.4333 }, // Q12912307
  { lat: 13.884131, lng: 100.57698 }, // TOT Stadium Chaeng Watthana
  { lat: 43.54725, lng: -6.723083333 }, // Q13146861
  { lat: 39.097819, lng: 26.554267 }, // Mytilene Municipal Stadium
  { lat: -0.681639, lng: 100.778594 }, // Ombilin Stadium
  { lat: 45.8035, lng: 15.1585 }, // Portoval Stadium
  { lat: 51.22744, lng: 5.39839 }, // Q13571331
  { lat: 24.8982, lng: 91.8636 }, // Sylhet District Stadium
  { lat: 24.005777, lng: 121.585436 }, // Hualien Baseball Stadium
  { lat: -6.176683, lng: 106.827834 }, // Ikada Stadium
  { lat: 44.0644, lng: -123.1454 }, // Bethel Park
  { lat: 44.0644, lng: -123.1454 }, // Bethel Park
  { lat: 51.6026, lng: -0.291785 }, // The Hive Stadium
  { lat: 62.7977, lng: 22.8884 }, // Skaala Arena
  { lat: -15.7835, lng: -47.89916389 }, // Estádio Mané Garrincha
  { lat: 47.0814, lng: 29.1083 }, // Stadionul CPSM
  { lat: 33.1965, lng: -87.5868 }, // Stillman Stadium
  { lat: 33.4381, lng: -111.83 }, // HoHoKam Stadium
  { lat: 39.6992, lng: -104.935 }, // Infinity Park
  { lat: 39.6617, lng: -75.7488 }, // Delaware Stadium
  { lat: 40.5119, lng: -88.9967 }, // Hancock Stadium
  { lat: 38.2181, lng: -98.2089 }, // Smisor Stadium
  { lat: 30.1733, lng: -93.21 }, // Cowboy Stadium
  { lat: 48.0883, lng: 19.6133 }, // Stadium Liptovský Mikuláš
  { lat: -21.163611, lng: 149.183889 }, // Stadium Mackay
  { lat: 49.2063, lng: 19.2918 }, // Stadium MUDr. Ivan Chodák
  { lat: -46.406944, lng: 168.381111 }, // Stadium Southland
  { lat: 52.7317, lng: 15.2075 }, // Stadium OSiR in Gorzów Wielkopolski
  { lat: 52.8725, lng: 18.682778 }, // Stadium in Aleksandrów Kujawski
  { lat: 39.874361111, lng: 19.995583333 }, // Stadiumi Butrinti
  { lat: 41.7939, lng: -87.6039 }, // Stagg Field
  { lat: 42.105498, lng: -72.553867 }, // Stagg Field
  { lat: 17.141, lng: -61.7948 }, // Coolidge Cricket Ground
  { lat: 46.251731, lng: 14.364914 }, // Stanko Mlakar Stadium
  { lat: 41.6704, lng: -86.2555 }, // Stanley Coveleski Regional Stadium
  { lat: 57.5792, lng: -3.87139 }, // Station Park, Nairn
  { lat: 37.9872, lng: 23.6761 }, // Stavros Mavrothalassitis Stadium
  { lat: 41.191944, lng: -111.94 }, // Stewart Stadium
  { lat: -26.733889, lng: 153.126111 }, // Stockland Park
  { lat: 38.038611, lng: -84.502222 }, // Stoll Field/McLean Stadium
  { lat: 59.2383, lng: 14.4431 }, // Stora Valla
  { lat: 30.510833, lng: -90.468333 }, // Strawberry Stadium
  { lat: 30.0537, lng: -94.0986 }, // Stuart Stadium
  { lat: 40.0812, lng: 20.1381 }, // Subi Bakiri Stadium
  { lat: -29.769444, lng: 30.885556 }, // Sugar Ray Xulu Stadium
  { lat: 29.4685, lng: -98.4708 }, // Sullivan Field
  { lat: 5.3697337, lng: 103.1056112 }, // Sultan Mizan Zainal Abidin Stadium
  { lat: -0.04638889, lng: 109.3375 }, // Sultan Syarif Abdurrahman Stadium
  { lat: 33.425, lng: -111.932 }, // Sun Devil Soccer/Lacrosse Stadium
  { lat: 39.244607, lng: 125.866062 }, // Sunan Stadium
  { lat: 26.7777, lng: -80.0848 }, // Suncoast Stadium
  { lat: 22.5277, lng: 59.4735 }, // Sur Sports Complex
  { lat: 31.343056, lng: 75.5575 }, // Surjit Hockey Stadium
  { lat: 51.6078, lng: -1.79227 }, // Swindon Stadium
  { lat: -33.850278, lng: 151.064167 }, // Sydney Olympic Park Athletic Centre
  { lat: -33.876978, lng: 151.230274 }, // Sydney Stadium
  { lat: 32.707777777, lng: -97.3675 }, // TCU Diamond
  { lat: 41.267, lng: -95.932 }, // Charles Schwab Field Omaha
  { lat: 48.4333, lng: 19.55 }, // TJ Baník Stadium
  { lat: -39.066389, lng: 174.081944 }, // TSB Stadium
  { lat: 29.989444, lng: -90.099444 }, // Tad Gormley Stadium
  { lat: 35.4958, lng: -97.5669 }, // Taft Stadium
  { lat: 36.204569, lng: 117.063311 }, // Tai'an Sports Center Stadium
  { lat: 23.321111, lng: 120.313889 }, // Tainan County Stadium
  { lat: 27.219234, lng: 56.343936 }, // Khalij-e Fars Stadium
  { lat: 51.5939, lng: -3.77595 }, // Talbot Athletic Ground
  { lat: 24.9936, lng: 121.324 }, // Taoyuan City Stadium
  { lat: -21.4006, lng: -48.4934 }, // Taquarão
  { lat: 28.442222, lng: 77.036389 }, // Tau Devi Lal Stadium
  { lat: 20.7783, lng: 97.0378 }, // Taunggyi Stadium
  { lat: 37.9687, lng: 23.6886 }, // Tavros Stadium
  { lat: 54.7197, lng: -5.80028 }, // Taylors Avenue
  { lat: 36.187611, lng: 136.131333 }, // Technoport Fukui Stadium
  { lat: 36.8842, lng: -76.3012 }, // Ted Constant Convocation Center
  { lat: 32.0276, lng: -81.0687 }, // Ted Wright Stadium
  { lat: -20.797222, lng: -49.358889 }, // Teixeirão
  { lat: 57.4819, lng: -4.2468 }, // Telford Street Park
  { lat: 3.446222222, lng: 102.422638888 }, // Temerloh Mini Stadium
  { lat: 40.076, lng: -75.1661 }, // Temple Stadium
  { lat: 42.280555555, lng: 43.271944444 }, // Temur Maghradze Stadium
  { lat: 35.115, lng: 117.1771 }, // Tengzhou Olympic Center Stadium
  { lat: 19.799141, lng: 105.772746 }, // Thanh Hoa Stadium
  { lat: 50.700667, lng: -2.445556 }, // The Avenue Stadium
  { lat: 49.485, lng: -2.546 }, // The Corbet Field
  { lat: 37.571806, lng: -77.463733 }, // The Diamond
  { lat: 50.869019, lng: 0.012275 }, // The Dripping Pan
  { lat: 57.536389, lng: -2.467222 }, // The Haughs
  { lat: 53.716111, lng: -1.859167 }, // The Shay
  { lat: 49.48194444, lng: -2.54111111 }, // The Track
  { lat: 32.824583, lng: 35.06075 }, // Thomas D'Alesandro Stadium
  { lat: 38.9786, lng: -76.4831 }, // Thompson Stadium
  { lat: 38.0781, lng: -97.3439 }, // Thresher Stadium
  { lat: 49.2544, lng: -123.245 }, // Thunderbird Stadium
  { lat: 39.1693, lng: 117.204 }, // Tianjin Locomotive Stadium
  { lat: 32.0864, lng: -96.5158 }, // Tiger Stadium
  { lat: 15.400575, lng: 73.815114 }, // Tilak Maidan Stadium
  { lat: 44.023611, lng: -88.563056 }, // Titan Stadium
  { lat: 1.3304, lng: 103.853 }, // Toa Payoh Stadium
  { lat: 36.556667, lng: 139.986667 }, // Tochigi Green Stadium
  { lat: 40.3281, lng: 36.556 }, // Tokat Gaziosmanpaşa Stadium
  { lat: 35.62675, lng: 139.875244 }, // Tokyo Bay NK Hall
  { lat: 40.04, lng: -75.1565 }, // Tom Gola Arena
  { lat: 8.6125, lng: -11.041611 }, // Tongo Field
  { lat: 53.883237, lng: 30.414626 }, // Torpedo Stadium
  { lat: 35.499806, lng: 134.18375 }, // Tottori Athletics Stadium
  { lat: 35.458333, lng: 134.221667 }, // Tottori Bank Bird Stadium
  { lat: -19.250556, lng: 146.8275 }, // Townsville Entertainment and Convention Centre
  { lat: 36.625056, lng: 137.195688 }, // Toyama Athletic Stadium
  { lat: 35.133889, lng: 137.188611 }, // Toyota Athletic Stadium
  { lat: 29.538908, lng: -98.394617 }, // Toyota Field
  { lat: 4.931228, lng: 114.9470584 }, // Track and Field Sports Complex, Bandar Seri Begawan
  { lat: 41.36111, lng: 69.39472 }, // Traktor Tashkent Stadium
  { lat: 39.785, lng: -84.1996 }, // Triangle Park
  { lat: 41.3892, lng: 23.1994 }, // Tsar Samuil Stadium
  { lat: 37.831, lng: 68.7773 }, // Tsentralnyi Stadium
  { lat: 38.713611, lng: 139.815 }, // Tsuruoka Komagihara Stadium
  { lat: 2.726359, lng: 101.982672 }, // Tuanku Abdul Rahman Stadium
  { lat: 36.178085, lng: -85.506169 }, // Tucker Stadium
  { lat: -0.278886, lng: -78.546197 }, // Estadio Gonzalo Pozo Ripalda
  { lat: 43.3246, lng: 45.6899 }, // Sultan Bilimkhanov Stadium
  { lat: 45.8981, lng: 28.1892 }, // Stadionul Raional Atlant
  { lat: 45.8981, lng: 28.1892 }, // Stadionul Raional Atlant
  { lat: 18.415711111, lng: -66.075502777 }, // Roberto Clemente Coliseum
  { lat: 53.2835, lng: -6.37374 }, // Estadi Tallaght
  { lat: 46.069129987, lng: 14.508604587 }, // Estadi Centralni Bežigrad
  { lat: 50.985, lng: 5.0606 }, // Q2497832
  { lat: 48.623611, lng: 22.276389 }, // Avanhard Stadium, Uzhhorod
  { lat: 40.149373, lng: 44.476449 }, // Mika Stadium
  { lat: 36.646667, lng: 117.005833 }, // Shandong Provincial Stadium
  { lat: 39.207787, lng: 46.400674 }, // Gandzasar Stadium
  { lat: 5.018611, lng: 7.925278 }, // Uyo Township Stadium
  { lat: 49.4361, lng: 32.0547 }, // Cherkasy Arena
  { lat: 50.902222, lng: 34.799722 }, // Yuvileiny Stadium
  { lat: 9.936389, lng: -84.107778 }, // Estadio Nacional de Costa Rica
  { lat: 13.158333, lng: -61.229444 }, // Victoria Park
  { lat: 10.96139, lng: 106.8625 }, // Biên Hòa Stadium
  { lat: 10.9619, lng: 106.863 }, // Biên Hòa Stadium
  { lat: 25.279655555, lng: 55.360605555 }, // Rashid Stadium
  { lat: 43.1192, lng: 131.8788 }, // Dynamo Stadium
  { lat: 44.0436, lng: -121.3 }, // Vince Genna Stadium
  { lat: 64.145683, lng: -21.967728 }, // KR-völlur
  { lat: 35.7862, lng: -78.7551 }, // WakeMed Soccer Park
  { lat: 5.511667, lng: 5.756389 }, // Warri Stadium
  { lat: 34.0429, lng: -118.152 }, // Weingart Stadium
  { lat: -30.061667, lng: -51.227222 }, // Estadi Ildo Meneghetti
  { lat: 40.01555556, lng: 116.37083333 }, // Camp d'Hoquei del Parc Olímpic de Pequín
  { lat: 54.343375, lng: -6.661447 }, // Athletic Grounds
  { lat: 41.5388, lng: -8.4209 }, // Estádio 1º de Maio
  { lat: 37.02277778, lng: -7.92861111 }, // Estádio de São Luís
  { lat: 33.8844, lng: -118.332 }, // Murdock Stadium
  { lat: 55.7392, lng: 24.3594 }, // Estadi Aukštaitija
  { lat: 5.663689, lng: -55.102228 }, // Clarence Seedorf Stadion
  { lat: 4.932778, lng: 6.266667 }, // Samson Siasia Sports Stadium
  { lat: 52.256642, lng: 5.378294 }, // Sportpark De Westmaat
  { lat: 50.849267, lng: 3.612758 }, // Burgemeester Thienpontstadion
  { lat: -33.808056, lng: 150.999722 }, // Parramatta Stadium
  { lat: 43.836881, lng: 125.390597 }, // Estadi de l'àrea de desenvolupament
  { lat: 34.7167, lng: 113.725 }, // Estadi Zhengzhou Hanghai
  { lat: 34.716666666, lng: 113.725277777 }, // Estadi Zhengzhou Hanghai
  { lat: -17.796067, lng: -63.183873 }, // Estadi Ramón Tahuichi Aguilera
  { lat: 43.35791, lng: -5.86082 }, // Estadi Carlos Tartiere
  { lat: 43.35791, lng: -5.86082 }, // Estadi Carlos Tartiere
  { lat: 43.35791, lng: -5.86082 }, // Estadi Carlos Tartiere
  { lat: 13.761111, lng: 100.508889 }, // Rajadamnern Stadium
  { lat: 38.75193, lng: -9.161882 }, // Estádio Universitário de Lisboa
  { lat: 41.847286, lng: 44.721492 }, // Mtskheta Park
  { lat: 26.4272, lng: 50.1141 }, // Prince Mohamed bin Fahd Stadium
  { lat: 5.621239, lng: -54.401583 }, // Ronnie Brunswijkstadion
  { lat: 47.973222, lng: 37.798139 }, // Metalurh Stadium
  { lat: 43.469537, lng: 43.590338 }, // Spartak Stadium
  { lat: -17.8537, lng: 31.0376 }, // Rufaro Stadium
  { lat: -7.555556, lng: 110.806389 }, // Manahan Stadium
  { lat: 51.311408, lng: 4.942839 }, // Stadsparkstadion
  { lat: 43.302778, lng: -2.986389 }, // estadi de Lasesarre
  { lat: 30.045278, lng: 31.223333 }, // Estadi Mokhtar El-Tetsh
  { lat: 59.29138889, lng: 18.08527778 }, // Tele2 Arena
  { lat: 50.408524, lng: 4.456877 }, // Stade de la Neuville
  { lat: -17.379303, lng: -66.16183 }, // Estadi Félix Capriles
  { lat: 45.545, lng: 18.695833 }, // Estadi Gradski vrt
  { lat: 31.985, lng: 35.903 }, // Estadi Internacional d'Amman
  { lat: 23.6086, lng: 58.5067 }, // Royal Oman Police Stadium
  { lat: 38.753611, lng: -9.182639 }, // Estádio da Luz (1954)
  { lat: 43.036111111, lng: -76.136388888 }, // JMA Wireless Dome
  { lat: 37.278923, lng: 9.865583 }, // Estadi 15 d'Octubre
  { lat: 31.510833, lng: 74.331944 }, // Punjab Stadium
  { lat: 27.1462, lng: -13.1918 }, // Sheikh Mohamed Laghdaf Stadium
  { lat: -39.50194444, lng: 176.91277778 }, // McLean Park
  { lat: 44.847942, lng: 20.397972 }, // Zemun Stadium
  { lat: 36.349167, lng: 6.625833 }, // Ramadan Ben-Abdelmalek Stadium
  { lat: -20.130895, lng: 28.569624 }, // Barbourfields Stadium
  { lat: 39.329444444, lng: -76.601388888 }, // Memorial Stadium
  { lat: 52.253144, lng: 6.808475 }, // Fanny Blankers-Koen Stadion
  { lat: 39.932023, lng: 32.872146 }, // Cebeci İnönü Stadium
  { lat: -22.610833, lng: -43.330556 }, // Estádio de Los Larios
  { lat: 25.290833333, lng: 55.348333333 }, // Maktoum Bin Rashid Al Maktoum Stadium
  { lat: 10.80194, lng: 106.66667 }, // Quan khu 7 Stadium
  { lat: 63.439414, lng: -20.28795 }, // Hásteinsvöllur
  { lat: 64.104167, lng: -21.896667 }, // Kópavogsvöllur
  { lat: 41.279722, lng: 69.2125 }, // Bunyodkor Stadium
  { lat: 15.641278, lng: 32.471556 }, // Estadi Al-Merreikh
  { lat: 52.5303, lng: -1.90561 }, // Alexander Stadium
  { lat: -5.192174, lng: -80.616797 }, // Estadi Miguel Grau
  { lat: -30.6094, lng: -71.2058 }, // Q2837803
  { lat: 43.079078, lng: -76.165358 }, // Alliance Bank Stadium
  { lat: 28.128978, lng: -15.433814 }, // Estadi Insular
  { lat: -12.057916, lng: -77.083634 }, // Estadio Universidad San Marcos
  { lat: -13.836205, lng: -171.752014 }, // Apia Park
  { lat: 48.89565, lng: 2.229554 }, // Paris La Défense Arena
  { lat: 50.8025, lng: 19.153611 }, // Arena Częstochowa
  { lat: -23.513056, lng: -46.899444 }, // Arena Barueri
  { lat: -40.356666666, lng: 175.601111111 }, // Arena Manawatu
  { lat: 32.756388888, lng: -97.084722222 }, // Arlington Stadium
  { lat: -25.9414, lng: 32.6162 }, // Estádio do Costa do Sol
  { lat: 44.058333333, lng: -123.068611111 }, // Autzen Stadium
  { lat: 40.56237222, lng: -8.44179167 }, // Estádio Municipal de Águeda
  { lat: 37.502676, lng: 22.388678 }, // Theodoros Kolokotronis Stadium
  { lat: -7.25201, lng: 112.75621 }, // Gelora 10 November Stadium
  { lat: -6.289108, lng: 106.776711 }, // Lebak Bulus Stadium
  { lat: 23.388889, lng: 85.329167 }, // Astroturf Hockey Stadium
  { lat: 24.066167, lng: 32.884472 }, // Aswan Stadium
  { lat: 41.4642, lng: -87.0483 }, // Athletics–Recreation Center
  { lat: 39.368056, lng: 49.245556 }, // Nariman Narimanov Stadium
  { lat: 41.42194444, lng: 48.42138889 }, // Shovkat Ordukhanov Stadium
  { lat: 40.992222, lng: 45.625556 }, // Tovuz City Stadium
  { lat: 43.0172779, lng: -83.7023985 }, // Atwood Stadium
  { lat: 40.36027778, lng: 49.81972222 }, // MOIK Stadium
  { lat: 54.874085, lng: 69.152074 }, // Karasay Stadium
  { lat: 30.201667, lng: 66.998056 }, // Ayub National Stadium
  { lat: 35.722222, lng: 51.269444 }, // Azadi Indoor Stadium
  { lat: 30.4588, lng: -91.1721 }, // BREC Memorial Stadium
  { lat: -1.445, lng: -48.465833 }, // Baenão
  { lat: 33.314972222, lng: 44.384472222 }, // Baghdad FC Stadium
  { lat: -18.91628, lng: 29.825019 }, // Baghdad Stadium
  { lat: 3.550368, lng: 98.864509 }, // Baharuddin Siregar Stadium
  { lat: 34.4617, lng: -81.8614 }, // Bailey Memorial Stadium
  { lat: 46.735, lng: -117.155 }, // Bailey–Brayton Field
  { lat: 39.993055555, lng: -75.155833333 }, // Baker Bowl
  { lat: 32.720833333, lng: -117.150555555 }, // Balboa Stadium
  { lat: 39.053333, lng: -77.455556 }, // BallPark at One Loudoun
  { lat: 57.5117, lng: -1.79585 }, // Balmoor Stadium
  { lat: 12.961684, lng: 77.600642 }, // Bangalore Hockey Stadium
  { lat: 14.038739, lng: 100.602272 }, // Bangkok University Stadium
  { lat: 23.805533, lng: 90.404139 }, // Bangladesh Army Stadium
  { lat: 29.061667, lng: 31.0975 }, // Bani Sweif Stadium
  { lat: 34.35302, lng: 107.146761 }, // Baoji City Stadium
  { lat: 22.717691, lng: 88.478644 }, // Barasat Stadium
  { lat: -18.14685, lng: 49.38610833 }, // Barikadimy Stadium
  { lat: 35.4046, lng: -78.7427 }, // Barker-Lane Stadium
  { lat: -2.572082, lng: 140.523682 }, // Barnabas Youwe Stadium
  { lat: -26.10496, lng: 28.21365 }, // Barnard Stadium
  { lat: 40.801944, lng: 19.909444 }, // Bashkim Sulejmani Stadium
  { lat: -31.903056, lng: 115.955833 }, // Bassendean Oval
  { lat: 32.000833333, lng: 34.748472222 }, // Bat Yam Municipal Stadium
  { lat: 41.63527778, lng: 41.61916667 }, // Estadi de Batumi
  { lat: 40.332217, lng: 49.817664 }, // Bayil Stadium
  { lat: 31.550833, lng: -97.107778 }, // Baylor Ballpark
  { lat: 31.5302, lng: -97.1485 }, // McLane Stadium
  { lat: -37.685, lng: 176.226111 }, // Mercury Baypark Stadium and Arena
  { lat: 56.1887, lng: -2.99902 }, // Bayview Stadium
  { lat: 31.2731, lng: 34.7794 }, // Turner Stadium
  { lat: 48.443111111, lng: -123.523055555 }, // Westhills Stadium
  { lat: 48.443111111, lng: -123.523055555 }, // Westhills Stadium
  { lat: 40.3506, lng: -94.885612 }, // Bearcat Stadium
  { lat: 1.32641, lng: 103.939 }, // Bedok Stadium
  { lat: 33.87405, lng: 35.498394444 }, // Beirut Municipal Stadium
  { lat: 43.406944, lng: 24.608056 }, // Belite Orli Stadium
  { lat: 44.563, lng: -123.279 }, // Bell Field
  { lat: -33.916667, lng: 151.094722 }, // Belmore Sports Ground
  { lat: 39.482542, lng: -0.371152 }, // Estadi de Vallejo
  { lat: 7.45380556, lng: -2.585 }, // Berekum Sports Stadium
  { lat: 40.8121, lng: -74.0771 }, // Bergen Ballpark
  { lat: 42.058228631, lng: 24.757789086 }, // Berkut Stadium
  { lat: 43.211278, lng: -79.821778 }, // Bernie Arbour Memorial Stadium
  { lat: 39.3586, lng: -74.4586 }, // Bernie Robbins Stadium
  { lat: 45.5294, lng: -73.7472 }, // Berthiaume-du-Tremblay Stadium
  { lat: 41.188558, lng: 19.553247 }, // Estadi Besa
  { lat: 40.6297, lng: -75.3734 }, // Bethlehem Area School District Stadium
  { lat: 40.0017, lng: -76.3536 }, // Biemesderfer Stadium
  { lat: 39.181111, lng: -86.514444 }, // Bill Armstrong Stadium
  { lat: 34.435, lng: 133.175555555 }, // Bingo Athletic Stadium
  { lat: 43.6956, lng: -79.2608 }, // Birchmount Stadium
  { lat: 23.378, lng: 85.3875 }, // Birsa Munda Athletics Stadium
  { lat: 13.71515, lng: 100.559717 }, // PAT Stadium
  { lat: 7.96, lng: -11.74 }, // Bo Stadium
  { lat: 42.6833, lng: -73.8271 }, // Bob Ford Field
  { lat: 35.3047, lng: -83.1825 }, // Bob Waters Field at E. J. Whitmire Stadium
  { lat: 29.887778, lng: -97.928333 }, // Bobcat Ballpark
  { lat: 45.6592, lng: -111.049 }, // Bobcat Stadium
  { lat: -28.21931, lng: 28.31647 }, // Bohlokong Stadium
  { lat: 43.073889, lng: -87.920556 }, // Borchert Field
  { lat: 42.0003891, lng: 21.50286102 }, // Boris Trajkovski Stadium
  { lat: 42.0004, lng: 21.5029 }, // Boris Trajkovski Stadium
  { lat: 57.6518, lng: -3.32092 }, // Borough Briggs
  { lat: 33.808411, lng: 132.747525 }, // Botchan Stadium
  { lat: -29.23136, lng: 26.70078 }, // Botshabelo Stadium
  { lat: 37.7258, lng: -122.445 }, // Boxer Stadium
  { lat: 30.426111, lng: -84.291667 }, // Bragg Memorial Stadium
  { lat: 34.81, lng: -87.6728 }, // Tom Braly Stadium
  { lat: -32.893333333, lng: 151.6825 }, // The Gardens Greyhound and Sporting Complex
  { lat: 51.490825, lng: -0.2887 }, // Brentford Community Stadium
  { lat: 35.2364, lng: -82.7247 }, // Brevard Memorial Stadium
  { lat: 41.77605556, lng: 19.64466111 }, // Brian Filipi Stadium
  { lat: 38.4353, lng: -78.8731 }, // Bridgeforth Stadium and Zane Showker Field
  { lat: -32.923056, lng: 151.732222 }, // Broadmeadow Basketball Stadium
  { lat: 56.003442, lng: -3.789306 }, // Brockville Park
  { lat: -33.76, lng: 151.273333 }, // Brookvale Oval
  { lat: 55.863475, lng: -3.97804722 }, // Broomfield Park
  { lat: 44.500278, lng: -88.056667 }, // Brown County Veterans Memorial Arena
  { lat: 41.4656, lng: -87.0481 }, // Brown Field
  { lat: 41.8422, lng: -71.3944 }, // Brown Stadium
  { lat: 59.0605, lng: 10.0289 }, // Lovisenlund
  { lat: 10.482778, lng: -66.941667 }, // Estadi Brígido Iriarte
  { lat: 32.978333, lng: -80.067778 }, // Buccaneer Field
  { lat: 0.289444, lng: 34.760278 }, // Bukhungu Stadium
  { lat: 31.824444, lng: 131.448056 }, // Hinata Athletic Stadium
  { lat: 34.780277777, lng: 132.870861111 }, // Miyoshi Athletic Stadium
  { lat: 37.530509, lng: 126.883022 }, // Mokdong Stadium
  { lat: -24.383626, lng: 25.537693 }, // Molepolole Stadium
  { lat: -4.044722, lng: 39.666389 }, // Mombasa Municipal Stadium
  { lat: 43.6794, lng: -79.3228 }, // Monarch Park Stadium
  { lat: 22.119783, lng: 95.12766 }, // Monywa Stadium
  { lat: 41.73213889, lng: -72.67727778 }, // Morgan G. Bulkeley Stadium
  { lat: 41.8011, lng: -72.255 }, // Morrone Stadium
  { lat: -25.156667, lng: 27.175556 }, // Moruleng Stadium
  { lat: 58.53972222, lng: 15.05388889 }, // Motala Idrottspark
  { lat: 39.637075, lng: -79.95517 }, // Mountaineer Field
  { lat: 0.143111, lng: 117.461239 }, // Mulawarman Stadium
  { lat: 38.908016, lng: -77.07532 }, // Cooper Field
  { lat: 11.256405, lng: 75.785708 }, // EMS Stadium
  { lat: 29.173056, lng: -81.1175 }, // Municipal Stadium
  { lat: 45.41194444, lng: -71.88194444 }, // Municipal Stadium
  { lat: 39.085833333, lng: -94.556944444 }, // Municipal Stadium
  { lat: 40.8022, lng: 22.0521 }, // Municipal Stadium of Edessa
  { lat: 40.5301, lng: 21.2581 }, // Municipal Stadium of Kastoria
  { lat: 32.407444444, lng: 15.071777777 }, // Murbat Stadium
  { lat: 35.717441, lng: 139.568354 }, // Musashino Municipal Athletic Stadium
  { lat: 34.62068, lng: 133.804 }, // Muscat Stadium
  { lat: 0.31361111, lng: 32.58111111 }, // Muteesa II Stadium
  { lat: 41.673176, lng: -72.959459 }, // Muzzy Field
  { lat: 48.858311, lng: 16.052019 }, // Městský stadion
  { lat: 50.675745, lng: 14.016387 }, // Městský stadion
  { lat: -33.893841, lng: 18.583025 }, // NNK Rugby Stadium
  { lat: 36.658611, lng: 138.233333 }, // Nagano Athletic Stadium
  { lat: 32.838611, lng: 130.039444 }, // Nagasaki Athletic Stadium
  { lat: 35.076083, lng: 136.850667 }, // Nagoya City Minato Soccer Stadium
  { lat: 15.710043, lng: 100.106783 }, // Nakhon Sawan Stadium
  { lat: 0.311629, lng: 32.573541 }, // Estadi Nakivubo
  { lat: 28.685275, lng: 115.92293333 }, // Nanchang Bayi Stadium
  { lat: 31.968512, lng: 120.890453 }, // Nantong Stadium
  { lat: 9.54972222, lng: 44.0625 }, // National Stadium
  { lat: 46.7264, lng: -117.018 }, // Neale Stadium
  { lat: 40.820556, lng: -96.705556 }, // Nebraska Field
  { lat: 5.260872222, lng: 100.437469444 }, // Penang State Stadium
  { lat: 37.7765, lng: -122.454 }, // Negoesco Stadium
  { lat: 11.006626, lng: 76.969475 }, // Nehru Stadium, Coimbatore
  { lat: 30.324347222, lng: -97.688202777 }, // Nelson Field
  { lat: 29.409131, lng: -98.601114 }, // Nelson W. Wolff Municipal Stadium
  { lat: 42.666806, lng: 27.705 }, // Nesebar Stadium
  { lat: 22.56612778, lng: 88.34166667 }, // Netaji Indoor Stadium
  { lat: -34.9325, lng: 138.578611 }, // Netball SA Stadium
  { lat: 57.1051, lng: -2.09987 }, // New Aberdeen Stadium
  { lat: 53.709, lng: -1.33 }, // New Castleford Stadium
  { lat: 33.755277777, lng: -84.400833333 }, // Mercedes-Benz Stadium
  { lat: 31.279084, lng: 48.779745 }, // Foolad Khuzestan Stadium
  { lat: 43.2526, lng: -79.8302 }, // Hamilton Stadium
  { lat: -15.4167, lng: 28.2833 }, // New Lusaka Stadium
  { lat: 30.55361111, lng: 47.77777778 }, // New Minaa Stadium
  { lat: 32.066197, lng: 44.317142 }, // Najaf Stadium
  { lat: 50.4505, lng: -104.633 }, // Mosaic Stadium
  { lat: 40.769866, lng: -74.184612 }, // Newark Schools Stadium
  { lat: -32.920833333, lng: 151.73625 }, // Newcastle Entertainment Centre
  { lat: 46.898333333, lng: -96.804166666 }, // Newman Outdoor Field
  { lat: 53.7145, lng: -1.47603 }, // Newmarket Stadium
  { lat: 37.879418, lng: 139.064266 }, // Niigata Prefectural Baseball Stadium
  { lat: 33.768178, lng: 132.797594 }, // Ningineer Stadium
  { lat: 35.7225, lng: 138.439167 }, // Nirasaki Central Park Stadium
  { lat: 34.993478, lng: 135.713961 }, // Nishikyogoku Athletic Stadium
  { lat: -12.84722222, lng: 28.21111111 }, // Nkana Stadium
  { lat: -15.37194444, lng: 28.37611111 }, // Nkoloma Stadium
  { lat: 27.5294, lng: -97.8815 }, // Nolan Ryan Field
  { lat: 57.338056, lng: -2.196111 }, // North Lodge Park
  { lat: -27.9778, lng: 26.6917 }, // North West Stadium
  { lat: 42.065277777, lng: -87.693333333 }, // Northwestern Field
  { lat: 40.403056, lng: -104.705278 }, // Nottingham Field
  { lat: 52.9507, lng: -1.10883 }, // Nottingham Greyhound Stadium
  { lat: 39.4805, lng: -88.1812 }, // O'Brien Stadium
  { lat: 50.30083333, lng: 18.91944444 }, // OSiR Skałka
  { lat: 46.372931, lng: 15.104184 }, // Ob Jezeru City Stadium
  { lat: 42.915114, lng: -78.862009 }, // Offermann Stadium
  { lat: 34.5922, lng: -86.9746 }, // Ogle Stadium
  { lat: 33.246389, lng: 131.623056 }, // Estadi d'Ōita
  { lat: 35.017222, lng: 135.856667 }, // Ojiyama Stadium
  { lat: 26.308612, lng: 127.820993 }, // Okinawa Athletic Stadium
  { lat: 38.9839, lng: -76.9358 }, // Old Byrd Stadium
  { lat: 52.344506, lng: 4.859717 }, // Het Nederlandsch Sportpark
  { lat: 30.60575, lng: -96.3413 }, // Olsen Field at Blue Bell Park
  { lat: 46.9781, lng: -123.859 }, // Olympic Stadium
  { lat: -26.72555556, lng: 27.115 }, // Olën Park
  { lat: -26.947, lng: 26.711 }, // Oppenheimer Stadium
  { lat: 39.832502, lng: 109.948156 }, // Ordos Stadium
  { lat: 49.883506, lng: -97.150018 }, // Osborne Stadium
  { lat: 36.275308, lng: 139.395589 }, // Ota Athletic Stadium
  { lat: -33.95322222, lng: 22.44762222 }, // Outeniqua Park
  { lat: 40.7412, lng: -74.2476 }, // Owen T. Carroll Field
  { lat: 53.4064, lng: -1.4925 }, // Owlerton Stadium
  { lat: 32.839444, lng: -96.782222 }, // Ownby Stadium
  { lat: 32.801, lng: -96.8197 }, // P.C. Cobb Stadium
  { lat: 18.630416666, lng: 73.825944444 }, // PCMC Hockey Stadium
  { lat: 6.91888889, lng: 79.88388889 }, // Paikiasothy Saravanamuttu Stadium
  { lat: -32.939167, lng: -60.760833 }, // Luciana Aymar Stadium
  { lat: -34.7155, lng: -58.249 }, // Estadio de la Barranca Dr.Isidoro Iriarte (Argentino de Quilmes)
  { lat: -33.6043, lng: -71.6148 }, // Estadio Municipal Doctor Olegario Henríquez Escalante
  { lat: 37.267199286, lng: -6.925848407 }, // Estadio Iberoamericano
  { lat: 53.516863888, lng: -1.1047 }, // Belle Vue
  { lat: 53.669722, lng: -1.479444 }, // Belle Vue
  { lat: 39.201944, lng: -96.593889 }, // Bill Snyder Family Football Stadium
  { lat: 32.167839, lng: 34.824793 }, // Herzliya Municipal Stadium
  { lat: 33.7725, lng: -84.392777777 }, // Bobby Dodd Stadium
  { lat: 31.8103, lng: 34.6483 }, // Estadi HaYud-Alef
  { lat: 36.125833333, lng: -97.066388888 }, // Boone Pickens Stadium
  { lat: 31.8475, lng: 35.230278 }, // Estadi Internacional Faisal Al-Husseini
  { lat: -25.353791, lng: -57.445233 }, // Q2918409
  { lat: 8.44388889, lng: -82.42361111 }, // Estadio Kenny Sarracín
  { lat: 55.7914, lng: 37.5161 }, // Grigory Fedotov Stadium
  { lat: 38.684411, lng: -6.414606 }, // Estadi Francisco de la Hera
  { lat: -34.577, lng: -70.9865 }, // Q2919402
  { lat: 32.100277777, lng: 34.776388888 }, // Estadi Maccabiah
  { lat: 51.51, lng: -3.581667 }, // Brewery Field
  { lat: 28.6091, lng: -81.1924 }, // Acrisure Bounce House
  { lat: 43.6028, lng: -116.196 }, // Albertsons Stadium
  { lat: 38.990277777, lng: -76.947222222 }, // SECU Stadium
  { lat: 39.4072, lng: -9.13583 }, // Campo da Mata
  { lat: 53.205714, lng: -6.102889 }, // Carlisle Grounds
  { lat: 36.179666666, lng: -115.129972222 }, // Cashman Field
  { lat: 43.6536, lng: -79.5844 }, // Rob Ford Stadium
  { lat: 40.386673, lng: 71.778306 }, // Fargona Stadium
  { lat: 39.768544, lng: 64.425706 }, // Buxoro Arena
  { lat: 43.4068, lng: 39.94959444 }, // Ice Cube Curling Center
  { lat: 36.7321, lng: -119.7905 }, // Chukchansi Park
  { lat: 26.195555555, lng: -80.161111111 }, // Fort Lauderdale Stadium
  { lat: 38.58590556, lng: 68.76951111 }, // Pamir Stadium
  { lat: 51.162739, lng: 71.413312 }, // Estadi Kazhimukan Munaitpasov
  { lat: 4.374417, lng: 18.564389 }, // Estadi Barthélemy Boganda
  { lat: 34.877219778, lng: -1.301144473 }, // Colonel Lotfi Stadium
  { lat: 32.878191, lng: -6.90738 }, // Complexe OCP
  { lat: 39.3446, lng: -8.9352 }, // Estádio Municipal de Rio Maior
  { lat: 37.1886, lng: -7.4189 }, // Sports Complex of Vila Real de Santo António
  { lat: 48.435556, lng: 35.005556 }, // Stadium Meteor
  { lat: -34.919722, lng: 138.630556 }, // Norwood Oval
  { lat: -0.522991, lng: 166.915 }, // Denig Stadium
  { lat: 14.676078, lng: -90.488547 }, // Estadio Cementos Progreso
  { lat: 36.186944, lng: 5.393056 }, // Stade 8 Mai 1945
  { lat: -23.669444, lng: -46.509167 }, // Estádio Bruno José Daniel
  { lat: -16.408803, lng: -71.535024 }, // Estadio Mariano Melgar
  { lat: 15.846856, lng: -87.937794 }, // Estadio Excélsior
  { lat: 53.320833, lng: -6.233333 }, // Donnybrook Stadium
  { lat: 47.1102, lng: 9.5195 }, // Sportanlage Blumenau
  { lat: 35.5964, lng: -77.3653 }, // Dowdy–Ficklen Stadium
  { lat: 12.10005278, lng: 15.05507222 }, // Estadi Poliesportiu Idriss Mahamat Ouya
  { lat: -33.981944, lng: 25.639444 }, // Estadi EPRU
  { lat: 27.347778, lng: -82.517222 }, // Ed Smith Stadium
  { lat: -33.3379, lng: -60.2214 }, // Estadio Fortunato Bonelli
  { lat: 24.01433056, lng: -104.68690833 }, // Estadio Francisco Zarco
  { lat: 14.033333, lng: -86.574444 }, // Estadio Marcelo Tinoco
  { lat: 11.9067667, lng: -86.2076264 }, // Estadio Olímpico de San Marcos
  { lat: 9.041311, lng: -79.5453 }, // Estadio Nacional de Panamá
  { lat: 28.712778, lng: -106.143889 }, // Estadio Olímpico de la UACH
  { lat: -33.450772, lng: -70.674606 }, // Víctor Jara Stadium
  { lat: 14.61555556, lng: -90.50972222 }, // Estadio del Ejército
  { lat: 39.55, lng: -8.98333 }, // Estádio Municipal de Alcobaça
  { lat: 32.728611111, lng: -16.773333333 }, // Machico Municipal Stadium
  { lat: 41.135955555, lng: -8.541758333 }, // Estadi de São Miguel (Gondomar)
  { lat: 18.192222222, lng: -67.154444444 }, // Isidoro García Stadium
  { lat: 9.9365, lng: -84.107878 }, // Estadio Nacional de Costa Rica
  { lat: 8.108889, lng: -80.972778 }, // Estadio Áristocles Castillo
  { lat: 31.5313, lng: -97.1487 }, // Floyd Casey Stadium
  { lat: 40.009444, lng: -105.266944 }, // Folsom Field
  { lat: -22.978219, lng: -43.221033 }, // Estádio da Gávea
  { lat: -33.934993, lng: 18.634121 }, // University of the Western Cape Stadium
  { lat: 48.9003, lng: 18.0569 }, // Trenčín Zimny Arena
  { lat: 48.9005699, lng: 18.0571032 }, // Trenčín Zimny Arena
  { lat: 45.044166666, lng: 39.029444444 }, // Krasnodar Stadium
  { lat: 45.044166666, lng: 39.029444444 }, // Krasnodar Stadium
  { lat: 35.776389, lng: 10.820278 }, // Estadi Mustapha Ben Jannet
  { lat: 34.0213, lng: -118.28 }, // Galen Center
  { lat: 6.450438888, lng: 100.200558333 }, // Utama Negeri Stadium
  { lat: 42.880175, lng: 74.59793889 }, // Spartak Stadium
  { lat: 34.729861, lng: 36.697917 }, // Homs Municipal Stadium
  { lat: 33.536109, lng: -7.511156 }, // Estadi Hassan II
  { lat: 53.765, lng: -1.756944 }, // Odsal Stadium
  { lat: 35.683315, lng: -0.636221 }, // Estadi Ahmed Zabana
  { lat: 42.784947, lng: 18.953731 }, // Estadi Ciutat de Nikšić
  { lat: 53.395, lng: -2.595555555 }, // Halliwell Jones Stadium
  { lat: 53.365833, lng: -2.738333 }, // Halton Stadium
  { lat: -25.82756944, lng: 32.57502778 }, // Estádio do Zimpeto
  { lat: 49.485833333, lng: 5.976944444 }, // Estadi de la Frontière
  { lat: 30.058611, lng: 31.203333 }, // Estadi Abdel-Latif Abu-Rajelha
  { lat: 51.187675, lng: 4.440333 }, // Q3133850
  { lat: 55.8817, lng: -4.30778 }, // Hughenden Stadium
  { lat: 32.475555555, lng: -93.791944444 }, // Independence Stadium
  { lat: 51.239444, lng: 5.307222 }, // Q3153676
  { lat: 42.014167, lng: -93.635833 }, // Jack Trice Stadium
  { lat: 33.511388888, lng: -86.842777777 }, // Legion Field
  { lat: -41.266944, lng: 173.283056 }, // Trafalgar Park
  { lat: 38.425, lng: -82.4208 }, // Joan C. Edwards Stadium
  { lat: -25.883888888, lng: 29.214444444 }, // Witbank Stadium
  { lat: 33.339617, lng: 44.435502 }, // Al Shorta Stadium
  { lat: 33.5911, lng: -101.873 }, // Jones AT&T Stadium
  { lat: -38.158055555, lng: 144.354722222 }, // Kardinia Park
  { lat: 41.658611, lng: -91.551111 }, // Kinnick Stadium
  { lat: -22.439642, lng: -46.962561 }, // Estádio Romildo Vitor Gomes Ferreira
  { lat: 48.8772, lng: 2.37694 }, // Estadi Bergeyre
  { lat: 30.673042, lng: -88.077764 }, // Ladd–Peebles Stadium
  { lat: 37.22, lng: -80.418056 }, // Lane Stadium
  { lat: 56.5144, lng: 21.0156 }, // Ice Hall of Liepāja Olympic Center
  { lat: 46.559528, lng: 16.4508 }, // Lendava Sports Park
  { lat: 1.304277777, lng: 103.874611111 }, // National Stadium
  { lat: 35.121111111, lng: -89.9775 }, // Simmons Bank Liberty Stadium
  { lat: 44.891122, lng: 7.348703 }, // Palazzo Polifunzionale del Ghiaccio
  { lat: 21.446608, lng: 39.251693 }, // Prince Abdullah Al Faisal Sports City
  { lat: 51.1703, lng: 4.96834 }, // De Leunen
  { lat: 34.6803, lng: -82.8464 }, // Littlejohn Coliseum
  { lat: 31.233425, lng: 121.531683 }, // Yuanshen Sports Centre Stadium
  { lat: 31.92749977, lng: 35.95305634 }, // King Abdullah Stadium
  { lat: 1.310016, lng: 103.860347 }, // Jalan Besar Stadium
  { lat: 36.185563, lng: 37.120163 }, // Al-Hamadaniah Stadium
  { lat: 30.615778, lng: 104.307826 }, // Chengdu Longquanyi Football Stadium
  { lat: 22.520833333, lng: 113.945833333 }, // Shenzhen Bay Sports Center
  { lat: 41.321654, lng: 69.230561 }, // JAR Stadium
  { lat: 25.258708, lng: 51.520509 }, // Grand Hamad Stadium
  { lat: 6.9475, lng: 79.8686 }, // Sugathadasa Stadium
  { lat: 22.945908, lng: 113.352264 }, // Henry Fok Stadium
  { lat: 29.356944444, lng: 48.000277777 }, // Sabah Al Salem Stadium
  { lat: 25.038011, lng: 102.728745 }, // Kunming Tuodong Sports Center
  { lat: 3.814722222, lng: 103.323888888 }, // Darul Makmur Stadium
  { lat: 29.34, lng: 48.030277777 }, // Estadi Mohammed Al-Hamad
  { lat: 23.6189, lng: 58.2168 }, // Al-Seeb Stadium
  { lat: 31.328889, lng: -89.331389 }, // M. M. Roberts Stadium
  { lat: 34.233889, lng: 108.9375 }, // Shaanxi Province Stadium
  { lat: 31.183361, lng: 121.43355 }, // Shanghai Indoor Stadium
  { lat: 38.026667, lng: 46.295833 }, // Yadegar-e Emam Stadium
  { lat: 24.662599, lng: 46.739745 }, // Prince Faisal bin Fahd Sports City
  { lat: -1.035628, lng: -79.467863 }, // Estadio 7 de Octubre
  { lat: 36.827333, lng: 118.294575 }, // Linzi Stadium
  { lat: 36.813306, lng: 117.982856 }, // Zibo Sports Center Stadium
  { lat: 25.333205555, lng: 55.419572222 }, // Sharjah Stadium
  { lat: 35.707671, lng: 51.311708 }, // Estadi Shahid Dastgerdi
  { lat: -7.817041, lng: 112.028602 }, // Brawijaya Stadium
  { lat: 18.669015, lng: 105.669508 }, // Vinh Stadium
  { lat: 1.588544444, lng: 110.360186111 }, // Sarawak Stadium
  { lat: 13.364444, lng: 100.976389 }, // Chonburi Municipality Stadium
  { lat: 20.851779, lng: 106.688743 }, // Lạch Tray Stadium
  { lat: 5.983355555, lng: 116.095544444 }, // Likas Stadium
  { lat: 6.123838888, lng: 102.243561111 }, // Sultan Mohammad IV Stadium
  { lat: 22.562175, lng: 114.086989 }, // Shenzhen Stadium
  { lat: 13.782645, lng: 100.55655 }, // Thai Army Sports Stadium
  { lat: 22.697139, lng: 114.212194 }, // Shenzhen Universiade Sports Centre
  { lat: -29.67888889, lng: -51.13527778 }, // Estádio Santa Rosa
  { lat: 21.5672, lng: 39.1737 }, // Prince Sultan bin Fahd Stadium
  { lat: 40.213563, lng: 69.27883 }, // Bahrom Vafoev Stadium
  { lat: 39.611364, lng: 19.915836 }, // Kerkyra Municipal Stadium
  { lat: 34.0075, lng: -118.266111111 }, // Wrigley Field
  { lat: 41.873163888, lng: -71.370038888 }, // McCoy Stadium
  { lat: 39.180833, lng: -86.525556 }, // Memorial Stadium
  { lat: 38.963056, lng: -95.246389 }, // David Booth Kansas Memorial Stadium
  { lat: 40.099166666, lng: -88.235833333 }, // Memorial Stadium
  { lat: 41.3875, lng: -73.964166666 }, // Michie Stadium
  { lat: 51.07441, lng: 5.218077 }, // Mijnstadion
  { lat: 43.030277777, lng: -87.973611111 }, // Milwaukee County Stadium
  { lat: 43.181706, lng: -2.475803 }, // Estadi Municipal d'Ipurua
  { lat: 42.344167, lng: -3.680556 }, // Estadi Municipal de El Plantío
  { lat: -10.92333333, lng: -37.07222222 }, // Estádio João Hora de Oliveira
  { lat: 38.08333333, lng: -0.95 }, // Estadi Los Arcos
  { lat: 37.638817, lng: -1.735122 }, // Estadi Francisco Artés Carrasco
  { lat: 37.638847, lng: -1.735084 }, // Estadi Francisco Artés Carrasco
  { lat: -36.86, lng: 174.6362 }, // Trusts Stadium
  { lat: 40.077222, lng: -2.140278 }, // Estadio La Fuensanta
  { lat: 36.75444167, lng: -3.51277778 }, // Estadi Municipal Escribano Castilla
  { lat: 40.483, lng: -3.34722 }, // Estadio Municipal El Val
  { lat: 44.638611, lng: 22.667222 }, // Stadionul Municipal
  { lat: -35.339167, lng: 149.154722 }, // Narrabundah Ballpark
  { lat: -0.540278, lng: 166.93 }, // National Stadium
  { lat: 38.984722, lng: -76.506944 }, // Navy–Marine Corps Memorial Stadium
  { lat: 40.698889, lng: 19.964444 }, // Tomori Stadium
  { lat: 53.753889, lng: -0.264722 }, // Craven Park
  { lat: 42.35343, lng: -71.119273 }, // Nickerson Field
  { lat: 39.131111111, lng: -84.516111111 }, // Nippert Stadium
  { lat: 48.32027778, lng: 18.0875 }, // Nitra Aréna
  { lat: 35.557222, lng: 6.187778 }, // Estadi 1 de Novembre de 1954
  { lat: 18.083055555, lng: -88.570277777 }, // Orange Walk People's Stadium
  { lat: 44.83598, lng: -0.57253 }, // Q3361143
  { lat: 43.270556, lng: 5.401389 }, // Palais des sports de Marseille
  { lat: -26.25176111, lng: 28.42790556 }, // PAM Brink Stadium
  { lat: 38.205833333, lng: -85.758888888 }, // L&N Federal Credit Union Stadium
  { lat: 43.33146, lng: 3.22331 }, // Parc des Sports de Sauclières
  { lat: 5.29732, lng: -4.00618 }, // Treichville Sports Park
  { lat: 54.163056, lng: -6.334722 }, // Páirc Esler
  { lat: 19.5199, lng: -96.9192 }, // Estadio Xalapeño
  { lat: 49.88957, lng: -97.19832 }, // Canad Inns Stadium
  { lat: 55.4696, lng: -4.62 }, // Somerset Park
  { lat: 50.452627777, lng: -104.624191666 }, // Mosaic Stadium at Taylor Field
  { lat: 52.40806, lng: 4.63083 }, // Pim Mulier Stadium
  { lat: 40.4444, lng: -79.9618 }, // Pitt Stadium
  { lat: 38.54741, lng: -0.137908 }, // Estadi Guillermo Amor
  { lat: 36.16333333, lng: -5.46527778 }, // Estadi Nuevo Mirador
  { lat: 43.3106, lng: -3.00972 }, // Camp Municipal de Las Llanas
  { lat: 42.018692, lng: 20.978179 }, // Estadi Gradski Tetovo
  { lat: 41.507222, lng: 20.963333 }, // Gradski stadion Kičevo
  { lat: 42.0808178, lng: 22.1610253 }, // Gradski stadion Kratovo
  { lat: -6.1368615, lng: 106.9134062 }, // Tugu Stadium
  { lat: 5.17417, lng: 97.1378 }, // Tunas Bangsa Stadium
  { lat: 45.2037, lng: -75.7954 }, // Twin Elm Rugby Park
  { lat: 39.0951, lng: 63.5834 }, // Türkmenabat Stadium
  { lat: 28.60765, lng: -81.1952 }, // UCF Soccer and Track Complex
  { lat: -26.178382, lng: 27.992467 }, // UJ Stadium
  { lat: 39.2505, lng: -76.7076 }, // UMBC Stadium
  { lat: 42.5156, lng: -92.4673 }, // UNI-Dome
  { lat: 28.063, lng: -82.4067 }, // USF Track and Field Stadium
  { lat: 38.752777777, lng: -9.184722222 }, // Estádio da Luz
  { lat: 35.532, lng: 129.266 }, // Ulsan Baseball Stadium
  { lat: -28.298009, lng: 31.433113 }, // Ulundi Stadium
  { lat: -1.67544, lng: 29.2626 }, // Umuganda Stadium
  { lat: 42.683056, lng: -73.826944 }, // University Field
  { lat: 40.5103, lng: -75.7802 }, // University Field
  { lat: 39.732222, lng: -121.853889 }, // University Soccer Stadium, Chico
  { lat: 43.470278, lng: -80.53 }, // University Stadium
  { lat: 33.5798, lng: -85.1236 }, // University Stadium
  { lat: 42.999167, lng: -78.7775 }, // University at Buffalo Stadium
  { lat: 49.679, lng: -112.865 }, // University of Lethbridge Community Stadium
  { lat: 14.5636, lng: 121.057 }, // University of Makati Stadium
  { lat: 42.2983, lng: -83.0631 }, // University of Windsor Stadium
  { lat: 29.452762, lng: -98.567051 }, // V. J. Keefe Memorial Stadium
  { lat: 55.745278, lng: -4.682778 }, // Valefield Park
  { lat: 49.267, lng: -123.251 }, // Varsity Stadium
  { lat: 51.616464, lng: -3.949947 }, // Vetch Field
  { lat: 27.5197, lng: -99.5093 }, // Veterans Field
  { lat: 51.5903, lng: -3.80222 }, // Victoria Road
  { lat: 44.973889, lng: -93.258056 }, // U.S. Bank Stadium
  { lat: 40.033055555, lng: -75.336666666 }, // Villanova Stadium
  { lat: 42.354444444, lng: 42.993888888 }, // Vladimer Bochorishvili Stadium
  { lat: 48.037667, lng: 14.410361 }, // Vorwärts Stadium
  { lat: 37.9586, lng: 23.7693 }, // Vyronas National Stadium
  { lat: 29.9323, lng: -95.3611 }, // W.W. Thorne Stadium
  { lat: -34.426667, lng: 150.902778 }, // WIN Entertainment Centre
  { lat: 40.617406, lng: -74.094822 }, // Hameline Field
  { lat: 42.285833, lng: -85.601111 }, // Waldo Stadium
  { lat: 32.4287, lng: -99.7459 }, // Walt Driggers Field
  { lat: 42.90567, lng: -78.857053 }, // War Memorial Stadium
  { lat: 42.90567, lng: -78.857053 }, // War Memorial Stadium
  { lat: 38.417, lng: -96.1796 }, // Welch Stadium
  { lat: -6.8160139, lng: 110.8508512 }, // Wergu Wetan Stadium
  { lat: 33.4972, lng: -86.8121 }, // West Campus Field
  { lat: -29.106899, lng: 26.207044 }, // Westdene Stadium
  { lat: 27.809595, lng: -97.399681 }, // Whataburger Field
  { lat: 51.605, lng: -0.100556 }, // White Hart Lane Community Sports Centre
  { lat: 53.518542, lng: -2.121747 }, // Whitebank Stadium
  { lat: 43.908125, lng: -69.955103 }, // Whittier Field
  { lat: 29.52375, lng: -95.07472 }, // Wildcat Field
  { lat: 29.964805, lng: -90.382693 }, // Fighting Wildcats Stadium
  { lat: -7.631, lng: 111.53 }, // Wilis Stadium
  { lat: 32.9167, lng: -96.4467 }, // Wilkerson-Sanders Memorial Stadium
  { lat: 36.847, lng: -76.2601 }, // William 'Dick' Price Stadium
  { lat: 38.925588584, lng: -77.02078677 }, // William H. Greene Stadium
  { lat: 38.925588584, lng: -77.02078677 }, // William H. Greene Stadium
  { lat: 34.396983, lng: 132.454958 }, // Hiroshima Municipal Stadium
  { lat: 37.354, lng: -79.175 }, // Williams Stadium
  { lat: 39.4402778, lng: -83.8186111 }, // Williams Stadium
  { lat: 39.752, lng: -75.5251 }, // Wilmington Park
  { lat: 42.2939, lng: -83.0191 }, // Windsor Stadium
  { lat: 44.8247, lng: -68.7944 }, // Winkin Sports Complex
  { lat: 37.337376, lng: 127.944224 }, // Wonju Stadium
  { lat: -29.6111, lng: 30.3911 }, // Woodburn Stadium
  { lat: 36.079722, lng: -79.777222 }, // World War Memorial Stadium
  { lat: 31.3112, lng: 118.376 }, // Wuhu Olympic Stadium
  { lat: 31.3112, lng: 118.376 }, // Wuhu Olympic Stadium
  { lat: 32.051, lng: 118.769 }, // Wutaishan Stadium
  { lat: -34.009003, lng: 18.460894 }, // Wynberg Military Base Stadium
  { lat: 41.5661, lng: 60.605 }, // Xorazm Stadium
  { lat: 39.5194, lng: -84.7328 }, // Yager Stadium
  { lat: 39.033611, lng: -95.700833 }, // Yager Stadium
  { lat: 46.5912, lng: -120.486 }, // Yakima County Stadium
  { lat: 38.264167, lng: 140.345556 }, // Yamagata City Athletic Stadium
  { lat: 34.154444, lng: 131.4375 }, // Yamaguchi Ishin Park Stadium
  { lat: 34.869722, lng: 135.803889 }, // Yamashiro Park Taiyogaoka Stadium
  { lat: 37.842913, lng: 113.600348 }, // Yangquan Stadium
  { lat: 35.344688, lng: 129.032218 }, // Yangsan Stadium
  { lat: 40.763056, lng: 47.0425 }, // Yashar Mammadzade Stadium
  { lat: 1.412389, lng: 103.832334 }, // Yishun Stadium
  { lat: 28.55509, lng: 112.352064 }, // Yiyang Stadium
  { lat: 35.629793, lng: 139.519375 }, // Yomiuri Giants Stadium
  { lat: 43.7775, lng: -79.5075 }, // Alumni Field
  { lat: 35.0639, lng: -82.3747 }, // Younts Stadium
  { lat: 22.661421, lng: 110.207233 }, // Yulin Stadium
  { lat: 29.94482, lng: -90.116816 }, // Yulman Stadium
  { lat: 35.648611, lng: 139.823611 }, // Yumenoshima Stadium
  { lat: 42.6863, lng: 23.3327 }, // Estadi Iunak
  { lat: 49.0042, lng: 33.6481 }, // Yunist Stadium
  { lat: 54.479, lng: 26.4044 }, // Yunost Stadium
  { lat: 43.221111, lng: 27.943056 }, // Yuri Gagarin Stadium
  { lat: 37.2728, lng: -76.7142 }, // Zable Stadium
  { lat: 40.49199, lng: 49.94755 }, // Zabrat Stadium
  { lat: 19.766667, lng: 96.07275 }, // Zabuthiri Stadium
  { lat: 43.89501, lng: 22.27347 }, // Zaječar City Stadium
  { lat: 19.89595, lng: 96.2487 }, // Zayyarthiri Stadium
  { lat: 42.078888888, lng: 20.420277777 }, // Zeqir Ymeri Stadium
  { lat: 0.000691666, lng: -51.080825 }, // Estadi Milton de Souza Corrêa
  { lat: 48.275, lng: 25.942 }, // Bukovyna Stadium
  { lat: 55.646956, lng: 12.511847 }, // Valby Idrætspark
  { lat: 41.924289, lng: -71.538575 }, // Beirne Stadium
  { lat: -2.9775, lng: 104.744 }, // Bumi Sriwijaya Stadium
  { lat: 0.39611111, lng: 32.46944444 }, // Bunamwaya Stadium
  { lat: 32.759875, lng: -96.811208 }, // Burnett Field
  { lat: 35.116543, lng: 129.014543 }, // Busan Gudeok Stadium
  { lat: 39.788056, lng: -86.188611 }, // Bush Stadium
  { lat: 39.844444, lng: -86.165833 }, // Bud and Jackie Sellick Bowl
  { lat: 33.2618, lng: -97.113 }, // C. H. Collins Athletic Complex
  { lat: -2.499734, lng: 32.899772 }, // CCM Kirumba Stadium
  { lat: 24.850833, lng: 66.991389 }, // CDGK Stadium
  { lat: 6.900278, lng: 79.870833 }, // CR & FC Grounds
  { lat: 6.900278, lng: 79.870833 }, // CR & FC Grounds
  { lat: 27.7071, lng: -97.4302 }, // Cabaniss Field
  { lat: 41.3721, lng: -72.0991 }, // Cadet Memorial Field
  { lat: 55.7025, lng: 12.572222 }, // Idrætsparken
  { lat: -16.9275, lng: 145.777778 }, // Cairns Convention Centre
  { lat: 30.215833, lng: -92.041944 }, // Cajun Field at Our Lady of Lourdes Stadium
  { lat: 9.414806, lng: -82.521769 }, // Calvin Byron Stadium
  { lat: 40.1645, lng: -80.2457 }, // Cameron Stadium
  { lat: 42.0693, lng: -71.0427 }, // Campanelli Stadium
  { lat: -34.050278, lng: 150.833611 }, // Campbelltown Stadium
  { lat: 39.09487778, lng: -9.25659444 }, // Campo Manuel Marques
  { lat: 38.2698, lng: -0.683464 }, // Camp d'Altabix
  { lat: 38.9925, lng: -0.516389 }, // Camp de Futbol La Murta
  { lat: 38.6768612, lng: -9.1693152 }, // Campo de Jogos do Pragal
  { lat: 41.2192, lng: -73.2458 }, // Campus Field
  { lat: 32.130232, lng: 34.840243 }, // Canada Stadium
  { lat: 35.1267, lng: -89.983 }, // Canale Arena
  { lat: 5.111389, lng: -1.257778 }, // Cape Coast Sports Stadium
  { lat: 36.9749, lng: -82.5644 }, // Carl Smith Stadium
  { lat: 36.591799, lng: -101.638888 }, // Carl Wooten Field
  { lat: 42.117778, lng: -80.093889 }, // Cathedral Prep Events Center
  { lat: 18.45793333, lng: -77.92139167 }, // Catherine Hall Sports Complex
  { lat: 55.8299, lng: -4.25319 }, // Cathkin Park
  { lat: -1.178731, lng: 136.086986 }, // Cendrawasih Stadium
  { lat: 51.34824, lng: 0.75926 }, // Central Park Stadium
  { lat: 37.7217, lng: -97.295519 }, // Cessna Stadium
  { lat: 15.218954, lng: 100.155546 }, // Chainat Stadium
  { lat: -31.9525, lng: 115.7825 }, // Perth Superdrome
  { lat: 8.5049, lng: 76.9507 }, // Chandrasekharan Nair Stadium
  { lat: 31.657929, lng: 120.777376 }, // Changshu Stadium
  { lat: 36.218506, lng: 113.073256 }, // Changzhi Stadium
  { lat: 31.606456, lng: 117.834736 }, // Chaohu Stadium
  { lat: 32.8348, lng: -96.6252 }, // Charger Stadium
  { lat: 38.540556, lng: -121.486667 }, // Charles C. Hughes Stadium
  { lat: 37.975613, lng: -87.533636 }, // Charles H. Braun Stadium
  { lat: -28.580697, lng: 28.83203 }, // Charles Mopeli Stadium
  { lat: -29.910398, lng: 30.877311 }, // Chatsworth Stadium
  { lat: 36.81876, lng: 127.115081 }, // Cheonan Stadium
  { lat: 42.876116991, lng: 27.890348593 }, // Chernomorets Stadium, Byala
  { lat: 42.490278, lng: 27.453056 }, // Chernomorets Stadium
  { lat: 16.069609, lng: 108.216475 }, // Chi Lang Stadium
  { lat: 35.646389, lng: 140.119444 }, // Chiba Sports Center Stadium
  { lat: 1.391173, lng: 103.749052 }, // Choa Chu Kang Stadium
  { lat: 32.044414, lng: -102.076131 }, // Christensen Stadium
  { lat: 57.44907222, lng: -2.78306111 }, // Christie Park, Huntly
  { lat: 40.951872, lng: -76.885403 }, // Christy Mathewson–Memorial Stadium
  { lat: 37.8537, lng: 127.6899 }, // Chuncheon Baseball Stadium
  { lat: 37.855952, lng: 127.690945 }, // Chuncheon Songam Sports Town
  { lat: 36.980383, lng: 127.936387 }, // Chungju Public Stadium
  { lat: 31.987332, lng: -102.155799 }, // Momentum Bank Ballpark
  { lat: 42.466667, lng: 21.464444 }, // City Stadium
  { lat: 42.905, lng: 21.19472222 }, // City Stadium
  { lat: 42.38388889, lng: 20.43444444 }, // City Stadium
  { lat: 37.5497, lng: -77.4868 }, // City Stadium
  { lat: 54.16583333, lng: 19.42111111 }, // City Stadium Elbląg
  { lat: 49.95, lng: 18.611944 }, // City Stadium Jastrzębie-Zdrój
  { lat: 28.966697, lng: -13.554307 }, // Ciudad Deportiva de Lanzarote
  { lat: 44.0367, lng: -123.091 }, // Civic Stadium
  { lat: -13.97825, lng: 33.758611 }, // Civo Stadium
  { lat: 56.822353, lng: -5.087075 }, // Claggan Park
  { lat: 30.287222222, lng: -97.736944444 }, // Clark Field
  { lat: 53.557222222, lng: -113.478055555 }, // Clarke Stadium
  { lat: 32.722021, lng: -97.131157 }, // Clay Gould Ballpark
  { lat: 32.72208, lng: -97.13112 }, // Clay Gould Ballpark
  { lat: 1.309845, lng: 103.763015 }, // Clementi Stadium
  { lat: 55.8603, lng: -4.01139 }, // Cliftonhill
  { lat: 42.024, lng: -93.653 }, // Clyde Williams Field
  { lat: 34.375666, lng: 132.422939 }, // Coca-Cola West Hiroshima Stadium
  { lat: 10.474183, lng: -66.939064 }, // Cocodrilos Sports Park
  { lat: -33.94, lng: 18.87 }, // Coetzenburg Stadium
  { lat: 40.861667, lng: -73.882778 }, // Coffey Field
  { lat: 31.891195, lng: -106.438272 }, // Cohen Stadium
  { lat: 40.572222, lng: -105.078056 }, // Colorado Field
  { lat: 29.688333333, lng: -95.408611111 }, // Colt Stadium
  { lat: 42.262928, lng: -71.823619 }, // Commerce Bank Field at Foley Stadium
  { lat: 40.8276, lng: -91.1369 }, // Community Field
  { lat: 33.2444, lng: -111.864 }, // Compadre Stadium
  { lat: 41.6938, lng: -86.2309 }, // Compton Family Ice Arena
  { lat: 29.624, lng: -95.647 }, // Constellation Field
  { lat: -39.9341, lng: 175.0493 }, // Cooks Gardens
  { lat: 60.5589, lng: -151.202 }, // Coral Seymour Ballpark
  { lat: 5.207214, lng: 96.724496 }, // Cot Gapu Stadium
  { lat: 29.7267, lng: -95.3452 }, // Schroeder Park
  { lat: 53.875278, lng: -1.9025 }, // Cougar Park
  { lat: 36.5857, lng: -79.4158 }, // Cougars Den
  { lat: 37.3094, lng: -89.5311 }, // Houck Field
  { lat: 35.3055, lng: -80.7381 }, // Irwin Belk Track and Field Center/Transamerica Field
  { lat: 35.3106, lng: -80.7403 }, // Jerry Richardson Stadium
  { lat: 35.6616, lng: -97.4708 }, // Wantland Stadium
  { lat: 41.8319, lng: -71.3955 }, // Stevenson Field
  { lat: 29.8911, lng: -97.9256 }, // Bobcat Stadium
  { lat: 33.58861111, lng: -101.87666667 }, // Dan Law Field at Rip Griffin Park
  { lat: 33.0634, lng: -96.7022 }, // John Clark Field
  { lat: 31.5525, lng: -97.13055556 }, // Katy Park
  { lat: 32.703136, lng: -97.372467 }, // Lupton Stadium
  { lat: 29.72194444, lng: -95.34916667 }, // TDECU Stadium
  { lat: 29.5387, lng: -95.2672 }, // Pearland Stadium
  { lat: 27.4979, lng: -99.4374 }, // Student Activity Complex
  { lat: 29.7264, lng: -95.3481 }, // Carl Lewis International Complex
  { lat: 41.80444444, lng: -72.25527778 }, // Memorial Stadium (Storrs)
  { lat: 42.1579, lng: -72.4699 }, // Lusitano Stadium
  { lat: 42.9693, lng: -85.8943 }, // Lubbers Stadium
  { lat: 42.2558, lng: -83.6472 }, // Rynearson Stadium
  { lat: 50.6692, lng: -120.366 }, // Hillside Stadium
  { lat: 50.7464, lng: 6.09453 }, // Waldstadion
  { lat: -33.76722222, lng: 150.94 }, // Gabbie Stadium
  { lat: -28.02861111, lng: 153.42861111 }, // Gold Coast Convention and Exhibition Centre
  { lat: -31.9503, lng: 115.782 }, // Western Australian Athletics Stadium
  { lat: 41.1248, lng: 37.2855 }, // Ünye İlçe Stadium
  { lat: 41.12472222, lng: 37.28555556 }, // Ünye İlçe Stadium
  { lat: 57.70583333, lng: 11.98083333 }, // Gamla Ullevi
  { lat: 41.067158, lng: -8.544812 }, // Estádio Municipal Dr. Jorge Sampaio
  { lat: 12.7678, lng: 101.166 }, // PTT Stadium
  { lat: 52.79333333, lng: 27.54972222 }, // Shakhtyor Stadium
  { lat: 52.79333333, lng: 27.54972222 }, // Shakhtyor Stadium
  { lat: 52.793325, lng: 27.55087222 }, // Shakhtyor Stadium
  { lat: 52.793325, lng: 27.55087222 }, // Shakhtyor Stadium
  { lat: -17.6894, lng: -149.58443 }, // Q15130022
  { lat: 46.838333, lng: 29.5575 }, // Bolshaya Sportivnaya Arena
  { lat: 32.627388888, lng: 35.317111111 }, // Afula Illit Stadium
  { lat: 55.43305556, lng: -2.76277778 }, // Albert Park
  { lat: 59.2477, lng: 18.2241 }, // Tyresövallen
  { lat: 39.855, lng: 44.689166666 }, // Ayg Stadium
  { lat: 39.855, lng: 44.689166666 }, // Ayg Stadium
  { lat: 39.855, lng: 44.68916667 }, // Ayg Stadium
  { lat: 39.855, lng: 44.68916667 }, // Ayg Stadium
  { lat: 13.8684344, lng: 100.8470571 }, // BEC Tero Sasana Nong Chok Stadium
  { lat: 41.9125, lng: 19.2439 }, // Stadion Olympic
  { lat: 23.72536944, lng: 90.42946389 }, // Bir Shreshtha Shaheed Shipahi Mostafa Kamal Stadium
  { lat: 23.46439444, lng: 91.18135833 }, // Comilla Stadium
  { lat: 21.43958056, lng: 91.97639444 }, // Cox’s Bazar Stadium
  { lat: 26.883799, lng: 81.058481 }, // Dr. Akhilesh Das Stadium
  { lat: 23.60446389, lng: 89.843375 }, // Faridpur Stadium
  { lat: 40.22111111, lng: 44.55527778 }, // Football Academy Stadium (Yerevan)
  { lat: 40.388491666, lng: -3.705211111 }, // Estadio Román Valero
  { lat: 37.721442, lng: 140.363474 }, // estadi de beisbol Fukushima Azuma
  { lat: 37.721458, lng: 140.363603 }, // estadi de beisbol Fukushima Azuma
  { lat: 41.664807, lng: 123.37856 }, // Green Island Stadium
  { lat: 57.29045278, lng: -2.38150833 }, // Harlaw Park
  { lat: 30.27526944, lng: -81.5117 }, // Hodges Stadium
  { lat: 40.581475, lng: 22.94511389 }, // Kalamaria Stadium
  { lat: 43.42833333, lng: 28.33111111 }, // Kavarna Stadium
  { lat: 24.822691, lng: 93.95245 }, // Khuman Lampak Main Stadium
  { lat: 22.4942, lng: 88.3945 }, // Kishore Bharati Krirangan
  { lat: 24.441027777, lng: 90.778238888 }, // Kishoreganj Football Stadium
  { lat: -6.583517, lng: 110.66369 }, // Krida Bakti Stadium
  { lat: 31.386152, lng: 120.905201 }, // Kunshan Stadium
  { lat: 57.54083333, lng: -2.94472222 }, // Kynoch Park
  { lat: 35.56055556, lng: 35.74472222 }, // Latakia Sports City Stadium
  { lat: 43.13333333, lng: 25.7 }, // Lokomotiv Stadium (Gorna Oryahovitsa)
  { lat: 57.61263056, lng: -3.61513611 }, // Mosset Park
  { lat: 24.76733611, lng: 90.38984444 }, // Mymensingh Stadium
  { lat: -34.008936, lng: 25.679037 }, // NMU Stadium
  { lat: 40.79666667, lng: -77.86972222 }, // New Beaver Field
  { lat: 43.22111111, lng: 27.94305556 }, // New Varna Stadium
  { lat: 23.95940833, lng: 91.11331944 }, // Niaz Mohammad Stadium
  { lat: 25.93202778, lng: 88.84560833 }, // Nilphamari Stadium
  { lat: 25.37527778, lng: 51.49583333 }, // Qatar University Stadium
  { lat: 25.7592, lng: 89.24970833 }, // Rangpur Stadium
  { lat: 40.8075, lng: -73.797777777 }, // Reinhart Field
  { lat: 22.87640833, lng: 91.09810556 }, // Shaheed Bulu Stadium
  { lat: 23.02013889, lng: 91.40247778 }, // Shaheed Salam Stadium
  { lat: 23.16400556, lng: 89.20316389 }, // Shamsul Huda Stadium
  { lat: 23.00422222, lng: 89.82738056 }, // Gopalganj Old Stadium
  { lat: 23.01006389, lng: 89.82751667 }, // Gopalganj International Cricket Stadium
  { lat: 38.03715, lng: 23.74154 }, // Agia Sophia Stadium
  { lat: 38.03715, lng: 23.74154 }, // Agia Sophia Stadium
  { lat: 19.7667, lng: 96.0727 }, // Wunna Theikdi Stadium
  { lat: 14.9272, lng: 102.05 }, // 80th Birthday Stadium
  { lat: 37.7572, lng: 112.53 }, // Shanxi Sports Centre Stadium
  { lat: 55.2615, lng: 22.2794 }, // Vytautas Stadium
  { lat: 24.2456, lng: 55.7166 }, // Estadi Hazza bin Zayed
  { lat: 50.6004, lng: 5.50372 }, // Stade du Pairay
  { lat: 17.0802048, lng: -96.7465228 }, // Estadio Tecnológico de Oaxaca
  { lat: -6.9769, lng: 108.4854 }, // Mashud Wisnusaputra Stadium
  { lat: 55.9825, lng: 23.8648 }, // Pakruojis Stadium
  { lat: 53.5492, lng: 13.2605 }, // Q15820659
  { lat: 39.20888889, lng: 45.41222222 }, // Estadi Ciutat de Naxçıvan
  { lat: 51.7393, lng: 14.3374 }, // Max-Reimann-Stadion
  { lat: 35.48725, lng: 24.00055556 }, // Perivolia Municipal Stadium
  { lat: 8.72652, lng: 49.33682 }, // Estadi Horseed
  { lat: 47.08867, lng: 28.77154 }, // Ghidighici Stadium
  { lat: 47.464, lng: 18.5868 }, // Pancho Arena
  { lat: 41.09333333, lng: 45.36611111 }, // Qazakh City Stadium
  { lat: 40.576667, lng: 48.381389 }, // Agsu City Stadium
  { lat: 43.3787, lng: 17.598 }, // Estadi Pecara
  { lat: 44.982039237, lng: 16.707993513 }, // Gradski stadion
  { lat: 44.9551, lng: 18.3081 }, // Stadion Dr. Milan Jelić
  { lat: 45.484497, lng: 15.563933 }, // Stadion Branko Čavlović-Čavlek
  { lat: 63.194722222, lng: 14.655833333 }, // Jämtkraft Arena
  { lat: 43.586122, lng: 20.227239 }, // Javor Stadium
  { lat: 42.708821, lng: 18.352743 }, // Police City Stadium
  { lat: 44.886944, lng: 18.412778 }, // Banja Ilidža
  { lat: 44.112667, lng: 15.246829 }, // Stadion Stanovi
  { lat: 40.4344, lng: -86.9183 }, // Ross–Ade Stadium
  { lat: 45.804722, lng: 15.960833 }, // Estadi Kranjčevićeva
  { lat: 45.283742, lng: 18.797382 }, // Stadion HNK Cibalia
  { lat: 31.314397, lng: 48.665008 }, // Takhti Stadium
  { lat: 47.840975, lng: 16.254101 }, // Arena Nova
  { lat: 43.46944444, lng: 17.32777778 }, // Mokri Dolac Stadium
  { lat: 41.332833, lng: -8.564367 }, // Estádio do Clube Desportivo Trofense
  { lat: 40.513611111, lng: -74.465277777 }, // SHI Stadium
  { lat: 42.087509448, lng: -87.700625415 }, // Ryan Field
  { lat: 36.086388888, lng: -115.016666666 }, // Sam Boyd Stadium
  { lat: 36.809722, lng: -119.738611 }, // Save Mart Center
  { lat: 42.444086, lng: -76.478656 }, // Schoellkopf Field
  { lat: 40.562222, lng: -105.141667 }, // Sonny Lubick Field at Hughes Stadium
  { lat: 53.55491389, lng: -2.65066111 }, // Springfield Park, Wigan
  { lat: 34.2167, lng: -5.7 }, // Q3495480
  { lat: 36.875, lng: 10.32 }, // Stade Abdelaziz Chtioui
  { lat: 36.728894, lng: 4.014039 }, // Hocine-Ait Ahmed Stadium
  { lat: 34.007264, lng: -6.8406147 }, // Q3495488
  { lat: 48.94443, lng: 2.90552 }, // Q3495494
  { lat: 43.2179, lng: 2.36442 }, // Stade d'Albert Domec
  { lat: 35.6663, lng: 10.1094 }, // Stade Ali Zouaoui
  { lat: 49.42765, lng: 1.05115 }, // Amable-et-Micheline-Lozai Stadium
  { lat: 50.70424, lng: 3.19538 }, // Stade Amédée-Prouvost
  { lat: 49.69812, lng: 2.80146 }, // Q3495507
  { lat: 44.80533, lng: -0.55245 }, // Stade André Moga
  { lat: -20.078889, lng: 57.6 }, // Stade Anjalay
  { lat: 13.72805556, lng: -89.72361111 }, // Estadio Anna Mercedes Campos
  { lat: 14.926111, lng: -88.246111 }, // Estadio Argelio Sabillón
  { lat: 44.468893, lng: 26.074991 }, // Stadionul Arcul de Triumf
  { lat: 9.344049, lng: -79.89584 }, // Estadio Armando Dely Valdés
  { lat: 13.927036, lng: -89.849053 }, // Estadio Simeón Magaña
  { lat: 33.6954, lng: -7.39919 }, // Stade El Bachir, Mohammédia
  { lat: 14.481667, lng: -4.184167 }, // Estadi Barema Bocoum
  { lat: 33.2416, lng: -8.49327 }, // Stade El Abdi
  { lat: -22.90055556, lng: -43.10583333 }, // Estádio Caio Martins
  { lat: 14.531667, lng: -91.509167 }, // Estadio Carlos Salazar Hijo
  { lat: 45.1872, lng: 5.741 }, // Q3495550
  { lat: 46.2536, lng: 5.645 }, // Stade Charles-Mathon
  { lat: 45.458, lng: -73.636 }, // Concordia Stadium
  { lat: 42.74724, lng: 2.92347 }, // estadi Daniel Ambert
  { lat: 1.198011, lng: -77.277608 }, // Estadio Departamental Libertad
  { lat: 32.3002, lng: -9.22957 }, // Stade El Massira
  { lat: 34.0057743, lng: -6.8648592 }, // Q3495577
  { lat: 31.6277, lng: -8.00956 }, // Stade El Harti
  { lat: 42.66324, lng: 9.43554 }, // Q3495582
  { lat: 50.8424, lng: 4.4451 }, // Fallon Stadium
  { lat: 34.7033, lng: 11.2078 }, // Farhat Hached stadium
  { lat: 45.18923, lng: 0.7036 }, // Stade Francis-Rongiéras
  { lat: 43.12649, lng: 0.38852 }, // Stade François Sarrat
  { lat: 43.52494225, lng: 5.46193107 }, // Georges-Carcassonne Stadium
  { lat: 44.94561, lng: 4.919267 }, // Stade Georges Pompidou
  { lat: 12.01305556, lng: -83.76611111 }, // Estadio El Pericón
  { lat: 43.89537, lng: -0.48264 }, // Stade André-et-Guy-Boniface
  { lat: 2.935833333, lng: -75.280277777 }, // Estadio Guillermo Plazas Alcid
  { lat: 35.6869, lng: 10.0736 }, // Q3495618
  { lat: 35.679167, lng: -0.675278 }, // Habib Bouakeul Stadium
  { lat: 15.400672, lng: -87.815287 }, // Estadio Humberto Micheletti
  { lat: 34.9202, lng: -82.4371 }, // Paladin Stadium
  { lat: 27.334131, lng: 88.611981 }, // Paljor Stadium
  { lat: 43.7747, lng: -79.5068 }, // York Lions Stadium
  { lat: 29.9944, lng: -90.0879 }, // Pan American Stadium
  { lat: 10.624926, lng: 122.965465 }, // Panaad Stadium
  { lat: 38.629967, lng: 21.411747 }, // Panetolikos Stadium
  { lat: 10.27652778, lng: 11.16847222 }, // Pantami Stadium
  { lat: 38.3893, lng: 21.81488 }, // Papacharalambeio National Stadium
  { lat: 52.4104, lng: -4.08074 }, // Park Avenue
  { lat: -39.5082, lng: 176.8569 }, // Park Island
  { lat: 37.5718, lng: -77.4637 }, // Parker Field
  { lat: 18.2262229, lng: -66.0341835 }, // Parque Yldefonso Solá Morales
  { lat: 29.6694, lng: -95.1832 }, // Pasadena Memorial Stadium
  { lat: 16.785392342, lng: 94.733974754 }, // Pathein Stadium
  { lat: 40.7957, lng: -81.4971 }, // Paul Brown Tiger Stadium
  { lat: 47.4313, lng: -120.34 }, // Paul Thomas Sr. Field
  { lat: 32.4122, lng: -81.7831 }, // Paulson Stadium
  { lat: 39.3211, lng: -82.1028 }, // Peden Stadium
  { lat: -33.758611, lng: 150.687778 }, // Penrith Stadium
  { lat: 51.751111, lng: -3.377778 }, // Penydarren Park
  { lat: 38.602937, lng: -95.262333 }, // AdventHealth Field
  { lat: 24.858611, lng: 66.988333 }, // Peoples Football Stadium
  { lat: 49.2903, lng: -122.784 }, // Percy Perry Stadium
  { lat: 42.8471, lng: -88.7449 }, // Perkins Stadium
  { lat: -31.937778, lng: 115.7925 }, // Perry Lakes Basketball Stadium
  { lat: -31.946389, lng: 115.79 }, // Perry Lakes Stadium
  { lat: -27.4433, lng: 153.039 }, // Perry Park
  { lat: -31.9511, lng: 115.8891 }, // Perth Stadium
  { lat: 32.097833, lng: 34.873203 }, // Petah Tikva Municipal Stadium
  { lat: 55.877761, lng: -4.229803 }, // Petershill Park
  { lat: 31.981667, lng: 35.903889 }, // Petra Stadium
  { lat: 30.027, lng: 31.446 }, // Petro Sport Stadium
  { lat: 8.449861, lng: 98.535472 }, // Phang Nga Province Stadium
  { lat: 16.443144, lng: 100.324005 }, // Phichit Stadium
  { lat: 14.578611, lng: 121.066389 }, // PhilSports Football and Athletics Stadium
  { lat: -34.018056, lng: 18.588889 }, // Philippi Stadium
  { lat: -25.751667, lng: 28.164722 }, // Pilditch Stadium
  { lat: 36.172335, lng: -82.757285 }, // Pioneer Field
  { lat: 37.6573, lng: -122.061 }, // Pioneer Stadium
  { lat: 27.99749, lng: -82.107911 }, // Plant City Stadium
  { lat: 37.197653, lng: -93.279772 }, // Plaster Sports Complex
  { lat: 10.694061, lng: -71.63675 }, // Plaza de toros Monumental de Maracaibo
  { lat: 13.979166666, lng: 108.005 }, // Pleiku Stadium
  { lat: 43.4125, lng: 24.60861111 }, // Estadi Pleven
  { lat: 34.16821, lng: 134.617839 }, // Pocarisweat Stadium
  { lat: 50.029661, lng: 15.781801 }, // Pod Vinicí
  { lat: -7.595123, lng: 112.774153 }, // Pogar Bangil Stadium
  { lat: 36.007778, lng: 129.359444 }, // Pohang Baseball Stadium
  { lat: 53.7667, lng: 87.1164 }, // Metallurg Stadium, Novokuznetsk
  { lat: 49.089752, lng: 33.430814 }, // Polytechnic Stadium
  { lat: 48.040277777, lng: 17.320833333 }, // Pomlé Stadium
  { lat: 26.2397, lng: -80.1073 }, // Pompano Beach Municipal Stadium
  { lat: 47.7631, lng: -122.211 }, // Pop Keeney Stadium
  { lat: -41.144722, lng: 174.856667 }, // Porirua Park
  { lat: 48.423333, lng: -89.239722 }, // Port Arthur Stadium
  { lat: -31.427222, lng: 152.872222 }, // Port Macquarie Regional Stadium
  { lat: 53.678611, lng: -1.354722 }, // Post Office Road
  { lat: 32.81277, lng: -98.07978 }, // Pratt Field
  { lat: 43.564922, lng: 19.533981 }, // Priboj City Stadium
  { lat: -13.710027777, lng: -172.207772222 }, // Prince Edwards Park, Lalomalava
  { lat: 25.886929, lng: 45.368021 }, // Prince Salman Bin Abdulaziz Sport City Stadium
  { lat: -29.744249, lng: 30.971264 }, // Princess Magogo Stadium
  { lat: 57.663326, lng: -2.517742 }, // Princess Royal Park
  { lat: 50.804181, lng: 0.320767 }, // Priory Lane
  { lat: 38.233611, lng: 21.741944 }, // Prosfygika Stadium
  { lat: 30.0431, lng: -94.07 }, // Provost Umphrey Stadium
  { lat: 37.6791, lng: 21.4282 }, // Pyrgos Stadium
  { lat: 24.929541, lng: 118.656262 }, // Quanzhou Sports Center
  { lat: -20.145108, lng: 28.588944 }, // Queens Sports Club
  { lat: 1.29589, lng: 103.802 }, // Queenstown Stadium
  { lat: 32.768219, lng: -96.98635 }, // Grand Prairie Stadium
  { lat: 52.215, lng: 20.993056 }, // RKS Skra Stadium
  { lat: -15.7178, lng: 46.3158 }, // Rabemananjara Stadium
  { lat: 22.51166667, lng: 88.35222222 }, // Rabindra Sarobar Stadium
  { lat: 31.56666667, lng: 74.35 }, // Railway Stadium
  { lat: 16.69305556, lng: 74.23027778 }, // Rajarshi Shahu Stadium
  { lat: 23.714281, lng: 92.735391 }, // Rajiv Gandhi Stadium Mualpui
  { lat: 43.024167, lng: 25.111389 }, // Rakovski Stadium
  { lat: 41.29583, lng: -72.9673 }, // Ralph F. DellaCamera Stadium
  { lat: 39.0765, lng: -108.552 }, // Ralph Stocker Stadium
  { lat: 37.7256, lng: -122.449 }, // Rams Stadium
  { lat: -26.2346, lng: 28.0516 }, // Rand Stadium
  { lat: 43.23270278, lng: 44.74112778 }, // Rashid Aushev Central Stadium
  { lat: 36.7677, lng: -119.7891 }, // Ratcliffe Stadium
  { lat: 31.9206, lng: -102.365 }, // Ratliff Stadium
  { lat: 34.7453, lng: -92.3275 }, // Ray Winder Field
  { lat: 45.092081, lng: -64.367416 }, // Raymond Field
  { lat: 51.104339, lng: -1.785758 }, // Raymond McEnhill Stadium
  { lat: 12.68, lng: 101.235278 }, // Rayong Province Central Stadium
  { lat: 29.713333, lng: -95.404167 }, // Reckling Park
  { lat: 56.1166, lng: -3.77864 }, // Recreation Park
  { lat: 41.3117, lng: -72.9619 }, // Reese Stadium
  { lat: 38.562905837, lng: -76.904098808 }, // Regency Furniture Stadium
  { lat: 38.345, lng: -97.1986 }, // Reimer Stadium
  { lat: 33.2133, lng: -87.5304 }, // Rhoads Stadium
  { lat: 40.76, lng: -111.848889 }, // Robert Rice Stadium
  { lat: 33.509444, lng: -90.343056 }, // Rice–Totten Field
  { lat: 29.905833, lng: -95.688611 }, // Richard E. Berry Educational Support Center
  { lat: 37.249546, lng: -96.974441 }, // Richard L. Jantz Stadium
  { lat: -28.743392, lng: 32.055874 }, // Richards Bay Stadium
  { lat: 35.4996, lng: -80.8428 }, // Richardson Stadium
  { lat: 39.3378, lng: -76.6525 }, // Ridley Athletic Complex
  { lat: 38.998611111, lng: -76.945277777 }, // Robert E. Taylor Stadium
  { lat: 18.376667, lng: -65.949167 }, // Roberto Clemente Stadium
  { lat: 29.39851, lng: -94.93464 }, // Robinson Stadium
  { lat: 36.2828, lng: -76.219 }, // Roebuck Stadium
  { lat: 46.7317, lng: -117.162 }, // Rogers Field
  { lat: 43.2668, lng: -79.9171 }, // Ron Joyce Stadium
  { lat: -21.777778, lng: -46.605833 }, // Ronaldão
  { lat: 37.145449, lng: 122.472178 }, // Rongcheng Stadium
  { lat: 40.706388888, lng: -74.104166666 }, // Roosevelt Stadium
  { lat: 49.0613, lng: -122.326 }, // Rotary Stadium
  { lat: 34.1204, lng: -109.285 }, // Round Valley Ensphere
  { lat: 37.7344, lng: -84.2974 }, // Roy Kidd Stadium
  { lat: 36.6213, lng: -88.3176 }, // Roy Stewart Stadium
  { lat: 41.0394, lng: -81.4561 }, // Rubber Bowl
  { lat: -26.071805555, lng: 27.866611111 }, // Ruimsig Stadium
  { lat: 51.310444, lng: -0.762306 }, // Rushmoor Stadium
  { lat: 40.513611, lng: -74.465278 }, // Rutgers Stadium
  { lat: 41.115875, lng: 20.091992 }, // Elbasan Arena
  { lat: 31.715, lng: -106.269 }, // SISD Student Activities Complex
  { lat: 33.276709, lng: 130.291693 }, // SAGA Sunrise Park Athletic Stadium
  { lat: 35.527904, lng: 139.386034 }, // Sagamihara Gion Stadium
  { lat: 39.280833, lng: -94.908333 }, // Saint Mary Field
  { lat: -18.996833, lng: 32.640925 }, // Sakubva Stadium
  { lat: 37.2877, lng: -80.0365 }, // Salem Football Stadium
  { lat: 38.8133, lng: -97.6061 }, // Salina Stadium
  { lat: 36.6942, lng: -121.652 }, // Salinas Sports Complex
  { lat: 37.7085, lng: -89.21624 }, // Saluki Stadium
  { lat: 39.613972, lng: 48.975028 }, // Salyan Olympic Sport Complex Stadium
  { lat: -28.311389, lng: -54.265833 }, // Estádio da Zona Sul
  { lat: 31.4306, lng: -100.46 }, // San Angelo Stadium
  { lat: -0.867538, lng: 134.061468 }, // Sanggeng Stadium
  { lat: 36.432297, lng: 128.161579 }, // Sangju Civic Stadium
  { lat: 37.4034, lng: -121.97 }, // Levi's Stadium
  { lat: -34.929444, lng: 138.578333 }, // SA Athletics Stadium
  { lat: 43.019066, lng: 141.464016 }, // Sapporo Atsubetsu Park Stadium
  { lat: 14.556724, lng: 100.904748 }, // Saraburi Province Central Stadium
  { lat: 38.496667, lng: 125.7575 }, // Sariwon Youth Stadium
  { lat: 41.29938889, lng: -82.22208333 }, // Savage Stadium
  { lat: 55.9367, lng: 23.2956 }, // Estadi Municipal de Šiauliai
  { lat: 40.2161, lng: -85.4167 }, // Scheumann Stadium
  { lat: 43.7, lng: -72.277778 }, // Scully-Fahey Field
  { lat: 57.3324, lng: -3.60092 }, // Seafield Park
  { lat: 37.766666666, lng: -122.409166666 }, // Seals Stadium
  { lat: 30.728889, lng: 76.745833 }, // Sector 42 Stadium
  { lat: -0.493091, lng: 117.149352 }, // Segiri Stadium
  { lat: 33.463236, lng: -86.795254 }, // Pete Hanna Stadium
  { lat: -3.79305556, lng: 102.27277778 }, // Semarak Stadium
  { lat: 38.258537, lng: 140.904036 }, // Sendai City Athletic Stadium
  { lat: 41.084689, lng: 23.546577 }, // Serres Municipal Stadium
  { lat: 40.0643, lng: -77.5253 }, // Seth Grove Stadium
  { lat: 22.3872, lng: 114.197 }, // Sha Tin Sports Ground
  { lat: 40.48793, lng: 50.12903 }, // Shagan Olympic Sport Complex Stadium
  { lat: 42.65277778, lng: 20.29388889 }, // Shahin Haxhiislami Stadium
  { lat: 40.834852, lng: 46.029123 }, // Shamkir City Stadium
  { lat: 37.8278, lng: 112.561 }, // Shanxi Provincial Stadium
  { lat: -3.36888889, lng: 36.68583333 }, // Sheikh Amri Abeid Memorial Stadium
  { lat: 32.760381, lng: 21.7421 }, // Sheikh Chadae Stadium
  { lat: 24.39638889, lng: 54.54055556 }, // Sheikh Zayed Cricket Stadium
  { lat: 42.01166667, lng: 24.86444444 }, // Shipka
  { lat: 38.989167, lng: -76.944167 }, // Shipley Field
  { lat: 35.152778, lng: 138.847778 }, // Shizuoka Ashitaka Athletic Stadium
  { lat: 32.4338, lng: -99.6982 }, // Shotwell Stadium
  { lat: 35.612111111, lng: 51.358055555 }, // Kazemi Stadium
  { lat: 51.23847, lng: 5.09278 }, // Q16062424
  { lat: 50.7362, lng: 5.70772 }, // Stade de la Cité de l'Oie
  { lat: 50.4133, lng: 3.77904 }, // Robert Urbain Stadium
  { lat: 46.6075, lng: 16.2292 }, // Beltinci Sports Park
  { lat: 35.730277777, lng: 51.392027777 }, // University of Tehran Stadium
  { lat: 31.7739, lng: 35.2219 }, // Jerusalem International YMCA Stadium
  { lat: 41.550252, lng: -72.776126 }, // Falcon Field
  { lat: 23.39277755, lng: 85.329051861 }, // Birsa Munda Football Stadium
  { lat: 38.306194444, lng: 116.798861111 }, // Cangzhou Stadium
  { lat: 40.1589, lng: 44.2908 }, // Vagharshapat City Stadium
  { lat: -2.88517, lng: -78.98946 }, // Q16303216
  { lat: -35.001232, lng: -71.380139 }, // Estadio Municipal de Sagrada Familia
  { lat: 40.1647, lng: 44.0453 }, // Armavir City Stadium
  { lat: 37.951727, lng: 23.645042 }, // Papastratio Swimming Pool
  { lat: 0.615845, lng: 73.0968 }, // Hithadhoo Zone Stadium
  { lat: 40.334883, lng: 49.835045 }, // Q16417001
  { lat: 52.5444, lng: 17.6125 }, // Q16484644
  { lat: -34.890647222, lng: -58.563263888 }, // Estadio 20 de Octubre
  { lat: -8.117979, lng: -79.016333 }, // Q16492903
  { lat: 16.713638888, lng: -99.691083333 }, // Q16492909
  { lat: 12.6380311, lng: -87.1408342 }, // Efraín Tijerino Stadium
  { lat: -25.504055555, lng: -57.3635 }, // Q16492929
  { lat: 8.07972, lng: -63.5172 }, // Q16492933
  { lat: 19.829722222, lng: -90.554444444 }, // Estadio Universitario de Campeche
  { lat: 51.061, lng: 4.34719 }, // Q16511399
  { lat: 35.6286, lng: 5.9117 }, // Stade Abderrahmene Bensaci
  { lat: 35.631, lng: 5.908 }, // Stade Abderrahmene Bensaci
  { lat: 36.9042, lng: 7.75194 }, // Stade 19 mai 1956
  { lat: 14.7697, lng: -16.9442 }, // Stade Lat-Dior
  { lat: 51.167, lng: 4.82574 }, // Q16511460
  { lat: 50.9478, lng: 3.13704 }, // Q16511462
  { lat: 50.8042165, lng: 4.9451261 }, // Q16511464
  { lat: 50.8042165, lng: 4.9451261 }, // Q16511464
  { lat: 50.8047, lng: 4.94813 }, // Q16511464
  { lat: 50.8047, lng: 4.94813 }, // Q16511464
  { lat: 36.0667, lng: 4.76667 }, // Stade 20 Août 1955
  { lat: 36.2675, lng: 2.7501 }, // Stade Imam Lyes de Médéa
  { lat: 36.261667, lng: 2.769722 }, // Stade Imam Lyes de Médéa
  { lat: 35.4053, lng: 8.11632 }, // Stade du 4 Mars
  { lat: 9.51741, lng: 45.5402 }, // Q16527012
  { lat: -8.76841, lng: 160.699 }, // Q16527872
  { lat: 12.1938, lng: -61.7061 }, // Alston George Park
  { lat: 18.2182, lng: -63.0501 }, // Q16529037
  { lat: 13.0187, lng: 42.7469 }, // Q16530442
  { lat: 30.4412, lng: 47.7871 }, // Q16531664
  { lat: 17.2935, lng: -62.7313 }, // Q16531668
  { lat: 15.57472222, lng: -61.45444444 }, // Benjamin's Park
  { lat: 13.2755, lng: -16.65 }, // Q16533211
  { lat: 0.341915, lng: 33.0284 }, // Buikwe Stadium
  { lat: -33.4584, lng: -70.5177 }, // Q16535232
  { lat: -18.0087, lng: 31.0902 }, // Q16536081
  { lat: 27.6778, lng: 85.3342 }, // Chyasal ANFA Technical Football Center
  { lat: 18.7637, lng: -69.643 }, // Q16544093
  { lat: 21.3787, lng: -77.9098 }, // Q16544119
  { lat: 19.1174, lng: -70.6385 }, // Q16544126
  { lat: 12.2835, lng: -14.2266 }, // Q16544164
  { lat: 12.1781, lng: -14.6536 }, // Estádio Rocha
  { lat: 0.300771, lng: 73.4252 }, // Q16546553
  { lat: 15.2466, lng: -61.3105 }, // Q16549169
  { lat: 10.61186, lng: -66.8735 }, // Hugo Chávez Coliseum
  { lat: 17.135, lng: -62.6261 }, // Q16555802
  { lat: 4.175, lng: 73.5169 }, // Henveiru Stadium
  { lat: 34.3419, lng: 62.2031 }, // Q16557592
  { lat: -28.8735, lng: 28.0549 }, // Q16558228
  { lat: -8.10433, lng: 156.842 }, // John F. Kennedy Stadium
  { lat: 15.7777, lng: 38.4577 }, // Q16563529
  { lat: 25.4464, lng: -108.074 }, // Estadio Alfredo Díaz Angulo
  { lat: -24.7793, lng: -65.42135 }, // Doctor Luis Güemes Stadium
  { lat: -34.595732795, lng: -58.525635888 }, // Monumental de Villa Lynch Stadium
  { lat: -14.781595, lng: -71.41425 }, // Q16564684
  { lat: -33.36627, lng: -70.748975 }, // Q16564691
  { lat: -31.418069444, lng: -62.0795 }, // Q16564706
  { lat: 28.707272222, lng: -17.762397222 }, // Q16564739
  { lat: 7.051903, lng: -73.080774 }, // Estadio Álvaro Gómez Hurtado
  { lat: 40.994, lng: 28.912 }, // Zeytinburnu Stadium
  { lat: 43.664659, lng: 51.147333 }, // Jas Qanat Stadium
  { lat: 39.667647, lng: 20.848669 }, // Zosimades Stadium
  { lat: 40.014578, lng: 52.987995 }, // Şagadam Stadium
  { lat: 41.04416667, lng: 29.01704722 }, // Şeref Stadium
  { lat: 44.7308, lng: 20.3884 }, // Železnik Stadium
  { lat: -15.836146, lng: -48.080657 }, // Estadi Elmo Serejo Farias
  { lat: 36.411613, lng: 139.053258 }, // Shoda Shoyu Stadium Gunma
  { lat: 41.64444351, lng: -4.76333332 }, // Ciudad Deportiva del Real Valladolid
  { lat: -6.90141667, lng: 109.71725 }, // Moh Sarengat Stadium
  { lat: 39.7722, lng: 2.71735 }, // Camp d'en Maiol
  { lat: 49.464624, lng: -2.562906 }, // Footes Lane
  { lat: 31.4359, lng: -100.454 }, // Foster Field
  { lat: 43.256572222, lng: -5.780241666 }, // Estadio Hermanos Antuña
  { lat: -33.398927, lng: -71.688202 }, // Q8842844
  { lat: 42.4769, lng: -2.45686 }, // Estadi Mundial 82
  { lat: -12.05972, lng: -77.11995 }, // Estadio Miguel Grau
  { lat: 43.6137, lng: -5.80009 }, // Estadio Municipal de Miramar
  { lat: -33.49395556, lng: -70.67103611 }, // Q8842866
  { lat: 39.362552, lng: 21.935127 }, // Municipal Stadium of Karditsa
  { lat: -28.580575, lng: -70.758817 }, // Q8842868
  { lat: 28.059722222, lng: -16.726111111 }, // Antonio Domíngez Alfonso Olympic Stadium
  { lat: 43.1517, lng: -2.97306 }, // Estadi Ellakuri
  { lat: 36.589505877, lng: -6.224651022 }, // Portuense F.C.
  { lat: 36.589641666, lng: -6.224111111 }, // Portuense F.C.
  { lat: 42.3599, lng: 19.3264 }, // Stadion Tuško Polje
  { lat: 47.4639, lng: 8.31392 }, // Q9149153
  { lat: -29.687, lng: -53.8286 }, // Estádio Presidente Vargas
  { lat: 13.0114, lng: -61.2329 }, // Q9193275
  { lat: 19.3811, lng: -81.3987 }, // ED Bush Stadium
  { lat: 13.71805556, lng: -89.14055556 }, // Estadio España
  { lat: 13.7183, lng: -89.1407 }, // Estadio España
  { lat: -28.393003, lng: -53.918953 }, // Q9255144
  { lat: -9.42781, lng: -40.502 }, // Q9255146
  { lat: -10.285306, lng: -36.571544 }, // Q9255152
  { lat: -9.663694, lng: -37.125619 }, // Q9255156
  { lat: -18.505013287, lng: -54.753566063 }, // Q9255157
  { lat: -10.736111, lng: -36.854444 }, // Q9255159
  { lat: -28.943056, lng: -51.549167 }, // Q9255163
  { lat: -20.56800556, lng: -48.56366111 }, // Q9255167
  { lat: -20.568056, lng: -48.563611 }, // Q9255167
  { lat: -11.1875, lng: -37.992778 }, // Q9255171
  { lat: -12.1403, lng: -38.4152 }, // Q9255173
  { lat: -3.818056, lng: -38.449167 }, // Estádio Antônio Cruz
  { lat: -15.826389, lng: -47.972222 }, // Q9255176
  { lat: -10.487222, lng: -37.191667 }, // Q9255179
  { lat: -32.092778, lng: -52.158889 }, // Q9255180
  { lat: -29.821667, lng: -51.150833 }, // Q9255181
  { lat: -27.1014, lng: -48.9161 }, // Estádio Augusto Bauer
  { lat: -20.788333, lng: -51.678056 }, // Q9255184
  { lat: -9.919722, lng: -37.2725 }, // Q9255186
  { lat: -9.577222, lng: -48.391944 }, // Q9255190
  { lat: -18.913889, lng: -54.8525 }, // Q9255193
  { lat: -15.688333, lng: -48.196667 }, // Q9255194
  { lat: -12.7169, lng: -38.3153 }, // Estádio Armando Oliveira
  { lat: -9.155, lng: -35.533056 }, // Q9255203
  { lat: -12.91263, lng: -38.44133 }, // Q9255205
  { lat: -17.730278, lng: -48.162778 }, // Q9255216
  { lat: -12.784444, lng: -38.402222 }, // Q9255217
  { lat: -1.294722, lng: -48.163333 }, // Q9255218
  { lat: -9.53, lng: -37.293889 }, // Q9255221
  { lat: -21.696111, lng: -45.26 }, // Q9255224
  { lat: -6.367874, lng: -39.302763 }, // Elmo Moreno Stadium
  { lat: -3.708611, lng: -38.588333 }, // Vila Olímpica Elzir Cabral
  { lat: -19.819167, lng: -40.276389 }, // Q9255234
  { lat: -29.453611, lng: -51.971944 }, // Q9255240
  { lat: -3.135556, lng: -58.443611 }, // Q9255242
  { lat: -4.090278, lng: -38.484444 }, // Q9255244
  { lat: -2.700556, lng: -59.699444 }, // Q9255248
  { lat: -31.757797, lng: -52.380806 }, // Q9255252
  { lat: -18.167289, lng: -47.953081 }, // Estádio Genervino da Fonseca
  { lat: -11.480183, lng: -37.753872 }, // Q9255256
  { lat: -25.116239, lng: -50.156622 }, // Estádio Germano Krüger
  { lat: -11.871547, lng: -55.499561 }, // Q9255260
  { lat: -5.116, lng: -42.793 }, // Albertão
  { lat: -9.364169, lng: -37.250411 }, // Q9255269
  { lat: -7.234675, lng: -39.394469 }, // Q9255273
  { lat: -7.016103, lng: -42.120864 }, // Q9255275
  { lat: -1.723539, lng: -48.882804 }, // Q9255280
  { lat: -19.610851, lng: -43.224324 }, // Q9255284
  { lat: -15.779806, lng: -47.786381 }, // Paranoá JK Stadium
  { lat: -15.879439, lng: -48.088719 }, // Q9255289
  { lat: -4.984203, lng: -39.018308 }, // Q9255295
  { lat: -7.016011, lng: -37.283642 }, // Estadi José Cavalcanti
  { lat: -18.84941111, lng: -41.94107222 }, // Estádio José Mammoud Abbas
  { lat: -10.220611, lng: -36.840172 }, // Q9255306
  { lat: -15.882367, lng: -52.263283 }, // Q9255307
  { lat: -7.299864, lng: -38.149611 }, // Q9255308
  { lat: -7.884931, lng: -35.461269 }, // Q9255309
  { lat: -5.160756, lng: -38.095008 }, // Q9255311
  { lat: -26.49777778, lng: -49.09666667 }, // Q9255313
  { lat: -6.342914, lng: -47.427872 }, // Q9255315
  { lat: -5.790790036, lng: -35.196062456 }, // Estádio Juvenal Lamartine
  { lat: -6.326394, lng: -47.428731 }, // Q9255326
  { lat: -1.444008, lng: -48.462958 }, // Estádio da Curuzú
  { lat: -1.444008, lng: -48.462958 }, // Estádio da Curuzú
  { lat: -1.443888888, lng: -48.463055555 }, // Estádio da Curuzú
  { lat: -1.443888888, lng: -48.463055555 }, // Estádio da Curuzú
  { lat: -14.870206, lng: -40.825936 }, // Estádio Lomanto Júnior
  { lat: -7.090314, lng: -35.221917 }, // Q9255333
  { lat: 16.179194444, lng: -22.909305555 }, // Estadio Municipal Arsénio Ramos
  { lat: 17.02125, lng: -25.076805555 }, // Estádio Municipal do Porto Novo
  { lat: 47.8408, lng: 33.342 }, // Southern Iron Ore Enrichment Works Stadium
  { lat: 39.74787, lng: -8.702226 }, // Campo da Mata
  { lat: 37.6631, lng: 128.6876 }, // Alpensia Biathlon Centre
  { lat: 37.6631, lng: 128.6876 }, // Alpensia Biathlon Centre
  { lat: 44.39028, lng: 26.10333 }, // Stadionul ANEFS
  { lat: 44.4393, lng: 26.0701 }, // Stadionul ANEFS
  { lat: 14.897611111, lng: -24.495486111 }, // Estadi 5 de Julho
  { lat: 53.4812, lng: -2.1928 }, // Academy Stadium
  { lat: 19.4105, lng: -99.10886111 }, // Estadio Fray Nano
  { lat: 60.7015419, lng: 28.75697136 }, // Avangard Stadium
  { lat: 62.235277777, lng: 25.723611111 }, // Hippos
  { lat: 62.782155, lng: 22.85477 }, // Seinäjoen pesäpallostadion
  { lat: 60.871484, lng: 26.710925 }, // KSS Energia Areena
  { lat: 62.965077, lng: 23.013008 }, // Lukkarila baseball stadium
  { lat: 62.106389, lng: 30.14119 }, // Rantakenttä
  { lat: 61.805763, lng: 22.401473 }, // Q18662348
  { lat: 63.357221944, lng: 27.402221944 }, // Valio Areena
  { lat: 57.7192, lng: 11.9306 }, // Nordic Wellness Arena
  { lat: 46.45267, lng: -1.17268 }, // Stade Jean-de-Mouzon
  { lat: 21.0065585, lng: 107.2756533 }, // Cẩm Phả Stadium
  { lat: 33.9504, lng: -118.338 }, // SoFi Stadium
  { lat: 31.941111111, lng: 5.343055555 }, // Olympic Ouargla Stadium
  { lat: 33.400336111, lng: 6.878261111 }, // Stade 1er Novembre 1954
  { lat: 36.5668, lng: 3.14904 }, // Stade Ismaïl Makhlouf
  { lat: 15.56, lng: 108.50666667 }, // Tam Kỳ Stadium
  { lat: 38.9433, lng: -77.0009 }, // Cardinal Stadium
  { lat: 52.2474, lng: 26.80492 }, // Polesye Stadium
  { lat: -6.05444444, lng: 106.15102778 }, // Maulana Jusuf Stadium
  { lat: -6.564369, lng: 107.4455 }, // Purnawarman Stadium
  { lat: -0.411833, lng: 116.983611 }, // Rondong Demang Stadium
  { lat: -2.176472222, lng: 113.884555555 }, // Tuah Pahoe Stadium
  { lat: 33.1382, lng: -96.7052 }, // Gabe Nesbitt Stadium
  { lat: 38.936419402, lng: -76.996504973 }, // Brookland Stadium
  { lat: 42.81833333, lng: -103.00027778 }, // Elliott Field at Don Beebe Stadium
  { lat: 29.9358, lng: -95.5699 }, // Ken Pridgeon Stadium
  { lat: 23.7278, lng: 90.4134 }, // Bir Shreshtha Mustafa Kamal Stadium
  { lat: 40.9876, lng: 113.1367 }, // Ulanqab Stadium
  { lat: 54.6015, lng: 53.6886 }, // Tuymazy-Arena named after Gimayev
  { lat: -33.287212, lng: -66.340921 }, // Q20014127
  { lat: 19.365555555, lng: -99.350555555 }, // Alberto Pérez Navarro Stadium
  { lat: -25.343857, lng: -57.608311 }, // Q20024748
  { lat: 42.413611, lng: 27.696944 }, // Arena Sozopol
  { lat: 48.026666666, lng: 33.480833333 }, // Sukha Balka Stadium
  { lat: 38.011944444, lng: -3.3825 }, // Q20154624
  { lat: 53.86166667, lng: 27.57861111 }, // FC Minsk Stadium
  { lat: 45.94095612, lng: 6.4312582 }, // Sylvie Becaert Biathlon Stadium
  { lat: 11.604732, lng: 104.89438 }, // RSN Stadium
  { lat: 31.93925, lng: 34.893166666 }, // Lod Municipal Stadium
  { lat: 36.32555556, lng: -82.36944444 }, // Kermit Tipton Stadium
  { lat: 46.51409167, lng: 6.601525 }, // Stade Pierre de Coubertin
  { lat: -33.594481, lng: -70.690268 }, // Estadio Municipal de San Bernardo
  { lat: 11.66493056, lng: 76.19032778 }, // Krishnagiri Stadium
  { lat: 23.63, lng: 85.5425 }, // Jaipal Singh Stadium
  { lat: 36.116667, lng: 6 }, // Lahoua Smaïl Stadium
  { lat: 11.584528, lng: 37.382944 }, // Bahir Dar Stadium
  { lat: 11.584722, lng: 37.382778 }, // Bahir Dar Stadium
  { lat: -3.40637, lng: -78.58 }, // Q20994063
  { lat: 53.8177, lng: -1.58198 }, // Headingley Cricket Ground
  { lat: 41.36078333, lng: 2.15430556 }, // Estadi Pau Negre
  { lat: 22.245878, lng: 84.864286 }, // Biju Patnaik Hockey Stadium
  { lat: 31.202, lng: 77.423 }, // Shilaroo Hockey Stadium
  { lat: 28.442222222, lng: 77.036388888 }, // Tau Devi Lal Cricket Stadium
  { lat: 41.801878, lng: -72.256171 }, // Connecticut Softball Stadium
  { lat: 54.216009, lng: 30.288571 }, // Q21392992
  { lat: 21.145462, lng: -101.659543 }, // Estadio Domingo Santana
  { lat: 24.015825, lng: -104.689728 }, // Estadio Francisco Villa
  { lat: 5.47814, lng: 10.54685 }, // Estadi Omnisports de Bafoussam
  { lat: 40.546681, lng: 70.939747 }, // Markaziy Stadium (Kokand)
  { lat: 50.360018, lng: 26.16039 }, // Mototrek Stadium, Rivne
  { lat: 24.578229, lng: 73.712396 }, // Maharana Bhupal Stadium
  { lat: 41.388527777, lng: 41.428611111 }, // Hopa City Stadium
  { lat: -12.396111111, lng: 130.88 }, // Larrakia Park
  { lat: 51.607, lng: -1.792 }, // Abbey Greyhound Stadium
  { lat: 31.803138888, lng: 34.655722222 }, // Ashdod Multi-purpose stadium
  { lat: 51.8745, lng: -8.54822222 }, // Bishopstown Stadium
  { lat: 42.3924, lng: -83.0489 }, // Keyworth Stadium
  { lat: -6.244878, lng: 106.806761 }, // PTIK Stadium
  { lat: 14.31472222, lng: 121.07777778 }, // Biñan Football Stadium
  { lat: 43.37286, lng: 5.36285 }, // Stade La Martine
  { lat: 46.877611111, lng: -1.010638888 }, // Stade Massabielle
  { lat: 46.87743, lng: -1.0099 }, // Stade Massabielle
  { lat: 48.681287, lng: -1.358394 }, // Stade René-Fenouillère
  { lat: 49.1776, lng: 2.23243 }, // Stade des Marais
  { lat: 15.45916667, lng: 75.00527778 }, // RN Shetty Stadium
  { lat: 41.84531, lng: -71.43354 }, // Chapey Field at Anderson Stadium
  { lat: -22.860911, lng: -43.406619 }, // Deodoro Stadium
  { lat: 40.35892, lng: 50.29311 }, // Zira Olympic Sport Complex Stadium
  { lat: 3.7719279, lng: 102.5459609 }, // Tun Abdul Razak Stadium
  { lat: 40.569781, lng: -105.087949 }, // Canvas Stadium
  { lat: 42.411121, lng: 12.8889 }, // Q24084725
  { lat: 19.3875, lng: -70.533333333 }, // Estadio Bragaña García
  { lat: -25.750637712, lng: 28.248443438 }, // Tuks Stadium
  { lat: 32.74736111, lng: -97.08416667 }, // Globe Life Field
  { lat: 43.3263399, lng: 45.6889673 }, // Grozny Coliseum
  { lat: -15.827928, lng: -48.110333 }, // Q9255342
  { lat: -1.2864, lng: -47.927083 }, // Estádio Maximino Porpino Filho
  { lat: -11.444431, lng: -61.437903 }, // Q9255353
  { lat: -26.22491389, lng: -51.08263333 }, // Q9255355
  { lat: -9.747667, lng: -36.666806 }, // Estádio Municipal Coaracy da Mata Fonseca
  { lat: -16.457782, lng: -54.600236 }, // Q9255385
  { lat: -9.314972, lng: -35.560444 }, // Q9255387
  { lat: -3.28306, lng: -60.63139 }, // Q9255398
  { lat: -22.251389, lng: -45.921667 }, // Estádio Municipal Irmão Gino Maria Rossi
  { lat: -19.53888889, lng: -40.63888889 }, // Q9255419
  { lat: -21.268947, lng: -50.331394 }, // Estádio Municipal Pedro Marin Berbel
  { lat: -3.674195, lng: -40.363473 }, // Estádio do Junco
  { lat: -24.045556, lng: -52.390278 }, // Q9255462
  { lat: -20.941944, lng: -48.493611 }, // Estádio Municipal Sócrates Stamato
  { lat: -5.351944, lng: -49.138333 }, // Estádio Municipal Zinho de Oliveira
  { lat: -20.85305556, lng: -41.11305556 }, // Q9255492
  { lat: -14.790639, lng: -39.034119 }, // Estádio Mário Pessoa
  { lat: -17.570833, lng: -52.556944 }, // Q9255505
  { lat: -9.643056, lng: -36.210833 }, // Q9255507
  { lat: -7.953333, lng: -36.201944 }, // Estádio Otávio Limeira Alves
  { lat: -30.006667, lng: -51.173611 }, // Estádio Passo D'Areia
  { lat: -10.921389, lng: -37.672222 }, // Q9255515
  { lat: -9.390278, lng: -40.504444 }, // Q9255517
  { lat: -31.32983056, lng: -54.11645 }, // Estádio Pedra Moura
  { lat: -3.505833, lng: -39.579167 }, // Q9255523
  { lat: -10.688333, lng: -37.431944 }, // Estádio Etelvino Mendonça
  { lat: -10.894167, lng: -37.053056 }, // Q9255527
  { lat: -7.219444, lng: -35.903056 }, // Q9255531
  { lat: -20.1275, lng: -40.304167 }, // Q9255534
  { lat: -20.316111, lng: -40.308333 }, // Estádio Salvador Costa
  { lat: -12.983333, lng: -38.473056 }, // Estádio Parque Santiago
  { lat: -1.061944, lng: -46.798611 }, // Estádio São Benedito
  { lat: -15.881111, lng: -47.975833 }, // Q9255557
  { lat: -8.343611, lng: -36.444722 }, // Q9255561
  { lat: -20.143056, lng: -44.879722 }, // Q9255563
  { lat: -23.308333, lng: -51.151944 }, // Q9255565
  { lat: -13.876111, lng: -40.083611 }, // Q9255567
  { lat: -12.3926, lng: 13.5537 }, // Estádio do Buraco
  { lat: -29.709167, lng: -52.4225 }, // Estádio dos Plátanos
  { lat: 45.8382, lng: 20.4565 }, // City Stadium Kikinda
  { lat: 40.2901, lng: -76.6581 }, // Hersheypark Stadium
  { lat: 52.65, lng: -8.61667 }, // Q9293209
  { lat: -5.8894, lng: -35.1801 }, // Estadi Maria Lamas Farache
  { lat: -18.408611, lng: -49.243611 }, // Estádio JK
  { lat: -2.536286, lng: -44.289145 }, // Estádio Nhozinho Santos
  { lat: 30.5732, lng: 103.894 }, // Shuangliu Sports Centre
  { lat: 49.28341, lng: -0.71747 }, // Q9341073
  { lat: 5.50074, lng: -54.02711 }, // René-Long Stadium
  { lat: 5.49938, lng: -54.02619 }, // René-Long Stadium
  { lat: 16.21003, lng: -61.50237 }, // Q9341076
  { lat: 49.17596, lng: -0.32036 }, // Q9341077
  { lat: -3.47704, lng: 30.2474 }, // Q9341086
  { lat: 48.74775, lng: -0.58224 }, // Q9341090
  { lat: 44.1456, lng: 12.4503 }, // Q9341093
  { lat: 44.3433, lng: 11.71 }, // Q9341096
  { lat: 52.016667, lng: 18.489778 }, // Q9341100
  { lat: 12.86527778, lng: 45.0125 }, // Estadi 22 de maig
  { lat: 52.2225, lng: 17.2729 }, // Q9341102
  { lat: 54.474447, lng: 17.045172 }, // Q9341103
  { lat: 52.719722222, lng: 16.374166666 }, // Amica Wronki Stadium
  { lat: 53.460694444, lng: 14.511444444 }, // Stadion Arkonii Szczecin
  { lat: 50.5474, lng: 137.016 }, // Vanguard Stadium
  { lat: 50.2461, lng: 28.6689 }, // Central Stadium
  { lat: 56.2356, lng: 43.4587 }, // Khimik Stadium
  { lat: 56.2356, lng: 43.4587 }, // Khimik Stadium
  { lat: 56.235667, lng: 43.458639 }, // Khimik Stadium
  { lat: 56.235667, lng: 43.458639 }, // Khimik Stadium
  { lat: 51.6118, lng: 15.3106 }, // Q9341114
  { lat: 46.2466, lng: 30.4496 }, // Viktor Dukov Dnister Stadium
  { lat: 49.2489, lng: 24.6369 }, // Enerhetyk Stadium, Burshtyn
  { lat: 50.037778, lng: 19.934722 }, // Stadion RKS Garbarnia
  { lat: 50.044167, lng: 19.935556 }, // Q9341123
  { lat: 53.015422, lng: 18.562411 }, // Q9341126
  { lat: 51.499166666, lng: 16.065277777 }, // Q9341131
  { lat: 49.655, lng: 20.972778 }, // Q9341133
  { lat: 45.3236959, lng: 14.4684263 }, // Stadion Krimeja
  { lat: 50.8528, lng: 20.6147 }, // Korona Kielce Stadium
  { lat: 46.636389, lng: 32.625278 }, // Krystal Stadium, Kherson
  { lat: 54.4358, lng: 18.5506 }, // Q9341143
  { lat: 51.2518, lng: 22.5462 }, // Stadion Lublinianki
  { lat: 49.965833, lng: 20.425278 }, // Q9341146
  { lat: 52.0361, lng: 23.1103 }, // Q9341147
  { lat: 50.2625, lng: 19.473889 }, // Q9341148
  { lat: 52.1989, lng: 18.6289 }, // Q9341149
  { lat: 51.9547, lng: 15.5236 }, // Q9341150
  { lat: 51.424, lng: 21.9732 }, // Q9341151
  { lat: 50.083611111, lng: 14.350555555 }, // Markéta Stadium
  { lat: 53.25, lng: 19.4 }, // OSiR Stadium in Brodnica
  { lat: 53.697222, lng: 17.563056 }, // Municipal Stadium, Chojnice
  { lat: 52.235, lng: 19.3694 }, // Q9341156
  { lat: 52.4408, lng: 19.4791 }, // Q9341158
  { lat: 13.4461, lng: -16.5757 }, // Q16566644
  { lat: -34.982575, lng: -71.244904 }, // Q16571630
  { lat: -29.1492, lng: 27.7493 }, // Q16572242
  { lat: -26.7668, lng: 31.9316 }, // Mayaluka Stadium
  { lat: -11.4499, lng: 34.0229 }, // Mzuzu Stadium
  { lat: 12.5662, lng: -70.035 }, // Q16582589
  { lat: -17.7309, lng: 168.316 }, // Q16585248
  { lat: -14.2718, lng: -170.701 }, // Pago Park Soccer Stadium
  { lat: 18.5863, lng: -72.315 }, // Phoenix Stadium
  { lat: -37.7558, lng: 175.291 }, // Porritt Stadium
  { lat: 42.8433, lng: 19.8663 }, // Stadion Solila
  { lat: 26.462538944, lng: 87.285894166 }, // Sahid Maidan Rangasala
  { lat: 15.4037, lng: -61.4259 }, // Q16599450
  { lat: 43.8414, lng: 19.895 }, // Stadion kraj Valjaonice
  { lat: -12.2787, lng: 43.7331 }, // Q16605599
  { lat: 14.6735, lng: -60.9422 }, // Q16605602
  { lat: 48.763187, lng: 2.484226 }, // Léo Lagrange stadium
  { lat: -18.8951, lng: 47.495 }, // Stade Makis
  { lat: 48.80271, lng: 2.14068 }, // Q16605615
  { lat: 23.6924, lng: -15.9408 }, // Q16605618
  { lat: -3.25, lng: 29.6 }, // Q16605627
  { lat: 20.9132, lng: -17.0467 }, // Estadi Municipal de Nouadhibou
  { lat: -22.1401, lng: 166.36515 }, // Q16605633
  { lat: -18.1469, lng: 49.3861 }, // Q16605635
  { lat: -3.96667, lng: 29.4333 }, // Q16605644
  { lat: 49.6101, lng: 6.33467 }, // Estadi Rue de Lenningen
  { lat: 18.06591, lng: -63.03333 }, // Stade Thelbert Carti
  { lat: 16.5141, lng: -15.7913 }, // Q16605651
  { lat: -6.14638, lng: 23.5826 }, // Q16605654
  { lat: 16.22789, lng: -61.37964 }, // Q16605657
  { lat: -19.8556, lng: 47.0369 }, // Q16605660
  { lat: -21.053873, lng: 164.857469 }, // Stade Yoshida
  { lat: 26.7453, lng: -11.6761 }, // Q16605666
  { lat: -12.174, lng: 44.4016 }, // Q16605669
  { lat: -18.9002, lng: 47.5192 }, // Q16605672
  { lat: -22.2698, lng: 166.641 }, // Q16605674
  { lat: -12.7956, lng: 45.27991 }, // Q16605684
  { lat: 11.5825, lng: 43.1543 }, // Q16605686
  { lat: -4.32167, lng: 55.6893 }, // Stade d’Amitié
  { lat: 48.53146, lng: 2.66497 }, // Stade Municipal de Melun
  { lat: 41.756, lng: 45.797277777 }, // David Kipiani Stadium
  { lat: 41.7562, lng: 45.7972 }, // David Kipiani Stadium
  { lat: 50.2411, lng: 19.0086 }, // Q16605719
  { lat: 12.7619, lng: 104.898 }, // Q16605722
  { lat: 40.1589, lng: 43.8333 }, // Q16605724
  { lat: 47.2128, lng: 27.8 }, // Q16605745
  { lat: 42.2069, lng: 20.7286 }, // Q16605748
  { lat: 45.51131, lng: 12.63732 }, // Stadio Armando Picchi
  { lat: 45.8841, lng: 10.1864 }, // Q16608402
  { lat: 45.884198, lng: 10.186413 }, // Q16608402
  { lat: 45.5582, lng: 10.0658 }, // Q16608405
  { lat: 44.27729, lng: 8.43638 }, // Ferruccio Chittolina stadium
  { lat: 40.31835, lng: 9.32089 }, // Franco Frogheri Stadium
  { lat: 38.9683, lng: 16.3055 }, // Q16608417
  { lat: 42.3511, lng: 13.4103 }, // Stadio di Acquasanta
  { lat: 38.43486111, lng: 27.17786944 }, // New İzmir Stadium
  { lat: 70.6853, lng: -52.1169 }, // Q16613098
  { lat: -21.2065, lng: -159.769 }, // Q16613479
  { lat: 32.3, lng: -64.8667 }, // White Hill Stadium
  { lat: -25.999, lng: 28.2302 }, // Makhulong Stadium
  { lat: 36.717, lng: 119.124 }, // Weifang Sports Center Stadium
  { lat: 49.2786, lng: -122.922 }, // SFU Stadium at Terry Fox Field
  { lat: 49.2786, lng: -122.922 }, // SFU Stadium at Terry Fox Field
  { lat: 27.8456, lng: 113.106 }, // Zhuzhou Stadium
  { lat: 27.841, lng: 114.934 }, // Xinyu Stadium
  { lat: 7.33062, lng: 13.58539 }, // Stade Municipal Ndoumbe Oumar
  { lat: 40.512, lng: -8.08282 }, // Estádio João Cardoso
  { lat: 8.711777777, lng: -75.827638888 }, // Estadio de Monteria
  { lat: -7.04338889, lng: 112.73947222 }, // Gelora Bangkalan Stadium
  { lat: 12.663963, lng: 100.935586 }, // Sattahip Navy Stadium
  { lat: -30.97318, lng: -64.09318 }, // José Hernández Amphitheatre
  { lat: 60.69194444, lng: 17.13444444 }, // Gavlevallen
  { lat: 43.4298, lng: 6.80725 }, // Stade Louis Hon
  { lat: 21.13913889, lng: 79.08161111 }, // Yashwant Stadium
  { lat: 37.1909, lng: -93.3017 }, // JFK Stadium
  { lat: 0.3414988, lng: 101.0173723 }, // Tuanku Tambusai Stadium
  { lat: 22.759722222, lng: 108.393055555 }, // Guangxi Sports Centre Stadium
  { lat: 44.4233, lng: 24.3503 }, // Stadionul 1 Mai (Slatina)
  { lat: 44.80783333, lng: 22.96205556 }, // Stadionul Minerul (Motru)
  { lat: 47.00741667, lng: 21.97794444 }, // Stadionul Luceafărul
  { lat: 8.8831, lng: 76.599 }, // Lal Bahadur Shastri Stadium (Kollam)
  { lat: 49.513932, lng: 5.889775 }, // Estadi Municipal de Differdange
  { lat: -10.006633, lng: 14.905107 }, // Estádio Municipal de Calulo
  { lat: 22.97471, lng: 88.4487 }, // Kalyani Stadium
  { lat: 46.81194, lng: 29.55278 }, // Dinamo-Auto Stadium
  { lat: 26.007901, lng: 32.316623 }, // Aluminium Stadium
  { lat: 23.362, lng: 85.851 }, // Silli Stadium
  { lat: 11.87626, lng: 75.36835 }, // Jawahar Municipal Stadium
  { lat: 54.93498889, lng: -3.81744444 }, // Islecroft Stadium
  { lat: 55.95729167, lng: -2.98638056 }, // Pennypit Park
  { lat: 55.54735, lng: -2.85716944 }, // Yarrow Park
  { lat: 19.4094, lng: -99.156 }, // Estadi Nacional de Mèxic
  { lat: 45.821888888, lng: 20.473027777 }, // Stadium FK ŽAK
  { lat: 38.04301, lng: -78.5081 }, // University Hall Turf Field
  { lat: 53.8214, lng: 22.3622 }, // Municipal Stadium in Ełk Stefan Marcinkiewicz
  { lat: 52.5311, lng: 17.5856 }, // Q9341162
  { lat: 51.979764, lng: 14.717928 }, // Q9341164
  { lat: 52.7519, lng: 18.1011 }, // Q9341165
  { lat: 52.005556, lng: 17.476111 }, // Q9341166
  { lat: 50.1875, lng: 19.286 }, // Q9341167
  { lat: 51.758417, lng: 18.10075 }, // Q9341168
  { lat: 50.968888888, lng: 18.227222222 }, // Q9341170
  { lat: 50.081388888, lng: 17.997222222 }, // Q9341171
  { lat: 50.218888888, lng: 18.679166666 }, // Q9341172
  { lat: 51.5833, lng: 21.5667 }, // Q9341174
  { lat: 51.2037, lng: 16.1699 }, // Municipal Stadium, Legnica
  { lat: 50.6975, lng: 16.006111111 }, // Q9341177
  { lat: 52.347111, lng: 16.903444 }, // Q9341179
  { lat: 52.446667, lng: 15.586389 }, // Q9341180
  { lat: 53.7087, lng: 19.9498 }, // Ostróda Stadium
  { lat: 53.92225, lng: 18.689889 }, // Q9341182
  { lat: 54.718889, lng: 18.420556 }, // Town Stadium in Puck
  { lat: 51.4036, lng: 21.1567 }, // Stadion Lekkoatletyczno-Piłkarski (Radom)
  { lat: 52.55, lng: 19.699167 }, // Q9341185
  { lat: 53.342222, lng: 15.019167 }, // Stargard Municipal Stadium
  { lat: 50.0215, lng: 21.9963 }, // Stal Rzeszów Municipal Stadium
  { lat: 54.0944, lng: 22.9157 }, // Municipal Stadium, Suwałki
  { lat: 52.411389, lng: 17.070278 }, // City Stadium in Swarzędz
  { lat: 51.561944, lng: 15.515278 }, // Q9341190
  { lat: 52.2898, lng: 17.8881 }, // Q9341192
  { lat: 53.9168, lng: 14.2414 }, // Świnoujście Municipal Stadium
  { lat: 51.193782, lng: 58.321901 }, // Q9341196
  { lat: 46.373972, lng: 16.658806 }, // Q9341197
  { lat: 50.6761, lng: 17.9317 }, // Q9341205
  { lat: 52.425278, lng: 16.890278 }, // Q9341207
  { lat: 52.427222, lng: 16.943611 }, // Q9341209
  { lat: 33.99322222, lng: 71.53538889 }, // Qayyum Stadium
  { lat: 52.1781, lng: 22.2969 }, // ROSRRiT Stadium
  { lat: 52.185833, lng: 20.889444 }, // RKS Ursus stadium
  { lat: 58.5161, lng: 49.6948 }, // Q9341214
  { lat: 56.0988, lng: 38.1252 }, // Q9341215
  { lat: 50.392777777, lng: 18.878888888 }, // Q9341218
  { lat: 45.938056, lng: 20.083889 }, // Q9341219
  { lat: 46.225, lng: 15.2703 }, // Skalna Klet
  { lat: 49.2505, lng: 23.8564 }, // Sokil Stadium
  { lat: 50.0842, lng: 20.0458 }, // KS Wanda Stadium
  { lat: 57.5807, lng: 34.5667 }, // Q9341225
  { lat: 50.0064, lng: 20.9769 }, // MKS Tarnovia Stadium
  { lat: 50.0925, lng: 18.2403 }, // Q9341231
  { lat: 53.795556, lng: 20.488611 }, // Q9341235
  { lat: 49.566, lng: 22.2026 }, // Wierchy Stadium in Sanok
  { lat: 41.3245, lng: 69.3072 }, // Q9341237
  { lat: 52.1691, lng: 20.813 }, // Q9341240
  { lat: 49.6201, lng: 20.7047 }, // Władysław Augustynek Stadium
  { lat: 52.8201, lng: 17.2036 }, // Q9341244
  { lat: 54.346111, lng: 18.671389 }, // Zbigniew Podlecki Stadium
  { lat: 51.473805555, lng: 21.448888888 }, // Municipal Stadium in Pionki
  { lat: 54.386990512, lng: 18.613290974 }, // Gedania stadium in Gdańsk
  { lat: 54.387222, lng: 18.613889 }, // Gedania stadium in Gdańsk
  { lat: 52.4264, lng: 20.7281 }, // Q9341257
  { lat: 47.6525, lng: 23.57 }, // Q9341259
  { lat: 40.9, lng: 20.66388889 }, // Gjorgji Kyçyku Stadium
  { lat: 42.3631, lng: 21.15 }, // Q9341264
  { lat: 41.04244444, lng: 19.75271111 }, // Peqin Stadium
  { lat: 56.234444, lng: 12.856389 }, // Ängelholms IP
  { lat: -29.8869, lng: -51.1546 }, // Q9833112
  { lat: -1.301117, lng: -48.480183 }, // Q10276717
  { lat: -32.047578, lng: -52.113353 }, // Q10276735
  { lat: -22.324064, lng: -49.097611 }, // Estádio Alfredo de Castilho
  { lat: -3.621389, lng: -39.513611 }, // Q10276757
  { lat: 38.75425, lng: -8.95499 }, // Estádio António Almeida Correia
  { lat: -6.755942, lng: -38.223253 }, // Q10276778
  { lat: -22.89583333, lng: -47.06958333 }, // Estádio Cerecamp
  { lat: -22.35650278, lng: -41.77158056 }, // Moacyrzão
  { lat: -10.221111, lng: -36.838333 }, // Q10276853
  { lat: 38.663158333, lng: -9.0752 }, // Estádio Dom Manuel de Mello
  { lat: -21.186944, lng: -47.787778 }, // Estádio Palma Travassos
  { lat: -26.908353, lng: -48.659667 }, // Estádio Hercílio Luz
  { lat: -22.359385, lng: -47.34065 }, // Estádio Doutor Hermínio Ometto
  { lat: -22.35925278, lng: -47.34056944 }, // Estádio Doutor Hermínio Ometto
  { lat: 41.356, lng: -8.190722222 }, // Estádio Dr. Machado de Matos
  { lat: -25.524722, lng: -48.508056 }, // Q10276944
  { lat: -27.941667, lng: -52.915556 }, // Estádio Fonte Sarandi
  { lat: -3.884722, lng: -38.676667 }, // Q10276954
  { lat: -10.706478, lng: -48.408625 }, // General Sampaio Stadium
  { lat: -8.881381, lng: -36.477903 }, // Q10276976
  { lat: -8.276658, lng: -35.026561 }, // Q10276978
  { lat: -10.729094, lng: -37.078478 }, // Q10276980
  { lat: -11.254939, lng: -37.432425 }, // Q10276982
  { lat: -19.525, lng: -54.041111111 }, // Q10277019
  { lat: -8.050022, lng: -48.480967 }, // Q10277059
  { lat: -29.782517, lng: -51.155525 }, // Q10277070
  { lat: -22.555294, lng: -47.385042 }, // Estádio Major José Levy Sobrinho
  { lat: -20.85722222, lng: -41.09861111 }, // Q10277153
  { lat: 39.4881, lng: -8.54444 }, // Estádio Municipal Doutor Alves Vieira
  { lat: -21.299444, lng: -46.708333 }, // Q10277201
  { lat: -10.776111111, lng: -65.327222222 }, // Q10277242
  { lat: -27.452889, lng: -53.925444 }, // Q10277253
  { lat: -23.75555556, lng: -53.30694444 }, // Q10277255
  { lat: 33.13305556, lng: 11.21611111 }, // Estadi 7 de Març
  { lat: -6.3537442, lng: 106.8489148 }, // Heri Sudrajat Stadium
  { lat: 56.846111111, lng: 60.598888888 }, // Dynamo stadium in Yekaterinburg
  { lat: 25.18029444, lng: 51.59652222 }, // Saoud bin Abdulrahman Stadium
  { lat: 31.53722222, lng: 35.09916667 }, // Hussein Bin Ali Stadium
  { lat: 31.90694444, lng: 35.22472222 }, // Majed Asad Stadium
  { lat: 53.80776, lng: -1.62518 }, // McLaren Field
  { lat: 45.14472222, lng: 26.80277778 }, // Stadionul Cornel Negoescu
  { lat: 25.235052, lng: 51.532113 }, // Estadi Al Thumama
  { lat: 39.761061, lng: -75.552867 }, // Baynard Stadium
  { lat: 37.329167, lng: -121.901111 }, // Cisco Field
  { lat: 37.329167, lng: -121.901111 }, // Cisco Field
  { lat: 37.79575, lng: -122.283333 }, // Cisco Field
  { lat: 37.79575, lng: -122.283333 }, // Cisco Field
  { lat: 55.73583, lng: 37.57583 }, // Q41016870
  { lat: 49.850843, lng: 24.010725 }, // SCA Velotrack, Lviv
  { lat: 45.638303, lng: 25.587105 }, // Brașov Sports School
  { lat: 14.934847222, lng: -24.469319444 }, // Q42341204
  { lat: 32.50194444, lng: 45.83583333 }, // Al-Kut Olympic Stadium
  { lat: 53.2911, lng: -3.7127 }, // Eirias Stadium
  { lat: 25.820712, lng: -97.494269 }, // Estadio El Hogar
  { lat: -6.385277777, lng: 106.847222222 }, // Mahakam Stadium
  { lat: 42.345007, lng: 14.162547 }, // Stadio della Civitella
  { lat: -6.231387, lng: -77.867984 }, // Estadio Kuélap
  { lat: 1.481722222, lng: 103.61925 }, // Sultan Ibrahim Stadium
  { lat: -20.1875, lng: 57.72527778 }, // St. François Xavier Stadium
  { lat: 44.97083333, lng: -93.29194444 }, // Parade Stadium
  { lat: 41.2621, lng: -76.9642 }, // Kenneth M. Robbins Stadium
  { lat: 6.828611111, lng: -5.246388888 }, // Estadi de Yamoussoukro
  { lat: 5.58638889, lng: -0.17277778 }, // El Wak Stadium
  { lat: -33.884463, lng: 25.595285 }, // Wolfson Stadium
  { lat: 45.235805555, lng: 11.469444444 }, // Stadio comunale di Montagnana
  { lat: -3.11189, lng: -60.0175 }, // Q48879597
  { lat: 9.409722222, lng: -5.628888888 }, // Estadi de Korhogo
  { lat: 4.816944444, lng: -6.629444444 }, // Estadi de San Pédro
  { lat: -31.7830575, lng: -70.9701052 }, // Estadio Municipal de Salamanca
  { lat: 48.766314, lng: 44.577911 }, // Monolit Stadium
  { lat: 27.765952777, lng: -15.584044444 }, // Estadio Municipal de Maspalomas
  { lat: 20.713242, lng: -103.401353 }, // Estadio Akron
  { lat: 56.946338888, lng: 65.190097222 }, // Tyumen Biathlon Stadium
  { lat: 46.543869, lng: 6.622844 }, // Stade de la Tuilière
  { lat: -5.201859, lng: 119.383231 }, // Barombong Stadium
  { lat: 39.35778, lng: 22.92228 }, // Neapoli Volos Municipal Stadium
  { lat: 62.071583333, lng: -7.310361111 }, // Á Dungasandi
  { lat: 53.513638888, lng: -2.276777777 }, // Moor Lane
  { lat: 33.471398, lng: 44.373578 }, // Ammo Baba stadium
  { lat: 34.0761534, lng: -118.45332011 }, // Easton Stadium
  { lat: -7.185388888, lng: 112.65075 }, // Gelora Joko Samudro Stadium
  { lat: 51.604444444, lng: -0.066388888 }, // Tottenham Hotspur Stadium
  { lat: 45.757459, lng: 8.418694 }, // Stadio Alfredo d'Albertas
  { lat: 31.52875, lng: 34.601166666 }, // Sderot Stadium
  { lat: 48.10843, lng: -1.66332 }, // Q55599940
  { lat: 44.690556, lng: 18.997778 }, // Ugljevik City Stadium
  { lat: 33.865467, lng: 36.09407 }, // Al-Nabi Shayth Stadium
  { lat: 30.069529, lng: 31.2884604 }, // Police Academy Stadium
  { lat: 32.4445, lng: 34.947972222 }, // Q55650363
  { lat: 41.914833, lng: -87.661055 }, // Lincoln Yards Stadium
  { lat: 50.324277777, lng: 17.584972222 }, // 7 Kolejowa Street in Prudnik
  { lat: 6.2065, lng: 6.722444 }, // Stephen Keshi Stadium
  { lat: 18.2182, lng: -63.05 }, // Raymond E. Guishard Technical Centre
  { lat: 33.975719, lng: -6.824167 }, // Estadi Moulay Hassan
  { lat: -10.651944444, lng: -68.503888888 }, // Q56349553
  { lat: 36.8162, lng: 10.1253 }, // Hédi Enneifer Stadium
  { lat: 33.354388888, lng: 44.455583333 }, // Al-Madina Stadium
  { lat: -6.258583333, lng: 106.60425 }, // Indomilk Arena
  { lat: 34.878127351, lng: -1.315997309 }, // Q60833976
  { lat: 44.7966, lng: 20.50048 }, // Stadion Hajduk Lion
  { lat: 46.1925, lng: 21.311944444 }, // Stadionul Francisc von Neuman
  { lat: 41.791667, lng: 44.779444 }, // Estadi David Petriashvili
  { lat: 41.791667, lng: 44.78 }, // Estadi David Petriashvili
  { lat: 43.594, lng: 5.0013 }, // Q61747128
  { lat: 49.86514, lng: 3.2783 }, // Q61830487
  { lat: 49.25038, lng: 4.04766 }, // Q61830549
  { lat: 47.05175, lng: -0.87634 }, // Q61830659
  { lat: 40.436163888, lng: -3.599819444 }, // La Peineta
  { lat: 52.2166, lng: 104.094644 }, // Stadium Stroitel, Shelekhov
  { lat: 43.29872, lng: 13.73873 }, // Stadio Polisportivo Comunale
  { lat: 50.8837, lng: -114.0988 }, // ATCO Field
  { lat: 53.148333333, lng: 26 }, // Q64448626
  { lat: 43.608611111, lng: 1.419166666 }, // Stade Chapou
  { lat: 15.345555555, lng: 120.533611111 }, // New Clark City Athletics Stadium
  { lat: -27.765777777, lng: -64.269583333 }, // Estadio Único Madre de Ciudades
  { lat: 13.091597, lng: -59.573036 }, // Wildey Turf
  { lat: 52.728055555, lng: 41.4525 }, // Spartak Stadium
  { lat: 50.5735, lng: 36.5671 }, // Belgorod Arena
  { lat: 46.995556, lng: 6.944167 }, // Stade de la Maladière (1924)
  { lat: 40.864722222, lng: -8.626111111 }, // Estádio Marques da Silva
  { lat: 14.472472222, lng: 100.088441666 }, // Suphanburi Sports School Stadium
  { lat: 31.874635508, lng: 34.733574474 }, // Q65249654
  { lat: 39.738666666, lng: 141.120888888 }, // Iwate Morioka Stadium
  { lat: 17.010638888, lng: -96.572897222 }, // Estadio Independiente MRCI
  { lat: 50.3065, lng: 18.695666666 }, // Q66124697
  { lat: 14.277277777, lng: 100.572111111 }, // Udhomseelwitthaya School Stadium
  { lat: 57.430749, lng: 25.9202925 }, // Teperis stadium
  { lat: -33.656585552, lng: -70.924625131 }, // Q66712612
  { lat: 38.561944444, lng: -7.913888888 }, // Sanches de Miranda Stadium
  { lat: 39.006941, lng: 117.351801 }, // Haihe Educational Football Stadium
  { lat: 37.928889, lng: 41.9375 }, // Siirt Atatürk Stadium
  { lat: 46.3833, lng: 16.0481 }, // Zavrč Sports Park
  { lat: -15.3695, lng: 28.2726 }, // Estadi dels Herois Nacionals
  { lat: 14.7947, lng: 120.951 }, // Philippine Stadium
  { lat: 26.2238, lng: -98.2372 }, // McAllen Veterans Memorial Stadium
  { lat: 30.6909, lng: 76.7373 }, // International Hockey Stadium
  { lat: 46.85903, lng: -96.76582 }, // Jake Christiansen Stadium
  { lat: 45.4521, lng: -122.672 }, // Griswold Stadium
  { lat: 42.0499, lng: 19.898 }, // Ismail Xhemali Stadium
  { lat: 40.102944444, lng: 19.740472222 }, // Petro Ruci Stadium
  { lat: 41.51202778, lng: 19.78666667 }, // Redi Maloku Stadium
  { lat: 42.218555555, lng: 19.431833333 }, // Kompleksi Vellezërit Duli
  { lat: 36.326111111, lng: 59.570277777 }, // Imam Reza Stadium
  { lat: 12.97694444, lng: 7.63805556 }, // Estadi Muhammadu Dikko
  { lat: 51.109213888, lng: 71.394822222 }, // Barys Arena
  { lat: 45.7058, lng: 13.8717 }, // Rajko Štolfa Stadium
  { lat: 46.5886, lng: 15.0153 }, // Dravograd Sports Centre
  { lat: 51.317, lng: 4.933 }, // Q16649042
  { lat: 55.82778, lng: 37.32611 }, // Zorky Stadium
  { lat: 51.34888889, lng: 25.85361111 }, // Izotop Stadium
  { lat: 45.043395, lng: 39.035566 }, // Krasnodar Academy Stadium
  { lat: 37.46225, lng: 139.925694 }, // Aizu Athletic Park Stadium
  { lat: 19.3918, lng: -70.5244 }, // Q16726186
  { lat: -12.78598, lng: 45.22661 }, // Stade du Baobab
  { lat: -29.8149, lng: 27.2361 }, // Q16726241
  { lat: -26.3185, lng: 31.1444 }, // Q16726242
  { lat: 22.6905, lng: 90.6466 }, // Gajnabi Stadium
  { lat: 59.04869, lng: 10.04983 }, // Framparken
  { lat: 9.95127, lng: 8.86643 }, // Jos International Stadium
  { lat: 28.5410645, lng: -81.389035 }, // Inter&Co Stadium
  { lat: -17.730833, lng: 168.315833 }, // Port Vila Municipal Stadium
  { lat: 24.2532, lng: 89.9124 }, // Tangail Stadium
  { lat: 39.9556, lng: 44.5442 }, // Artashat City Stadium
  { lat: 14.5311, lng: 121.054 }, // McKinley Hill Stadium
  { lat: 23.0414, lng: 113.381 }, // Guanggong Cricket Stadium
  { lat: 38.0845, lng: 23.6883 }, // Yiannis Pathiakakis Stadium
  { lat: -6.495, lng: 106.8335 }, // Pakansari Stadium
  { lat: 31.32027778, lng: 48.66916667 }, // Behnam Mohammadi Stadium
  { lat: 25.78055556, lng: -80.20555556 }, // Nu Stadium
  { lat: 35.701805555, lng: 51.109611111 }, // Shohada Stadium (Qods)
  { lat: 54.6858, lng: 25.23 }, // Vingis Stadium
  { lat: 31.507053, lng: 35.032164 }, // Dura International Stadium
  { lat: 39.569505555, lng: 2.680094444 }, // Camp de Son Malferit
  { lat: 59.65166389, lng: 33.54701389 }, // Stadion Kirovets
  { lat: 33.891444, lng: 130.888861 }, // Mikuni World Stadium Kitakyūshū
  { lat: 53.0214, lng: 27.5461 }, // City Stadium (Slutsk)
  { lat: 49.061851333, lng: 20.308030833 }, // NTC Poprad
  { lat: 44.88277778, lng: 26.01416667 }, // Stadionul Chimia
  { lat: 44.92083333, lng: 25.96166667 }, // Stadionul Conpet
  { lat: 32.5328, lng: -92.0656 }, // Brown Stadium
  { lat: 19.32555556, lng: -98.23027778 }, // Estadio Tlahuicole
  { lat: -34.851743, lng: 138.636493 }, // Adelaide City Park
  { lat: 40.4212, lng: 49.9968 }, // Azersun Arena
  { lat: 43.8361994, lng: 13.0250913 }, // Stadio Raffaele Mancini
  { lat: 47.481572275, lng: 11.11750573 }, // Stadion
  { lat: 26.2238, lng: -98.2372 }, // Garrett–Harrison Stadium
  { lat: -6.85415079, lng: 39.27325969 }, // Chamazi Stadium
  { lat: 32.56475, lng: 44.004542 }, // Karbala Sports City
  { lat: 30.4403, lng: 47.7808 }, // Karbala Sports City
  { lat: 23.5329, lng: 87.305 }, // Shaheed Bhagat Singh Stadium
  { lat: 15.35027778, lng: 75.14277778 }, // Nehru Stadium, Hubli
  { lat: 15.35027778, lng: 75.14277778 }, // FACT Stadium
  { lat: 28.37747, lng: 79.43171 }, // Dori Lal Agarawal Sports Stadium
  { lat: 23.5654, lng: 87.3032 }, // Nehru Stadium, Durgapur
  { lat: 44.58022, lng: -0.04324 }, // Stade Municipal La Reole
  { lat: 39.15416667, lng: -76.71722222 }, // Joe Cannon Stadium
  { lat: 43.06499, lng: 2.21454 }, // Stade de l'Aiguille
  { lat: 41.318314, lng: 19.824075 }, // Arena Kombëtare
  { lat: 43.92943, lng: 4.80561 }, // Stade Saint Ruf
  { lat: 32.12583333, lng: 34.96583333 }, // Kfar Qassem Football Stadium
  { lat: 18.6364746, lng: 73.8198495 }, // Annasaheb Magar PCMC Stadium
  { lat: 4.004115, lng: 97.339315 }, // Seribu Bukit Stadium
  { lat: 44.37777778, lng: 25.94083333 }, // Stadionul Clinceni
  { lat: 49.116944, lng: 18.428611 }, // Štadión MŠK Považská Bystrica
  { lat: 45.519091095, lng: 11.324109618 }, // Tommaso Dal Molin Stadium
  { lat: 11.817598, lng: 99.788093 }, // Prachuap Khiri Khan Province Stadium
  { lat: 14.028011, lng: 100.725802 }, // Chalerm Prakiat Klong 6 Stadium
  { lat: -3.6604, lng: 133.715117 }, // Triton Stadium
  { lat: -6.38944444, lng: 106.80666667 }, // Merpati Stadium
  { lat: 11.58138889, lng: 104.88361111 }, // Western Stadium
  { lat: 11.82993, lng: 39.60016 }, // Woldiya Stadium
  { lat: 13.847122, lng: 100.565834 }, // Insee Chantarasatit Stadium
  { lat: 12.526877, lng: 99.969199 }, // Hua Hin municipal Stadium
  { lat: 43.1959, lng: 2.75928 }, // Stade du Moulin
  { lat: 43.28611, lng: 40.2626333 }, // Dinamo Stadium, Sokhumi
  { lat: 45.86291667, lng: 25.77613889 }, // Stadionul Municipal
  { lat: 42.6833, lng: 22.1666 }, // Surdulica City Stadium
  { lat: 42.6833, lng: 17.15 }, // Gradski Stadion
  { lat: 44.345336975, lng: 17.250930055 }, // Stadion Mračaj
  { lat: 44.10967, lng: 18.11693 }, // Stadion Mladost Kakanj
  { lat: 44.153836111, lng: 17.788272222 }, // Gradski Stadion Vitez
  { lat: -35.31388889, lng: 149.10555556 }, // Deakin Stadium
  { lat: -0.4856, lng: 15.8832 }, // Stade Omnisport Marien Ngouabi d'Owando
  { lat: 38.74379, lng: -9.10965 }, // Q25419585
  { lat: 40.53639467, lng: -7.27772826 }, // Estádio Municipal da Guarda
  { lat: 40.283023, lng: -7.511542 }, // Estádio Municipal José dos Santos Pinto
  { lat: 41.282090021, lng: -8.075706085 }, // Estádio Municipal de Amarante
  { lat: 38.877166666, lng: -7.157638888 }, // Estádio Patalino
  { lat: -8.72457985, lng: 115.17948256 }, // Gelora Samudra Stadium
  { lat: -7.07772222, lng: 113.28708333 }, // Ahmad Yani Stadium
  { lat: 41.344225, lng: 41.300723 }, // Arhavi City Stadium
  { lat: 43.408689, lng: 28.158368 }, // Balchik Stadium
  { lat: 42.637139, lng: 23.309167 }, // Q25487575
  { lat: 50.49018, lng: 5.10088 }, // Stade Julien-Pappa
  { lat: 46.9545386, lng: 7.4538628 }, // Spitalacker
  { lat: 31.325816666, lng: -113.532401666 }, // Francisco León García Stadium
  { lat: 51.9675325, lng: 4.4805646 }, // Hazelaarweg Stadion
  { lat: 47.295268, lng: 11.582466 }, // Gernot Langes Stadion
  { lat: 52.199051, lng: 20.991883 }, // Gwardia Warsaw Stadium
  { lat: -12.081638888, lng: -76.998277777 }, // Estadi d'Atletisme de la Vila Esportiva Nacional
  { lat: 47.222062, lng: 8.843983 }, // Grünfeld stadium
  { lat: 51.659166666, lng: -0.063888888 }, // Queen Elizabeth Stadium
  { lat: 53.14862, lng: 26.06678 }, // Q27235473
  { lat: 53.1308, lng: 26.0314 }, // Q27235477
  { lat: 1.7066, lng: 11.6451 }, // Stade d'Oyem
  { lat: -0.805361111, lng: 8.803805555 }, // Stade de Port-Gentil
  { lat: 4.7381053, lng: -74.1319878 }, // Coliseo Live
  { lat: 36.090777777, lng: -115.183 }, // Allegiant Stadium
  { lat: -7.954759, lng: 110.605073 }, // Gelora Handayani Stadium
  { lat: 49.460452777, lng: 17.445672222 }, // Městský stadion Přerov
  { lat: -33.808056, lng: 150.999722 }, // Western Sydney Stadium
  { lat: 40.66701, lng: 22.90822 }, // Agrotikos Asteras Stadium
  { lat: -5.949451, lng: -77.305588 }, // Estadio IPD de Nueva Cajamarca
  { lat: 49.0265, lng: 104.0489 }, // Erdenet Stadium
  { lat: 49.0265, lng: 104.049 }, // Erdenet Stadium
  { lat: 27.820972222, lng: 52.336972222 }, // Takhti Stadium (Jam)
  { lat: -17.7309, lng: 168.316 }, // Luganville Soccer Stadium
  { lat: 53.991666666, lng: -1.514444444 }, // Wetherby Road
  { lat: 44.5926079, lng: 24.5516649 }, // Stadionul Viitorul
  { lat: -34.94777778, lng: 138.50833333 }, // Diamond Sports Stadium
  { lat: -17.66602778, lng: -63.16030556 }, // Estadio Edgar Peña Gutierrez
  { lat: 42.36472222, lng: 18.75611111 }, // Stadion Donja Sutvara
  { lat: 35.6454746, lng: -5.3343773 }, // Q28269730
  { lat: 15.136916666, lng: -23.20525 }, // Estádio Municipal 20 de Janeiro
  { lat: 15.141375, lng: -23.533555555 }, // Estádio Municipal 25 de Julho
  { lat: 5.4807, lng: -4.0746 }, // Estadi Olímpic Alassane Ouattara
  { lat: 53.04416667, lng: -2.97666667 }, // Queensway Stadium
  { lat: 17.57752778, lng: 120.39 }, // Quirino Stadium
  { lat: 33.735277777, lng: -84.389444444 }, // Center Parc Stadium
  { lat: 25.07580556, lng: -77.32533333 }, // Nassau Stadium
  { lat: -13.943828, lng: 33.753175 }, // Estadi Nacional Bingu
  { lat: 42.626, lng: -83.0402 }, // Jimmy John's Field
  { lat: 31.92466667, lng: 34.86652778 }, // Ramla Municipal Stadium
  { lat: 49.577263, lng: 16.053323333 }, // Vysočina Arena
  { lat: 51.092778, lng: -115.386111 }, // Canmore Nordic Centre
  { lat: 51.465277777, lng: 6.851666666 }, // Willy-Jürissen-Halle
  { lat: 61.197089, lng: 28.730915 }, // Ukonniemi stadium
  { lat: 30.439897, lng: 47.77979 }, // Jidhe Alnakhla Stadium
  { lat: 44.4922, lng: 11.3098 }, // estadi Renato Dall'Ara
  { lat: 51.298611, lng: 9.484167 }, // Auestadion
  { lat: 43.4682, lng: 4.94795 }, // Stade Parsemain
  { lat: 44.69327786, lng: 10.6414175 }, // Stadio Mirabello
  { lat: 24.788206, lng: 46.839236 }, // Estadi Internacional Rei Fahd
  { lat: 37.515833, lng: 15.071389 }, // Stadio Angelo Massimino
  { lat: 38.042222, lng: -1.144722 }, // Estadi Nueva Condomina
  { lat: 25.722805555, lng: -100.312055555 }, // Estadi Universitario (UANL)
  { lat: 58.361156, lng: 25.607033 }, // Viljandi linnastaadion
  { lat: 62.46944444, lng: 6.1875 }, // Color Line Stadion
  { lat: 51.75875, lng: 19.42675 }, // Estadi Municipal Władysław Król
  { lat: 43.526667, lng: 10.314167 }, // Estadi Armando Picchi
  { lat: 56.474703, lng: -2.968961 }, // Tannadice Park
  { lat: 52.260278, lng: 6.1725 }, // De Adelaarshorst
  { lat: 43.321667, lng: 11.326111 }, // Estadi Artemio Franchi (Siena)
  { lat: 30.60194444, lng: 32.27388889 }, // Estadi d'Ismaïlia
  { lat: 42.930556, lng: 13.884722 }, // Stadio Riviera delle Palme
  { lat: 45.708889, lng: 9.680833 }, // Stadio Atleti Azzurri d'Italia
  { lat: 57.0515, lng: 9.8991 }, // Aalborg Portland Park
  { lat: 5.30527778, lng: -3.99244444 }, // Stade Robert Champroux
  { lat: 46.362577, lng: 6.469886 }, // Stade Joseph-Moynat
  { lat: 47.4425, lng: 19.155103 }, // Estadi József Bozsik
  { lat: 56.46583333, lng: 10.01027778 }, // AutoC Park Randers
  { lat: -34.8845, lng: -56.159 }, // Estadio Gran Parque Central
  { lat: 45.0385, lng: 7.65819 }, // Stadio Filadelfia
  { lat: 22.568889, lng: 88.409167 }, // Salt Lake Stadium
  { lat: -33.404553, lng: -70.659017 }, // Estadio Santa Laura-Universidad SEK
  { lat: 50.9939, lng: 7.11969 }, // BELKAW-Arena
  { lat: 43.632778, lng: -79.418611 }, // BMO Field
  { lat: 52.5297, lng: 13.5022 }, // BVG-Stadion
  { lat: 55.2231, lng: 11.7664 }, // Næstved Stadion
  { lat: 42.684258, lng: 23.339769 }, // Estadi Balgarska Armia
  { lat: 54.869142, lng: -6.262867 }, // Ballymena Showgrounds
  { lat: 54.717407, lng: 20.489826 }, // Baltika Stadium
  { lat: 40.171426, lng: 44.449938 }, // Urartu Stadium
  { lat: 13.12, lng: -59.605 }, // Barbados National Stadium
  { lat: 52.3355, lng: 9.72167 }, // Beekestadion
  { lat: 59.26611111, lng: 15.22305556 }, // Eyravallen
  { lat: 53.3189, lng: -3.47611 }, // Belle Vue
  { lat: 52.475702777, lng: -1.868188888 }, // St Andrew's Stadium
  { lat: 51.208889, lng: 6.439556 }, // Bökelbergstadion
  { lat: 51.465278, lng: 11.961944 }, // Leuna-Chemie-Stadion
  { lat: -23.600125, lng: -46.720155555 }, // Estadi Morumbi
  { lat: -23.600125, lng: -46.720155555 }, // Estadi Morumbi
  { lat: -23.600125, lng: -46.720155555 }, // Estadi Morumbi
  { lat: 32.30055556, lng: -64.76972222 }, // Bermuda National Stadium
  { lat: 54.578333333, lng: -1.216944444 }, // Riverside Stadium
  { lat: 52.332533, lng: 14.556133 }, // Stadion der Freundschaft
  { lat: 48.0489, lng: 13.7828 }, // Stadion Vor der Au
  { lat: 49.332083, lng: 8.647667 }, // Hardtwaldstadion
  { lat: 48.744444, lng: 11.443056 }, // Tuja-Stadion
  { lat: 50.071111, lng: 8.256667 }, // BRITA-Arena
  { lat: 50.000833, lng: 8.245556 }, // Stadion am Bruchweg
  { lat: 53.571769, lng: 9.990544 }, // Sportplatz at Rothenbaum
  { lat: 48.1619, lng: 11.7236 }, // Sportpark Aschheim
  { lat: 41.023147, lng: 40.532794 }, // Rize Atatürk Stadium
  { lat: 40.0115, lng: 32.5024 }, // Osmanlı Stadyumu
  { lat: 43.519444, lng: 16.431667 }, // Estadi Poljud
  { lat: 52.448056, lng: -1.495556 }, // Ricoh Arena
  { lat: 49.0655, lng: 17.4714 }, // Městský fotbalový stadion Miroslava Valenty
  { lat: 62.019167, lng: -6.778056 }, // Tórsvøllur
  { lat: 43.215833, lng: 27.931389 }, // Ticha Stadium
  { lat: 42.139861, lng: 24.764444 }, // Hristo Botev Stadium
  { lat: -6.8535, lng: 39.273811 }, // Estadi Nacional de Tanzània
  { lat: 43.138889, lng: 23.7125 }, // Lokomotiv Stadium
  { lat: 50.4329, lng: 2.81491 }, // Stade Félix Bollaert
  { lat: 48.7661, lng: 11.4133 }, // Q854370
  { lat: 48.7474, lng: 9.18633 }, // Q854379
  { lat: 48.3949, lng: 10.8827 }, // Q854380
  { lat: 42.476389, lng: 1.487667 }, // Estadi Comunal d'Aixovall
  { lat: 43.345556, lng: 17.795278 }, // Estadi Bijeli Brijeg
  { lat: 44.20575, lng: 17.907083 }, // Estadi Bilino Polje
  { lat: 53.49361111, lng: 10.22611111 }, // Billtalstadion
  { lat: 28.582873, lng: 77.23438 }, // Jawaharlal Nehru Stadium
  { lat: 53.451111111, lng: -2.235277777 }, // Maine Road
  { lat: 51.472778, lng: -3.203056 }, // Cardiff City Stadium
  { lat: 46.9952, lng: 6.944 }, // Stade de la Maladière
  { lat: 51.7567, lng: 8.70056 }, // Hermann-Löns-Stadion
  { lat: 53.804722, lng: -3.048056 }, // Bloomfield Road
  { lat: 48.0976, lng: 16.3109 }, // Datenpol Arena
  { lat: 48.840556, lng: 10.072222 }, // Ostalb Arena
  { lat: 54.349167, lng: 10.123611 }, // Holstein-Stadion
  { lat: 47.822778, lng: 16.255278 }, // Stadion Wiener Neustadt
  { lat: 49.015556, lng: 12.073889 }, // Jahnstadion Regensburg (1926)
  { lat: 51.46527778, lng: 11.96194444 }, // Kurt-Wabbel-Stadion
  { lat: 49.857778, lng: 8.672222 }, // Stadion am Böllenfalltor
  { lat: 51.239083, lng: 7.105083 }, // Stadion am Zoo
  { lat: 51.485556, lng: 7.118611 }, // Lohrheidestadion
  { lat: 52.500833, lng: 13.264167 }, // Mommsenstadion
  { lat: 52.500833, lng: 13.264167 }, // Mommsenstadion
  { lat: 52.126667, lng: 11.671389 }, // Ernst Grube Stadium
  { lat: 50.852222, lng: 8.026111 }, // Leimbachstadion
  { lat: 49.768056, lng: 6.647778 }, // Moselstadion
  { lat: 55.481944, lng: 8.439444 }, // Estadi Esbjerg
  { lat: 51.0536, lng: 12.2831 }, // Bluechip-Arena
  { lat: 47.66805556, lng: 9.21333333 }, // Bodenseestadion
  { lat: 53.555277777, lng: -2.128611111 }, // Boundary Park
  { lat: 53.370277777, lng: -1.470833333 }, // Bramall Lane
  { lat: 60.366388888, lng: 5.356944444 }, // Estadi Brann
  { lat: 45.052184, lng: 7.649993 }, // Stadio di Corso Marsiglia
  { lat: 47.17369444, lng: 18.41536111 }, // Sóstói Stadion
  { lat: 43.873888888, lng: 18.408611111 }, // Estadi Asim Ferhatović Hase
  { lat: 44.412806, lng: 26.040444 }, // Stadionul Steaua
  { lat: -19.908333, lng: -43.917778 }, // Estadi Raimundo Sampaio
  { lat: 52.229031, lng: 16.378128 }, // Dyskobolia Stadium
  { lat: -23.526833, lng: -46.568469 }, // Estádio Parque São Jorge
  { lat: 50.0697, lng: 8.25719 }, // Helmut-Schön-Sportpark
  { lat: 41.270014, lng: 36.356122 }, // Samsun 19 Mayıs Stadium
  { lat: 50.1428, lng: 8.88306 }, // Herbert Dröse Stadion
  { lat: 51.560139, lng: -0.012639 }, // Brisbane Road
  { lat: 43.301378, lng: -1.973617 }, // Estadi d'Anoeta
  { lat: 41.385833, lng: 2.135556 }, // Camp de les Corts
  { lat: 52.3766, lng: 9.7729 }, // Eilenriedestadion
  { lat: 49.2308, lng: -123.021 }, // Swangard Stadium
  { lat: 55.9448, lng: -4.03709 }, // Broadwood Stadium
  { lat: -16.698889, lng: -49.233889 }, // Estadi Serra Dourada
  { lat: 51.005, lng: 5.533333 }, // Cegeka Arena
  { lat: 22.138706, lng: -100.950864 }, // Estadio Alfonso Lastras
  { lat: 48.4165, lng: 6.82942 }, // Q925932
  { lat: -34.9075, lng: 138.568889 }, // Hindmarsh Stadium
  { lat: 6.386, lng: 2.379333333 }, // Stade de l'Amitié
  { lat: 52.220461, lng: 21.040628 }, // Estadi de l'Exèrcit Polonès
  { lat: 9.409722, lng: -0.861667 }, // Estadi Alhaji Aliu Mahama
  { lat: 40.325556, lng: -3.714722 }, // Coliseum Alfonso Pérez
  { lat: -12.038, lng: -77.045 }, // Estadio Alberto Gallardo
  { lat: 50.427083, lng: 14.914783 }, // Městský stadion
  { lat: 40.777014, lng: 30.386558 }, // Sakarya Atatürk Stadium
  { lat: 35.527974, lng: 140.071639 }, // Ichihara Seaside Stadium
  { lat: 51.686944, lng: 5.088611 }, // Mandemakers Stadion
  { lat: 5.056233, lng: -75.489807 }, // Estadi Palogrande
  { lat: 49.615630555, lng: 6.109661111 }, // estadi Josy Barthel
  { lat: 43.59221, lng: 7.12603 }, // Estadi de Fort Carré
  { lat: 40.0146, lng: 18.1555 }, // Stadio Giuseppe Capozza
  { lat: -24.820889, lng: -65.419189 }, // Estadio Padre Ernesto Martearena
  { lat: 46.079078, lng: 23.566553 }, // Stadionul Cetate
  { lat: 48.76762, lng: 2.45944 }, // Stade Dominique Duvauchelle
  { lat: 60.983056, lng: 25.634167 }, // Lahti Stadium
  { lat: 52.494444, lng: 5.066389 }, // Kras Stadion
  { lat: 44.861565, lng: 13.851561 }, // Estadi Aldo Drosina
  { lat: 51.487489, lng: 0.035632 }, // The Valley
  { lat: 50.609908, lng: 5.543344 }, // Stade Maurice Dufrasne
  { lat: 10.303371, lng: -61.441673 }, // Manny Ramjohn Stadium
  { lat: 6.2568, lng: -75.590172 }, // Estadi Atanasio Girardot
  { lat: 10.334217, lng: -84.43445 }, // Estadio Carlos Ugalde Álvarez
  { lat: 41.366932, lng: -8.411789 }, // Estádio do Clube Desportivo das Aves
  { lat: 53.438888888, lng: -2.966388888 }, // Goodison Park
  { lat: 53.804222222, lng: -1.759022222 }, // Valley Parade
  { lat: 45.542356, lng: 13.730453 }, // Estadi Bonifika
  { lat: 40.813663, lng: 72.329307 }, // Soghlom Avlod Stadium
  { lat: -7.253889, lng: -35.880833 }, // Amigão
  { lat: 46.5625, lng: 15.640556 }, // Estadi Ljudski vrt
  { lat: 42.5574, lng: -6.599972 }, // Estadi El Toralín
  { lat: 40.391944, lng: -3.658961 }, // Campo de Fútbol de Vallecas
  { lat: 36.839778, lng: 10.185361 }, // Estadi Olímpic El Menzah
  { lat: 28.1, lng: -15.456667 }, // Estadi de Gran Canaria
  { lat: 54.89556, lng: -2.91365 }, // Brunton Park
  { lat: 46.78833333, lng: 6.525 }, // Stade Sous-Ville
  { lat: 58.729767, lng: 5.649772 }, // Bryne Stadion
  { lat: 55.648853, lng: 12.418358 }, // Estadi Brøndby
  { lat: 38.3951, lng: 27.1928 }, // Buca Arena
  { lat: 37.350556, lng: -121.936667 }, // Stevens Stadium
  { lat: 40.859722, lng: 14.293333 }, // Stadio Giorgio Ascarelli
  { lat: 53.568889, lng: -2.416111 }, // Burnden Park
  { lat: 40.192222, lng: 29.048333 }, // estadi Bursa Atatürk
  { lat: 55.8716, lng: 9.8576 }, // CASA Arena Horsens
  { lat: 57.494722, lng: -4.2175 }, // Caledonian Stadium
  { lat: 56.005136, lng: -3.754269 }, // Falkirk Stadium
  { lat: 53.205278, lng: 5.814722 }, // Estadi Cambuur
  { lat: 38.690978, lng: -0.490258 }, // Camp Municipal del Collao
  { lat: 51.47777778, lng: 7.33194444 }, // Q1030309
  { lat: 39.271666666, lng: -2.604444444 }, // Q1031429
  { lat: 32.649333333, lng: -16.900361111 }, // Campo do Adelino Rodrigues
  { lat: 55.9413, lng: -4.72681 }, // Cappielow
  { lat: 49.472222222, lng: 6.084722222 }, // Estadi Jos Nosbaum
  { lat: 54.5825, lng: -5.955 }, // Windsor Park
  { lat: 56.10873889, lng: -3.34709722 }, // Central Park, Cowdenbeath
  { lat: 51.185, lng: 4.382222 }, // Estadi Olímpic d'Anvers
  { lat: 13.917989, lng: 100.547411 }, // Thunderdome Stadium
  { lat: 42.679306, lng: 26.336667 }, // Hadzhi Dimitar Stadium
  { lat: 38.919722, lng: 16.587778 }, // Stadio Nicola Ceravolo
  { lat: 49.50185, lng: 0.1712 }, // Estadi Jules Deschaseaux
  { lat: 33.371944, lng: 130.520278 }, // Tosu Stadium
  { lat: 62.099722, lng: -6.736111 }, // Svangaskarð
  { lat: 15.118333, lng: 105.816389 }, // Champasak Stadium
  { lat: 15.1184127, lng: 105.8163491 }, // Champasak Stadium
  { lat: 50.714964, lng: 15.162225 }, // Chance Arena
  { lat: 27.471417, lng: 89.641056 }, // Changlimithang Stadium
  { lat: -31.368956, lng: -64.246244 }, // Estadi Mario Alberto Kempes
  { lat: 51.398333333, lng: -0.085555555 }, // Selhurst Park
  { lat: -34.449333, lng: -58.542219 }, // Estadio José Dellagiovanna
  { lat: -6.218578, lng: 106.802511 }, // Estadi Bung Karno
  { lat: 51.193269, lng: 3.181311 }, // Jan Breydel Stadium
  { lat: 41.06545, lng: 28.998967 }, // Estadi Ali Sami Yen
  { lat: -32.889564, lng: -68.879994 }, // Estadi Malvinas Argentinas
  { lat: 25.267358, lng: 51.484251 }, // Estadi Jassim Bin Hamad
  { lat: 4.976898, lng: -1.681799 }, // Estadi de Sekondi-Takoradi
  { lat: 48.019722, lng: 37.803889 }, // RSC Olimpiyskiy
  { lat: 45.6225, lng: 13.792778 }, // Stadio Nereo Rocco
  { lat: 45.475463, lng: 9.178544 }, // Arena Civica
  { lat: 42.356389, lng: 13.403889 }, // Stadio Tommaso Fattori
  { lat: 52.344444, lng: 4.95 }, // Estadi De Meer
  { lat: 40.009444444, lng: -82.991111111 }, // Columbus Crew Stadium
  { lat: 37.982905, lng: 23.69467 }, // Panathinaikos F.C. New Stadium
  { lat: 44.053056, lng: 12.577222 }, // Stadio Romeo Neri
  { lat: 59.213049, lng: 10.92732 }, // Fredrikstad Stadion
  { lat: -34.614167, lng: -58.535 }, // Estadio Almagro
  { lat: 45.6356, lng: 9.20821 }, // Stadio Ferruccio
  { lat: 48.10743, lng: -1.71282 }, // Estadi de la Route de Lorient
  { lat: 51.5478, lng: 0.159867 }, // Victoria Road
  { lat: 39.494722, lng: -0.364167 }, // Estadi Ciutat de València
  { lat: 48.980485, lng: 9.393005 }, // WIRmachenDRUCK Arena
  { lat: 48.9799, lng: 9.39413 }, // WIRmachenDRUCK Arena
  { lat: 44.788611, lng: 20.459167 }, // Estadi Partizan
  { lat: 35.882861111, lng: 14.513027777 }, // Estadi Tony Bezzina
  { lat: 52.255517, lng: 21.001322 }, // Stadion Polonii Warszawa
  { lat: 48.08387, lng: -0.75351 }, // Stade Francis Le Basser
  { lat: 49.411106407, lng: 1.070777714 }, // Stade Robert Diochon
  { lat: 43.81602, lng: 4.35928 }, // Stade des Costières
  { lat: 31.775833, lng: 35.2 }, // Hebrew University Stadium
  { lat: 21.4855, lng: 39.9737 }, // Estadi Rei Abdul Aziz
  { lat: 50.644553, lng: 3.046972 }, // Stade Grimonprez-Jooris
  { lat: 36.84, lng: -2.435278 }, // Estadi dels Jocs Mediterranis
  { lat: 59.13725, lng: 10.17969 }, // Jotun Arena
  { lat: 60.195278, lng: 11.987222 }, // Gjemselund Stadion
  { lat: 51.573889, lng: -2.959444 }, // Newport Stadium
  { lat: 42.749167, lng: 13.954722 }, // Stadio Rubens Fadini
  { lat: 45.161792, lng: 1.548485 }, // Stade Amédée-Domenech
  { lat: 55.261359, lng: 9.487791 }, // Sydbank Park
  { lat: 63.4125, lng: 10.405 }, // Lerkendal Stadion
  { lat: 34.769186, lng: 32.440144 }, // Pafiako Stadium
  { lat: 42.343611, lng: 14.136389 }, // Stadio Guido Angelini
  { lat: 56.95516667, lng: 24.15886111 }, // Estadi Daugava
  { lat: 40.747319, lng: 14.652581 }, // Stadio San Francesco d'Assisi
  { lat: 41.95138, lng: 8.77204 }, // Stade Ange Casanova
  { lat: 41.2044, lng: 32.6202 }, // Yenişehir Stadium
  { lat: 41.2044, lng: 32.6202 }, // Yenişehir Stadium
  { lat: 41.2044, lng: 32.6202 }, // Yenişehir Stadium
  { lat: 45.664806, lng: 25.585583 }, // Stadionul Silviu Ploeșteanu
  { lat: 35.577545, lng: 140.122912 }, // Fukuda Denshi Arena
  { lat: 52.9275, lng: -1.4611 }, // County Cricket Ground, Derby
  { lat: 51.564444, lng: -1.770556 }, // County Ground, Swindon
  { lat: 53.552222, lng: -1.4675 }, // Oakwell
  { lat: 39.489444, lng: -0.396389 }, // Estadi Nou Mestalla
  { lat: 55.7811, lng: 12.5058 }, // Lyngby Stadion
  { lat: 40.397333, lng: 49.852417 }, // Estadi Republicà Tofiq Bahramov
  { lat: 60.1875, lng: 24.9225 }, // Bolt Arena
  { lat: 51.8025, lng: 4.69 }, // M-Scores Stadion
  { lat: 51.8025, lng: 4.69 }, // M-Scores Stadion
  { lat: 51.486389, lng: 5.68 }, // Stadion De Braak
  { lat: 33.154458333, lng: -96.835158333 }, // Estadi Toyota
  { lat: 53.108611, lng: 6.864444 }, // De Langeleegte
  { lat: 52.517292, lng: 6.121911 }, // MAC³PARK stadion
  { lat: 57.159166666, lng: -2.088888888 }, // Pittodrie Stadium
  { lat: 40.613839, lng: 22.972422 }, // Estadi Toumba
  { lat: 51.9234, lng: 0.897703 }, // Colchester Community Stadium
  { lat: 53.772222222, lng: -2.688055555 }, // Deepdale
  { lat: 56.09981389, lng: -3.16833611 }, // Stark's Park
  { lat: -19.470833, lng: -42.541944 }, // Estádio Municipal João Lamego Netto
  { lat: 35.5725, lng: -5.348611 }, // Saniat Rmel
  { lat: 52.009444, lng: -0.733333 }, // Stadium MK
  { lat: 55.03866667, lng: 82.92505556 }, // Spartak Stadium
  { lat: 51.413333, lng: 16.1975 }, // Stadion Zagłębia Lubin
  { lat: 19.041944, lng: 73.026667 }, // DY Patil Stadium
  { lat: 52.564694, lng: -0.240389 }, // London Road Stadium
  { lat: 53.361667, lng: -6.275 }, // Dalymount Park
  { lat: 53.361667, lng: -6.275 }, // Dalymount Park
  { lat: 45.740556, lng: 21.244167 }, // Estadi Dan Păltinişanu (1963)
  { lat: -34.54018333, lng: -58.48159444 }, // City of Vicente López Stadium
  { lat: 14.453778, lng: -87.656839 }, // Estadio Carlos Miranda
  { lat: 56.55226944, lng: -2.59151944 }, // Gayfield Park
  { lat: 45.6135074, lng: 8.8807582 }, // Stadio Carlo Speroni
  { lat: 20.66834, lng: -103.327832 }, // estadi Felipe Martínez Sandoval
  { lat: 55.631922, lng: 12.482878 }, // Hvidovre Stadion
  { lat: 6.820833, lng: 3.920278 }, // Otunba Dipo Dina International Stadium
  { lat: -34.65792222, lng: -58.46453889 }, // Nueva España Stadium
  { lat: 42.444728, lng: 19.264378 }, // Estadi Ciutat de Podgorica
  { lat: 48.00892, lng: -4.09923 }, // Stade de Penvillers
  { lat: 18.393333, lng: -66.150833 }, // Estadi Juan Ramón Loubriel
  { lat: 27.695052, lng: 85.314835 }, // Dasarath Rangasala Stadium
  { lat: 25.420861111, lng: 51.490388888 }, // Estadi Icònic de Lusail
  { lat: 37.7659, lng: 29.0823 }, // Denizli Atatürk Stadium
  { lat: 35.916303, lng: 139.633377 }, // NACK5 Stadium Omiya
  { lat: 55.8178, lng: 37.4403 }, // Otkritie Arena
  { lat: 52.9425, lng: -1.137222 }, // Meadow Lane
  { lat: -34.670267, lng: -58.370969 }, // Estadi Libertadores de América
  { lat: -34.652064, lng: -58.440119 }, // Estadi Pedro Bidegain
  { lat: -34.910975, lng: -57.932592 }, // Estadi Juan Carmelo Zerillo
  { lat: -34.6675, lng: -58.368611 }, // Estadi Presidente Perón
  { lat: 39.648711, lng: 22.412111 }, // Alcazar Stadium
  { lat: -34.635375, lng: -58.520711 }, // Estadi José Amalfitani
  { lat: 31.271111, lng: 32.291389 }, // Estadi de Port Saïd
  { lat: 53.051944, lng: -3.003611 }, // Racecourse Ground
  { lat: 39.805555555, lng: -104.891944444 }, // Dick's Sporting Goods Park
  { lat: 47.553888888, lng: 21.633333333 }, // Debrecen Stadion
  { lat: 41.754444, lng: -2.467778 }, // Nuevo Estadio Los Pajaritos
  { lat: 52.206389, lng: 6.9025 }, // Estadi Diekman
  { lat: 44.455083, lng: 26.102444 }, // Stadionul Dinamo
  { lat: 50.0514, lng: 10.2031 }, // Willy-Sachs-Stadion
  { lat: 37.914261, lng: 40.221461 }, // Diyarbakır Atatürk Stadium
  { lat: 47.281, lng: 15.9772 }, // Stadion Hartberg
  { lat: 47.551480555, lng: 7.571308333 }, // Stadion Schützenmatte
  { lat: 46.8239, lng: 12.7672 }, // Q1236290
  { lat: 51.6036, lng: 7.44532 }, // Q1236957
  { lat: 8.556389, lng: -71.216667 }, // Estadi Metropolità de Mérida
  { lat: 48.4064, lng: 15.5981 }, // Sepp-Doll-Stadion
  { lat: 54.619517, lng: -5.947272 }, // Solitude
  { lat: 53.226944444, lng: 6.580277777 }, // Oosterpark Stadion
  { lat: 46.779678, lng: 23.577247 }, // Stadionul Dr. Constantin Rădulescu
  { lat: 40.600069, lng: 22.9695 }, // estadi Kleanthis Vikelidi
  { lat: 51.8336, lng: 8.32201 }, // Jahnstadion
  { lat: 46.49234, lng: 11.345385 }, // Stadio Druso
  { lat: 61.268056, lng: 24.020278 }, // Tehtaan kenttä
  { lat: 50.06744167, lng: 12.37652778 }, // Q1265230
  { lat: 11.181436, lng: -60.716905 }, // Dwight Yorke Stadium
  { lat: 12.58, lng: -16.25875 }, // Estadi Aline Sitoe Diatta
  { lat: -12.946636, lng: -38.417019 }, // Estádio de Pituaçu
  { lat: 49.631381, lng: 8.335803 }, // Wormatia-Stadion
  { lat: 45.339202, lng: 14.380959 }, // Estadi Kantrida
  { lat: 56.075308, lng: -3.441906 }, // East End Park
  { lat: 55.961666666, lng: -3.165555555 }, // Easter Road
  { lat: 48.0561, lng: 8.42972 }, // Q1279928
  { lat: 42.269942, lng: 2.999439 }, // Estadi Municipal de Vilatenim
  { lat: 41.454444, lng: 15.5425 }, // Stadio Pino Zaccheria
  { lat: 57.673056, lng: -2.96625 }, // Victoria Park
  { lat: 52.5172, lng: 13.2367 }, // Olympiapark-Amateurstadion
  { lat: 52.060719, lng: -2.717711 }, // Edgar Street
  { lat: 53.399722222, lng: -2.166388888 }, // Edgeley Park
  { lat: 53.677, lng: 9.97705 }, // Edmund-Plambeck-Stadion
  { lat: 55.716389, lng: 37.656389 }, // Eduard Streltsov Stadium
  { lat: 50.8798, lng: 12.0673 }, // Stadion der Freundschaft
  { lat: 50.35755833, lng: 18.89871667 }, // Stadion Edwarda Szymkowiaka
  { lat: -5.50784, lng: 12.24036 }, // Estadi Nacional de Chiazi
  { lat: 41.40127778, lng: -8.52242222 }, // Estádio Municipal 22 de Junho
  { lat: 49.02806, lng: 1.37002 }, // Stade Pacy-Ménilles
  { lat: 19.718742, lng: -101.233622 }, // Morelos Stadium
  { lat: 37.135694, lng: -8.539833 }, // Estádio Municipal de Portimão
  { lat: -2.548611, lng: -44.259722 }, // Estádio Governador João Castelo
  { lat: 46.18801, lng: 6.21191 }, // Q1309112
  { lat: 55.886167, lng: -3.522872 }, // Almondvale Stadium
  { lat: -14.94888889, lng: 13.5375 }, // Estadi Nacional de Tundavala
  { lat: 44.11878, lng: 4.09184 }, // Stade Pierre Pibarot
  { lat: 48.9061, lng: 2.34105 }, // Estadi de París
  { lat: 51.755, lng: 5.528056 }, // Heesen Yachts Stadion
  { lat: 46.172583, lng: 24.35275 }, // Stadionul Gaz Metan
  { lat: 8.576805555, lng: -71.165805555 }, // Estadio Guillermo Soto Rosa
  { lat: 45.783056, lng: 24.143611 }, // Municipal stadium in Sibiu
  { lat: 38.671111, lng: 39.197778 }, // Elazığ Atatürk Stadium
  { lat: 55.939055555, lng: -3.232444444 }, // Tynecastle Stadium
  { lat: 10.405534, lng: -75.498237 }, // Estadio Jaime Morón León
  { lat: 42.211861, lng: -8.740328 }, // Estadi Abanca Balaídos
  { lat: -25.421111, lng: -49.2595 }, // Estádio Couto Pereira
  { lat: 42.687583, lng: 23.335444 }, // Estadi Nacional Vasil Levski
  { lat: -16.40729, lng: -71.520203 }, // Estadi Virgen de Chapi
  { lat: 49.3367, lng: 7.17972 }, // Ellenfeldstadion
  { lat: -17.78888889, lng: 15.61388889 }, // Q1334923
  { lat: 53.509722, lng: -1.113889 }, // Keepmoat Stadium
  { lat: 40.625833, lng: 20.782778 }, // Skënderbeu Stadium
  { lat: 48.8347, lng: 8.19722 }, // Münchfeldstadion
  { lat: 56.455897, lng: 9.402064 }, // Estadi de Viborg
  { lat: 47.51238, lng: 6.81116 }, // Estadi Auguste Bonal
  { lat: -12.59361111, lng: 13.39 }, // Estadi Nacional d'Ombaka
  { lat: 39.736977, lng: -8.931459 }, // Estádio Municipal da Marinha Grande
  { lat: 20.705, lng: -103.328139 }, // Estadi Jalisco
  { lat: 47.78672, lng: 3.58871 }, // Stade de l'Abbé-Deschamps
  { lat: 43.003333, lng: -7.570833 }, // Estadi Anxo Carro
  { lat: 42.680833, lng: -2.935556 }, // Estadi Municipal d'Anduva
  { lat: 41.926944, lng: 12.472222 }, // Estadi Flaminio
  { lat: 40.634278, lng: -3.182657 }, // Estadi Pedro Escartín
  { lat: 41.637778, lng: 13.343056 }, // Stadio Matusa
  { lat: 35.894863888, lng: 14.415372222 }, // Estadi Nacional Ta' Qali
  { lat: 11.861111, lng: -86.243611 }, // Estadio Cacique Diriangén
  { lat: 64.143589, lng: -21.876011 }, // Valbjarnarvöllur
  { lat: 13.7541372, lng: -60.9441885 }, // George Odlum Stadium
  { lat: 48.3428, lng: 10.9083 }, // Q1357112
  { lat: 49.9006, lng: 10.9289 }, // Fuchs-Park-Stadion
  { lat: -23.545555555, lng: -46.474 }, // Arena Corinthians
  { lat: 53.53613, lng: 8.09622 }, // Jadestadion
  { lat: 35.8485, lng: 139.975149 }, // Hitachi Kashiwa Soccer Stadium
  { lat: 39.77075, lng: 30.513833333 }, // Eskişehir Atatürk Stadium
  { lat: -33.970298, lng: 18.468448 }, // Newlands Stadium
  { lat: 19.99395814, lng: -99.32531118 }, // Estadio 10 de Diciembre
  { lat: -31.631853, lng: -60.715867 }, // Estadio 15 de Abril
  { lat: -24.198611, lng: -65.290833 }, // 23 de Agosto Stadium
  { lat: 10.021666666, lng: -84.209166666 }, // Estadi Alejandro Morera Soto
  { lat: -12.068542, lng: -77.022886 }, // Estadi Alejandro Villanueva
  { lat: 7.13658889, lng: -73.11658889 }, // Américo Montanini Stadium
  { lat: -25.526944, lng: -54.611944 }, // Estadi Antonio Aranda
  { lat: -25.526944, lng: -54.611944 }, // Estadi Antonio Aranda
  { lat: -25.52694, lng: -54.61194 }, // Estadi Antonio Aranda
  { lat: -25.52694, lng: -54.61194 }, // Estadi Antonio Aranda
  { lat: -30.908333, lng: -55.548333 }, // Estadi Atilio Paiva Olivera
  { lat: -31.449167, lng: -64.175278 }, // Estadio La Boutique
  { lat: 19.383389, lng: -99.178225 }, // Estadio Azul
  { lat: -31.663217, lng: -60.725394 }, // Estadi Brigadier General Estanislao López
  { lat: 38.981117, lng: -1.852142 }, // Estadi Carlos Belmonte
  { lat: 37.609746, lng: -0.995977 }, // Estadi Cartagonova
  { lat: -34.56738889, lng: -58.52816667 }, // Estadio de Chacarita Juniors
  { lat: 4.515307, lng: -75.698447 }, // Estadio Centenario
  { lat: -34.84166667, lng: -56.16138889 }, // Estadio José Pedro Damiani
  { lat: 25.555, lng: -103.403056 }, // Estadio Corona
  { lat: 44.539212305, lng: 19.230742111 }, // Estadi Lagator
  { lat: -8.5521926, lng: 115.1239586 }, // Debes Stadium
  { lat: -19.055371, lng: -169.917871 }, // Paliati Grounds
  { lat: 60.256236, lng: 29.611963 }, // Roshchino Arena
  { lat: 9.625347222, lng: -13.629555 }, // Stade Petit Sory
  { lat: 36.7241205, lng: 3.5585726 }, // Thénia Stadium
  { lat: -5.448333333, lng: -80.740277777 }, // Bernal Municipal Stadium
  { lat: 51.455295, lng: 0.1701948 }, // The Oakwood
  { lat: 58.706687, lng: 59.461901 }, // Gornyak Stadium
  { lat: 48.717802312, lng: 8.97562623 }, // Allmendstadion
  { lat: 30.55075, lng: 47.803277777 }, // Al-Bahri Stadium
  { lat: 33.351388888, lng: 43.811027777 }, // Al-Fallujah Stadium
  { lat: 30.769344, lng: 104.075794 }, // Chengdu Phoenix Hill Football Stadium
  { lat: 37.238833333, lng: 141.002611111 }, // J-VILLAGE Stadium
  { lat: -1.061667, lng: -46.798333 }, // Diogão
  { lat: 52.056972, lng: 4.2925 }, // De Aftrap
  { lat: 53.40156, lng: 49.5021 }, // Q112113979
  { lat: 48.82192, lng: 2.37732 }, // Q112208963
  { lat: 39.817429686, lng: -89.635940893 }, // Robin Roberts Stadium
  { lat: 18.333333333, lng: 105.9075 }, // Hà Tĩnh Stadium
  { lat: 37.841704949, lng: -122.105516841 }, // Saint Mary's Stadium
  { lat: 45.87029, lng: 4.71215 }, // Stade Joseph Magat
  { lat: 32.566611111, lng: 43.476305555 }, // Ayn al-Tamr Stadium
  { lat: 6.9956983, lng: -73.0498181 }, // Q113568814
  { lat: 37.050555555, lng: 22.001111111 }, // Municipal Stadium of Messini
  { lat: 46.1347, lng: 3.41585 }, // Stade Darragon
  { lat: 48.93792, lng: 8.39357 }, // Hans-Bretz-Stadion
  { lat: 20.03, lng: -75.815 }, // Estadio Antonio Maceo
  { lat: 49.516958994, lng: 9.321779528 }, // Frankenlandstadion
  { lat: 31.814776, lng: 34.6527 }, // Ashdod Stadium
  { lat: 50.3117563, lng: 11.9000318 }, // Stadion 'Ossecker Straße'
  { lat: 46.845256752, lng: -113.996890853 }, // Dornblaser Field II
  { lat: 37.286692323, lng: -6.053542302 }, // Q115798859
  { lat: 33.430555555, lng: 44.284722222 }, // Tajiat Olympic Stadium
  { lat: 38.737519607, lng: -9.203829445 }, // Estádio Pina Manique
  { lat: -10.883222222, lng: -61.897222222 }, // José de Abreu Bianco Municipal Stadium
  { lat: 8.55078422, lng: -71.235228638 }, // Ejido 'Campo Abierto' Sports Center
  { lat: 49.463833333, lng: 105.954666666 }, // My Mongolia Park Stadium
  { lat: 35.2822804, lng: 136.2550163 }, // Q117087266
  { lat: 37.241277, lng: 67.30397 }, // Surkhon Arena
  { lat: 39.6500396, lng: 141.1380349 }, // Iwate Morioka Ballpark
  { lat: 8.1377, lng: 4.6928 }, // Offa Township Stadium
  { lat: 35.679166666, lng: -0.675277777 }, // Allal Toula Stadium
  { lat: -4.925523, lng: -80.345776 }, // Q118452608
  { lat: 36.651666666, lng: 3.328611111 }, // Q118496877
  { lat: 48.676111111, lng: 26.592916666 }, // Tonkocheyev Stadium
  { lat: 46.29796, lng: 4.812143 }, // Q119164384
  { lat: 46.29796, lng: 4.812143 }, // Q119164384
  { lat: 39.120333333, lng: -94.56625 }, // CPKC Stadium
  { lat: 45.04048, lng: 3.87198 }, // Stade du Viouzou
  { lat: -33.408863462, lng: -70.656237898 }, // Q120753174
  { lat: 23.335463, lng: 107.583007 }, // Pingguo Stadium
  { lat: 50.34375, lng: 30.622027777 }, // Arena Livyi Bereh
  { lat: 53.617782, lng: 9.975697 }, // Q122017547
  { lat: 17.657444444, lng: 44.476613888 }, // Prince Hathloul bin Abdul Aziz Sports City
  { lat: 17.657177, lng: 44.477534 }, // Prince Hathloul bin Abdul Aziz Sports City
  { lat: 53.200555555, lng: 5.768333333 }, // Kooi Stadion
  { lat: 45.60317, lng: 5.2655 }, // Stade de Chatereine
  { lat: 30.33188, lng: 120.1777 }, // Q122811673
  { lat: 13.745555555, lng: 100.525555555 }, // Suphachalasai Stadium
  { lat: 36.879357702, lng: 15.063758189 }, // Q122941596
  { lat: 49.3981089, lng: 15.5833097 }, // Horácká multifunkční aréna
  { lat: 49.3981089, lng: 15.5833097 }, // Horácká multifunkční aréna
  { lat: 48.392777777, lng: 13.306666666 }, // Rottalstadion
  { lat: 48.207222222, lng: 11.323611111 }, // Olching Speedwaybahn
  { lat: 56.334444444, lng: 43.966388888 }, // Ice Palace (Nizhniy Novgorod)
  { lat: 56.334722222, lng: 43.966944444 }, // Ice Palace (Nizhniy Novgorod)
  { lat: 34.520277777, lng: 109.454722222 }, // Weinan Sports Center Stadium
  { lat: 44.129450017, lng: 18.587310704 }, // Danac Stadium
  { lat: 50.80484, lng: 12.95509 }, // Q124168900
  { lat: 61.354166666, lng: 16.395 }, // SBB Arena
  { lat: 31.021698687, lng: 46.251238516 }, // Q124617950
  { lat: 32.59016, lng: -6.25867 }, // Q124656169
  { lat: -6.647834623, lng: -79.789626071 }, // Q124660833
  { lat: 34.283297, lng: 108.768768 }, // Xi'an International Football Center
  { lat: 43.42328948, lng: -2.723333784 }, // Q125659900
  { lat: -17.050277777, lng: -64.869722222 }, // Q125963312
  { lat: 32.319684, lng: 35.028425 }, // Tulkarm International Stadium
  { lat: 26.350571111, lng: 50.181142777 }, // Al-Ettifaq Club Stadium
  { lat: 6.2153, lng: 7.0639 }, // Awka City Stadium
  { lat: 24.811, lng: 46.547 }, // Al-Murabba Stadium
  { lat: 42.08750945, lng: -87.700625419 }, // Ryan Field
  { lat: -25.851247, lng: 32.418549 }, // Campo da ABB
  { lat: 38.974750325, lng: -5.786257348 }, // Estadio Municipal Villanovense
  { lat: 52.251372, lng: 21.076658 }, // Q130852083
  { lat: 48.664694444, lng: 33.068555555 }, // Olimp Stadium
  { lat: 38.0601, lng: 58.081 }, // Arkadag Stadium
  { lat: -25.277846, lng: -57.611039 }, // Estadi Dr. Nicolás Leoz
  { lat: -34.606028, lng: -58.472583 }, // Diego Armando Maradona Stadium
  { lat: 42.131944, lng: -0.424444 }, // Estadi El Alcoraz
  { lat: -6.768333, lng: -79.860833 }, // Estadio Elías Aguirre
  { lat: -25.272222, lng: -57.493056 }, // Estadi Feliciano Cáceres
  { lat: 7.894478, lng: -72.501717 }, // General Santander
  { lat: 10.180083, lng: -64.656117 }, // Estadi José Antonio Anzoátegui
  { lat: 4.804804, lng: -75.75219 }, // Estadio Hernán Ramírez Villegas
  { lat: 40.995278, lng: -5.665 }, // Estadi Helmántico
  { lat: 20.105144, lng: -98.756114 }, // Gorda hilda
  { lat: -16.499444, lng: -68.122778 }, // Estadi Hernando Siles
  { lat: -34.6165, lng: -58.49775 }, // Islas Malvinas Stadium
  { lat: 34.725217, lng: 137.875006 }, // Yamaha Stadium
  { lat: -38.017944, lng: -57.582333 }, // Estadi José María Minella
  { lat: -31.4035, lng: -64.206272 }, // Julio Cesar Villagra Stadium
  { lat: -34.678333, lng: -58.340278 }, // Julio Humberto Grondona Stadium
  { lat: 42.453333, lng: -2.453333 }, // Estadi Las Gaunas
  { lat: -0.107694, lng: -78.489083 }, // Estadi Rodrigo Paz Delgado
  { lat: 42.011739, lng: -4.516136 }, // Estadi Nueva Balastera
  { lat: -34.8675, lng: -56.25194444 }, // Estadio Luis Tróccoli
  { lat: 19.164222, lng: -96.125017 }, // Estadio Luis 'Pirata' Fuente
  { lat: -32.956056, lng: -60.661444 }, // Estadi Marcelo Bielsa
  { lat: -25.259722, lng: -57.583889 }, // Estadio Martín Torres
  { lat: -33.871928, lng: -60.561475 }, // Miguel Morales Stadium
  { lat: 10.92686111, lng: -74.80072222 }, // Metropolità Roberto Meléndez
  { lat: 9.993544, lng: -69.219858 }, // Estadi Metropolità de Futbol de Lara
  { lat: 42.837111, lng: -2.688044 }, // Estadi de Mendizorroza
  { lat: -2.178861, lng: -79.894369 }, // Estadi Modelo Alberto Spencer
  { lat: -12.055694, lng: -76.935972 }, // Estadi Monumental U
  { lat: -33.506611, lng: -70.605944 }, // Estadi Monumental David Arellano
  { lat: 35.8854, lng: -5.3279 }, // Estadio Municipal Alfonso Murube
  { lat: 40.3404, lng: -3.7607 }, // Estadi Municipal de Butarque
  { lat: 36.689167, lng: -6.120278 }, // Estadi Municipal de Chapín
  { lat: 35.285, lng: -2.949444 }, // Estadi Municipal Álvarez Claro
  { lat: 40.338889, lng: -3.840556 }, // Estadi Santo Domingo
  { lat: 12.109167, lng: -86.273056 }, // Nicaragua National Football Stadium
  { lat: -12.067138888, lng: -77.033722222 }, // Estadi Nacional del Perú
  { lat: 21.115544, lng: -101.657744 }, // Estadi León
  { lat: 38.858922, lng: -7.005886 }, // Estadi Nuevo Vivero
  { lat: 43.360783, lng: -5.870222 }, // Estadi Carlos Tartiere
  { lat: 15.470122222, lng: -88.006761111 }, // Estadio Olímpico Metropolitano
  { lat: 3.429889, lng: -76.541083 }, // Estadi Olímpic Pascual Guerrero
  { lat: -31.712119, lng: -55.991924 }, // Estadi Raúl Goyenola
  { lat: -31.711944, lng: -55.991944 }, // Estadi Raúl Goyenola
  { lat: -38.726944, lng: -62.275833 }, // Estadio Roberto Natalio Carminatti
  { lat: -25.30344444, lng: -57.61594444 }, // Estadio Rogelio Livieres
  { lat: 9.035833, lng: -79.469444 }, // Estadio Rommel Fernández
  { lat: 9.965427, lng: -84.075455 }, // Estadio Ricardo Saprissa Aymá
  { lat: 18.85712222, lng: -97.10271944 }, // Estadio Socum
  { lat: 21.880653, lng: -102.275483 }, // Victoria Stadium
  { lat: 18.42, lng: -70.11 }, // Estadio Panamericano, San Cristóbal
  { lat: 18.42, lng: -70.11 }, // Estadio Panamericano, San Cristóbal
  { lat: 40.65944444, lng: -7.90083333 }, // Estádio do Fontelo
  { lat: 1.82, lng: 9.7875 }, // Estadio La Libertad
  { lat: -31.611946, lng: -68.527479 }, // Estadio San Juan del Bicentenario
  { lat: 38.716, lng: -9.406 }, // Estádio António Coimbra da Mota
  { lat: -22.508336, lng: -44.096928 }, // Estádio Raulino de Oliveira
  { lat: -25.439444, lng: -49.255833 }, // Estadi Durival Britto e Silva
  { lat: -8.969947, lng: 13.283672 }, // Estadi 11 de Novembro
  { lat: -8.062888888, lng: -34.902888888 }, // Estadi Adelmar da Costa Carvalho
  { lat: 37.029128, lng: -7.848483 }, // Estádio José Arcanjo
  { lat: -22.031517, lng: -47.901764 }, // Estádio Luís Augusto de Oliveira
  { lat: 40.926689, lng: -8.545814 }, // Estádio Marcolino de Castro
  { lat: -22.098611, lng: -51.415 }, // Estadio Paulo Constantino
  { lat: 39.23984722, lng: -9.30878333 }, // Estádio Municipal da Lourinhã
  { lat: 40.92833333, lng: -8.24861111 }, // Estadi Municipal d'Arouca
  { lat: 40.162675, lng: -8.859369 }, // Estádio Municipal José Bento Pessoa
  { lat: -27.585556, lng: -48.586667 }, // Estádio Orlando Scarpelli
  { lat: -1.381111, lng: -48.444 }, // Estádio Estadual Jornalista Edgar Augusto Proença
  { lat: -1.381111, lng: -48.444 }, // Estádio Estadual Jornalista Edgar Augusto Proença
  { lat: -30.060497, lng: -51.213594 }, // Estadi Olímpico Monumental
  { lat: -23.527556, lng: -46.678417 }, // Estadi Palestra Itália
  { lat: 41.271388888, lng: -8.385277777 }, // Estádio Capital do Móvel
  { lat: 32.670625, lng: -16.883525 }, // Estádio da Madeira
  { lat: -27.666389, lng: -48.531667 }, // Estádio da Ressacada
  { lat: 41.18388889, lng: -8.66694444 }, // Estádio do Mar
  { lat: 53.206111111, lng: 6.591388888 }, // Euroborg
  { lat: 48.1681, lng: 11.5289 }, // Dantestadion
  { lat: 52.5511, lng: 13.3927 }, // NNW-Platz
  { lat: 55.8597, lng: -3.95975 }, // Excelsior Stadium
  { lat: 48.5322, lng: 12.1383 }, // Q1384007
  { lat: -1.228056, lng: 36.890556 }, // Moi International Sports Centre
  { lat: 54.3099, lng: 13.0964 }, // Q1387008
  { lat: 36.885833, lng: 7.733056 }, // Estadi 19 de Maig de 1956
  { lat: 55.815847, lng: 12.353289 }, // Right to Dream Park
  { lat: 44.712625, lng: 26.656017 }, // Stadionul Tineretului
  { lat: 48.8825, lng: 9.07222 }, // Felsenberg-Arena
  { lat: 51.542778, lng: 5.066944 }, // Estadi Rei Guillem II
  { lat: 51.8833, lng: 8.51444 }, // Sportclub Arena
  { lat: 44.313889, lng: 23.784167 }, // Stadionul Ion Oblemenco
  { lat: 46.848611, lng: 16.848611 }, // ZTE Arena
  { lat: 51.0373, lng: 6.99511 }, // Q1415059
  { lat: 60.341544, lng: 5.268447 }, // Varden Amfi
  { lat: 49.17956, lng: -0.39667 }, // Stade Michel d'Ornano
  { lat: 58.914611, lng: 5.730442 }, // Estadi Viking
  { lat: 55.881556, lng: -4.269639 }, // Estadi Firhill
  { lat: 61.4925, lng: 23.764167 }, // Estadi Ratina
  { lat: 41.042, lng: 40.5732 }, // Yeni Rize Şehir Stadı
  { lat: 41.315522, lng: 69.260244 }, // Pakhtakor Markaziy Stadium
  { lat: 43.495545, lng: -1.455446 }, // Stade Didier Deschamps
  { lat: 37.351389, lng: -121.925 }, // Avaya Stadium
  { lat: 14.61694444, lng: -90.53472222 }, // Estadio El Trébol
  { lat: 35.902461, lng: 14.49259 }, // Estadi Empire
  { lat: 20.945833, lng: -89.593611 }, // Estadio Carlos Iturralde
  { lat: 18.655069, lng: -99.192027 }, // Estadio Coruco Díaz
  { lat: 24.830556, lng: -107.404167 }, // Estadio Carlos González
  { lat: 19.054722, lng: -98.186389 }, // Estadio Ignacio Zaragoza
  { lat: 29.107694, lng: -110.995764 }, // Estadio Héroe de Nacozari
  { lat: 20.358061, lng: -102.0499 }, // Estadio Juan N. López
  { lat: 20.535, lng: -100.818333 }, // Monumental Stadium football Miguel Aleman Valdes
  { lat: 28.712778, lng: -106.143889 }, // Estadio Olímpico de la UACH
  { lat: 22.279988, lng: -97.850773 }, // Estadio Tamaulipas
  { lat: 19.285156, lng: -99.676131 }, // Estadio Universitario Alberto Chivo Cordova
  { lat: 19.700294, lng: -101.168075 }, // Estadio Venustiano Carranza
  { lat: 25.670172, lng: -100.2437 }, // Estadio BBVA
  { lat: 38.7628177, lng: -9.1586173 }, // Estádio José Alvalade (1956)
  { lat: 38.752036, lng: -9.227967 }, // Estádio José Gomes
  { lat: 11.57413889, lng: 43.13188889 }, // Stade du Ville
  { lat: 23.73945, lng: -99.15246667 }, // Villareal Anaya Stadium
  { lat: 23.7395, lng: -99.1525 }, // Villareal Anaya Stadium
  { lat: -11.392222, lng: 43.288611 }, // Stade Said Mohamed Cheikh
  { lat: 22.141391, lng: -100.985159 }, // Estadio Plan de San Luis Potosí
  { lat: 34.615339, lng: 135.516572 }, // Yodoko Sakura Stadium
  { lat: 8.8875, lng: -79.775556 }, // Estadio Agustín Sánchez
  { lat: 6.202222222, lng: 1.239722222 }, // Stade de Kégué
  { lat: 36.349167, lng: 6.625833 }, // Stade Mohamed Hamlaoui
  { lat: 35.741211, lng: -5.858105 }, // Grand Stade de Tanger
  { lat: 6.477778, lng: 2.618611 }, // estadi Charles de Gaulle
  { lat: 45.430236, lng: 28.022378 }, // Stadionul Oțelul
  { lat: -4.635511111, lng: 55.470461111 }, // Stade Linité
  { lat: 42.88155556, lng: 20.85088889 }, // Olympic Stadium Adem Jashari
  { lat: 51.103619444, lng: 4.374458333 }, // Gemeentelijk Parkstadion
  { lat: 43.3195118, lng: -1.9752008 }, // Estadi d'Atotxa
  { lat: 48.2489, lng: 16.3597 }, // Estadi Hohe Warte
  { lat: 44.940278, lng: 26.033333 }, // Estadi Ilie Oană
  { lat: 49.817419, lng: 19.054267 }, // Stadion Miejski
  { lat: 36.47, lng: -6.207222 }, // Estadio Iberoamericano Bahía Sur
  { lat: -34.776394, lng: -56.165854 }, // Estadio Complejo Rentistas
  { lat: 41.32583333, lng: 19.44944444 }, // Estadi Niko Dovana
  { lat: 41.326081, lng: 19.449856 }, // Estadi Niko Dovana
  { lat: 51.661944, lng: -0.272222 }, // Meadow Park
  { lat: -20.501389, lng: -54.609722 }, // Morenão
  { lat: -29.162, lng: -51.176 }, // Estádio Alfredo Jaconi
  { lat: -25.43152778, lng: -49.21930556 }, // Pinheirão
  { lat: -2.206603, lng: -79.893758 }, // Estadi George Capwell
  { lat: 43.181706, lng: -2.475803 }, // Estadi Municipal d'Ipurua
  { lat: -8.827389, lng: 13.255889 }, // Estádio da Cidadela
  { lat: 36.1585, lng: -5.34025 }, // Estadio Municipal de La Línea de la Concepción
  { lat: 43.491358, lng: -8.239274 }, // Estadi Municipal d'A Malata
  { lat: 44.020872, lng: 20.899194 }, // Čika Dača Stadium
  { lat: 53.225453, lng: -4.150139 }, // Nantporth
  { lat: 55.6063, lng: -2.78414 }, // Netherdale
  { lat: 52.8759, lng: -3.02631 }, // Park Hall
  { lat: 9.94455, lng: -84.0441 }, // Estadio Ecológico
  { lat: 50.279747, lng: 19.001203 }, // Stadion GKS Katowice
  { lat: 42.682527777, lng: 13.762583333 }, // Stadio Gaetano Bonolis
  { lat: 43.96885, lng: 21.268411 }, // Jagodina City Stadium
  { lat: 44.660633, lng: 20.901733 }, // Smederevo City Stadium
  { lat: 43.583114, lng: 21.338122 }, // Estadi Mladost
  { lat: 45.609906, lng: 19.528203 }, // Stadion Hajduk
  { lat: 46.081781, lng: 19.676958 }, // Estadi Gradski Subotica
  { lat: 58.242286, lng: 22.480172 }, // Kuressaare linnastaadion
  { lat: 43.897819, lng: 20.341406 }, // Čačak Stadium
  { lat: 44.772658, lng: 20.421639 }, // Stadion Čukarički
  { lat: 44.876358, lng: 20.444283 }, // Vizelj park
  { lat: 44.765156, lng: 20.472153 }, // Stadion Kralj Petar I
  { lat: 46.166111, lng: 16.834722 }, // Gradski stadion
  { lat: 45.864722, lng: 15.799722 }, // Stadion ŠRC Zaprešić
  { lat: 45.440833, lng: 17.663333 }, // Kamen Ingrad Stadium
  { lat: 43.743553, lng: 15.896058 }, // Šubićevac Stadium
  { lat: 44.540278, lng: 10.788611 }, // Stadio Enzo Ricci
  { lat: 13.097778, lng: -86.353056 }, // Estadio Independencia
  { lat: 13.097778, lng: -86.353056 }, // Estadio Independencia
  { lat: 13.0978, lng: -86.3529 }, // Estadio Independencia
  { lat: 13.0978, lng: -86.3529 }, // Estadio Independencia
  { lat: 36.8206, lng: 34.5389 }, // Mersin Arena
  { lat: 54.413056, lng: -6.457778 }, // Shamrock Park
  { lat: -26.443, lng: 31.2055 }, // Somhlolo National Stadium
  { lat: 14.435241, lng: -11.439925 }, // Estadi Abdoulaye Nakoro Cissoko
  { lat: 35.21361111, lng: 33.33777778 }, // Nicosia Atatürk Stadium
  { lat: 4.7606, lng: -6.63811 }, // Stade Municipal
  { lat: 11.3136, lng: -5.69944 }, // Estadi Babemba Traoré
  { lat: 10.04083333, lng: -84.16055556 }, // Q3495546
  { lat: 14.96694444, lng: -89.52694444 }, // Estadio David Ordoñez Bardales
  { lat: 10.211389, lng: -83.789722 }, // Estadio Ebal Rodríguez
  { lat: 10.635833, lng: -85.433333 }, // Estadio Edgardo Baltodano Briceño
  { lat: 13.291612, lng: -87.19339 }, // Estadio Fausto Flores Lagos
  { lat: -20.245833, lng: 57.421111 }, // Stade Germain Comarmond
  { lat: 10.091711, lng: -84.476272 }, // Estadio Carlos Roldan
  { lat: 37.7681, lng: 30.5611 }, // Isparta Atatürk Stadium
  { lat: -20.89503, lng: 55.50148 }, // Stade Jean-Ivoula
  { lat: 9.889628, lng: -84.049322 }, // Estadio Jorge 'Cuty' Monge
  { lat: 13.632222, lng: -87.890278 }, // Estadio Jose Ramon Flores
  { lat: 9.991111111, lng: -83.033055555 }, // Estadi Juan Gobán
  { lat: 14.7950799, lng: -89.5444 }, // Estadio Las Victorias
  { lat: 9.976422, lng: -84.838781 }, // Estadio Lito Pérez
  { lat: 4.429509, lng: -75.218325 }, // Estadio Manuel Murillo Toro
  { lat: 45.73717, lng: 7.32722 }, // Mario Puchoz Stadium
  { lat: 9.97276, lng: -84.0069 }, // Estadi Municipal el Labrador
  { lat: 9.368611111, lng: -83.704444444 }, // Estadio Municipal de Pérez Zeledón
  { lat: 53.8857, lng: 11.452 }, // Kurt-Bürger-Stadion
  { lat: 44.455931, lng: 26.056831 }, // Stadionul Giulești-Valentin Stănescu
  { lat: 53.72416667, lng: -7.85361111 }, // Flancare Park
  { lat: 49.7352, lng: 7.29491 }, // Stadion Im Haag
  { lat: 53.43657611, lng: 14.51865806 }, // Stadion Florian Kryger
  { lat: 48.7109, lng: 8.99353 }, // Floschenstadion
  { lat: 48.40293, lng: -4.46148 }, // Stade Francis-Le Blé
  { lat: 42.65196, lng: 9.44303 }, // Stade Armand Cesari
  { lat: 32.4828, lng: 51.4214 }, // Estadi Foolad Shahr
  { lat: 50.733953, lng: 3.211082 }, // Stade Le Canonnier
  { lat: 56.1188, lng: -3.91176 }, // Forthbank Stadium
  { lat: 61.231983, lng: 7.085238 }, // Fosshaugane Campus
  { lat: 40.707, lng: 72.8722 }, // Tsentral'nyi Stadion
  { lat: 41.279994, lng: 67.212614 }, // MHSK Stadium
  { lat: 50.9083, lng: 6.90556 }, // RheinEnergieSportpark
  { lat: 47.90214444, lng: 106.91625 }, // National Sports Stadium
  { lat: 47.902211, lng: 106.916236 }, // National Sports Stadium
  { lat: -22.60763611, lng: 17.090975 }, // estadi Sam Nujoma
  { lat: 52.9452, lng: 12.8156 }, // Volksparkstadion
  { lat: 51.8764, lng: 11.0501 }, // Friedensstadion
  { lat: 51.4452, lng: 14.2605 }, // Friedrich-Ludwig-Jahn-Stadium (Hoyerswerda)
  { lat: 49.8528, lng: 7.86944 }, // Q1457827
  { lat: 40.171944, lng: 44.525833 }, // Estadi Republicà Vazguèn Sargsian
  { lat: 47.37031, lng: 1.74035 }, // Stade Jules Ladoumègue
  { lat: 43.723306, lng: 7.25875 }, // Stade du Ray
  { lat: 43.723306, lng: 7.25875 }, // Stade du Ray
  { lat: 51.2086, lng: 6.79035 }, // Q1471051
  { lat: 56.961372, lng: 24.116408 }, // Estadi Skonto
  { lat: 54.993214, lng: -3.071919 }, // Raydale Park
  { lat: 34.00283, lng: -4.968851 }, // Estadi de Fes
  { lat: 51.5317, lng: 7.01834 }, // Q1483145
  { lat: 49.109945, lng: 6.159532 }, // Stade Saint-Symphorien
  { lat: 54.493136, lng: 18.531214 }, // Stadion Miejski
  { lat: 50.8221, lng: 12.9445 }, // Q1490413
  { lat: 38.736944444, lng: 35.423055555 }, // Kadir Has Stadium
  { lat: 43.345556, lng: -1.785833 }, // Stadium Gal
  { lat: 47.91834167, lng: 9.26191389 }, // Geberit-Arena
  { lat: 53.1275, lng: 18.024167 }, // Polonia Bydgoszcz Stadium
  { lat: 13.52725, lng: 2.10897 }, // Général Seyni Kountché Stadion
  { lat: 13.52725, lng: 2.108972 }, // Général Seyni Kountché Stadion
  { lat: 50.860833, lng: 6.038611 }, // Gemeentelijk Sportpark Kaalheide
  { lat: 50.797775, lng: 8.754603 }, // Georg-Gaßmann-Stadion
  { lat: 37.067572, lng: 37.377592 }, // Gaziantep Kamil Ocak Stadium
  { lat: 38.6233, lng: 27.4396 }, // Manisa 19 Mayıs Stadium
  { lat: 46.838333, lng: 29.5575 }, // Sheriff Arena
  { lat: 52.2946, lng: 7.43189 }, // Q1509496
  { lat: 42.45527778, lng: 14.22944444 }, // Stadio Adriatico
  { lat: 50.63114, lng: 3.1375 }, // Stadium Lille Métropole
  { lat: 32.859869, lng: 13.135878 }, // Estadi Internacional de Trípoli
  { lat: 32.859869, lng: 13.135878 }, // Estadi Internacional de Trípoli
  { lat: 32.859869, lng: 13.135878 }, // Estadi Internacional de Trípoli
  { lat: 52.623889, lng: 4.733333 }, // Alkmaarderhout
  { lat: 40.9824, lng: 37.8783 }, // Estadi 19 Eylül
  { lat: 47.24391, lng: 6.0031 }, // Léo Lagrange stadium
  { lat: 40.90972222, lng: 38.37194444 }, // Giresun Atatürk Stadium
  { lat: 47.130833, lng: 24.502778 }, // Stadionul Gloria
  { lat: 36.759889, lng: 2.995194 }, // Estadi 5 de Juliol de 1980
  { lat: 50.083611, lng: 14.444444 }, // FK Viktoria Stadion
  { lat: 40.76305556, lng: 29.85416667 }, // İsmetpaşa Stadium
  { lat: 38.092778, lng: 15.635278 }, // Estadi Oreste Granillo
  { lat: 36.038611111, lng: 14.268611111 }, // Estadi Gozo
  { lat: 43.142639, lng: 24.724861 }, // Lovech Stadium
  { lat: 54.9213, lng: -1.375480555 }, // Roker Park
  { lat: 52.674167, lng: -8.6425 }, // Thomond Park
  { lat: 38.4373, lng: 27.1508 }, // Estadi İzmir Alsancak
  { lat: 51.1767, lng: 6.44917 }, // Q1545799
  { lat: 51.488167, lng: -0.302639 }, // Griffin Park
  { lat: 51.1667, lng: 7.15 }, // Q1548554
  { lat: 47.0606, lng: 15.4494 }, // Gruabn
  { lat: 32.827322, lng: 34.981284 }, // Estadi Kiryat Eliezer
  { lat: 42.66297, lng: 21.15688 }, // Estadi de la Ciutat de Pristina
  { lat: 46.80073, lng: 1.72375 }, // Stade Gaston Petit
  { lat: 54.0892, lng: 9.95558 }, // Grümmi-Arena
  { lat: 47.8479, lng: 12.1293 }, // Q1553794
  { lat: 50.830278, lng: 3.248889 }, // Guldensporen Stadion
  { lat: 56.11666667, lng: 8.95166667 }, // MCH Arena
  { lat: 48.2265, lng: 9.89111 }, // Q1558198
  { lat: 45.025277777, lng: 38.999444444 }, // estadi Kuban
  { lat: 52.6207, lng: 10.0487 }, // Günther-Volker-Stadion
  { lat: 48.1191, lng: 7.74351 }, // Kaiserstuhlstadion
  { lat: 45.775, lng: 12.831389 }, // Stadio Piergiovanni Mecchia
  { lat: 51.765, lng: 19.511667 }, // Estadi Widzew Łódź
  { lat: 52.51665194, lng: 13.48698389 }, // Hans-Zoschke-Stadion
  { lat: 4.05556, lng: 9.71861 }, // Estadi de la Reunificació
  { lat: 31.1509, lng: 29.8485 }, // Estadi Harras El-Hedoud
  { lat: 49.89422, lng: 2.2633 }, // Estadi de la Licorne
  { lat: 49.0983, lng: 9.72389 }, // Q1568487
  { lat: 59.187558701, lng: 17.570436431 }, // Södertälje fotbollsarena
  { lat: 59.187558701, lng: 17.570436431 }, // Södertälje fotbollsarena
  { lat: 56.15777778, lng: 9.55305556 }, // Silkeborg Stadion
  { lat: 43.451111, lng: 11.894444 }, // Stadio Città di Arezzo
  { lat: 50.991944, lng: 5.843611 }, // Estadi Fortuna Sittard
  { lat: 46.59636, lng: 4.05545 }, // Stade Jean Laville
  { lat: 52.4692, lng: 13.4167 }, // Q1571306
  { lat: 42.737639, lng: 23.314806 }, // Lokomotiv Stadium
  { lat: 0.522222222, lng: 9.393333333 }, // Stade d'Angondjé
  { lat: 44.839722, lng: 11.6075 }, // Stadio Paolo Mazza
  { lat: 51.540556, lng: 4.454167 }, // Atik Stadion
  { lat: 48.6248, lng: 7.90749 }, // Q1578290
  { lat: 31.706667, lng: -7.980556 }, // Estadi de Marràqueix
  { lat: 14.5675, lng: -90.73805556 }, // Estadio Pensativo
  { lat: -31.3837, lng: -64.1803 }, // Juan Domingo Perón Stadium
  { lat: 16.00539, lng: -61.74174 }, // Estadi Saint-Claude
  { lat: -23.947111111, lng: -46.337361111 }, // Estádio Ulrico Mursa
  { lat: 15.4762068, lng: -90.3769094 }, // Estadio Verapaz
  { lat: 35.2061, lng: 32.9947 }, // Zafer Stadium
  { lat: 27.36, lng: 33.66 }, // Khaled Bichara Stadium
  { lat: 36.749411, lng: 5.046539 }, // Stade de l'Unité Maghrébine
  { lat: 44.01293, lng: 1.37287 }, // Fobio Stadium
  { lat: 48.082, lng: 7.366 }, // Francs Stadium
  { lat: 50.277222222, lng: 19.103611111 }, // Estadi Ludowy
  { lat: -21.3468, lng: 55.5584 }, // Q3496240
  { lat: 41.841111, lng: 12.47 }, // Stadio Tre Fontane
  { lat: 46.768422, lng: 23.572078 }, // Stadionul Ion Moina
  { lat: 64.087423, lng: -21.928865 }, // Stjörnuvöllur
  { lat: 43.702778, lng: 16.653889 }, // Gradski stadion
  { lat: 49.231311, lng: 17.669425 }, // Letná Stadion
  { lat: 43.512289, lng: 16.435053 }, // Stadion Stari plac
  { lat: 38.43589722, lng: 22.88284444 }, // Levadia Municipal Stadium
  { lat: 12.968866, lng: 77.611585 }, // Bengaluru Football Stadium
  { lat: 55.6869, lng: 12.4776 }, // Vanløse Idrætspark
  { lat: 39.61561, lng: 22.39949 }, // AEL FC Arena
  { lat: 42.1420989, lng: 21.7099741 }, // Bashkimi 1947 Stadium
  { lat: 53.570225, lng: -0.046497 }, // Blundell Park
  { lat: 41.876615, lng: 12.478012 }, // Campo Testaccio
  { lat: 35.146111, lng: 33.314444 }, // Estadi Makario
  { lat: 35.146111, lng: 33.314444 }, // Estadi Makario
  { lat: 42.907901, lng: 47.618587 }, // Anji Arena
  { lat: 45.395, lng: 11.875278 }, // Stadio Silvio Appiani
  { lat: 65.03027778, lng: 25.495 }, // Castrén Stadium
  { lat: -12.067138888, lng: -77.033722222 }, // Estadi Nacional del Perú
  { lat: 36.862, lng: -2.44529 }, // Campo Municipal Juan Rojas
  { lat: 40.563889, lng: 8.324722 }, // Estadi Mariotti
  { lat: 45.65472222, lng: 10.23611111 }, // Nuovo Stadio Comunale
  { lat: 45.655, lng: 10.2362 }, // Nuovo Stadio Comunale
  { lat: -27.498611, lng: -55.852222 }, // Comandante Andrés Guacurarí Stadium
  { lat: 48.6704, lng: 15.6635 }, // Sparkasse Horn Arena
  { lat: 45.94284, lng: 8.5589 }, // Stadio Carlo Pedroli
  { lat: 36.9056, lng: 14.709 }, // Stadio Aldo Campo
  { lat: 41.074486111, lng: 14.346516666 }, // Stadio Alberto Pinto
  { lat: 40.76248, lng: 14.43337 }, // Stadio Alfredo Giraud
  { lat: 40.046389, lng: 18.007222 }, // Stadio Antonio Bianco
  { lat: 44.526928, lng: 11.348606 }, // Arcoveggio Stadium
  { lat: 40.846389, lng: 14.224167 }, // Stadio Arturo Collana
  { lat: 40.984722222, lng: 14.204583333 }, // Q3967749
  { lat: 40.916138888, lng: 9.492611111 }, // Stadio Bruno Nespoli
  { lat: 45.533889, lng: 9.219722 }, // Stadio Ernesto Breda
  { lat: 46.0642, lng: 11.1143 }, // Stadio Briamasco
  { lat: 45.7952, lng: 9.8952 }, // Q3967758
  { lat: 43.1672, lng: 13.73 }, // Stadio Bruno Recchioni
  { lat: 38.15527, lng: 15.22968 }, // Q3967760
  { lat: 42.410954, lng: 12.886797 }, // Stadio Centro d'Italia – Manlio Scopigno
  { lat: 45.6248, lng: 9.0497 }, // Stadio Emilio Colombo-Gaetano Gianetti
  { lat: 40.9447, lng: 14.2783 }, // Stadio Pasquale Ianniello
  { lat: 41.717553, lng: 13.621859 }, // Stadio Claudio Tomei
  { lat: 44.93238, lng: 9.91212 }, // Velodromo Attilio Pavesi
  { lat: 44.7682128, lng: 8.7827971 }, // Stadio Costante Girardengo
  { lat: 44.3156, lng: 9.33732 }, // Stadio Comunale (Chiavari)
  { lat: 43.4858, lng: 13.4928 }, // Stadio Diana
  { lat: 40.8353, lng: 14.0944 }, // Stadio Domenico Conte
  { lat: 41.463611, lng: 12.898889 }, // Stadio Domenico Francioni
  { lat: 41.266333333, lng: 15.888972222 }, // Stadio Domenico Monterisi
  { lat: 37.1025, lng: 13.9431 }, // Stadio Dino Liotta
  { lat: 45.3074, lng: 9.49478 }, // Dossenina Stadium
  { lat: 42.42347222, lng: 12.10052778 }, // Stadio Enrico Rocchi
  { lat: 37.3047, lng: 13.5869 }, // Stadio Esseneto
  { lat: 43.669028, lng: 10.644222 }, // Stadio Ettore Mannucci
  { lat: 45.7121, lng: 8.8108 }, // Stadio Felice Chinetti
  { lat: 45.5007, lng: 12.2502 }, // Q3967787
  { lat: 42.05413, lng: 13.92157 }, // Stadio Francesco Pallozzi
  { lat: 45.1704, lng: 9.697 }, // Fratelli Molinari Stadium
  { lat: 44.38313889, lng: 7.53397222 }, // Stadio Fratelli Paschiero
  { lat: 40.64903, lng: 17.93813 }, // Stadio Franco Fanuzzi
  { lat: 37.5609, lng: 14.2725 }, // Q3967795
  { lat: 44.2753, lng: 12.3419 }, // Stadio Germano Todoli
  { lat: 45.576263888, lng: 9.274091666 }, // Stadio Gino Alfonso Sada
  { lat: 45.576084, lng: 9.274179 }, // Stadio Gino Alfonso Sada
  { lat: 43.421944444, lng: 11.140277777 }, // Stadio Gino Manni
  { lat: 41.485428, lng: 13.844689 }, // Gino Salveti Stadium
  { lat: 37.3278, lng: 13.6639 }, // Stadio Giovanni Bruccoleri
  { lat: 38.165, lng: 15.54 }, // Stadio Comunale Giovanni Celeste
  { lat: 45.589341666, lng: 8.909780555 }, // Stadio Giovanni Mari
  { lat: 40.699722, lng: 17.343333 }, // Stadio Gian Domenico Tursi
  { lat: 44.2729, lng: 9.41609 }, // Giuseppe Sivori Stadium
  { lat: 43.7164, lng: 13.2114 }, // Stadio Goffredo Bianchelli
  { lat: 45.357778, lng: 9.675556 }, // Stadio Giuseppe Voltini
  { lat: 43.3072, lng: 13.43572 }, // stadio Helvia Recina
  { lat: 40.629575, lng: 14.383758 }, // Stadio Italia
  { lat: 40.60966, lng: 15.05632 }, // Q3967822
  { lat: 44.4444, lng: 8.96863 }, // stadio La Sciorba
  { lat: 45.6039, lng: 10.5128 }, // Stadio Lino Turina
  { lat: 45.60394444, lng: 10.51308333 }, // Stadio Lino Turina
  { lat: 37.5197, lng: 13.0658 }, // Q3967827
  { lat: 38.683581944, lng: 16.109495833 }, // Stadio Luigi Razza
  { lat: 42.9236, lng: 10.5348 }, // Stadio Magona d'Italia
  { lat: 43.875727, lng: 11.109559 }, // Stadio Lungobisenzio
  { lat: 40.740231, lng: 14.607075 }, // Stadio Marcello Torre
  { lat: 14.563403, lng: 120.992 }, // Rizal Memorial Stadium
  { lat: 29.565, lng: 52.491389 }, // Pars Stadium
  { lat: 35.829739, lng: 128.690205 }, // Estadi de Daegu
  { lat: 33.8915, lng: -5.53957 }, // Stade d'Honneur
  { lat: 34.659444, lng: -1.934444 }, // Estadi d'Honneur
  { lat: 53.5675, lng: 9.94111111 }, // eVendi Arena
  { lat: 50.826667, lng: 12.376667 }, // Eisstadion im Sahnpark
  { lat: 24.34986, lng: 54.68571 }, // Baniyas Stadium
  { lat: -12.072778, lng: -75.201944 }, // Estadio Huancayo
  { lat: 29.329002777, lng: 47.987691666 }, // Al-Sadaqua Walsalam Stadium
  { lat: 47.902211, lng: 106.916236 }, // National Sports Stadium
  { lat: 56.668611111, lng: 16.360833333 }, // Fredriksskans
  { lat: 52.215556, lng: -2.1625 }, // Sixways Stadium
  { lat: -25.279153, lng: -57.598122 }, // Estadio José Tomás Silva
  { lat: -27.4698, lng: -58.967 }, // Q5848038
  { lat: -25.5533, lng: -54.6297 }, // Q5848047
  { lat: -24.656756, lng: -56.4415526 }, // Q5848049
  { lat: -25.244006, lng: -57.550971 }, // Q5848069
  { lat: -25.510921, lng: -54.718518 }, // Q5848073
  { lat: -2.051444444, lng: -79.912430555 }, // Q5848075
  { lat: 42.1664, lng: -1.74833 }, // Q5848077
  { lat: -0.697633, lng: -80.091 }, // Q5848099
  { lat: 4.58423, lng: -74.2132 }, // Q5848111
  { lat: -33.257944444, lng: -58.022805555 }, // Q5848117
  { lat: -26.34216111, lng: -70.61113611 }, // Q5848122
  { lat: 4.139166666, lng: -73.619166666 }, // Estadio Bello Horizonte - Rey Pelé
  { lat: 43.387923557, lng: -5.8178588 }, // Estadio Díaz Vega
  { lat: 2.14122, lng: 11.31211 }, // Estadio de Ebibeyin
  { lat: -25.295669, lng: -57.531712 }, // Q5848148
  { lat: -36.6245, lng: -72.13893333 }, // Q5848150
  { lat: -2.54839, lng: -78.9485 }, // Q5848158
  { lat: -37.8037, lng: -72.7033 }, // Q5848161
  { lat: 36.431403118, lng: -5.158667471 }, // Q5848176
  { lat: 28.4967, lng: -16.3194 }, // Francisco Peraza Municipal Stadium
  { lat: -34.4042, lng: -70.8607 }, // Q5848180
  { lat: -34.6391, lng: -71.3684 }, // Estadio Municipal Joaquín Muñoz García
  { lat: 42.58838889, lng: -5.56261111 }, // Estadio Antonio Amilivia
  { lat: 30.339444, lng: 48.292222 }, // Takhti Stadium (Abadan)
  { lat: 14.966667, lng: 103.096111 }, // Chang Arena
  { lat: 54.270042, lng: -8.487233 }, // The Showgrounds
  { lat: 0.391806, lng: 9.452167 }, // Estadi Omar Bongo
  { lat: 53.969317, lng: -1.0883 }, // Bootham Crescent
  { lat: 31.7472, lng: -93.0961 }, // Harry Turpin Stadium
  { lat: 29.7864, lng: -90.8042 }, // Manning Field at John L. Guidry Stadium
  { lat: -38.158055555, lng: 144.354722222 }, // Kardinia Park
  { lat: 41.018056, lng: 21.338889 }, // Stadion Tumbe Kafe
  { lat: 44.32083333, lng: -96.78 }, // Coughlin–Alumni Stadium
  { lat: 45.3651, lng: -71.8411 }, // Coulter Field
  { lat: 42.9708, lng: -81.2666 }, // Cove Road Stadium
  { lat: 54.4975, lng: 18.530833 }, // National Rugby Stadium
  { lat: 32.37949, lng: -86.293002 }, // Cramton Bowl
  { lat: 32.3793, lng: -86.29275 }, // Cramton Bowl
  { lat: 29.8492, lng: -95.2095 }, // Crenshaw Memorial Stadium
  { lat: -33.74, lng: 151.285833 }, // Cromer Park
  { lat: 51.1443, lng: 0.25087 }, // Culverden Stadium
  { lat: 44.960169, lng: 24.940641 }, // Stadionul Dacia
  { lat: 48.426389, lng: 27.811667 }, // Călărășăuca Stadium
  { lat: 24.894167, lng: 67.078611 }, // D.H.A Football Stadium
  { lat: 30.356897, lng: -81.605682 }, // D. B. Milne Field
  { lat: 25.04666667, lng: 55.21888889 }, // DSC Cricket Stadium
  { lat: 25.021708333, lng: 55.132986111 }, // DSC Hockey Stadium
  { lat: 25.043302777, lng: 55.224580555 }, // DSC Multi-Purpose Stadium
  { lat: 39.6815, lng: -104.963 }, // DU Stadium
  { lat: 39.02, lng: 121.564 }, // Dalian Sports Center Stadium
  { lat: 31.0375, lng: 30.457222 }, // Damanhour Stadium
  { lat: 52.4389, lng: -1.75724 }, // Damson Park
  { lat: 50.2481, lng: 19.013 }, // Q15919421
  { lat: 43.1262, lng: 5.97244 }, // Léo-Lagrange stadium
  { lat: 41.1725, lng: 29.05027778 }, // Yusuf Ziya Öniş Stadium
  { lat: 27.692187652, lng: 68.336409395 }, // Shaheed Mohtarama Benazir Bhutto International Cricket Stadium
  { lat: -8.278611, lng: -35.973056 }, // Lacerdão
  { lat: -8.1225, lng: -35.281111 }, // Q10277290
  { lat: -6.863611, lng: -35.490556 }, // Q10277295
  { lat: 39.603509016, lng: -8.66327242 }, // Estádio Municipal de Fátima
  { lat: 1.005, lng: -60.1589 }, // Q10277339
  { lat: -10.149167, lng: -67.740833 }, // Q10277356
  { lat: -25.52767778, lng: -48.51815833 }, // Nelson Medrado Dias Stadium
  { lat: -25.5275, lng: -48.518056 }, // Nelson Medrado Dias Stadium
  { lat: -10.457778, lng: -40.185 }, // Q10277398
  { lat: -3.893056, lng: -38.448333 }, // Q10277420
  { lat: -27.645556, lng: -48.664167 }, // Q10277422
  { lat: -9.375, lng: -36.235 }, // Q10277464
  { lat: -8.689444, lng: -35.598056 }, // Q10277470
  { lat: 38.448088888, lng: -9.100397222 }, // Estádio Vila Amália
  { lat: -18.712222, lng: -40.404167 }, // Q10277503
  { lat: -9.541667, lng: -36.634444 }, // Q10277504
  { lat: -25.533056, lng: -54.568611 }, // Q10277534
  { lat: 32.690277777, lng: -17.048888888 }, // Centro Desportivo da Madeira
  { lat: 43.21, lng: -2.77694444 }, // Q10489207
  { lat: 59.295833, lng: 18.081944 }, // Johanneshovs IP
  { lat: 44.383486, lng: 19.104653 }, // Q10662717
  { lat: 10.049, lng: 105.789 }, // Cần Thơ Stadium
  { lat: 20.25852778, lng: 105.96905556 }, // Ninh Binh Stadium
  { lat: 9.96333333, lng: 105.11805556 }, // Rach Gia Stadium
  { lat: 38.026667, lng: 46.295833 }, // Gostaresh Foolad Stadium
  { lat: 40.813611111, lng: -74.074444444 }, // MetLife Stadium
  { lat: 62.225246, lng: -6.579201 }, // Við Djúpumýrar
  { lat: 32.793889, lng: 130.741389 }, // Suizenji Stadium
  { lat: 55.7263, lng: 21.1095 }, // Estadi Central de Klaipėda
  { lat: 37.01727778, lng: 140.86433333 }, // Iwaki Green Field
  { lat: 37.017327777, lng: 140.864377777 }, // Iwaki Green Field
  { lat: 35.839009, lng: 127.126355 }, // Jeonju Sports Complex
  { lat: 40.4997, lng: 68.7822 }, // Guliston Stadium
  { lat: 35.447725, lng: 133.3076861 }, // All-Gainare Yajin Stadium
  { lat: 33.50555556, lng: 36.28916667 }, // Tishreen Stadium
  { lat: 33.50555556, lng: 36.28916667 }, // Tishreen Stadium
  { lat: 34.46488889, lng: 136.7291944 }, // Mie Prefecture Arena
  { lat: 33.966889, lng: 130.933139 }, // Shimonoseki Stadium
  { lat: 34.989869, lng: 135.715325 }, // Kyoto Aquarena
  { lat: 35.016944444, lng: 135.584722222 }, // Kyoto Stadium
  { lat: 39.28722222, lng: 139.9638139 }, // Nikaho Green Field
  { lat: 36.23795556, lng: 138.4933639 }, // Saku Athletic Stadium
  { lat: 32.93125833, lng: 131.8709611 }, // Saiki Stadium
  { lat: 34.7828, lng: 135.054 }, // Miki Athletic Stadium
  { lat: 35.121101, lng: 136.942643 }, // Mizuho Rugby Stadium
  { lat: 40.292417, lng: 140.58675 }, // Nipro Hachiko Dome
  { lat: 42.353611111, lng: 141.024722222 }, // Nakajima Park Baseball Stadium
  { lat: 35.622376, lng: 138.589756 }, // estadi JIT Recycle Ink
  { lat: 39.7305, lng: 141.160583 }, // Iwate Prefectural Baseball Stadium
  { lat: 13.179611, lng: 30.217333 }, // Al-Ubayyid Stadium
  { lat: -7.623744, lng: 15.057972 }, // Estádio 4 de Janeiro
  { lat: 48.023888888, lng: 17.968333333 }, // Stadium FC Neded
  { lat: 15.038930555, lng: -24.333791666 }, // Estádio Francisco José Rodrigues
  { lat: 48.58733333, lng: 18.86333333 }, // Mestský štadión Žiar nad Hronom
  { lat: 20.02642, lng: 110.2123 }, // Wuyuan River Stadium
  { lat: 46.365306, lng: 2.589269 }, // Q30740504
  { lat: 39.199694444, lng: 9.137416666 }, // Unipol Domus
  { lat: -33.68511, lng: -65.495319 }, // Estadio Único de Villa Mercedes
  { lat: -20.23972222, lng: 57.47166667 }, // Sir Gaëtan Duval Stadium
  { lat: 44.406389, lng: 12.194722 }, // Stadio Bruno Benelli
  { lat: 48.460333, lng: 35.032472 }, // Dniprò Arena
  { lat: 13.681105555, lng: -89.222333333 }, // Estadio Cuscatlán
  { lat: -34.91375, lng: -57.989028 }, // Estadi Único Diego Armando Maradona
  { lat: 50.640075, lng: 13.817936 }, // Na Stínadlech
  { lat: 9.368786, lng: -83.704653 }, // Estadio Municipal de Pérez Zeledón
  { lat: 49.8044, lng: 18.2558 }, // Městský stadion
  { lat: 9.988055555, lng: -83.065833333 }, // Estadio Nuevo de Limón
  { lat: 42.76716, lng: 1.75841 }, // Q3495809
  { lat: 11.849444, lng: -86.205 }, // Estadio Pedro Selva
  { lat: 36.149356, lng: -5.350342 }, // Victoria Stadium
  { lat: 12.659722, lng: -7.993056 }, // Estadi Modibo Kéïta
  { lat: 45.765224, lng: 4.982131 }, // Parc Olympique Lyonnais
  { lat: 52.338611, lng: 6.649722 }, // Asito Stadion
  { lat: 48.924444444, lng: 2.36 }, // Stade de France
  { lat: 42.587482, lng: -5.576699 }, // Estadi Reino de León
  { lat: -22.893172, lng: -43.292269 }, // Estadi Olímpic Nilton Santos
  { lat: 43.368667, lng: -8.417372 }, // Estadi Municipal de Riazor
  { lat: 39.230833, lng: 9.181944 }, // Stadio Is Arenas
  { lat: 38.152767, lng: 13.342275 }, // Estadi Renzo Barbera
  { lat: -32.32277778, lng: -58.0725 }, // Estadio Parque Artigas
  { lat: 46.67131, lng: -1.44065 }, // Stade Henri Desgrange
  { lat: 51.422222222, lng: -0.982777777 }, // Madejski Stadium
  { lat: 52.509166666, lng: -1.963888888 }, // The Hawthorns
  { lat: -34.838719, lng: -56.132281 }, // harwood 6417
  { lat: -34.916666666, lng: -56.166666666 }, // Estadio Luis Franzini
  { lat: 55.702469, lng: 12.572203 }, // Parken Stadium
  { lat: 55.821, lng: 49.161 }, // Kazan Arena
  { lat: 47.74869, lng: -3.36929 }, // Stade du Moustoir
  { lat: 47.74869, lng: -3.36929 }, // Stade du Moustoir
  { lat: 47.74869, lng: -3.36929 }, // Stade du Moustoir
  { lat: 47.079722, lng: 8.283611 }, // Stadion Gersag
  { lat: 53.430833333, lng: -2.960833333 }, // Anfield
  { lat: 53.483055555, lng: -2.200277777 }, // City of Manchester Stadium
  { lat: 3.411389, lng: -76.550833 }, // Velòdrom Alcides Nieto Patiño
  { lat: -22.975225, lng: -43.392405555 }, // Velòdrom Olímpic de Rio
  { lat: 45.834633, lng: 8.800631 }, // Stadio Franco Ossola
  { lat: 40.7424, lng: -74.2174 }, // Newark Velodrome
  { lat: 40.4501, lng: -3.6532 }, // Campo de Ciudad Lineal
  { lat: 45.0569, lng: 7.66028 }, // Velodrome Humbert I
  { lat: 53.0875, lng: 8.815278 }, // ÖVB Arena
  { lat: 19.40981014, lng: -99.10338655 }, // Agustín Melgar Olympic Velodrome
  { lat: 52.530833, lng: 13.450833 }, // Velòdrom de Berlín
  { lat: 48.210833, lng: 16.423611 }, // Ferry-Dusika-Hallenstadion
  { lat: 45.1851, lng: 5.7415 }, // Palau dels Esports
  { lat: 37.865389, lng: 32.483278 }, // Konya Atatürk Stadium
  { lat: 35.705658333, lng: 139.751913888 }, // Tokyo Dome
  { lat: 52.163611, lng: 20.821944 }, // Arena Pruszków
  { lat: -33.879792, lng: 18.633511 }, // Techtonic Velodrome
  { lat: 35.185981, lng: 136.947314 }, // Nagoya Dome
  { lat: 48.88539722, lng: 2.28323611 }, // Vélodrome Buffalo
  { lat: 47.506111, lng: 19.094722 }, // Millenáris Sporttelep
  { lat: 35.7685, lng: 139.4205 }, // Seibu Dome
  { lat: 52.634675, lng: 4.71661944 }, // Sportpaleis Alkmaar
  { lat: -33.9075, lng: 150.998611 }, // Dunc Gray Velodrome
  { lat: 47.4096, lng: 8.55127 }, // Oerlikon Velodrome
  { lat: 52.2081, lng: 5.996367 }, // Omnisport Apeldoorn
  { lat: 38.0401, lng: 23.7804 }, // Athens Olympic Velodrome
  { lat: 33.595277777, lng: 130.362222222 }, // Fukuoka Dome
  { lat: 52.4752, lng: 13.3574 }, // Radrennbahn Schöneberg
  { lat: 45.775, lng: 12.831389 }, // Stadio Piergiovanni Mecchia
  { lat: -46.406944, lng: 168.381111 }, // Invercargill ILT Velodrome
  { lat: 18.001944, lng: -76.771667 }, // Independence Park
  { lat: 50.6781, lng: 3.2052 }, // Velòdrom André Pétrieux
  { lat: 51.55083333, lng: -0.01388889 }, // London Olympic Velodrome
  { lat: 48.169722, lng: 11.541111 }, // Radstadion
  { lat: 39.58812778, lng: 2.64306944 }, // Velòdrom Illes Balears
  { lat: 39.58812778, lng: 2.64306944 }, // Velòdrom Illes Balears
  { lat: 39.763658333, lng: -86.163319444 }, // RCA Dome
  { lat: 41.43813, lng: 2.148861 }, // Velòdrom d'Horta
  { lat: 44.898777, lng: -0.566299 }, // Vélodrome de Bordeaux
  { lat: 40.5475, lng: -75.610555555 }, // Valley Preferred Cycling Center
  { lat: 28.63111111, lng: 77.24944444 }, // Indira Gandhi Arena
  { lat: 44.01021, lng: 1.35174 }, // Stade Sapiac
  { lat: 49.17616, lng: -0.39034 }, // Stade de Venoix
  { lat: 49.17616, lng: -0.39034 }, // Stade de Venoix
  { lat: 16.2493, lng: -61.5941 }, // Amédée Détraux Velodrome
  { lat: 45.45, lng: -73.56666667 }, // Vélodrome de Queen's Park, Verdun
  { lat: 45.45, lng: -73.56666667 }, // Vélodrome de Queen's Park, Verdun
  { lat: 48.788031, lng: 2.03486 }, // Vélodrome de Saint-Quentin-en-Yvelines
  { lat: 43.10027778, lng: 6.12444444 }, // Vélodrome Hyères
  { lat: 49.885, lng: -97.1947 }, // Winnipeg Velodrome
  { lat: 44.93238, lng: 9.91212 }, // Velodromo Attilio Pavesi
  { lat: 38.1732, lng: 13.3134 }, // Velodromo Paolo Borsellino
  { lat: 41.826647, lng: 12.456897 }, // Olympic Velodrome, Rome
  { lat: 50.448665, lng: 30.505684 }, // Kyiv velotrack
  { lat: 33.8589, lng: -118.26 }, // VELO Sports Center
  { lat: 40.683333, lng: -73.976667 }, // Proposed domed Brooklyn Dodgers stadium
  { lat: 35.231944, lng: 128.668056 }, // Changwon Velodrome
  { lat: 41.857, lng: -71.402 }, // Cycledrome
  { lat: 43.4756, lng: -79.876 }, // Milton Pan Am and Parapan Am Velodrome
  { lat: 40.872841, lng: -73.907478 }, // New York Velodrome
  { lat: 10.084436, lng: -61.601494 }, // Palo Seco Velodrome
  { lat: -31.878989, lng: 116.026364 }, // Perth SpeedDome
  { lat: 43.298823, lng: -1.972293 }, // Velòdrom d'Anoeta
  { lat: -41.045833, lng: 145.898333 }, // West Park Oval
  { lat: 35.38291667, lng: 132.7405 }, // Izumo Dome
  { lat: 22.313128, lng: 114.262115 }, // Hong Kong Velodrome
  { lat: 14.6299, lng: 121.023201 }, // Amoranto Sports Complex
  { lat: -34.84138889, lng: 138.6125 }, // Adelaide Super-Drome
  { lat: 39.5783, lng: 2.64417 }, // Velòdrom de Tirador
  { lat: 37.93333333, lng: 58.36666667 }, // Velodrome of Ashgabat
  { lat: 50.6799, lng: 3.2048 }, // Velòdrom cobert regional Jean Stablinski
  { lat: 45.957234, lng: 12.648607 }, // Stadio Ottavio Bottecchia
  { lat: -29.818938888, lng: 31.030833333 }, // Cyril Geoghegan Velodrome
  { lat: -27.511001, lng: 153.147608 }, // Chandler Velodrome
  { lat: 49.850843, lng: 24.010725 }, // SCA Velotrack, Lviv
  { lat: 39.565197, lng: 2.891102 }, // Velòdrom Andreu Oliver
  { lat: 48.10843, lng: -1.66332 }, // Q55599940
  { lat: -12.080027777, lng: -76.999 }, // velòdrom de la Vila Esportiva Nacional
  { lat: 54.508425, lng: -1.534394 }, // The Darlington Arena
  { lat: -1.303611, lng: 36.824167 }, // Nyayo National Stadium
  { lat: 55.0698, lng: -3.62494 }, // Palmerston Park
  { lat: 48.163611, lng: 17.136944 }, // Tehelné pole
  { lat: 36.907, lng: 30.8929 }, // Mardan Sports Complex
  { lat: 59.413068, lng: 5.279379 }, // Haugesund Sparebank Arena
  { lat: 52.999302777, lng: -2.182488888 }, // Victoria Ground
  { lat: 59.370667, lng: 16.495 }, // Tunavallen
  { lat: 51.891667, lng: 8.388333 }, // Heidewaldstadion
  { lat: 52.105556, lng: 11.600833 }, // Heinrich Germer Stadium
  { lat: 52.4861, lng: 13.3778 }, // Willy-Kressmann-Stadion
  { lat: 51.64338889, lng: 7.25244444 }, // Stimbergstadion
  { lat: 6.49705556, lng: 3.36491667 }, // Estadi Nacional de Lagos
  { lat: 51.144167, lng: 4.573611 }, // Herman Vanderpoortenstadion
  { lat: 49.2573, lng: 6.87022 }, // Q1610458
  { lat: 53.5886, lng: 9.94418 }, // Sportpark Eimsbüttel
  { lat: 69.648872, lng: 18.935042 }, // Romssa Arena
  { lat: 31.66571, lng: 34.569479 }, // Sala Stadium
  { lat: 51.0375, lng: 7.00021 }, // Ulrich-Haberland-Stadion
  { lat: 50.9119, lng: 7.99028 }, // Hofbachstadion
  { lat: 48.129167, lng: 16.468611 }, // Rudolf-Tonn-Stadion
  { lat: 46.80855, lng: 0.52131 }, // Stade de la Montée Rouge
  { lat: 53.587222, lng: 9.969722 }, // Stadion Hoheluft
  { lat: 45.62381518, lng: 13.79425764 }, // Stadio Giuseppe Grezar
  { lat: 51.405083333, lng: -0.281944444 }, // Kingsmeadow
  { lat: 59.286217, lng: 11.097608 }, // Sarpsborg Stadion
  { lat: 51.4314, lng: 7.81167 }, // Q1633727
  { lat: 47.766213, lng: 27.933197 }, // Stadionul Orășenesc
  { lat: 52.4083, lng: 9.60222 }, // Wilhelm-Langrehr-Stadion
  { lat: 58.96499599, lng: 5.71147442 }, // Stavanger Stadion
  { lat: 55.604225, lng: -4.508122 }, // Rugby Park
  { lat: 39.832222, lng: -75.378889 }, // PPL Park
  { lat: 45.386769, lng: 20.398686 }, // Stadion Karađorđev park
  { lat: 47.9, lng: 106.916111 }, // MFF Football Centre
  { lat: 16.821314, lng: 96.186828 }, // Thuwunna Stadium
  { lat: 52.2494, lng: 8.507 }, // Häcker Wiehenstadion
  { lat: 48.1654, lng: 16.4269 }, // Simmeringer Had
  { lat: 43.846667, lng: 18.387222 }, // Estadi Grbavica
  { lat: 52.517222, lng: 6.120278 }, // Oosterenkstadion
  { lat: 3.08225, lng: 101.544944 }, // Estadi Shah Alam
  { lat: 41.003664, lng: 39.705317 }, // Estadi Hüseyin Avni Aker
  { lat: 61.476667, lng: 21.774444 }, // Estadi de Pori
  { lat: 55.413578, lng: 12.134153 }, // Herfølge Stadion
  { lat: 51.486667, lng: 6.976389 }, // Stadion Essen
  { lat: 9.99963, lng: -84.123065 }, // Estadio Eladio Rosabal Cordero
  { lat: 9.858472, lng: -83.918713 }, // Estadio José Rafael Fello Meza Ivankovich
  { lat: -17.8214, lng: 30.9947 }, // Estadi Nacional de Zimbàbue
  { lat: 47.143722, lng: 37.558333 }, // Illichivets Stadium
  { lat: 51.491389, lng: 0.087222 }, // Manor Ground, Plumstead
  { lat: 51.447672, lng: 6.831662 }, // Ruhrstadion
  { lat: 18.001944, lng: -76.771667 }, // Independence Park
  { lat: -17.7875, lng: 15.69222222 }, // Oshakati Independence Stadium
  { lat: 52.0377, lng: -0.775014 }, // National Hockey Stadium
  { lat: 51.551944, lng: 7.208611 }, // Stadion am Schloss Strünkede
  { lat: 52.7081, lng: 7.29806 }, // Hänsch-Arena
  { lat: 51.4875, lng: 0.088056 }, // Invicta Ground
  { lat: 41.116389, lng: 14.781111 }, // Stadio Ciro Vigorito
  { lat: 51.716419, lng: -1.208067 }, // Kassam Stadium
  { lat: 52.078333333, lng: 5.145833333 }, // Stadion Galgenwaard
  { lat: 39.91027778, lng: 44.02944444 }, // Iğdır Stadium
  { lat: 51.526, lng: 6.91897 }, // Jahnstadion
  { lat: 51.519167, lng: 9.926389 }, // Jahnstadion
  { lat: 51.1943, lng: 6.6753 }, // Jahnstadion (Neuss)
  { lat: 51.660908, lng: 7.136294 }, // Jahnstadion
  { lat: 52.2792, lng: 7.45977 }, // Q1678577
  { lat: -26.231894, lng: 27.922892 }, // Orlando Stadium
  { lat: 9.997222222, lng: 76.301111111 }, // Jawaharlal Nehru International Stadium
  { lat: 59.734392, lng: 10.201333 }, // Marienlyst Stadion
  { lat: 41.541, lng: 45.006944 }, // Estadi Poladi
  { lat: 51.225, lng: 6.827222 }, // Paul-Janes-Stadion
  { lat: 51.561667, lng: 6.987222 }, // Stadion Gladbeck
  { lat: 55.71372, lng: 9.5562 }, // Vejle Stadion
  { lat: 51.031389, lng: 3.766111 }, // estadi Jules Otten
  { lat: -28.066944, lng: 153.378889 }, // Robina Stadium
  { lat: 51.522, lng: 7.1719 }, // Q1713400
  { lat: 49.767194444, lng: 9.932944444 }, // flyeralarm Arena
  { lat: 49.767194444, lng: 9.932944444 }, // flyeralarm Arena
  { lat: 49.767194444, lng: 9.932944444 }, // flyeralarm Arena
  { lat: 49.767194444, lng: 9.932944444 }, // flyeralarm Arena
  { lat: 59.425828, lng: 24.764767 }, // Kalevi Keskstaadion
  { lat: 51.6066, lng: 7.53669 }, // Q1723303
  { lat: -15.798889, lng: 35.0345 }, // Estadi Kamuzu
  { lat: 53.049722, lng: -2.1925 }, // Vale Park
  { lat: 52.4838, lng: 13.3027 }, // Stadion Wilmersdorf
  { lat: 43.846111, lng: 18.358889 }, // Otoka Stadium
  { lat: 64.075833, lng: -21.938611 }, // Kaplakriki
  { lat: 49.686868, lng: 6.448519 }, // Estadi Op Flohr
  { lat: 43.12612, lng: 5.90218 }, // Bon Rencontre Stadium
  { lat: 51.2569, lng: 9.40056 }, // Q1736150
  { lat: 59.972953, lng: 30.220533 }, // Estadi Kírov
  { lat: 47.859627, lng: 35.096952 }, // Slavutych Arena
  { lat: 50.066667, lng: 14.454167 }, // Ďolíček
  { lat: 35.469166666, lng: 139.603611111 }, // Nippatsu Mitsuzawa Stadium
  { lat: -37.781111, lng: 175.268333 }, // Waikato Stadium
  { lat: 48.3149, lng: 12.2759 }, // Q1758537
  { lat: 63.085278, lng: 21.627778 }, // Estadi Hietalahti
  { lat: 63.673611, lng: 22.695 }, // Jakobstads Centralplan
  { lat: 48.1924, lng: 15.6267 }, // Voith-Platz
  { lat: 53.242777777, lng: -2.127222222 }, // Moss Rose
  { lat: 43.162213888, lng: -77.629352777 }, // Marina Auto Stadium
  { lat: 39.333888888, lng: 16.238611111 }, // Stadio Marco Lorenzon
  { lat: 37.4686, lng: 14.0389 }, // Q3967834
  { lat: 41.6088, lng: 14.2501 }, // stadio Mario Lancellotta
  { lat: 43.940833, lng: 10.914722 }, // Stadio Marcello Melani
  { lat: 45.18632, lng: 11.30027 }, // Q3967838
  { lat: 40.8618, lng: 14.2744 }, // Stadio Militare dell'Arenaccia
  { lat: 43.72996965, lng: 12.62719265 }, // Montefeltro Stadium
  { lat: 41.628056, lng: 15.918889 }, // Stadio Miramare
  { lat: 45.3622, lng: 10.4202 }, // Q3967845
  { lat: 46.0609, lng: 13.2241 }, // Stadium Moretti
  { lat: 41.675344, lng: 13.580449 }, // Conte Arduino Mangoni
  { lat: 40.90279, lng: 9.11428 }, // stadio Nino Manconi
  { lat: 37.0743, lng: 15.2913 }, // Stadio Nicola De Simone
  { lat: 37.6591, lng: 12.5863 }, // Q3967852
  { lat: 37.4939, lng: 14.0478 }, // Q3967854
  { lat: 45.205, lng: 9.152778 }, // Stadio Pietro Fortunati
  { lat: 45.0598, lng: 7.6333 }, // Stadio Primo Nebiolo
  { lat: 38.028333, lng: 12.545833 }, // Stadio Polisportivo Provinciale
  { lat: 43.847778, lng: 10.517222 }, // Stadio Porta Elisa
  { lat: 45.857831, lng: 9.398919 }, // Stadio Rigamonti
  { lat: 42.94118118, lng: 10.88941669 }, // Stadio Romeo Malservisi-Mario Matteini
  { lat: 40.90479, lng: 14.26765 }, // Q3967875
  { lat: 45.771389, lng: 11.751944 }, // Stadio Rino Mercante
  { lat: 40.8237, lng: 14.3343 }, // Q3967877
  { lat: 44.775556, lng: 10.881667 }, // Stadio Sandro Cabassi
  { lat: 43.1042, lng: 12.3872 }, // Stadio Santa Giuliana
  { lat: 39.31, lng: 16.2308 }, // Stadio San Vito
  { lat: 44.47843, lng: 11.36333 }, // Stadio Sterlino
  { lat: 40.709722, lng: 14.7025 }, // Stadio Simonetta Lamberti
  { lat: 43.89956, lng: 12.90554 }, // Stadio Tonino Benelli
  { lat: 44.29778, lng: 8.45332 }, // Stadio Valerio Bacigalupo
  { lat: 45.63652, lng: 12.56539 }, // Stadio Verino Zanutto
  { lat: 37.6014, lng: 15.1585 }, // Stadio Aci e Galatea
  { lat: 42.5623, lng: 12.6644 }, // Stadio Viale Brin
  { lat: 40.9571, lng: 17.2937 }, // Stadio Vito Simone Veneziani
  { lat: 43.573889, lng: 11.526667 }, // Stadio Virgilio Fedini
  { lat: 45.6771, lng: 9.2242 }, // Q3967907
  { lat: 37.0677, lng: 14.258 }, // Stadio Vincenzo Presti
  { lat: 40.7583, lng: 14.5175 }, // Q3967910
  { lat: 41.76559, lng: 12.66311 }, // Stadio Domenico Fiore
  { lat: 43.8238, lng: 7.80204 }, // Stadio comunale
  { lat: 41.2707828, lng: 16.414481 }, // Stadio comunale
  { lat: 42.65617, lng: 13.70169 }, // Stadio comunale di Teramo
  { lat: 45.64887, lng: 11.30435 }, // Stadio dei Fiori
  { lat: 44.065328, lng: 10.076805 }, // Stadio dei Marmi
  { lat: 42.0258, lng: 13.4233 }, // Stadio dei Marsi-Sandro Cimarra
  { lat: 44.030833, lng: 10.116667 }, // Stadio degli Oliveti
  { lat: 44.414164, lng: 8.873081 }, // Q3967931
  { lat: 43.30175695, lng: 13.43996065 }, // stadio della Vittoria
  { lat: 43.21162625, lng: 13.2918987 }, // Q3967941
  { lat: 41.1331, lng: 16.8397 }, // Stadio della Vittoria
  { lat: 44.411134, lng: 8.896278 }, // Q3967947
  { lat: 38.1732, lng: 13.3134 }, // Velodromo Paolo Borsellino
  { lat: 41.023775, lng: 28.87981389 }, // Güngören M.Yahya Baş Stadium
  { lat: -25.917417, lng: 32.526278 }, // Estádio da Machava
  { lat: 0.34720833, lng: 32.65888889 }, // Estadi Nacional Mandela
  { lat: 11.84341667, lng: -15.59083333 }, // Estadi 24 de Setembre
  { lat: -34.593722, lng: -58.488528 }, // Estadio Alfredo Ramos
  { lat: 33.344244, lng: 44.368173 }, // Al-Zawraa Stadium
  { lat: 56.6617, lng: 23.7563 }, // Centre Olímpic de Zemgale
  { lat: 54.8259, lng: 56.0614 }, // Neftyanik
  { lat: -19.5225, lng: -42.626389 }, // Louis Ensch Stadium
  { lat: 66.4997, lng: 25.7217 }, // Rovaniemen keskuskenttä
  { lat: 56.9495911, lng: 23.6101985 }, // Estadi Sloka
  { lat: 53.905416666, lng: 30.340972222 }, // Spartak Stadium
  { lat: 53.140278, lng: 29.217222 }, // Spartak Stadium
  { lat: 54.192777777, lng: 28.475694444 }, // Baríssau Arena
  { lat: 40.156667, lng: 47.170278 }, // Guzanli Olympic Complex Stadium
  { lat: 52.798611111, lng: 27.538194444 }, // Stroitel Stadium
  { lat: 41.038459, lng: 28.986818 }, // Estadi de Taksim
  { lat: 45.05, lng: 20.09 }, // Inđija Stadium
  { lat: 54.092361111, lng: 28.319722222 }, // Estadi Torpedo
  { lat: 52.038888888, lng: 29.276805555 }, // Yunost Stadium
  { lat: 37.844722222, lng: 27.838611111 }, // Adnan Menderes Stadium
  { lat: 47.7483, lng: 26.6519 }, // Stadionul Municipal
  { lat: 41.017169, lng: 39.585053 }, // Akçaabat Fatih Stadium
  { lat: 35.36421371, lng: 35.926663596 }, // Al-Horea Stadium
  { lat: 36.50377, lng: 40.74105 }, // Hasakah Municipal Stadium
  { lat: 33.210747, lng: -87.532658 }, // Alabama Soccer Stadium
  { lat: 44.112, lng: -87.913 }, // Aldo Santaga Stadium
  { lat: 47.226389, lng: 22.797778 }, // Stadionul Măgura
  { lat: -7.1675, lng: -34.872778 }, // Estadi José Américo de Almeida Filho
  { lat: -1.244772, lng: -78.623069 }, // Estadi Bellavista
  { lat: -23.527556, lng: -46.678417 }, // Allianz Parque
  { lat: -19.478794, lng: -44.222022 }, // Arena do Jacaré
  { lat: 55.79055465, lng: 37.55992747 }, // Central Dynamo Stadium
  { lat: 36.764189, lng: -2.800494 }, // Estadi Municipal de Santo Domingo
  { lat: 63.123931, lng: 7.735792 }, // Atlanten Stadion
  { lat: 40.21, lng: 29.009 }, // Timsah Arena
  { lat: 57.5117, lng: -1.79585 }, // Balmoor Stadium
  { lat: 39.6415, lng: 27.8877 }, // Balıkesir Atatürk Stadium
  { lat: 53.5167, lng: -2.1804 }, // Broadhurst Park
  { lat: 56.1887, lng: -2.99902 }, // Bayview Stadium
  { lat: 57.690022, lng: -2.003969 }, // Bellslea Park
  { lat: 40.724307, lng: -73.792838 }, // Belson Stadium
  { lat: 51.3675, lng: -0.204444444 }, // Gander Green Lane
  { lat: 53.475314, lng: -2.043864 }, // Bower Fold
  { lat: 43.2514, lng: -79.8303 }, // Brian Timmis Stadium
  { lat: 59.718537, lng: 10.850768 }, // Ski Stadion
  { lat: 0.39611111, lng: 32.46944444 }, // Bunamwaya Stadium
  { lat: 42.4465, lng: -76.4737 }, // Berman Field
  { lat: 48.92947, lng: 21.90511 }, // Chemlon Stadion
  { lat: 39.3261, lng: -82.1117 }, // Chessa Field
  { lat: 40.291, lng: -79.4033 }, // Chuck Noll Field
  { lat: 52.21638889, lng: 0.1225 }, // City Ground
  { lat: 40.87233283, lng: -73.913869 }, // Commisso Soccer Stadium
  { lat: -33.868333, lng: 151.109444 }, // Concord Oval
  { lat: 18.924449, lng: 72.828734 }, // Cooperage Ground
  { lat: 53.875278, lng: -1.9025 }, // Cougar Park
  { lat: 51.137814, lng: 1.284883 }, // Crabble Athletic Ground
  { lat: 38.868504, lng: -77.012935 }, // Audi Field
  { lat: 63.428376, lng: 10.52401 }, // EXTRA Arena
  { lat: 44.03333333, lng: 20.45 }, // Metalac Stadium
  { lat: 35.324433102, lng: 40.146233964 }, // Deir ez-Zor Municipal Stadium
  { lat: 15.3435, lng: 38.92563889 }, // Estadi Denden
  { lat: 39.6517, lng: -79.9842 }, // Dick Dlesk Soccer Stadium
  { lat: 54.750694, lng: -6.001942 }, // Dixon Park
  { lat: 50.322083, lng: 30.568333 }, // Dynamo Training Center in Koncha-Zaspa
  { lat: 41.6706, lng: 26.5544 }, // Edirne 25 Kasım Stadium
  { lat: 43.076884, lng: -87.885053 }, // Engelmann Stadium
  { lat: -43.5092, lng: 172.636 }, // English Park
  { lat: -32.88425, lng: -68.863555555 }, // Víctor Legrotaglie Stadium
  { lat: 41.3469, lng: 2.10167 }, // Estadi Municipal de Futbol de L'Hospitalet
  { lat: -34.782286, lng: -58.399508 }, // Alfredo Beranger Stadium
  { lat: 22.401764, lng: -97.910718 }, // Estadio Altamira
  { lat: 10.465744, lng: -73.249336 }, // Estadio Armando Maestre Pavajeau
  { lat: 25.79722222, lng: -109.03138889 }, // Centenario Los Mochis Stadium
  { lat: -27.443611, lng: -59.010833 }, // Centennial Stadium, Resistencia
  { lat: -34.606056, lng: -58.55675 }, // City of Caseros Stadium
  { lat: 37.258855, lng: -6.93704 }, // Estadi Colombino
  { lat: -34.594972, lng: -58.449261 }, // Don León Kolbowski Stadium
  { lat: -34.757778, lng: -58.42 }, // Estadi Eduardo Gallardón
  { lat: 43.47689, lng: -3.78964 }, // Camps de Sport del Sardinero (1913)
  { lat: 41.667997, lng: -3.698911 }, // Estadi El Montecillo
  { lat: -31.5274, lng: -68.563 }, // José Nehin Stadium
  { lat: 40.3258215, lng: -3.8942758 }, // Estadio El Soto
  { lat: -34.585356, lng: -60.929278 }, // Eva Perón Stadium
  { lat: -34.694981, lng: -58.586814 }, // Estadio Fragata Presidente Sarmiento
  { lat: -31.519847, lng: -68.530289 }, // Estadio Ingeniero Hilario Sánchez
  { lat: -34.680408, lng: -58.732975 }, // José Manuel Moreno Stadium
  { lat: -6.380946, lng: -78.81463 }, // Juan Maldonado Gamarra Stadium
  { lat: -26.83628056, lng: -65.22960556 }, // Eva Peron 'La Ciudadela'
  { lat: 1.862765, lng: 9.761439 }, // Estadio La Libertad
  { lat: 42.455262, lng: -2.450386 }, // Estadi Las Gaunas
  { lat: -45.83845278, lng: -67.48531667 }, // Estadio Municipal de Comodoro Rivadavia
  { lat: 36.51166667, lng: -4.87888889 }, // Estadio Municipal de Marbella
  { lat: 18.997222, lng: -98.1975 }, // Estadio Olímpico de C.U.
  { lat: -33.079095454, lng: -68.481100214 }, // Estadio Libertador General San Martín
  { lat: -27.1475, lng: -109.42972222 }, // Hanga Roa Stadium
  { lat: 37.383608333, lng: -5.971941666 }, // Estadi de Nervión
  { lat: 19.17011111, lng: -96.12566667 }, // Parque Deportivo Veracruzano
  { lat: -23.630117, lng: -46.559875 }, // Estádio Anacleto Campanella
  { lat: -31.761111, lng: -52.336111 }, // Estádio Boca do Lobo
  { lat: -31.770833, lng: -52.3325 }, // Estádio Bento Freitas
  { lat: -29.165, lng: -51.196667 }, // Francisco Stédile Stadium
  { lat: -21.774446, lng: -48.170071 }, // Estádio Fonte Luminosa
  { lat: -21.774446, lng: -48.170071 }, // Estádio Fonte Luminosa
  { lat: 16.618055555, lng: -24.293611111 }, // Estádio João de Deus Lopes da Silva
  { lat: 11.860203, lng: -15.586389 }, // Estádio Lino Correia
  { lat: -22.683786651, lng: -46.997095673 }, // Estádio Municipal Alfredo Chiavegato
  { lat: -6.267167, lng: -36.513 }, // Estádio Municipal Coronel José Bezerra
  { lat: -6.267167, lng: -36.513 }, // Estádio Municipal Coronel José Bezerra
  { lat: -22.761144, lng: -47.154406 }, // Estádio Municipal Luís Perissinotto
  { lat: -21.7875, lng: -43.378056 }, // Estádio Municipal Radialista Mário Helênio
  { lat: -22.965414, lng: -46.536936 }, // Estádio Nabi Abi Chedid
  { lat: -23.518083333, lng: -46.68525 }, // Estadi Nicolau Alayon
  { lat: -23.553333, lng: -46.604444 }, // Estádio Rua Javari
  { lat: -9.6675, lng: -35.718056 }, // Estádio Severiano Gomes Filho
  { lat: 38.765, lng: -9.159 }, // Estadi do Lumiar
  { lat: -8.81427, lng: 13.226 }, // Estádio dos Coqueiros
  { lat: 44.791586, lng: 20.494644 }, // FK Obilić Stadium
  { lat: 52.623611111, lng: -1.140555555 }, // Filbert Street
  { lat: 41.074219, lng: -81.511181 }, // FirstEnergy Stadium
  { lat: -32.92934444, lng: -60.69468889 }, // Fortín de Ludueña Stadium
  { lat: 61.500278, lng: 23.785278 }, // Estadi Tammela
  { lat: -36.8001, lng: 174.596 }, // Fred Taylor Park
  { lat: 35.168, lng: 33.3558 }, // Estadi GSP
  { lat: 33.785871, lng: -118.110763 }, // George Allen Field
  { lat: 34.74376, lng: 32.4407 }, // Geroskipou Municipal Stadium
  { lat: 56.7353, lng: -2.65639 }, // Glebe Park
  { lat: 38.984167, lng: -76.481667 }, // Glenn Warner Soccer Facility
  { lat: 57.7137, lng: -3.28549 }, // Grant Park
  { lat: 59.959114, lng: 10.780485 }, // Grefsen Stadion
  { lat: 42.1425, lng: 41.665555555 }, // Grigol Jomartidze Stadium
  { lat: 54.299861111, lng: 26.830416666 }, // City Stadium
  { lat: 47.1779, lng: 8.5085 }, // Herti Allmend Stadion
  { lat: -38.887894423, lng: -62.080190168 }, // El Coloso de Cemento
  { lat: -34.861525, lng: -56.209033 }, // Estadio José Nasazzi
  { lat: 3.521642, lng: -76.417036 }, // Estadi Deportivo Cali
  { lat: 50.099716, lng: 14.416122 }, // Estadi Letná
  { lat: 45.109594, lng: 7.641247 }, // Juventus Stadium
  { lat: 50.0675, lng: 14.4715 }, // Eden Arena
  { lat: -34.861111111, lng: -56.204166666 }, // Estadi Parque Alfredo Víctor Viera
  { lat: 46.768333, lng: 23.572222 }, // Cluj Arena
  { lat: 43.641388888, lng: -79.389166666 }, // Rogers Centre
  { lat: 53.3961, lng: -1.4258 }, // Don Valley Stadium
  { lat: 41.103388888, lng: 28.991 }, // Türk Telekom Arena
  { lat: 53.463055555, lng: -2.291388888 }, // Old Trafford
  { lat: 42.882767, lng: -8.516014 }, // Estadio Multiusos de San Lázaro
  { lat: 45.435833, lng: 8.595833 }, // Stadio Silvio Piola
  { lat: 45.544167, lng: 11.555556 }, // Estadi Romeo Menti
  { lat: 43.106111, lng: 12.357222 }, // Stadio Renato Curi
  { lat: 44.140556, lng: 12.261944 }, // Stadio Dino Manuzzi
  { lat: 43.726389, lng: 10.955 }, // Estadi Carlo Castellani
  { lat: 44.653611, lng: 10.923333 }, // Stadio Alberto Braglia
  { lat: 42.562222, lng: 12.635278 }, // Stadio Libero Liberati
  { lat: 45.570556, lng: 10.236944 }, // Stadio Mario Rigamonti
  { lat: 45.81388889, lng: 9.07222222 }, // Stadio Giuseppe Sinigaglia
  { lat: 45.813782, lng: 9.072363 }, // Stadio Giuseppe Sinigaglia
  { lat: 45.834633, lng: 8.800631 }, // Stadio Franco Ossola
  { lat: 45.319817, lng: 8.421335 }, // Stadio Silvio Piola
  { lat: 39.079167, lng: 17.116667 }, // Stadio Ezio Scida
  { lat: 39.079167, lng: 17.116667 }, // Stadio Ezio Scida
  { lat: 45.642778, lng: 11.781111 }, // Stadio Pier Cesare Tombolato
  { lat: 45.432222, lng: 11.858333 }, // Stadio Euganeo
  { lat: 44.102222, lng: 9.808611 }, // Stadio Alberto Picco
  { lat: 43.725278, lng: 10.4 }, // Arena Garibaldi – Stadio Romeo Anconetani
  { lat: 37.872294, lng: -4.764642 }, // Estadi Nuevo Arcángel
  { lat: 52.622222222, lng: 1.309166666 }, // Carrow Road
  { lat: 52.105278, lng: 8.688056 }, // Friedrich-Ludwig-Jahn-Stadium (Herford)
  { lat: 19.078056, lng: -98.164444 }, // Estadi Cuauhtémoc
  { lat: 37.356403, lng: -5.981611 }, // Estadi Benito Villamarín
  { lat: 43.70513, lng: 7.19262 }, // Allianz Riviera
  { lat: 48.218775, lng: 11.624752777 }, // Allianz Arena
  { lat: 32.6898, lng: 35.311325 }, // Barel Stadium
  { lat: -13.525, lng: -71.966 }, // Estadio Garcilaso
  { lat: 49.239, lng: 8.888278 }, // Rhein-Neckar-Arena
  { lat: 32.05173, lng: 34.76148 }, // Estadi Bloomfield
  { lat: 48.173055555, lng: 11.546666666 }, // Estadi Olímpic de Múnic
  { lat: 52.270936, lng: 7.920444 }, // Stadion am Lotter Kreuz
  { lat: -25.775919, lng: 28.072869 }, // Lucas Masterpieces Moripe Stadium
  { lat: -23.282222, lng: -51.165 }, // Estádio do Café
  { lat: 38.161389, lng: 15.520833 }, // Estadi San Filippo
  { lat: 51.4925, lng: 7.451667 }, // Signal Iduna Park
  { lat: 53.586944, lng: 9.898611 }, // Volksparkstadion
  { lat: 53.586944, lng: 9.898611 }, // Volksparkstadion
  { lat: 51.554502777, lng: 7.067588888 }, // Veltins-Arena
  { lat: 64.143555555, lng: -21.878972222 }, // Laugardalsvöllur
  { lat: 50.933611, lng: 6.875 }, // RheinEnergieStadion
  { lat: 48.792222, lng: 9.231944 }, // MHPArena
  { lat: 49.426240624, lng: 11.125617009 }, // easyCredit-Stadion
  { lat: 52.36, lng: 9.731111 }, // AWD-Arena
  { lat: 51.174583333, lng: 6.385463888 }, // Borussia-Park
  { lat: 49.434444, lng: 7.775833 }, // Fritz-Walter-Stadion
  { lat: 49.6, lng: 17.248333 }, // Estadi Ander
  { lat: 53.066389, lng: 8.8375 }, // Weserstadion
  { lat: -22.912166666, lng: -43.230163888 }, // Estadi Maracanã
  { lat: 51.261539, lng: 6.733083 }, // Esprit Arena
  { lat: 51.261539, lng: 6.733083 }, // Esprit Arena
  { lat: 51.261539, lng: 6.733083 }, // Esprit Arena
  { lat: 51.261539, lng: 6.733083 }, // Esprit Arena
  { lat: 52.431944, lng: 10.803889 }, // Volkswagen Arena
  { lat: 51.038255555, lng: 7.002205555 }, // BayArena
  { lat: 50.068611, lng: 8.645278 }, // Commerzbank-Arena
  { lat: 30.069111, lng: 31.312333 }, // Estadi Internacional de El Caire
  { lat: 41.380833333, lng: 2.122777777 }, // Camp Nou
  { lat: 41.933888888, lng: 12.454722222 }, // estadi Olímpic de Roma
  { lat: 50.914722222, lng: -1.413055555 }, // The Dell
  { lat: -26.234806, lng: 27.982378 }, // FNB Stadium
  { lat: 51.555, lng: -0.108333333 }, // Emirates Stadium
  { lat: 50.1247, lng: 8.62056 }, // Stadion am Brentanobad
  { lat: 48.3233205, lng: 10.8859261 }, // WWK Arena
  { lat: 53.145556, lng: 18.020556 }, // Estadi Zdzisław Krzyszkowiak
  { lat: 51.040278, lng: 13.747778 }, // Rudolf-Harbig-Stadion
  { lat: 51.481666666, lng: -0.191111111 }, // Stamford Bridge
  { lat: 51.538611111, lng: -0.016388888 }, // Estadi Olímpic de Londres
  { lat: -33.903461111, lng: 18.411152777 }, // Estadi Green Point
  { lat: 46.5609, lng: 3.34927 }, // Stade de Bellevue
  { lat: -29.829, lng: 31.0303 }, // Estadi Moses Mabhida
  { lat: 52.509166666, lng: -1.884722222 }, // Villa Park
  { lat: 37.56823, lng: 126.897243 }, // Estadi de la Copa del Món de Seül
  { lat: 37.56823, lng: 126.897243 }, // Estadi de la Copa del Món de Seül
  { lat: 52.53, lng: 13.359444 }, // Poststadion
  { lat: -12.917926, lng: -38.428117 }, // Barradão
  { lat: 54.602964, lng: -5.891319 }, // The Oval
  { lat: 29.7522, lng: -95.3524 }, // Shell Energy Stadium
  { lat: 50.950278, lng: -2.674881 }, // Huish Park
  { lat: 51.6428, lng: -3.02 }, // Cwmbran Stadium
  { lat: 43.56425383, lng: 13.526144 }, // Stadio del Conero
  { lat: 4.645888888, lng: -74.0775 }, // Estadi El Campín
  { lat: 52.239444, lng: 21.045556 }, // Estadi Nacional de Polònia
  { lat: 21.15095, lng: -86.83842222 }, // Andrés Quintana Roo Olympic Stadium
  { lat: -25.753189, lng: 28.223014 }, // Estadi Loftus Versfeld
  { lat: -29.117222222, lng: 26.208888888 }, // Estadi Free State
  { lat: -33.937778, lng: 25.598889 }, // Estadi Nelson Mandela Bay
  { lat: -26.1975, lng: 28.060833333 }, // Estadi Ellis Park
  { lat: 4.5734749, lng: -74.088768 }, // Velódromo Primero de Mayo
  { lat: -27.79383333, lng: -64.26422222 }, // Alfredo Terrera Stadium
  { lat: 10.07611111, lng: -84.30944444 }, // Estadio Allen Riggioni
  { lat: -40.9059, lng: -73.16075 }, // Q5847848
  { lat: 7.072194444, lng: -73.864583333 }, // Estadio Daniel Villa Zapata
  { lat: -34.6439, lng: -58.3528 }, // Estadio Dr. Osvaldo Baletto
  { lat: -34.649743698, lng: -58.625954483 }, // Estadio Francisco Urbano
  { lat: 8.823611111, lng: -82.972777777 }, // Q5847987
  { lat: 43.362911111, lng: -5.870369444 }, // estadi Hermanos Llana
  { lat: -32.9081, lng: -68.8399 }, // Estadio Ingelmo Nicolás Blázquez
  { lat: -34.5412, lng: -58.4618 }, // Juan Pasquale Stadium
  { lat: -33.737222222, lng: -70.737777777 }, // Estadio Lautaro
  { lat: -33.737247, lng: -70.737712 }, // Estadio Lautaro
  { lat: -34.513797984, lng: -58.706931584 }, // Malvinas Argentinas Stadium
  { lat: 18.7694, lng: -99.2364 }, // Estadio Mariano Matamoros
  { lat: 18.76954722, lng: -99.23641944 }, // Estadio Mariano Matamoros
  { lat: -31.3895, lng: -64.14326 }, // Miguel Sancho Stadium
  { lat: 8.711777777, lng: -75.827638888 }, // Estadio Jaraguay
  { lat: -34.738055555, lng: -58.517222222 }, // República de Italia Stadium
  { lat: -34.61, lng: -58.9084 }, // Estadio Ricardo Puga
  { lat: -34.6656, lng: -58.6639 }, // Estadio Carlos Alberto Sacaan
  { lat: 56.3659, lng: 8.63174 }, // Holstebro Idrætspark
  { lat: 1.497575, lng: 103.751372222 }, // Tan Sri Dato Haji Hassan Yunos Stadium
  { lat: 60.2621, lng: 24.83818333 }, // Myyrmäen jalkapallostadion
  { lat: 38.3969, lng: 27.0757 }, // Estadi Gürsel Aksel
  { lat: 37.929, lng: 41.9374 }, // Siirt Atatürk Stadium
  { lat: 41.57222222, lng: 35.91194444 }, // Bafra Stadium
  { lat: 37.1917, lng: 33.2203 }, // Kemal Kaynas Stadyum
  { lat: 37.1917, lng: 33.2203 }, // Kemal Kaynas Stadyum
  { lat: 39.1477, lng: 34.1558 }, // Ahi Stadium
  { lat: 39.8397, lng: 33.5386 }, // Başpınar Stadium
  { lat: 39.8358, lng: 33.5037 }, // Fikret Karabudak Stadium
  { lat: 36.6254, lng: 29.1213 }, // Fethiye District Stadium
  { lat: 41.00244, lng: 29.22609 }, // Sancaktepe Stadium
  { lat: 36.939666669, lng: 34.870055561 }, // Burhanettin Kocamaz Stadium
  { lat: 36.5851, lng: 36.1553 }, // İskenderun 5 Temmuz Stadium
  { lat: 37.5741, lng: 36.9234 }, // 12 Şubat Stadium
  { lat: 27.7685, lng: -82.6331 }, // Al Lang Stadium
  { lat: 41.227777777, lng: 36.4575 }, // Samsun 19 Mayıs Stadium
  { lat: 9.86389, lng: -84.0825 }, // Q6116014
  { lat: 33.58423, lng: -101.89951 }, // John Walker Soccer Complex
  { lat: 44.54262, lng: 26.06784 }, // Stadionul Otopeni
  { lat: 46.549722, lng: 24.545833 }, // Stadionul Trans-Sil
  { lat: 63.082778, lng: 21.641111 }, // Kaarlen kenttä
  { lat: 41.365504, lng: 33.767113 }, // Kastamonu Gazi Stadium
  { lat: 41.51211111, lng: 19.78672778 }, // Kastrioti Stadium
  { lat: 60.993611, lng: 24.441944 }, // Kaurialan kenttä
  { lat: 48.7428, lng: 21.9083 }, // Zemplin Stadium
  { lat: 48.7428, lng: 21.9083 }, // Zemplin Stadium
  { lat: 48.750061111, lng: 21.936230555 }, // Zemplin Stadium
  { lat: 48.750061111, lng: 21.936230555 }, // Zemplin Stadium
  { lat: 39.911, lng: 41.238 }, // Kazım Karabekir Stadium
  { lat: 34.028938888, lng: -84.567611111 }, // Fifth Third Stadium
  { lat: 34.028938888, lng: -84.567611111 }, // Fifth Third Stadium
  { lat: 61.062778, lng: 28.198611 }, // Kimpinen Sports Centre
  { lat: 55.494167, lng: 9.459167 }, // Kolding Stadion
  { lat: 39.790175, lng: -86.189185 }, // Kuntz Stadium
  { lat: 60.986389, lng: 25.650278 }, // Lahden kisapuisto
  { lat: 33.8866, lng: -117.887 }, // Titan Stadium
  { lat: 30.2825, lng: -97.729722 }, // Mike A. Myers Stadium
  { lat: 43.851601, lng: 19.846842 }, // Radomir Antić Stadium
  { lat: 43.134236, lng: 20.516067 }, // Novi Pazar City Stadium
  { lat: 31.7641, lng: 35.2161 }, // Katamon Football Stadium
  { lat: 51.240507, lng: 5.119414 }, // Lorzestraat
  { lat: 36.166667, lng: -79.745 }, // Macpherson Stadium
  { lat: 41.6706, lng: -71.180061 }, // Mark's Stadium
  { lat: 36.179662, lng: 137.917128 }, // Matsumotodaira Football Stadium
  { lat: -40.3464, lng: 175.635 }, // Memorial Park (Palmerston North)
  { lat: 45.574444, lng: -122.727222 }, // Merlo Field
  { lat: 50.924444, lng: 21.379444 }, // Miejski Stadion Sportowy 'KSZO'
  { lat: 2.116667, lng: 45.4 }, // Estadi Mogadiscio
  { lat: 55.57825, lng: 9.7286 }, // Fredericia New Stadium
  { lat: 41.264743, lng: -95.939398 }, // Morrison Stadium
  { lat: 50.914902, lng: 14.618924 }, // Městský stadion v Kotlině
  { lat: 51.579167, lng: 4.789722 }, // NAC Stadion t Ploegske
  { lat: 51.576389, lng: 4.745833 }, // NAC stadion Heuvelstraat
  { lat: -1.292222, lng: 36.842222 }, // Estadi Ciutat de Nairobi
  { lat: 37.97712222, lng: 23.635 }, // Neapoli Municipal Stadium
  { lat: 36.888, lng: 30.668 }, // New Antalya Stadium
  { lat: 37.9462, lng: 32.4881 }, // Estadi Municipal Metropolità de Konya
  { lat: 40.9987, lng: 39.6463 }, // Estadi Şenol Güneş
  { lat: 55.0688, lng: 15.1192 }, // Nexø Stadion
  { lat: 37.913038, lng: 139.036142 }, // Niigata City Athletic Stadium
  { lat: 40.5186, lng: -74.4637 }, // Yurcak Field
  { lat: 35.769167, lng: 139.707778 }, // Nishigaoka Soccer Stadium
  { lat: 59.5703, lng: 9.2704 }, // Notodden Stadion
  { lat: 52.345008, lng: 14.589897 }, // OSiR Stadium in Słubice
  { lat: 42.3654, lng: -71.1256 }, // Ohiri Field
  { lat: 59.219414, lng: 10.928308 }, // Old Fredrikstad Stadion
  { lat: 10.084436, lng: -61.601494 }, // Palo Seco Velodrome
  { lat: 1.461966666, lng: 103.898102777 }, // Pasir Gudang Stadium
  { lat: 35.129167, lng: 33.083889 }, // Peristerona Stadium
  { lat: 59.15254, lng: 9.64172 }, // Pors Stadion
  { lat: 57.0983, lng: 12.2654 }, // Påskbergsvallen
  { lat: 65.019694444, lng: 25.465805555 }, // Raatti Stadium
  { lat: 59.0068, lng: 5.619538 }, // Randaberg Stadion
  { lat: 52.089722222, lng: 23.68375 }, // Regional Sport Complex Brestsky
  { lat: 62.105833, lng: -6.723333 }, // Runavík Stadium
  { lat: 44.8524527, lng: 20.3824536 }, // SC Partizan-Teleoptik
  { lat: 54.624294, lng: -5.921925 }, // Seaview
  { lat: 28.7946, lng: -81.3892 }, // Seminole Soccer Complex
  { lat: -1.559111111, lng: 13.22725 }, // Stade Henri-Sylvoz
  { lat: 46.779142, lng: -56.183347 }, // Stade John Girardin
  { lat: 6.49722222, lng: 2.605 }, // Stade Municipale
  { lat: 18.73333333, lng: 7.38333333 }, // Stade d'Arlit
  { lat: 46.20655, lng: 6.17659 }, // Stade de Frontenex
  { lat: 46.185861, lng: 6.149833 }, // Stade de la Fontenette
  { lat: 46.234390317, lng: 6.069765138 }, // Stade des Arberes
  { lat: 41.7313, lng: 12.6517 }, // Stadio Pio XII
  { lat: 50.0675, lng: 14.471667 }, // Stadion Eden
  { lat: 43.1517, lng: 22.5961 }, // Stadion Dragan Nikolić
  { lat: 50.171, lng: 12.6567 }, // Stadion FK Baník Sokolov
  { lat: 44.808144, lng: 20.373892 }, // Stadion FK Bežanija
  { lat: 50.773847, lng: 14.222472 }, // Stadion FK Řezuz Děčín
  { lat: 51.3016, lng: 22.876 }, // Stadion Górnika Łęczna
  { lat: 49.702603, lng: 14.8915 }, // Stadion Kollárova ulice
  { lat: 41.908356, lng: 22.406394 }, // Nikola Mantov Stadium
  { lat: 52.3811, lng: 4.67667 }, // Stadion Oostpoort
  { lat: 45.276667, lng: 19.5275 }, // Stadion Pivare
  { lat: 45.724, lng: 16.0732 }, // Stadion Radnik
  { lat: 49.6686, lng: 18.66784 }, // Stadion Rudolfa Labaje
  { lat: 49.289883, lng: 17.402386 }, // Stadion Jožky Silného
  { lat: 45.34744, lng: 14.400759 }, // Estadi Rujevica
  { lat: 50.298611, lng: 21.435833 }, // Stadion Stali Mielec
  { lat: 49.9098, lng: 15.3846 }, // Stadion pod Hrádkem
  { lat: 49.949725, lng: 17.890092 }, // Stadion v Městských sadech
  { lat: 44.3086, lng: 26.1839 }, // Stadionul Berceni
  { lat: 45.753859, lng: 21.21052 }, // Stadionul CFR
  { lat: 45.7539, lng: 21.2105 }, // Stadionul CFR
  { lat: 45.889722, lng: 22.901389 }, // Stadionul Cetate
  { lat: 46.790278, lng: 23.612222 }, // Stadionul Clujana
  { lat: 44.46418, lng: 26.33276 }, // Stadionul Cătălin Hîldan
  { lat: 45.841, lng: 23.191 }, // Stadionul Dacia
  { lat: 43.662778, lng: 25.366667 }, // Stadionul Dunărea
  { lat: 44.981667, lng: 25.649444 }, // Stadionul Flacăra
  { lat: 44.4575, lng: 26.1025 }, // Stadionul Florea Dumitrache
  { lat: 45.839167, lng: 21.226389 }, // Stadionul Fortuna
  { lat: 47.071944, lng: 21.93 }, // Stadionul Iuliu Bodola
  { lat: 44.465711, lng: 26.145267 }, // Stadionul Juventus
  { lat: 43.896111, lng: 25.981389 }, // Stadionul Marin Anastasovici
  { lat: 45.357778, lng: 23.211389 }, // Stadionul Minerul
  { lat: 44.536944, lng: 25.983056 }, // Stadionul Mogoșoaia
  { lat: 45.6575, lng: 25.570833 }, // Stadionul Municipal (Brașov)
  { lat: 45.1471, lng: 24.6732 }, // Stadionul Municipal
  { lat: 45.376667, lng: 27.031111 }, // Stadionul Municipal
  { lat: 46.563056, lng: 23.823611 }, // Stadionul Municipal
  { lat: 47.79961111, lng: 22.89102778 }, // Stadionul Olimpia
  { lat: 44.566389, lng: 25.951667 }, // Stadionul Orășenesc
  { lat: 44.913892, lng: 26.041214 }, // Stadionul Prahova
  { lat: 44.735, lng: 26.173611 }, // Stadionul Snagov
  { lat: 45.7704, lng: 21.25426 }, // Stadionul UMT
  { lat: 44.4362, lng: 26.0766 }, // Estadi Venus
  { lat: 59.939661, lng: 11.003525 }, // Strømmen Stadion
  { lat: 53.716111, lng: -1.859167 }, // The Shay
  { lat: 53.809711, lng: -1.664214 }, // The Citadel
  { lat: 40.3281, lng: 36.556 }, // Tokat Gaziosmanpaşa Stadium
  { lat: 66.072956, lng: -23.136141 }, // Q7825697
  { lat: 36.070309, lng: -79.812895 }, // UNCG Soccer Stadium
  { lat: 38.752777777, lng: -9.184722222 }, // Estádio da Luz
  { lat: -24.655114, lng: 25.940571 }, // University of Botswana Stadium
  { lat: 47.3789, lng: 8.49694 }, // Utogrund
  { lat: 43.031944444, lng: -87.936111111 }, // Valley Fields
  { lat: 44.7749, lng: 20.4902 }, // Voždovac Stadium
  { lat: 32.8397, lng: -96.7823 }, // Washburne Soccer and Track Stadium
  { lat: 53.518542, lng: -2.121747 }, // Whitebank Stadium
  { lat: 40.994, lng: 28.912 }, // Zeytinburnu Stadium
  { lat: 9.946111111, lng: -84.056666666 }, // Estadi José Joaquín 'Coyella' Fonseca
  { lat: -31.743031, lng: -60.507597 }, // Presbyter Bartolomé Grella Grella
  { lat: -17.7347, lng: -49.1123 }, // Q9186138
  { lat: -17.8623, lng: -51.7288 }, // Q9186140
  { lat: -10.4436, lng: -62.4731 }, // Q9255036
  { lat: -15.615706, lng: -47.652811 }, // Q9255145
  { lat: -7.587403, lng: -39.278806 }, // Q9255148
  { lat: -3.766667, lng: -38.572778 }, // Q9255150
  { lat: -24.767222, lng: -51.752222 }, // Q9255154
  { lat: -8.669186, lng: -35.728425 }, // Q9255162
  { lat: -20.56800556, lng: -48.56366111 }, // Q9255167
  { lat: -20.568056, lng: -48.563611 }, // Q9255167
  { lat: -31.335833, lng: -54.095556 }, // Q9255169
  { lat: -0.040278, lng: -51.175278 }, // Q9255178
  { lat: -22.384722, lng: -47.3925 }, // Q9255183
  { lat: -25.466944, lng: -50.659167 }, // Q9255191
  { lat: -29.208611, lng: -51.349167 }, // Q9255199
  { lat: -20.671111, lng: -40.499444 }, // Q9255201
  { lat: -2.906944, lng: -41.77 }, // Q9255208
  { lat: -22.876111, lng: -48.448611 }, // Q9255213
  { lat: -20.896667, lng: -47.586111 }, // Q9255214
  { lat: -12.485, lng: -49.128056 }, // Q9255222
  { lat: -22.424444, lng: -47.358611 }, // Q9255229
  { lat: -20.560434, lng: -54.575658 }, // Q9255230
  { lat: -19.793333, lng: -42.140556 }, // Q9255232
  { lat: -5.816667, lng: -61.291111 }, // Q9255238
  { lat: -21.438333, lng: -45.947778 }, // Q9255246
  { lat: -11.738411, lng: -49.092714 }, // Q9255262
  { lat: 0.033392, lng: -51.063439 }, // Q9255265
  { lat: -4.935478, lng: -37.96675 }, // Q9255271
  { lat: -7.086395, lng: -41.473467 }, // Q9255277
  { lat: -6.379733, lng: -37.354069 }, // Q9255293
  { lat: -7.655375, lng: -35.318992 }, // Q9255294
  { lat: -16.360658, lng: -39.594181 }, // Estádio José Araújo
  { lat: -11.3425, lng: -38.960833 }, // Q9255297
  { lat: -4.223858, lng: -44.777844 }, // Q9255302
  { lat: -19.4725, lng: -42.575277777 }, // João Teotônio Ferreira Stadium
  { lat: -4.248008, lng: -42.292406 }, // Q9255318
  { lat: -5.790790036, lng: -35.196062456 }, // Estádio Juvenal Lamartine
  { lat: -5.18555556, lng: -37.35694444 }, // Nogueirão
  { lat: -6.326394, lng: -47.428731 }, // Q9255326
  { lat: -1.444008, lng: -48.462958 }, // Estádio da Curuzú
  { lat: -1.444008, lng: -48.462958 }, // Estádio da Curuzú
  { lat: -1.443888888, lng: -48.463055555 }, // Estádio da Curuzú
  { lat: -1.443888888, lng: -48.463055555 }, // Estádio da Curuzú
  { lat: -8.008283, lng: -34.979792 }, // Q9255330
  { lat: -7.512153, lng: -34.9155 }, // Q9255335
  { lat: -7.324186, lng: -39.298011 }, // Q9255338
  { lat: -19.829183, lng: -40.367086 }, // Q9255341
  { lat: -5.296356, lng: -36.761756 }, // Q9255349
  { lat: -7.945819, lng: -34.888136 }, // Ademir Cunha Stadium
  { lat: -5.52530556, lng: -47.48847222 }, // Q9255395
  { lat: -21.617333, lng: -55.169528 }, // Q9255427
  { lat: -22.06675, lng: -46.569633 }, // Q9255455
  { lat: -3.680556, lng: -39.588056 }, // Q9255458
  { lat: -23.115556, lng: -45.71 }, // Q9255464
  { lat: -6.779722, lng: -43.009167 }, // Q9255468
  { lat: -23.074167, lng: -52.468333 }, // Q9255475
  { lat: -12.660158, lng: -39.124336 }, // Q9255479
  { lat: -2.928056, lng: -41.753333 }, // Q9255485
  { lat: -11.730903, lng: -61.764719 }, // Q9255490
  { lat: -3.786389, lng: -49.67 }, // Antônio Dias municipal stadium
  { lat: -21.793333, lng: -54.553333 }, // Q9255500
  { lat: -6.118056, lng: -38.212222 }, // Q9255502
  { lat: -10.281944, lng: -48.330556 }, // Q9255503
  { lat: -10.878333, lng: -61.956111 }, // Q9255521
  { lat: -27.104167, lng: -52.606944 }, // Q9255529
  { lat: -29.706667, lng: -52.442222 }, // Q9255533
  { lat: -6.439167, lng: -37.083333 }, // Q9255537
  { lat: -12.983333, lng: -38.473056 }, // Estádio Parque Santiago
  { lat: -5.134167, lng: -39.733889 }, // Q9255541
  { lat: -21.127222, lng: -42.337778 }, // Q9255543
  { lat: -18.915278, lng: -40.078333 }, // Q9255545
  { lat: -5.921111, lng: -35.260833 }, // Q9255553
  { lat: -7.127222, lng: -34.968889 }, // Q9255559
  { lat: -18.799444, lng: -52.63 }, // Q9255572
  { lat: -7.225556, lng: -48.254444 }, // Q9255574
  { lat: 44.2136, lng: 12.0578 }, // Stadio Tullo Morgagni
  { lat: 52.719722222, lng: 16.374166666 }, // Amica Wronki Stadium
  { lat: 45.120833, lng: 19.221389 }, // Q9341120
  { lat: 44.9085, lng: 19.9743 }, // Suvača Sportcenter
  { lat: -4.62444, lng: 55.4541 }, // People's Stadium, Seychelles
  { lat: 51.2319, lng: 22.5575 }, // Arena Lublin
  { lat: 49.8453, lng: 18.5613 }, // Městský stadion
  { lat: 50.124166666, lng: 18.990555555 }, // Tychy City Stadium
  { lat: 50.1584, lng: 20.8492 }, // Stadion Bruk-Bet Termaliki
  { lat: 38.036947, lng: 23.741358 }, // Estadi Nikos Goumas
  { lat: 51.409444, lng: 21.171389 }, // Stadion RKS Radomiak
  { lat: 52.2094, lng: 18.2369 }, // Q9341243
  { lat: 54.1758, lng: 15.5619 }, // Stadium in Kołobrzeg
  { lat: -29.484035851, lng: -51.999884953 }, // Q10276745
  { lat: -28.46666667, lng: -49.00694444 }, // Estádio Aníbal Torres Costa
  { lat: -22.89583333, lng: -47.06958333 }, // Estádio Cerecamp
  { lat: -18.016667, lng: -49.366111 }, // Estádio Divino Garcia Rosa
  { lat: -22.359385, lng: -47.34065 }, // Estádio Doutor Hermínio Ometto
  { lat: -22.35925278, lng: -47.34056944 }, // Estádio Doutor Hermínio Ometto
  { lat: 54.39, lng: 18.640278 }, // PGE Arena Gdańsk
  { lat: 43.264205, lng: -2.949369 }, // San Mamés Barria
  { lat: 53.0636, lng: 8.84286 }, // Weserstadion Platz 11
  { lat: 48.207222222, lng: 16.420833333 }, // Estadi Ernst Happel
  { lat: 51.603333333, lng: -0.065833333 }, // White Hart Lane
  { lat: -25.461888888, lng: 30.929777777 }, // Estadi Mbombela
  { lat: 52.397222, lng: 16.858056 }, // Estadi Municipal de Poznań
  { lat: 51.141111111, lng: 16.943611111 }, // Estadi Municipal de Wrocław
  { lat: 47.541389, lng: 7.62 }, // Sankt Jakob-Park
  { lat: 56.83244, lng: 60.57358 }, // Estadi Central de Iekaterinburg
  { lat: 55.796944, lng: 49.098889 }, // Estadi Central de Kazan
  { lat: 43.238331, lng: 76.92435 }, // Estadi Central d'Almati
  { lat: 53.225974, lng: 63.636578 }, // Kostanay Central Stadium
  { lat: 41.72291667, lng: 44.79013889 }, // Central Stadium
  { lat: 47.994494, lng: 37.785747 }, // Shakhtar Stadium
  { lat: 46.480556, lng: 30.755556 }, // Chornomorets Stadium
  { lat: 51.672778, lng: 39.204167 }, // Tsentralnyi Profsoyuz Stadion
  { lat: 47.668335, lng: 9.481577 }, // Zeppelinstadion
  { lat: 54.975555555, lng: -1.621666666 }, // St. James' Park
  { lat: 55.825863888, lng: -4.252002777 }, // Hampden Park
  { lat: 45.67, lng: 12.255833 }, // Stadio Omobono Tenni
  { lat: 51.365839, lng: 19.381692 }, // Stadion GKS
  { lat: 43.476389, lng: -3.793333 }, // Estadi El Sardinero
  { lat: 33.864444444, lng: -118.261111111 }, // Dignity Health Sports Park
  { lat: 51.207778, lng: 7.619167 }, // Nattenberg-Stadion
  { lat: 52.915, lng: -1.447222222 }, // Pride Park Stadium
  { lat: 43.269241, lng: 5.394907 }, // Stade Vélodrome
  { lat: 55.715833333, lng: 37.553611111 }, // Estadi Lujniki
  { lat: 47.255972, lng: 11.410789 }, // Estadi Tivoli Tirol
  { lat: 51.478055555, lng: -3.1825 }, // Millennium Stadium
  { lat: 51.557696, lng: -0.102966 }, // Arsenal Stadium
  { lat: 47.81625, lng: 12.998222222 }, // Red Bull Arena
  { lat: 55.853055555, lng: -4.309166666 }, // Ibrox Stadium
  { lat: 51.345833, lng: 12.348056 }, // Zentralstadion
  { lat: 37.946169, lng: 23.664536 }, // Estadi Geórgios Karaiskakis
  { lat: 49.775278055, lng: 24.027778055 }, // Arena Lviv
  { lat: 55.849711111, lng: -4.205588888 }, // Celtic Park
  { lat: 49.4988, lng: 0.1697 }, // Stade Océane
  { lat: 49.4988, lng: 0.1697 }, // Stade Océane
  { lat: -28.684167, lng: -49.3675 }, // Estádio Heriberto Hülse
  { lat: 62.0193487, lng: -6.7811394 }, // Gundadalur
  { lat: 41.074472222, lng: 28.765702777 }, // Atatürk Olimpiyat Stadyumu
  { lat: 40.9875, lng: 29.036666666 }, // Şükrü Saracoğlu Stadyumu
  { lat: 52.056111, lng: 4.29 }, // Zuiderpark Stadion
  { lat: 46.980278, lng: 28.866944 }, // Estadi Zimbru
  { lat: 46.744817, lng: 7.606075 }, // Stockhorn Arena
  { lat: 53.580555555, lng: -2.535555555 }, // Reebok Stadium
  { lat: 53.334956, lng: -6.228253 }, // Aviva Stadium
  { lat: 53.728611111, lng: -2.489166666 }, // Ewood Park
  { lat: 45.146111, lng: 10.794167 }, // Stadio Danilo Martelli
  { lat: 45.140278, lng: 10.034722 }, // Stadio Giovanni Zini
  { lat: 55.779947, lng: -3.980078 }, // Fir Park
  { lat: 52.394444, lng: 5.240556 }, // Yanmar Stadion
  { lat: 28.463055555, lng: -16.260555555 }, // Estadi Heliodoro Rodríguez López
  { lat: 41.378089, lng: -8.354761 }, // Parque de Jogos Comendador Joaquim de Almeida Freitas
  { lat: 42.97982222, lng: 47.50720556 }, // Dynamo Stadium
  { lat: 51.4246, lng: 6.99481 }, // Grugastadion
  { lat: 48.564444, lng: 13.422778 }, // Drei Flüsse Stadion
  { lat: 46.2091, lng: 6.1182 }, // Estadi de Charmilles
  { lat: 46.2091, lng: 6.1182 }, // Estadi de Charmilles
  { lat: 46.2091, lng: 6.1182 }, // Estadi de Charmilles
  { lat: 38.435, lng: 27.178055555 }, // Estadi Atatürk d'Esmirna
  { lat: 32.100278, lng: 34.824167 }, // Estadi Ramat Gan
  { lat: -24.783333, lng: -65.403889 }, // Argentine
  { lat: 39.996053, lng: -0.038792 }, // Nou Castàlia
  { lat: 43.023056, lng: 44.695 }, // Republican Spartak Stadium
  { lat: 52.280833, lng: 8.071111 }, // Stadion an der Bremer Brücke
  { lat: 50.95194444, lng: 3.10527778 }, // Schiervelde Stadion
  { lat: 51.174667, lng: 6.451278 }, // Jahnstadion
  { lat: 47.3536, lng: 9.6372 }, // Stadion Schnabelholz
  { lat: 34.937422, lng: 33.620922 }, // Antonis Papadopoulos Stadium
  { lat: 60.4575, lng: 26.939722 }, // Arto Tolsa Areena
  { lat: 43.780822, lng: 11.282258 }, // Estadi Artemio Franchi
  { lat: 59.962752, lng: 11.063458 }, // Åråsen Stadion
  { lat: 44.416431, lng: 8.952428 }, // Estadi Luigi Ferraris
  { lat: 37.383878, lng: -5.970467 }, // Estadi Ramón Sánchez Pizjuán
  { lat: 39.59, lng: 2.63 }, // Estadi de Son Moix
  { lat: -34.545277777, lng: -58.449722222 }, // Estadi Monumental Antonio Vespucio Liberti
  { lat: 40.706667, lng: 14.494444 }, // Stadio Romeo Menti
  { lat: 59.421292, lng: 24.73205 }, // A. Le Coq Arena
  { lat: 46.56935, lng: 3.31933 }, // Hector-Rolland Stadium
  { lat: -37.852899, lng: 144.971337 }, // Middle Park
  { lat: -34.643494, lng: -58.396511 }, // Estadi Tomás Adolfo Ducó
  { lat: 41.121344, lng: 24.949372 }, // Xanthi FC Arena
  { lat: 46.391531, lng: 16.422307 }, // Stadion SRC Mladost
  { lat: 47.111389, lng: 6.836111 }, // Centre Sportif de la Charrière
  { lat: 48.559444, lng: 39.321111 }, // Estadi Avanhard
  { lat: 24.469397222, lng: 54.375252777 }, // Al Nahyan Stadium
  { lat: 15.64722222, lng: 32.475 }, // Estadi Al-Hilal
  { lat: 38.761194444, lng: -9.160783333 }, // Estádio José Alvalade
  { lat: 6.682681, lng: -1.605111 }, // Estadi Baba Yara
  { lat: 45.0569, lng: 7.66028 }, // Velodrome Humbert I
  { lat: 51.751389, lng: 14.345556 }, // LEAG Energie Stadion
  { lat: 41.723, lng: 44.78975 }, // Estadi Borís Paitxadze
  { lat: 52.6125, lng: 4.741667 }, // AFAS Stadion
  { lat: 47.408333, lng: 9.306389 }, // kybunpark
  { lat: 60.159119, lng: 10.265368 }, // AKA Arena
  { lat: 46.6206, lng: 14.3401 }, // Sportzentrum Fischl
  { lat: 50.868333, lng: 4.694167 }, // Den Dreef
  { lat: 42.432778, lng: 25.615278 }, // Beroe Stadium
  { lat: -22.658639, lng: -50.43325 }, // Q10277171
  { lat: -22.439943, lng: -46.83098 }, // Estádio Municipal Coronel Francisco Vieira
  { lat: -22.8952771, lng: -49.6251433 }, // Estádio Municipal Leônidas Camarinha
  { lat: -23.75555556, lng: -53.30694444 }, // Q10277255
  { lat: -13.0744, lng: -55.9242 }, // Estádio Municipal Passo das Emas
  { lat: -23.668888888, lng: -46.470555555 }, // Estádio Municipal Pedro Benedetti
  { lat: -21.59175, lng: -48.80502 }, // Estadi Municipal dos Amaros
  { lat: -3.745833, lng: -38.536667 }, // Estádio Presidente Vargas
  { lat: -14.672777777, lng: -52.352777777 }, // Q10277489
  { lat: -31.417832, lng: -57.976474 }, // Estadio Parque 'Julio Pozzi'
  { lat: 49.776629, lng: 14.677938 }, // Městský stadion
  { lat: -5.98898, lng: -79.7527 }, // Estadio Francisco Mendoza Pizarro
  { lat: 36.413333, lng: 139.053889 }, // Gunma Shikishima Soccer Stadium
  { lat: 41.0278, lng: 28.939 }, // Vefa Stadium
  { lat: 33.50555556, lng: 36.28916667 }, // Tishreen Stadium
  { lat: 33.50555556, lng: 36.28916667 }, // Tishreen Stadium
  { lat: 54.3204, lng: -2.73652222 }, // Pye Motors Stadium
  { lat: 34.810639, lng: 137.722389 }, // Honda Miyakoda Soccer Stadium
  { lat: 38.30072222, lng: 141.0635 }, // Q11353369
  { lat: 35.10975, lng: 135.992444 }, // Big Lake
  { lat: 57.844131, lng: 27.010974 }, // Võru stadium
  { lat: 39.72155, lng: 140.0992778 }, // Akigin Stadium
  { lat: 32.77508, lng: 129.861207 }, // Nagasaki Municipal Rugby-Soccer Stadium
  { lat: 35.999361111, lng: 140.607138888 }, // Kashima Heights Sports Plaza - Ground No. 1
  { lat: -25.6625, lng: 27.221944 }, // Olympia Park
  { lat: -6.220606, lng: -36.017986 }, // Q11697180
  { lat: -4.829689, lng: -42.177638 }, // Deusdeth de Melo Stadium
  { lat: -20.768417, lng: -41.672944 }, // Q11697191
  { lat: -22.698216, lng: -46.764239 }, // Q11697199
  { lat: -3.88489, lng: -38.676636 }, // Q11697207
  { lat: -20.101697, lng: -43.974114 }, // Q11697210
  { lat: -16.700833, lng: -49.091944 }, // Estádio Plínio José de Souza
  { lat: -8.421944, lng: -37.0575 }, // Q11697218
  { lat: 56.144848, lng: 9.146501 }, // Ikast Stadion
  { lat: 60.2167, lng: 25.1386 }, // Vuosaaren urheilukenttä
  { lat: 61.1211, lng: 21.5033 }, // Äijänsuo stadium
  { lat: 39.1521, lng: -0.428445 }, // Estadi Luis Suñer Picó
  { lat: 39.1668, lng: -0.430583 }, // Estadi Luis Suñer Picó
  { lat: 59.2839, lng: 10.4164 }, // Tønsberg Gressbane
  { lat: 60.152, lng: 11.189 }, // UKI Arena
  { lat: 31.515306, lng: 34.45575 }, // Yarmouk Stadium
  { lat: 50.795933, lng: 8.758553 }, // Stadion an der Gisselberger Straße
  { lat: 34.71638889, lng: 36.68888889 }, // Bassel al-Assad Stadium (Homs)
  { lat: 42.276111111, lng: 22.683055555 }, // Osogovo Stadium
  { lat: 57.54105278, lng: 25.44083611 }, // Estadi Jānis Daliņš
  { lat: 56.5682, lng: 9.0378 }, // Skive Stadion
  { lat: 55.40046389, lng: 11.364275 }, // Slagelse Stadion
  { lat: 42.34055, lng: -7.87555 }, // Estadi Municipal d'O Couto
  { lat: 31.915394, lng: 34.775203 }, // Ness Ziona Stadium
  { lat: -6.88333, lng: 109.666 }, // Hoegeng Stadium
  { lat: 44.907111, lng: 17.309472 }, // Gradski stadion
  { lat: 45.8364, lng: 16.1075 }, // Stadion ŠRC Sesvete
  { lat: 37.041111111, lng: 22.120833333 }, // Messiniakos Stadium
  { lat: 42.006575, lng: 21.46137 }, // Avtokomanda Stadium
  { lat: 40.332011, lng: -1.105906 }, // Estadio de Pinilla
  { lat: -16.7696047, lng: 179.3525121 }, // Ganilau Park
  { lat: 14.4292, lng: -16.9727 }, // Stade Caroline Faye
  { lat: 62.7819, lng: 22.8511 }, // Seinäjoen keskuskenttä
  { lat: 43.860014, lng: 20.132608 }, // Mladost Stadium
  { lat: 43.860013888, lng: 20.132608333 }, // Mladost Stadium
  { lat: -23.073889, lng: -52.468056 }, // Estádio Waldemiro Wagner
  { lat: 32.720903, lng: 35.265769 }, // Ilut Stadium
  { lat: 25.579995, lng: 91.894326 }, // Jawaharlal Nehru Stadium, Shillong
  { lat: 45.746111111, lng: 21.228333333 }, // Stadionul Știința
  { lat: -7.87525, lng: 110.380388888 }, // Sultan Agung Stadium
  { lat: 55.874637, lng: 26.55053 }, // Estadi Daugava
  { lat: 50.3305, lng: 7.58661 }, // Stadion Oberwerth
  { lat: 36.884, lng: -76.3109 }, // Old Dominion Soccer Complex
  { lat: 41.039166666, lng: 28.994166666 }, // Vodafone Arena
  { lat: -27.1041, lng: -52.607 }, // Arena Condá
  { lat: 47.9952, lng: 16.86369 }, // Heidebodenstadion
  { lat: 41.1248, lng: 37.2855 }, // Ünye İlçe Stadium
  { lat: 41.12472222, lng: 37.28555556 }, // Ünye İlçe Stadium
  { lat: 46.8253, lng: 14.8514 }, // Lavanttal-Arena
  { lat: 52.11155556, lng: 23.76522222 }, // Q15109396
  { lat: 41.067158, lng: -8.544812 }, // Estádio Municipal Dr. Jorge Sampaio
  { lat: 52.36661111, lng: 14.03602778 }, // S-OS Arena
  { lat: 52.36661111, lng: 14.03602778 }, // S-OS Arena
  { lat: 52.79333333, lng: 27.54972222 }, // Shakhtyor Stadium
  { lat: 52.79333333, lng: 27.54972222 }, // Shakhtyor Stadium
  { lat: 52.793325, lng: 27.55087222 }, // Shakhtyor Stadium
  { lat: 52.793325, lng: 27.55087222 }, // Shakhtyor Stadium
  { lat: 51.37722222, lng: 12.37222222 }, // Stadion des Friedens (Leipzig)
  { lat: 55.43305556, lng: -2.76277778 }, // Albert Park
  { lat: 39.681466, lng: -104.96327883 }, // University of Denver Soccer Stadium
  { lat: 41.791345629, lng: 20.901447483 }, // Gradski stadion Gostivar
  { lat: 40.71848583, lng: -73.59866383 }, // Hofstra University Soccer Stadium
  { lat: 54.84980278, lng: -5.82625833 }, // Inver Park
  { lat: 34.935236, lng: 32.975947 }, // Kyperounda Community Stadium
  { lat: 52.3666, lng: 14.036 }, // Rudolf-Harbig-Stadion
  { lat: 22.562035, lng: 88.342223 }, // Mohun Bagan Ground
  { lat: 38.2087, lng: -85.75515 }, // Dr. Mark & Cindy Lynn Stadium
  { lat: 48.003591019, lng: 13.481024622 }, // Q15848229
  { lat: 50.7137, lng: 6.01631 }, // Q15867580
  { lat: 49.5093, lng: 6.28961 }, // Q15919542
  { lat: 44.437199, lng: 26.152202 }, // Estadi Nacional Lia Manoliu
  { lat: 59.434472222, lng: 24.783444444 }, // Estadi Kadriorg
  { lat: 47.988889, lng: 7.893056 }, // Schwarzwald-Stadion
  { lat: 35.8873, lng: 14.4925 }, // Estadi Victor Tedesco
  { lat: 50.842186, lng: 12.945669 }, // Stadion an der Gellertstraße
  { lat: 51.493611, lng: 6.854444 }, // Niederrheinstadion
  { lat: 49.945278, lng: 11.586944 }, // Hans-Walter-Wild-Stadion
  { lat: 51.3029, lng: 12.4192 }, // Bruno-Plache-Stadion
  { lat: 48.753944, lng: 9.188417 }, // Gazi-Stadion auf der Waldau
  { lat: 51.475, lng: -0.221666666 }, // Craven Cottage
  { lat: 52.958611, lng: 5.936111 }, // Abe Lenstra Stadion
  { lat: 51.358056, lng: 12.307778 }, // Alfred-Kunze-Sportpark
  { lat: 43.727778, lng: 7.415556 }, // Estadi Louis II
  { lat: 50.128056, lng: 8.723333 }, // Stadion am Bornheimer Hang
  { lat: 52.55, lng: 13.3933 }, // Stadion am Gesundbrunnen
  { lat: 19.303055555, lng: -99.150555555 }, // Estadi Azteca
  { lat: 48.404589, lng: 10.009575 }, // Donaustadion
  { lat: 52.425306, lng: 10.799417 }, // VfL-Stadion am Elsterweg
  { lat: 51.248386, lng: -0.754789 }, // Recreation Ground
  { lat: 51.4266, lng: 7.01825 }, // Uhlenkrugstadion
  { lat: -34.836633, lng: -56.216569 }, // Estadio Osvaldo Roberto
  { lat: -34.873333, lng: -56.234444 }, // estadi Abraham Paladino
  { lat: -34.724444444, lng: -56.2025 }, // Estadio Parque Artigas Las Piedras
  { lat: 41.084736, lng: 16.840072 }, // estadi San Nicola
  { lat: 51.893894444, lng: 4.523252777 }, // Stadion Feĳenoord
  { lat: 51.531944444, lng: 0.039444444 }, // Upton Park
  { lat: 51.531944444, lng: 0.039444444 }, // Upton Park
  { lat: 60.18689398, lng: 24.92606242 }, // Estadi Olímpic de Hèlsinki
  { lat: 10.31944444, lng: 9.83527778 }, // Abubarkar Tafawa Balewa Stadium
  { lat: 9.037917, lng: 7.453389 }, // Estadi Nacional d'Abuja
  { lat: 53.554444, lng: 9.967778 }, // Millerntor-Stadion
  { lat: 43.32317778, lng: 45.74525278 }, // Akhmat-Arena
  { lat: 45.240278, lng: 19.381667 }, // Stadion Slavko Maletin Vava
  { lat: 51.630555555, lng: -0.800277777 }, // Adams Park
  { lat: 9.013306, lng: 38.756417 }, // Estadi d'Addis Abeba
  { lat: 53.55527778, lng: 9.91138889 }, // Adolf-Jäger-Kampfbahn
  { lat: 42.705467, lng: 23.363197 }, // Estadi Georgi Asparuhov
  { lat: 50.094444, lng: 8.798611 }, // Stadion am Bieberer Berg
  { lat: 37.417236, lng: -6.004564 }, // Estadi Olímpic de la Cartuja
  { lat: 38.546667, lng: -90.438611 }, // World Wide Technology Soccer Park
  { lat: 51.489944, lng: 7.236489 }, // Ruhrstadion
  { lat: 52.590277777, lng: -2.130277777 }, // Molineux Stadium
  { lat: 54.222361111, lng: 28.490277777 }, // Haradski Stadium
  { lat: 57.628729, lng: 39.867486 }, // Shinnik Stadium
  { lat: 47.1453, lng: 7.26104 }, // Gurzelen Stadion
  { lat: 50.5975, lng: 12.711111 }, // Erzgebirgsstadion
  { lat: 44.829167, lng: -0.598056 }, // Stade Jacques Chaban-Delmas
  { lat: 47.45905, lng: -0.53163 }, // Stade Jean-Bouin
  { lat: 41.164444444, lng: -8.586666666 }, // Estádio das Antas
  { lat: 37.1478, lng: 38.8068 }, // Şanlıurfa 11 Nisan Stadium
  { lat: -16.0125, lng: -48.062222 }, // Bezerrão
  { lat: 40.98, lng: 28.791388888 }, // Şenlikköy Stadium
  { lat: -17.53484444, lng: 177.66956667 }, // Govind Park
  { lat: 53.087419, lng: -2.435747 }, // Alexandra Stadium
  { lat: 40.410986, lng: 49.897711 }, // ASK Arena
  { lat: 31.751166666, lng: 35.190616666 }, // Estadi Teddy Kollek
  { lat: 50.8575, lng: 5.717778 }, // De Geusselt
  { lat: 48.740836, lng: 21.244497 }, // Lokomotíva Stadium
  { lat: 48.373333, lng: 17.591667 }, // Estadi Anton Malatinský
  { lat: 49.0825, lng: 19.28388889 }, // Štadión MFK Ružomberok
  { lat: 48.684133, lng: 17.376808 }, // Štadión FK Senica
  { lat: 48.166111, lng: 17.141111 }, // Estadi Pasienky
  { lat: 48.731947, lng: 19.131503 }, // Estadi Národný Atletický
  { lat: 49.006667, lng: 21.234444 }, // Estadi Tatran
  { lat: 48.399167, lng: 18.403889 }, // Štadión FC ViOn
  { lat: 48.89861111, lng: 18.04472222 }, // Štadión na Sihoti
  { lat: 48.321857, lng: 18.087506 }, // Štadión pod Zoborom
  { lat: 49.229167, lng: 18.744722 }, // Štadión MŠK Žilina
  { lat: 49.984167, lng: 8.224167 }, // Opel Arena
  { lat: 46.0906, lng: 19.6495 }, // Stadium near the Sombor Gate
  { lat: 46.069658, lng: 14.499624 }, // ŽAK Stadium
  { lat: 51.883184, lng: 4.472526 }, // Kromme Zandweg
  { lat: 3.8855, lng: 11.540528 }, // Estadi Ahmadou Ahidjo
  { lat: 42.219722, lng: 14.382222 }, // Stadio Guido Biondi
  { lat: 49.1349, lng: 9.20343 }, // Frankenstadion Heilbronn
  { lat: 59.746949, lng: 10.014616 }, // Mjøndalen Stadion
  { lat: 51.2638, lng: 6.72941 }, // AirBerlin World
  { lat: 62.73341, lng: 7.14813 }, // Aker Stadion
  { lat: 38.916575, lng: 27.83811667 }, // Akhisar Şehir Stadium
  { lat: 38.916575, lng: 27.83811667 }, // Akhisar Şehir Stadium
  { lat: 7.258611, lng: 5.189722 }, // Akure Township Stadium
  { lat: 45.91722, lng: 6.11972 }, // Parc des Sports
  { lat: 45.91722, lng: 6.11972 }, // Parc des Sports
  { lat: 25.34474, lng: 51.440562 }, // Estadi Thani bin Jassim
  { lat: 18.970556, lng: -99.246667 }, // Centenario Stadium
  { lat: 30.1745, lng: 31.435 }, // Estadi El-Zamalek
  { lat: -25.3154361, lng: -57.6121987 }, // Estadio Emiliano Ghezzi
  { lat: 10.1389, lng: -85.4547 }, // Q431546
  { lat: 50.789722222, lng: 6.093888888 }, // Old Tivoli
  { lat: 15.41194444, lng: 44.20144722 }, // Estadi Ali Mohsen Al-Muraisi
  { lat: 53.5876645, lng: 9.8991535 }, // Altonaer Stadion (Hamburg)
  { lat: 13.46861111, lng: -16.6775 }, // Independence Stadium
  { lat: 47.8133, lng: 13.0275 }, // Lehener Stadion
  { lat: 51.929722, lng: 7.624583 }, // Preußenstadion
  { lat: 52.399083, lng: 13.094806 }, // Karl-Liebknecht-Stadion
  { lat: 52.533889, lng: 13.376667 }, // Stadion der Weltjugend
  { lat: 52.533889, lng: 13.376667 }, // Stadion der Weltjugend
  { lat: 50.626389, lng: 6.045833 }, // Kehrweg Stadion
  { lat: 49.2783, lng: 8.84212 }, // Dietmar-Hopp-Stadion
  { lat: 40.625497222, lng: 22.967002777 }, // Estadi Kaftanzoglio
  { lat: 52.125556, lng: 11.670833 }, // Avnet Arena
  { lat: 43.67833333, lng: 7.19777778 }, // estadi Charles Ehrmann
  { lat: 41.032777777, lng: 28.972222222 }, // Recep Tayyip Erdoğan Stadium
  { lat: 49.7711, lng: 6.62667 }, // Waldstadion Trier
  { lat: 47.1298, lng: 15.3385 }, // Sportstadion Gratkorn
  { lat: 50.111389, lng: 14.3875 }, // Estadi Juliska
  { lat: 45.246667, lng: 19.842222 }, // Estadi Karađorđe
  { lat: 41.31898056, lng: 19.81138333 }, // Estadi Selman Stërmasi
  { lat: 33.582867, lng: -7.646817 }, // Estadi Mohammed V
  { lat: 58.194583333, lng: 15.995833333 }, // Kopparvallen
  { lat: 51.877014, lng: 0.883425 }, // Layer Road
  { lat: 47.24301111, lng: 39.76105278 }, // Olimp-2
  { lat: 57.5959, lng: -4.41891 }, // Victoria Park
  { lat: 50.698188129, lng: 12.483179452 }, // Westsachsenstadion
  { lat: 50.697222, lng: 12.485556 }, // Westsachsenstadion
  { lat: 47.562305555, lng: 7.602636111 }, // Landhof
  { lat: 10.616532, lng: -61.282511 }, // Larry Gomes Stadium
  { lat: 42.5125, lng: 27.470278 }, // Lazur Stadium
  { lat: 41.93157, lng: 8.77887 }, // Stade François-Coty
  { lat: 58.366536, lng: 26.713728 }, // Tamme Stadium
  { lat: 16.762783, lng: -93.096369 }, // Estadio Víctor Manuel Reyna
  { lat: -37.824722, lng: 144.981111 }, // Olympic Park Stadium
  { lat: 56.409686, lng: -3.476928 }, // McDiarmid Park
  { lat: 33.426388888, lng: -111.9325 }, // Mountain America Stadium
  { lat: 50.883056, lng: 3.428889 }, // Regenboogstadion
  { lat: 55.397771, lng: 10.350055 }, // Estadi Odense
  { lat: 30.1111, lng: 31.3676 }, // Estadi de l'Acadèmia Militar del Caire
  { lat: 45.582778, lng: 9.308056 }, // Stadio Brianteo
  { lat: 52.455, lng: 4.635 }, // BUKO Stadion
  { lat: 51.701667, lng: 5.329722 }, // De Vliert
  { lat: 54.367942, lng: 18.621053 }, // MOSiR Stadium
  { lat: 50.730713888, lng: -3.52115 }, // St James Park
  { lat: 40.447527, lng: -3.716147 }, // Stadium Metropolitano
  { lat: 33.959861, lng: -6.889111 }, // Estadi Princep Moulay Abdellah
  { lat: 51.474722222, lng: -3.2 }, // Ninian Park
  { lat: 42.675361, lng: 23.272028 }, // Estadi Aleksandar Shalamanov
  { lat: 53.340922, lng: -6.316619 }, // Richmond Park
  { lat: 60.772778, lng: 26.790278 }, // Saviniemi
  { lat: 42.070031, lng: 19.506558 }, // Estadi Loro Boriçi
  { lat: 48.8925, lng: 9.21139 }, // Ludwig-Jahn-Stadion
  { lat: 50.670833, lng: 5.5525 }, // Stade Vélodrome de Rocourt
  { lat: 38.352178, lng: 38.330494 }, // Malatya İnönü Stadium
  { lat: 49.264, lng: 11.298 }, // M.A.R. Arena
  { lat: 17.504444444, lng: -88.189166666 }, // MCC Grounds
  { lat: 44.714722, lng: 10.649722 }, // Mapei Stadium - Città del Tricolore
  { lat: 44.448194, lng: 26.052872 }, // Estadi Regie
  { lat: 49.845111, lng: 18.299392 }, // Estadi Bazaly
  { lat: 17.513744444, lng: -88.195011111 }, // Marion Jones Sports Complex
  { lat: 53.129167, lng: 8.206389 }, // Marschweg-Stadion
  { lat: 47.9794, lng: 10.1661 }, // Fußballarena Memmingen
  { lat: 47.99888889, lng: 17.61833333 }, // DAC Aréna
  { lat: 35.336666666, lng: 25.106111111 }, // Estadi Pankritio
  { lat: 35.002944, lng: 134.134218 }, // Okayama Prefecture Mimasaka Rugby Soccer Field
  { lat: 51.5047, lng: 7.62778 }, // Montanhydraulik Stadium
  { lat: 54.453889, lng: -6.336389 }, // Mourneview Park
  { lat: 29.9625, lng: 32.56833333 }, // Mubarak International Stadium
  { lat: 47.983942, lng: 7.881192 }, // Möslestadion
  { lat: 56.131944, lng: 10.196389 }, // Estadi d'Aarhus
  { lat: 56.47416667, lng: 84.95666667 }, // Trud Stadium
  { lat: -1.638611, lng: 13.574444 }, // Stade de Franceville
  { lat: 49.594833, lng: 34.549444 }, // Oleksiy Butovskyi Vorskla Stadium
  { lat: 43.252572222, lng: -79.830247222 }, // Ivor Wynne Stadium
  { lat: 55.7822, lng: -4.0585 }, // New Douglas Park
  { lat: 54.535925, lng: -6.003733 }, // New Grosvenor Stadium
  { lat: 53.4279, lng: -1.362 }, // New York Stadium
  { lat: 48.2209, lng: 15.6531 }, // NV Arena
  { lat: 48.30616, lng: 4.0982 }, // Stade de l'Aube
  { lat: 46.293333333, lng: 16.344166666 }, // Estadi Varteks
  { lat: 50.861389, lng: 20.624722 }, // Kielce City Stadium
  { lat: 25.629145, lng: -103.379417 }, // Corona Stadium
  { lat: 37.775416666, lng: -3.7675 }, // Nuevo Estadio de la Victoria
  { lat: 60.442778, lng: 22.291667 }, // Veritas Stadion
  { lat: 50.306583, lng: 18.695866 }, // Stadion Piast
  { lat: 52.562004, lng: 19.684067 }, // Kazimierz Górski Stadium
  { lat: 52.344753, lng: 6.686058 }, // Q2019176
  { lat: 63.44472222, lng: 18.10638889 }, // Olympia
  { lat: 36.801055, lng: 3.048111 }, // Omar Hamadi Stadium
  { lat: 34.700914, lng: 33.022975 }, // Estadi Tsirio
  { lat: 50.736248, lng: 3.587192 }, // Q2031487
  { lat: 52.4192, lng: 9.79369 }, // Oststadtstadion
  { lat: 50.429028, lng: 30.525278 }, // Bannikov Stadium
  { lat: 55.5375, lng: 28.648611111 }, // Atlant Stadium
  { lat: 51.5825, lng: 4.767222 }, // NAC Stadion
  { lat: 50.527055555, lng: 30.5075 }, // Obolon Arena
  { lat: 47.6005, lng: 13.7808 }, // Ausseerland-Arena
  { lat: 46.625, lng: 5.21638889 }, // Stade du Bram
  { lat: 43.92823, lng: 4.84507 }, // Avignon Sports Ground
  { lat: 32.6647, lng: -115.4573 }, // Parque Necaxa
  { lat: 54.589099, lng: -5.962551 }, // Celtic Park
  { lat: 47.4339, lng: 9.40576 }, // Paul-Grüninger-Stadion
  { lat: 55.198472222, lng: 30.229305555 }, // Vitebsky Central Sport Complex
  { lat: 43.55083333, lng: 6.96555556 }, // Stade Pierre de Coubertin
  { lat: 50.7244, lng: 1.61907 }, // Stade de la Libération
  { lat: 48.908056, lng: 24.69625 }, // MCS Rukh
  { lat: 40.736, lng: 31.6069 }, // Bolu Atatürk Stadium
  { lat: 34.874722, lng: 32.381111 }, // Peyia Municipal Stadium
  { lat: 47.205833333, lng: 9.537777777 }, // Sportpark Eschen-Mauren
  { lat: 52.774722, lng: 6.945556 }, // De Oude Meerdijk
  { lat: 59.211111, lng: 9.589722 }, // Skagerak Arena
  { lat: 45.029722, lng: 9.689722 }, // Stadio Leonardo Garilli
  { lat: 44.943611, lng: 34.089722 }, // Lokomotiv Republican Sports Complex
  { lat: 53.881111, lng: 10.668889 }, // Stadion an der Lohmühle
  { lat: 53.881111, lng: 10.668889 }, // Stadion an der Lohmühle
  { lat: 58.859444, lng: 5.725833 }, // Sandnes Idrettspark
  { lat: 52.4326, lng: 13.3548 }, // Preussen-Stadion an der Malteserstraße
  { lat: -45.869167, lng: 170.524444 }, // Forsyth Barr Stadium
  { lat: 51.994167, lng: 5.931111 }, // Monnikenhuize
  { lat: 49.75, lng: 13.385556 }, // Doosan Arena
  { lat: 14.746694, lng: -17.452014 }, // Estadi Léopold Sédar Senghor
  { lat: -43.491389, lng: 172.705278 }, // Queen Elizabeth II Park
  { lat: 51.595556, lng: 4.750278 }, // Rat-Verlegh-Stadion
  { lat: 51.5956, lng: 4.75028 }, // Rat-Verlegh-Stadion
  { lat: 51.214139, lng: 4.243931 }, // Freethiel Stadion
  { lat: 55.850556, lng: -4.443889 }, // St. Mirren Park
  { lat: 49.4792, lng: 8.49944 }, // Rhein-Neckar-Stadion
  { lat: 51.463, lng: 6.64734 }, // Q2147912
  { lat: 48.563, lng: 7.81162 }, // Q2147955
  { lat: 48.79047, lng: 9.23385 }, // Robert-Schlienz-Stadion
  { lat: -4.330417, lng: 15.31 }, // Estadi dels Màrtirs
  { lat: 52.362222, lng: 9.780556 }, // Rudolf-Kalweit-Stadion
  { lat: 52.410278, lng: 4.648889 }, // Haarlem Stadion
  { lat: 51.1896, lng: 7.2635 }, // Röntgen stadium
  { lat: 51.905, lng: 10.4451 }, // S-Arena
  { lat: 47.7947, lng: 13.0542 }, // SAK sports facility Nonntal
  { lat: 16.587361, lng: 104.765472 }, // Savannakhet Stadium
  { lat: 51.5028, lng: 6.74417 }, // Schwelgernstadion
  { lat: 49.142222, lng: 10.081111 }, // Schönebürgstadion
  { lat: 51.351944, lng: 6.179722 }, // De Koel
  { lat: 45.433876, lng: 11.899481 }, // Stadio Plebiscito
  { lat: 40.7181, lng: 8.57972 }, // Stadio Vanni Sanna
  { lat: 51.167639, lng: 4.121667 }, // Puyenbekestadion
  { lat: 50.97, lng: 12.4356 }, // Q2291675
  { lat: 50.282203, lng: 18.944178 }, // Stadion Ruchu
  { lat: 49.819234, lng: 24.048193 }, // Ukraina Stadium
  { lat: 40.926944, lng: 14.7925 }, // Stadio Partenio-Adriano Lombardi
  { lat: 51.916944, lng: 4.520556 }, // Stadion Woudestein
  { lat: 4.929028, lng: 114.945444 }, // Hassanal Bolkiah National Stadium
  { lat: 45.187474, lng: 5.740194 }, // Stade des Alpes
  { lat: 50.34851, lng: 3.53178 }, // Stade du Hainaut
  { lat: 40.645, lng: 14.823889 }, // Stadio Arechi
  { lat: 36.502778, lng: -6.273056 }, // Estadio Nuevo Mirandilla
  { lat: 47.4104, lng: 9.2543 }, // Q2312361
  { lat: 49.5557, lng: 10.9947 }, // Sportanlage Langenau
  { lat: 51.4753, lng: 7.04722 }, // Sportpark am Hallo
  { lat: 50.9452, lng: 7.03039 }, // Sportpark Höhenberg
  { lat: 50.5405, lng: 9.66582 }, // Q2312741
  { lat: 49.2169, lng: 7.59587 }, // Sportpark Husterhöhe
  { lat: 50.7481, lng: 7.0845 }, // Sportpark Nord
  { lat: 53.0799, lng: 8.93039 }, // Q2312754
  { lat: 52.6163, lng: 8.48314 }, // Q2312784
  { lat: 51.782778, lng: 5.948889 }, // Q2323717
  { lat: 49.575353, lng: 6.158297 }, // Estadi Alphonse Theis
  { lat: 34.03307, lng: -6.797184 }, // Stade Boubker Ammar
  { lat: 45.641894, lng: 0.176128 }, // Stade Lebon
  { lat: 48.856, lng: 2.41294 }, // Stade Déjerine
  { lat: 43.66944444, lng: 4.63194444 }, // Q2325847
  { lat: 43.688934, lng: 4.63065 }, // Q2325847
  { lat: 43.43621, lng: 6.74013 }, // Q2325851
  { lat: 43.41251, lng: 3.67057 }, // Estadi Louis Michel
  { lat: 49.64319, lng: -1.63811 }, // Q2325877
  { lat: 51.03555556, lng: 2.39027778 }, // Stade Marcel Tribut
  { lat: 43.12024, lng: 6.14186 }, // Stade Perruc
  { lat: 49.4316, lng: 2.11382 }, // Stade Pierre Brisson
  { lat: 46.31709, lng: -0.48959 }, // Stade René Gaillard
  { lat: 48.49691, lng: -4.43877 }, // Q2325943
  { lat: 50.95697, lng: 1.90184 }, // Stade de l'Épopée
  { lat: 41.3125, lng: 16.28388889 }, // Cosimo Puttilli Stadium
  { lat: 45.13130153, lng: 8.4451282 }, // Stadio Natale Palli
  { lat: 43.35, lng: 12.566667 }, // Stadio Pietro Barbetti
  { lat: 41.7795, lng: 14.1027 }, // Stadio Teofilo Patini
  { lat: 51.6797, lng: 8.32556 }, // Q2326041
  { lat: 50.097029, lng: 14.422554 }, // Belvedere Stadium
  { lat: 50.7859, lng: 7.86242 }, // Q2326049
  { lat: 47.4164, lng: 9.72417 }, // Stadion Birkenwiese
  { lat: 47.3768, lng: 15.0788 }, // Donawitz Stadium
  { lat: 47.185409, lng: 7.404031 }, // Stadion Brühl
  { lat: 50.3148, lng: 11.9313 }, // Stadion Grüne Au
  { lat: 51.5956, lng: 7.1953 }, // Q2326073
  { lat: 50.138336, lng: 14.090143 }, // Stadion Františka Kloze
  { lat: 49.2342, lng: 7.02444 }, // Stadion Kieselhumes
  { lat: 49.234299642, lng: 7.024495186 }, // Stadion Kieselhumes
  { lat: 52.4393, lng: 13.324 }, // Stadion Lichterfelde
  { lat: 51.5236, lng: 7.00889 }, // Mathias-Stinnes-Stadion
  { lat: 49.676944, lng: 13.976389 }, // Estadi Na Litavce
  { lat: 52.0207, lng: 8.56273 }, // Q2326097
  { lat: 45.77120129, lng: 15.97159445 }, // Stadion NŠC Stjepan Spajić
  { lat: 51.1601, lng: 6.98789 }, // Stadion am Hermann-Löns-Weg
  { lat: 51.855, lng: 6.60944 }, // Q2326114
  { lat: 50.1599, lng: 8.18385 }, // Stadion am Halberg
  { lat: 52.4132, lng: 12.5009 }, // Stadion am Quenz
  { lat: 49.9703, lng: 9.12991 }, // Stadion am Schönbusch
  { lat: 49.6843, lng: 12.1695 }, // Q2326124
  { lat: 54.1897, lng: 9.08722 }, // Q2326132
  { lat: 48.478611, lng: 9.19 }, // Stadion an der Kreuzeiche
  { lat: 51.4829, lng: 11.9131 }, // Q2326136
  { lat: 51.3289, lng: 7.01857 }, // Stadion Sonnenblume
  { lat: 43.315528, lng: 21.908533 }, // Estadi Čair
  { lat: 54.496307, lng: -6.714135 }, // Stangmore Park
  { lat: 51.6839, lng: -4.1476 }, // Stebonheath Park
  { lat: 51.006389, lng: 5.876944 }, // De Baandert
  { lat: 51.006389, lng: 5.876944 }, // De Baandert
  { lat: 46.261361, lng: 20.118139 }, // Szent Gellért Fórum
  { lat: 9.958055555, lng: -85.119444444 }, // Estadio Asociación Cívica Jicaraleña
  { lat: 48.110555555, lng: -123.420277777 }, // Civic Field
  { lat: 54.74944, lng: 20.48528 }, // Yantarny Sports Palace
  { lat: 46.692344444, lng: 19.217322222 }, // Stadler Stadion
  { lat: 24.8031056, lng: 46.6287872 }, // Al Shabab Stadium
  { lat: 48.7555, lng: 19.5174 }, // Osrblie Biathlon Centre
  { lat: 48.755751, lng: 19.518128 }, // Osrblie Biathlon Centre
  { lat: 38.5903, lng: -121.4909 }, // Railyards Stadium
  { lat: 30.903333333, lng: 46.4525 }, // Souk Al Shoyukh Stadium
  { lat: 34.62356, lng: 43.626175 }, // Salah Al Din Stadium
  { lat: 31.9152762, lng: 34.8126677 }, // Rehovot Stadium
  { lat: 31.080066359, lng: 35.029440236 }, // Q86007884
  { lat: 51.407071, lng: -0.42002 }, // Hazelwood
  { lat: 53.472777777, lng: 18.761111111 }, // Grudziadz Speedway Stadium
  { lat: 51.643056, lng: 17.821389 }, // Ostrów Wielkopolski Municipal Stadium
  { lat: -27.34169, lng: -55.845643 }, // Q87384474
  { lat: 46.549194444, lng: 15.650166666 }, // Q88685420
  { lat: 43.123888888, lng: 25.68 }, // Q93450528
  { lat: 54.8568, lng: 23.9512 }, // Kaunas War School Stadium
  { lat: 49.02473, lng: 2.34249 }, // Stade Omnisports des Fauvettes
  { lat: 48.83665, lng: 2.22496 }, // Alphonse-Le-Gallo Stadium
  { lat: 45.566388888, lng: 18.6575 }, // Opus Arena
  { lat: 36.480277777, lng: 2.812777777 }, // Zoubir Zouraghi Stadium
  { lat: 44.943556, lng: -93.191631 }, // O'Shaughnessy Stadium
  { lat: 44.943812, lng: -93.191563 }, // O'Shaughnessy Stadium
  { lat: 50.0676, lng: 72.9777 }, // Metallurg stadium (Temirtau)
  { lat: 32.64564, lng: -8.427183 }, // Municipal Stadium (Sidi Bennour)
  { lat: 52.431944, lng: 30.973194 }, // Łakamatyu Stadium
  { lat: -42.7470027, lng: -65.0428585 }, // Q97039805
  { lat: 31.734222222, lng: 34.73825 }, // Kiryat Malakhi Municipal Stadium
  { lat: 37.56809, lng: 22.80497 }, // Nafplio Municipal Stadium
  { lat: 47.87516, lng: -3.57149 }, // Q97464643
  { lat: 0.1986, lng: 32.5318 }, // St. Mary's Stadium-Kitende
  { lat: 43.883361111, lng: 10.7625 }, // stadio comunale Daniele Mariotti
  { lat: 20.0809491, lng: 41.5243977 }, // King Saud Sport City
  { lat: 50.561388888, lng: 22.052777777 }, // Stadion MOSiR (Stalowa Wola)
  { lat: 1.594472222, lng: 103.730944444 }, // Mount Austin Stadium
  { lat: 51.296, lng: 6.84 }, // Ratingen Stadium
  { lat: 50.433391, lng: 11.147396 }, // Q100137733
  { lat: 30.4425, lng: 47.77972222 }, // Al Fayhaa Stadium
  { lat: 59.869194444, lng: 30.341888888 }, // SKA Arena
  { lat: 37.7945, lng: -122.2587 }, // Laney College Football Stadium
  { lat: 43.86348, lng: 10.81519 }, // Stadio Roberto Strulli
  { lat: 35.195, lng: -97.441944444 }, // OU Softball Complex
  { lat: 45.783055555, lng: 24.143611111 }, // Estadi Municipal de Sibiu
  { lat: 44.455080555, lng: 26.102438888 }, // Stadionul Dinamo
  { lat: 51.401474983, lng: 7.762219137 }, // Q105091007
  { lat: 31.415555555, lng: 46.175 }, // Al Shatrah Stadium
  { lat: 35.203611111, lng: 45.961388888 }, // Halabja Stadium
  { lat: 34.070317852, lng: -118.448706102 }, // UCLA Straus Stadium
  { lat: 37.1684, lng: 42.69179 }, // Delal Stadium
  { lat: 48.4078, lng: -4.46953 }, // Q106833309
  { lat: 42.636655044, lng: 23.315992777 }, // Arena Tsarsko Selo
  { lat: -8.652639586, lng: 115.194441606 }, // Kompyang Sujana Stadium
  { lat: 42.679444444, lng: 26.336388888 }, // Q107722838
  { lat: 56.824532, lng: 60.609168 }, // UMMC Arena
  { lat: 51.303075451, lng: 12.21263471 }, // Stadion am Bad in Markranstädt
  { lat: 51.650943598, lng: 17.808469792 }, // Arena Ostrów
  { lat: 35.5276053, lng: -0.2093114 }, // Abdelkrim Kerroum Stadium
  { lat: 35.527861555, lng: -0.209032931 }, // Abdelkrim Kerroum Stadium
  { lat: 51.84616, lng: 6.63423 }, // Sportplatz In der Hardt
  { lat: 33.811413, lng: 132.748388 }, // Madonna Stadium
  { lat: 45.436101594, lng: 10.961800653 }, // Sinergy Stadium
  { lat: 44.4681, lng: -73.1944 }, // Virtue Field
  { lat: 48.9373, lng: 2.38238 }, // Parc des sports de Marville
  { lat: 26.4200235, lng: 44.0968817 }, // Al Taawon Club Stadium
  { lat: 24.59, lng: 46.528 }, // Prince Mohammed bin Salman Stadium
  { lat: -12.79061, lng: 45.1352 }, // Combani stadium
  { lat: -17.57947, lng: -149.8057 }, // Maatea Stadium
  { lat: -22.298768, lng: 166.442727 }, // Édouard-Pentecost stadium
  { lat: 14.618333333, lng: -60.906666666 }, // Pierre de Lucy stadium in Fossarieu
  { lat: 45.930555555, lng: 13.605833333 }, // Gorizia football stadium
  { lat: 45.958333333, lng: 12.516666666 }, // Q109352457
  { lat: 45.6325, lng: 13.784166666 }, // Q109352467
  { lat: 26.8112, lng: 81.0168 }, // Ekana Cricket Stadium
  { lat: 44.683814809, lng: 10.645488981 }, // Q109378145
  { lat: -34.8777303, lng: -56.1304717 }, // Q109424574
  { lat: 53.116580284, lng: 18.015244288 }, // TKKF Bydgoszcz Stadium
  { lat: 33.359444444, lng: 44.380277777 }, // Q109652296
  { lat: 43.658620968, lng: 17.949822885 }, // City Stadium Konjic
  { lat: 36.78626, lng: 34.617555 }, // Tevfik Sırrı Gür Stadium
  { lat: 22.559479, lng: 88.343854 }, // East Bengal Ground
  { lat: 54.151667, lng: -4.501667 }, // The Bowl
  { lat: 13.698261111, lng: -89.215433333 }, // Estadio Jorge 'El Mágico' González
  { lat: 60.102222, lng: 19.935278 }, // Wiklof Holding Arena
  { lat: 39.030519, lng: 117.719 }, // TEDA Football Stadium
  { lat: 0.335, lng: 6.7375 }, // Estádio Nacional 12 de Julho
  { lat: 51.885528, lng: -8.46775 }, // Turners Cross
  { lat: 52.8525, lng: 8.03874 }, // Q2434521
  { lat: 47.2586, lng: 11.4055 }, // Tivoli
  { lat: 48.2353, lng: 14.2536 }, // Trauner Stadion
  { lat: 51.8611, lng: 8.32194 }, // Tönnies-Arena
  { lat: 51.070565, lng: 3.10768247 }, // Q2464239
  { lat: 53.881388888, lng: 27.6175 }, // Estadi Traktar
  { lat: 53.105556, lng: 23.148889 }, // Białystok City Stadium
  { lat: 44.9203, lng: 8.616580555 }, // Stadio Giuseppe Moccagatta
  { lat: 47.7434, lng: 13.0477 }, // Untersberg-Arena
  { lat: 56.309435, lng: 43.930403 }, // Lokomotiv Stadium
  { lat: 53.83658333, lng: -2.22908333 }, // Victoria Park
  { lat: 59.506592, lng: 24.82805 }, // Viimsi Stadium
  { lat: 10.96139, lng: 106.8625 }, // Biên Hòa Stadium
  { lat: 10.9619, lng: 106.863 }, // Biên Hòa Stadium
  { lat: 52.4462, lng: 13.3937 }, // Viktoria field (Berlin)
  { lat: 50.5235, lng: 12.1259 }, // Vogtlandstadion
  { lat: 54.090666666, lng: 13.414777777 }, // Q2532191
  { lat: 54.0839, lng: 12.0885 }, // Q2532193
  { lat: 48.0033, lng: 13.6469 }, // Voralpenstadion, Vöcklabruck
  { lat: 48.702031, lng: 21.243342 }, // Všešportový areál
  { lat: 50.206111, lng: 15.845278 }, // Všesportovní stadion
  { lat: 40.452778, lng: 17.27 }, // Stadio Erasmo Iacovone
  { lat: 50.0893, lng: 11.2487 }, // Waldstadion Weismain
  { lat: 49.3161, lng: 7.355 }, // Waldstadion Homburg
  { lat: 50.9847, lng: 10.3089 }, // Wartburgstadion Eisenach
  { lat: 52.34989011, lng: 4.93956811 }, // Het Houten Stadion
  { lat: -30.061667, lng: -51.227222 }, // Estadi Ildo Meneghetti
  { lat: 51.525808, lng: 7.487376 }, // Weisse Wiese
  { lat: 52.0935, lng: 9.37835 }, // Weserberglandstadion
  { lat: 52.2833, lng: 8.91833 }, // Q2563900
  { lat: 48.0069, lng: 7.82611 }, // Q2565648
  { lat: 48.226, lng: 16.3109 }, // Sportklub Stadium
  { lat: 44.427666, lng: 26.074956 }, // Estadi Cotroceni
  { lat: 32.0453, lng: 34.815478 }, // Winter Stadium
  { lat: 53.904439, lng: 27.416553 }, // Dinamo-Yuni Stadium
  { lat: 44.462778, lng: 25.975278 }, // Stadionul Concordia
  { lat: 55.791389, lng: 37.516111 }, // VEB Arena
  { lat: 62.244722, lng: 25.740833 }, // Harju Stadium
  { lat: 57.3873, lng: 21.5704 }, // Estadi Olímpic de Ventspils
  { lat: 48.2231, lng: 9.02667 }, // Q2640149
  { lat: 38.75193, lng: -9.161882 }, // Estádio Universitário de Lisboa
  { lat: 51.196744, lng: 3.202133 }, // Klokke Stadion
  { lat: 50.983844444, lng: 3.520402777 }, // Burgemeester Van de Wielestadion
  { lat: 52.436527777, lng: 31.012361111 }, // Estadi Central
  { lat: 53.688888888, lng: 23.820833333 }, // Estadi Neman
  { lat: -22.909722, lng: -47.043611 }, // Estádio Brinco de Ouro
  { lat: 47.1655, lng: 9.4926 }, // Sportanlage Rheinwiese
  { lat: 47.1655, lng: 9.4926 }, // Sportanlage Rheinwiese
  { lat: 32.870888888, lng: -79.919766666 }, // MUSC Health Stadium
  { lat: 39.574082, lng: 2.677482 }, // Estadi Balear
  { lat: 22.766778, lng: -102.549278 }, // Estadio Olímpico Carlos Vega Villalba
  { lat: 25.2189, lng: 55.317147222 }, // Za'abeel Stadium
  { lat: 32.506067, lng: -116.993092 }, // Caliente Stadium
  { lat: 35.033889, lng: 33.765 }, // Dasaki Stadium
  { lat: 4.843056, lng: 31.615833 }, // Estadi de Juba
  { lat: -4.27352778, lng: 15.24841667 }, // Stade Alphonse Massemba-Débat
  { lat: 50.883889, lng: 4.070833 }, // Florent Beeckmanstadion
  { lat: 6.25701667, lng: -10.70206667 }, // Samuel Kanyon Doe Sports Complex
  { lat: 44.815456, lng: 20.494047 }, // Omladinski stadion
  { lat: 39.932023, lng: 32.872146 }, // Cebeci İnönü Stadium
  { lat: 34.925556, lng: 33.599722 }, // Estadi GSZ
  { lat: 51.216667, lng: 2.886389 }, // Albertpark
  { lat: 51.21691667, lng: 2.88654444 }, // Albertpark
  { lat: 4.074891, lng: -76.20158 }, // Estadio Doce de Octubre
  { lat: 15.72527778, lng: -88.59444444 }, // Estadio Roy Fearon
  { lat: -33.318144, lng: -62.036085 }, // Ceferino López stadium
  { lat: 53.516863888, lng: -1.1047 }, // Belle Vue
  { lat: 32.783111111, lng: 34.965166666 }, // Estadi Sammy Ofer
  { lat: 32.333939, lng: 34.862197 }, // estadi Sar-Tov
  { lat: 35.030833, lng: 33.987222 }, // Tasos Markou Stadium
  { lat: -33.006667, lng: 27.905278 }, // Buffalo City Stadium
  { lat: 47.07388, lng: 9.495554 }, // Sportplatz Rheinau
  { lat: 44.78444167, lng: 20.43288611 }, // Careva Ćuprija Stadium
  { lat: 44.78972222, lng: 20.4275 }, // Careva Ćuprija Stadium
  { lat: 60.4425, lng: 22.260833 }, // estadi Paavo Nurmi
  { lat: 56.502952, lng: 20.995424 }, // Estadi Daugava
  { lat: -20.321267, lng: 57.52965 }, // Stade George V
  { lat: 36.186944, lng: 5.393056 }, // Stade 8 Mai 1945
  { lat: 9.54586111, lng: -13.67291667 }, // Estadi 28 de Setembre de 1958
  { lat: -23.997222, lng: -46.271111 }, // Estádio Municipal Antônio Fernandes
  { lat: 41.347861, lng: 2.075667 }, // RCDE Stadium
  { lat: 48.178889, lng: 12.836389 }, // Wacker-Arena
  { lat: 53.379167, lng: 7.203333 }, // Ostfriesland-Stadion
  { lat: 49.3186, lng: 7.12167 }, // Waldstadion an der Kaiserlinde
  { lat: 51.549, lng: 0.701556 }, // Roots Hall
  { lat: 50.856944444, lng: 6.005833333 }, // Parkstad Limburg Stadion
  { lat: 44.783333333, lng: 20.464722222 }, // Rajko Mitić Stadium
  { lat: 50.3308, lng: 18.8967 }, // Q478488
  { lat: 51.53, lng: 7.079444 }, // Glückauf-Kampfbahn
  { lat: 48.745555555, lng: 11.485 }, // Audi-Sportpark
  { lat: 35.903142, lng: 139.717492 }, // Estadi de Saitama
  { lat: 33.246212, lng: 126.509361 }, // Estadi de la Copa del Món de Jeju
  { lat: 36.365229, lng: 127.325056 }, // Estadi de la Copa del Món de Daejeon
  { lat: 35.535277777, lng: 129.259444444 }, // Estadi de la Copa del Món d'Ulsan
  { lat: 35.997745, lng: 129.384412 }, // Pohang Steel Yard
  { lat: 47.4211, lng: 9.65278 }, // Reichshofstadion
  { lat: 37.466131, lng: 126.643035 }, // Incheon Football Stadium
  { lat: 53.547778, lng: -2.653889 }, // DW Stadium
  { lat: 38.72305556, lng: 35.49666667 }, // Kayseri Atatürk Stadium
  { lat: 35.133727, lng: 126.874914 }, // Estadi de la Copa del Món de Gwangju
  { lat: 35.991744, lng: 140.640525 }, // Estadi de Kashima
  { lat: 38.335391666, lng: 140.950419444 }, // Estadi de Miyagi
  { lat: 47.501389, lng: 8.716389 }, // Stadion Schützenwiese
  { lat: -34.894444, lng: -56.152778 }, // Estadio Centenario
  { lat: -34.63565, lng: -58.36465 }, // Estadi Alberto J. Armando
  { lat: 52.988333333, lng: -2.175555555 }, // Britannia Stadium
  { lat: 51.4417, lng: 5.4674 }, // Philips Stadion
  { lat: -32.920278, lng: -68.839444 }, // Estadio Feliciano Gambarte
  { lat: 55.85305556, lng: -4.42861111 }, // Love Street
  { lat: 51.4862, lng: -2.58313 }, // Memorial Stadium
  { lat: 50.348925, lng: 3.526847 }, // Stade Nungesser
  { lat: 51.339167, lng: 6.603611 }, // Grotenburg-Stadion
  { lat: 49.533056, lng: 8.485278 }, // Stadion am Alsenweg
  { lat: 50.813611, lng: 5.165278 }, // Stayen
  { lat: 5.837389, lng: -55.160806 }, // André Kamperveen Stadium
  { lat: 47.574892, lng: 19.08465 }, // Estadi Ferenc Szusza
  { lat: 47.695769, lng: 17.663827 }, // ETO Park
  { lat: 50.553611, lng: 8.494722 }, // Q523450
  { lat: 51.0375, lng: 4.471667 }, // Oscar Vankesbeeck Stadion
  { lat: 49.24716, lng: 4.02478 }, // Stade Auguste Delaune
  { lat: -34.717667, lng: -58.383806 }, // Estadi Ciudad de Lanús – Néstor Díaz Pérez
  { lat: 54.689139, lng: -1.212722 }, // Victoria Park
  { lat: 51.906158, lng: -2.060211 }, // Whaddon Road
  { lat: 46.081111, lng: 14.521389 }, // Estadi Stožice
  { lat: 49.227162, lng: 16.586276 }, // Městský fotbalový stadion Srbská
  { lat: 62.884444, lng: 27.670833 }, // Kuopio Football Stadium
  { lat: 41.2325, lng: 16.309167 }, // Stadio Degli Ulivi
  { lat: 10.674114, lng: -71.645011 }, // Estadi José Encarnación Romero
  { lat: 50.960278, lng: 11.037222 }, // Steigerwaldstadion
  { lat: 50.915833, lng: 11.582778 }, // Ernst-Abbe-Sportfeld
  { lat: 51.753333, lng: 7.905 }, // Wersestadion
  { lat: 48.073611, lng: 11.615556 }, // Generali Sportpark
  { lat: 48.6685, lng: 10.1393 }, // Voith-Arena
  { lat: 41.362756, lng: -8.740186 }, // Estádio dos Arcos
  { lat: 39.940094, lng: 32.845681 }, // Estadi Ankara 19 Mayis
  { lat: 30.9994, lng: 29.7293 }, // Estadi Borg El Arab
  { lat: 35.868071, lng: 127.06448 }, // Estadi de la Copa del Món de Jeonju
  { lat: 50.90583333, lng: -1.39111111 }, // St Mary's Stadium
  { lat: 51.731389, lng: 8.710833 }, // Home Deluxe Arena
  { lat: 36.878367, lng: 30.707892 }, // Antalya Atatürk Stadium
  { lat: 51.485833, lng: 6.977778 }, // Georg-Melches-Stadion
  { lat: 50.133056, lng: 8.730278 }, // Riederwaldstadion
  { lat: 37.152967, lng: -3.595736 }, // Estadi Nuevo Los Cármenes
  { lat: 17.12235556, lng: -61.83903056 }, // Antigua Recreation Ground
  { lat: -34.854922, lng: -56.225689 }, // Belvedere Stadium
  { lat: 47.475278, lng: 19.096111 }, // Estadi Flórián Albert
  { lat: 20.693888888, lng: -103.416111111 }, // Estadi Tres de Marzo
  { lat: 51.6422, lng: -3.9351 }, // Liberty Stadium
  { lat: 14.625764, lng: -90.510489 }, // Estadio Doroteo Guamuch Flores
  { lat: 34.929818, lng: 33.613207 }, // Stadium Ammochostos
  { lat: 48.0149, lng: 0.19327 }, // Stade Léon-Bollée
  { lat: 28.20437778, lng: 83.99166667 }, // Pokhara Rangasala
  { lat: 45.427761, lng: 12.363731 }, // Stadio Pierluigi Penzo
  { lat: 49.02, lng: 8.413055555 }, // Wildparkstadion
  { lat: 49.02, lng: 8.413055555 }, // Wildparkstadion
  { lat: 25.055569, lng: -77.358736 }, // Thomas Robinson Stadium
  { lat: 48.08713, lng: 7.37921 }, // Colmar Stadium
  { lat: 35.114542, lng: 33.362864 }, // Estadi GSP
  { lat: 43.378384, lng: 17.854382 }, // Estadi Rođeni
  { lat: 52.94, lng: -1.132778 }, // City Ground
  { lat: 47.503094, lng: 19.0982 }, // Estadi Ferenc Puskás
  { lat: -33.464444444, lng: -70.610555555 }, // Estadio Nacional de Xile
  { lat: 53.238333, lng: 50.271667 }, // Metallurg Stadium
  { lat: 55.80355, lng: 37.741169 }, // Estadi Lokomotiv
  { lat: 47.140277777, lng: 9.510277777 }, // Rheinpark Stadion
  { lat: 39.728612, lng: 36.984065 }, // Sivas 4 Eylül Stadium
  { lat: -34.750847, lng: -58.387544 }, // Estadio Florencio Sola
  { lat: 50.288333, lng: 18.973056 }, // Estadi de Silèsia
  { lat: 38.747189, lng: 48.857131 }, // Lankaran City Stadium
  { lat: 53.335005555, lng: -6.229202777 }, // Lansdowne Road
  { lat: 40.4858, lng: -7.5947 }, // Q602279
  { lat: 54.564167, lng: -1.246944 }, // Ayresome Park
  { lat: 54.564167, lng: -1.246944 }, // Ayresome Park
  { lat: 19.287286, lng: -99.666794 }, // Estadi Nemesio Díez
  { lat: 50.296317, lng: 18.768564 }, // Estadi Ernest Pohl
  { lat: 51.955833, lng: 6.309722 }, // De Vijverberg
  { lat: 51.094722, lng: 4.928333 }, // Het Kuipje
  { lat: 51.099706, lng: -0.194767 }, // The Peoples Pension Stadium
  { lat: 52.565433, lng: -1.990706 }, // Bescot Stadium
  { lat: 44.794916666, lng: 10.338444444 }, // Estadi Ennio Tardini
  { lat: 54.17583611, lng: 45.192175 }, // Start Stadium
  { lat: 51.4616, lng: 6.70109 }, // PCC-Stadion
  { lat: 35.084444444, lng: 137.170833333 }, // Toyota Stadium
  { lat: 40.634133, lng: 15.804317 }, // Stadio Alfredo Viviani
  { lat: 51.646158, lng: -0.191733 }, // Underhill Stadium
  { lat: 55.9384, lng: -4.56144 }, // Dumbarton Football Stadium
  { lat: 56.475264, lng: -2.973194 }, // Dens Park
  { lat: 40.4527, lng: -3.6868 }, // Estadi de Chamartín
  { lat: 30.0512, lng: 31.297 }, // Osman Ahmed Osman Stadium
  { lat: 10.641608, lng: -61.384761 }, // Marvin Lee Stadium
  { lat: 53.758856, lng: -1.776203 }, // Horsfall Stadium
  { lat: 53.916508, lng: -3.024728 }, // Highbury Stadium
  { lat: 51.393231, lng: -0.172381 }, // Imperial Fields
  { lat: 52.68863, lng: -2.74933 }, // New Meadow
  { lat: 53.138056, lng: -1.200556 }, // Field Mill
  { lat: 53.373722, lng: -3.0325 }, // Prenton Park
  { lat: 51.449539, lng: 0.322272 }, // Stonebridge Road
  { lat: 50.735278, lng: -1.838333 }, // Dean Court
  { lat: 53.218289, lng: -0.540811 }, // Sincil Bank
  { lat: 53.253442, lng: -1.427203 }, // Proact Stadium
  { lat: 52.821906, lng: -1.626958 }, // Pirelli Stadium
  { lat: 51.384166666, lng: 0.560833333 }, // Priestfield Stadium
  { lat: 53.586722, lng: -0.69525 }, // Glanford Park
  { lat: 50.476408, lng: -3.523825 }, // Plainmoor
  { lat: 14.098447222, lng: -87.203958333 }, // Estadio Nacional Jose de la Paz Herrera
  { lat: 50.388055555, lng: -4.150833333 }, // Home Park
  { lat: 51.889839, lng: -0.193608 }, // Broadhall Way
  { lat: 53.654166666, lng: -1.768333333 }, // Kirklees Stadium
  { lat: 50.861822222, lng: -0.083277777 }, // Brighton Community Stadium
  { lat: 53.620833, lng: -2.18 }, // Spotland Stadium
  { lat: 53.777777777, lng: -1.572222222 }, // Elland Road
  { lat: 50.796388888, lng: -1.063888888 }, // Fratton Park
  { lat: 52.055, lng: 1.145277777 }, // Portman Road
  { lat: 52.235197, lng: -0.93345 }, // Sixfields Stadium
  { lat: 53.580555555, lng: -2.294722222 }, // Gigg Lane
  { lat: 52.620277777, lng: -1.142222222 }, // Leicester City Stadium
  { lat: 34.810278, lng: 135.5425 }, // Osaka Expo '70 Stadium
  { lat: 37.987169444, lng: 23.754194444 }, // Estadi Apóstolos Nikolaïdis
  { lat: 53.765356, lng: -2.370911 }, // Crown Ground
  { lat: 31.1971, lng: 29.9132 }, // Estadi d'Alexandria
  { lat: 48.133305555, lng: 17.115805555 }, // Štadión Petržalka
  { lat: 39.929528, lng: 116.441139 }, // estadi dels Treballadors
  { lat: 51.4925, lng: 7.454444 }, // Stadion Rote Erde
  { lat: 53.746111111, lng: -0.367777777 }, // MKM Stadium
  { lat: 46.9609, lng: 7.43127 }, // Stadion Neufeld
  { lat: 3.054666666, lng: 101.691166666 }, // Estadi Nacional Bukit Jalil
  { lat: 46.901389, lng: 19.668889 }, // Széktói Stadion
  { lat: 49.468333, lng: 8.441389 }, // Südweststadion
  { lat: 46.081603, lng: 13.200136 }, // Estadi Friuli
  { lat: -8.040556, lng: -34.896667 }, // Estádio dos Aflitos
  { lat: 55.88527778, lng: 37.45416667 }, // Arena Khimki
  { lat: 46.246667, lng: 15.270278 }, // Estadi Z'dežele
  { lat: 48.9909, lng: 12.1069 }, // Arena Regensburg
  { lat: 37.986111, lng: -1.121389 }, // Estadi de La Condomina
  { lat: 51.411667, lng: 5.479444 }, // Jan Louwers Stadion
  { lat: 47.5034, lng: 9.73478 }, // Casino Stadium
  { lat: 40.47666667, lng: -3.61416667 }, // Estadi Alfredo Di Stéfano
  { lat: 41.57, lng: 14.630833 }, // Stadio Antonio Molinari
  { lat: 41.5701, lng: 14.6309 }, // Stadio Antonio Molinari
  { lat: 9.71, lng: -63.2677 }, // Estadi Monumental de Maturín
  { lat: 51.037222, lng: 4.486389 }, // AFAS Stadion KV Mechelen
  { lat: 35.724417, lng: 51.275528 }, // Estadi Azadi
  { lat: 35.724417, lng: 51.275528 }, // Estadi Azadi
  { lat: 37.246389, lng: -6.954167 }, // estadi Nuevo Colombino
  { lat: 49.479444, lng: 8.5025 }, // Carl-Benz-Stadion
  { lat: 57.990694, lng: 56.244636 }, // Zvezda
  { lat: 42.606667, lng: 23.023333 }, // Minyor Stadium
  { lat: 52.29, lng: 10.521389 }, // Eintracht-Stadion
  { lat: 40.4219, lng: -3.6751 }, // Estadi d'O'Donnell
  { lat: 45.834089, lng: 9.016686 }, // Stadio comunale Riva IV
  { lat: 46.162687, lng: 8.801544 }, // Stadio del Lido
  { lat: 47.458456, lng: 9.036692 }, // Lidl Arena
  { lat: 20.681667, lng: -103.462778 }, // Estadi Chivas
  { lat: 47.383333, lng: 8.06 }, // Stadion Brügglifeld
  { lat: 51.919444, lng: 4.433333 }, // Sparta Stadion Het Kasteel
  { lat: 37.865389, lng: 32.483278 }, // Konya Atatürk Stadium
  { lat: 42.953333, lng: 12.691667 }, // Stadio Enzo Blasone
  { lat: 46.233333, lng: 7.376389 }, // Stade de Tourbillon
  { lat: 50.450435, lng: 30.535178 }, // Valeriy Lobanovskyi Dynamo Stadium
  { lat: 46.023611, lng: 8.961667 }, // Estadi Cornaredo
  { lat: 47.4439, lng: 15.3006 }, // Alpenstadion
  { lat: 48.355358334, lng: 10.876082647 }, // Rosenaustadion
  { lat: 45.041722, lng: 7.649733 }, // Stadio di Corso Sebastopoli
  { lat: 47.895118, lng: 33.392462 }, // Metalurh Stadium
  { lat: -34.741778, lng: -58.251889 }, // Estadio Centenario Ciudad de Quilmes
  { lat: 46.962778, lng: 7.465 }, // Wankdorfstadion
  { lat: 46.783297, lng: 6.647056 }, // Stade Municipal
  { lat: 51.116389, lng: 3.987222 }, // Daknamstadion
  { lat: 48.235556, lng: 14.226667 }, // Waldstadion
  { lat: 47.033264, lng: 8.305187 }, // Stadion Allmend
  { lat: -34.912, lng: -57.9389 }, // Estadi Jorge Luis Hirschi
  { lat: -25.367568, lng: -57.584933 }, // Estadio Luis Alfonso Giagni
  { lat: 59.949, lng: 10.734333333 }, // Estadi Ullevaal
  { lat: 47.029836, lng: 8.287797 }, // Stadion Kleinfeld
  { lat: 47.7042, lng: 8.62583 }, // Stadion Breite
  { lat: 40.180278, lng: 44.494444 }, // Estadi Hrazdan
  { lat: 47.561194444, lng: 7.620013888 }, // Stadion Rankhof
  { lat: 49.486944, lng: 10.999167 }, // Trolli Arena
  { lat: 40.365278, lng: 18.208889 }, // Estadi Via del Mare
  { lat: -25.298376, lng: -57.639831 }, // Estadio Arsenio Erico
  { lat: 53.483055555, lng: -2.200277777 }, // City of Manchester Stadium
  { lat: 53.3961, lng: -1.4258 }, // Don Valley Stadium
  { lat: 51.538611111, lng: -0.016388888 }, // Estadi Olímpic de Londres
  { lat: 51.478055555, lng: -3.1825 }, // Millennium Stadium
  { lat: 32.836644, lng: -96.783994 }, // Gerald J. Ford Stadium
  { lat: 51.549, lng: 0.701556 }, // Roots Hall
  { lat: 53.447631, lng: -2.727614 }, // BrewDog Stadium
  { lat: 53.138056, lng: -1.200556 }, // Field Mill
  { lat: 51.449539, lng: 0.322272 }, // Stonebridge Road
  { lat: 53.0945, lng: -1.3813 }, // North Street
  { lat: 53.654166666, lng: -1.768333333 }, // Kirklees Stadium
  { lat: 53.620833, lng: -2.18 }, // Spotland Stadium
  { lat: 53.777777777, lng: -1.572222222 }, // Elland Road
  { lat: 52.235197, lng: -0.93345 }, // Sixfields Stadium
  { lat: 53.580555555, lng: -2.294722222 }, // Gigg Lane
  { lat: 53.746111111, lng: -0.367777777 }, // MKM Stadium
  { lat: 53.411388888, lng: -1.500555555 }, // Estadi Hillsborough
  { lat: 46.738333, lng: 7.628611 }, // Stadion Lachen
  { lat: 49.2475, lng: 6.984167 }, // Ludwigsparkstadion
  { lat: 47.970277777, lng: 21.712777777 }, // Városi Stadion
  { lat: 43.583296, lng: 1.434055 }, // Stadium Municipal de Toulouse
  { lat: 35.225833333, lng: -80.852777777 }, // Bank of America Stadium
  { lat: 32.74769, lng: -97.09288 }, // AT&T Stadium
  { lat: 32.74769, lng: -97.09288 }, // AT&T Stadium
  { lat: 42.72297, lng: 2.88521 }, // Estadi Gilbert Brutus
  { lat: 53.804722, lng: -3.048056 }, // Bloomfield Road
  { lat: 53.555277777, lng: -2.128611111 }, // Boundary Park
  { lat: 53.370277777, lng: -1.470833333 }, // Bramall Lane
  { lat: 32.228889, lng: -110.948889 }, // Arizona Stadium
  { lat: 32.783055555, lng: -117.119444444 }, // San Diego Stadium
  { lat: 53.804222222, lng: -1.759022222 }, // Valley Parade
  { lat: 54.89556, lng: -2.91365 }, // Brunton Park
  { lat: 39.743888888, lng: -105.02 }, // Empower Field at Mile High
  { lat: 39.90089, lng: -75.16776 }, // Lincoln Financial Field
  { lat: 53.552222, lng: -1.4675 }, // Oakwell
  { lat: 53.772222222, lng: -2.688055555 }, // Deepdale
  { lat: 53.051944, lng: -3.003611 }, // Racecourse Ground
  { lat: 52.624167, lng: -1.133056 }, // Welford Road Stadium
  { lat: 53.399722222, lng: -2.166388888 }, // Edgeley Park
  { lat: 55.939055555, lng: -3.232444444 }, // Tynecastle Stadium
  { lat: 53.509722, lng: -1.113889 }, // Keepmoat Stadium
  { lat: 43.621944, lng: 1.415556 }, // Stade Ernest-Wallon
  { lat: 55.018611, lng: -1.672222 }, // Kingston Park
  { lat: 53.2394, lng: -1.435458 }, // Saltergate
  { lat: 51.474722222, lng: -3.2 }, // Ninian Park
  { lat: 39.763658333, lng: -86.163319444 }, // RCA Dome
  { lat: 41.759722, lng: -72.618889 }, // Pratt & Whitney Stadium
  { lat: 36.148611111, lng: -95.943888888 }, // Skelly Field at H. A. Chapman Stadium
  { lat: 36.148611111, lng: -95.943888888 }, // Skelly Field at H. A. Chapman Stadium
  { lat: 36.148611111, lng: -95.943888888 }, // Skelly Field at H. A. Chapman Stadium
  { lat: 36.148611111, lng: -95.943888888 }, // Skelly Field at H. A. Chapman Stadium
  { lat: 36.148611111, lng: -95.943888888 }, // Skelly Field at H. A. Chapman Stadium
  { lat: 31.5731, lng: -84.1369 }, // Albany State University Coliseum
  { lat: 39.1892, lng: -75.5433 }, // Alumni Stadium
  { lat: 30.713889, lng: -95.541667 }, // Bowers Stadium
  { lat: 33.793, lng: -79.0177 }, // Brooks Stadium
  { lat: 33.793, lng: -79.0177 }, // Brooks Stadium
  { lat: 39.753056, lng: -105.2275 }, // Alumni Field
  { lat: 34.134444, lng: -93.063333 }, // Carpenter–Haygood Stadium
  { lat: 34.0182, lng: -81.0106 }, // Charlie W. Johnson Stadium
  { lat: 45.582735, lng: -94.391721 }, // Clemens Stadium
  { lat: 43.138611, lng: -70.939722 }, // Wildcat Stadium
  { lat: 41.3781, lng: -83.6225 }, // Doyt Perry Stadium
  { lat: 37.675833, lng: -113.076944 }, // Eccles Coliseum
  { lat: 40.819722222, lng: -81.398055555 }, // Tom Benson Hall of Fame Stadium
  { lat: 36.536111, lng: -87.352778 }, // Fortera Stadium
  { lat: 40.049119, lng: -79.899166 }, // Hepner–Bailey Field at Adamson Stadium
  { lat: 48.2483, lng: -101.303 }, // Herb Parker Stadium
  { lat: 42.8697, lng: -112.428 }, // ICCU Dome
  { lat: 60.2621, lng: 24.83818333 }, // Myyrmäen jalkapallostadion
  { lat: 32.532222, lng: -92.655833 }, // Joe Aillet Stadium
  { lat: 32.532222, lng: -92.655833 }, // Joe Aillet Stadium
  { lat: 32.793709, lng: -79.955882 }, // Johnson Hagood Stadium
  { lat: 34.028938888, lng: -84.567611111 }, // Fifth Third Stadium
  { lat: 34.028938888, lng: -84.567611111 }, // Fifth Third Stadium
  { lat: 32.530833, lng: -92.065833 }, // JPS Field at Malone Stadium
  { lat: 32.729166666, lng: -97.126666666 }, // Maverick Stadium,Texas
  { lat: 41.488, lng: -71.5346 }, // Meade Stadium
  { lat: 35.974001656, lng: -78.896467007 }, // O'Kelly–Riddick Stadium
  { lat: 37.0644, lng: -76.4992 }, // TowneBank Stadium
  { lat: 65.019694444, lng: 25.465805555 }, // Raatti Stadium
  { lat: 40.7705, lng: -80.3215 }, // Reeves Field
  { lat: 41.751667, lng: -111.811667 }, // Maverik Stadium, Utah State
  { lat: 46.864217, lng: -113.981497 }, // Washington–Grizzly Stadium
  { lat: 38.555672, lng: -121.422903 }, // Hornet Stadium
  { lat: 44.0644, lng: -123.1454 }, // Bethel Park
  { lat: 44.0644, lng: -123.1454 }, // Bethel Park
  { lat: 40.2793, lng: -74.0095 }, // Kessler Stadium
  { lat: 35.8511, lng: -86.3683 }, // Johnny 'Red' Floyd Stadium
  { lat: 36.299, lng: -82.374 }, // William B. Greene Jr. Stadium
  { lat: 27.951144, lng: -82.467106 }, // Phillips Field
  { lat: 33.527777777, lng: -86.808888888 }, // Protective Stadium
  { lat: 39.210277777, lng: -84.506111111 }, // RDI Stadium
  { lat: 32.561321316, lng: -94.375895795 }, // Ornelas Stadium
  { lat: 33.645833333, lng: -96.599722222 }, // Jerry E. Apple Stadium
  { lat: 39.10825, lng: -84.52422 }, // Stargel Stadium
  { lat: 41.79242291, lng: -87.599342446 }, // Stagg Field
  { lat: 52.543161, lng: 13.405359 }, // Friedrich-Ludwig-Jahn-Stadium (Berlin)
  { lat: 43.77596, lng: 11.18841 }, // Guelfi Sport Center
  { lat: 48.293333, lng: 14.276389 }, // Linzer Stadion
  { lat: 48.207778, lng: 13.478333 }, // Keine Sorgen Arena
  { lat: 50.776214, lng: 15.049972 }, // Stadion u Nisy
  { lat: 47.393056, lng: 8.504722 }, // Estadi Hardturm
  { lat: 47.360278, lng: 7.341667 }, // La Blancherie
  { lat: 46.198082, lng: 9.022304 }, // Stadio Comunale Bellinzona
  { lat: 46.738333, lng: 7.628611 }, // Stadion Lachen
  { lat: 47.7394, lng: 16.4064 }, // Pappelstadion
  { lat: -22.913611, lng: -47.051389 }, // Estádio Moisés Lucarelli
  { lat: 47.033264, lng: 8.305187 }, // Swissporarena
  { lat: 48.9669589, lng: 14.4675442 }, // Stadion Střelecký ostrov
  { lat: 48.162306, lng: 16.386694 }, // Generali Arena
  { lat: 47.046111, lng: 15.454444 }, // Estadi Graz-Liebenau
  { lat: 48.197778, lng: 16.265278 }, // Estadi Gerhard Hanappi
  { lat: 50.793333333, lng: 6.097222222 }, // New Tivoli
  { lat: 54.08495, lng: 12.095188888 }, // Ostseestadion
  { lat: 51.559167, lng: 7.066667 }, // Parkstadion
  { lat: 10.661522, lng: -61.533033 }, // Hasely Crawford Stadium
  { lat: 49.2475, lng: 6.984167 }, // Ludwigsparkstadion
  { lat: 52.031389, lng: 8.516944 }, // Bielefelder Alm
  { lat: 31.253794, lng: 34.785964 }, // Vasermil Stadium
  { lat: 20.577777777, lng: -100.366388888 }, // Estadi Corregidora
  { lat: -32.913997, lng: -60.674567 }, // Estadi Gigante de Arroyito
  { lat: 19.405833333, lng: -98.986944444 }, // Estadi Neza 86
  { lat: 41.318314, lng: 19.824075 }, // Estadi Qemal Stafa
  { lat: 52.062778, lng: 4.383056 }, // WerkTalent Stadion
  { lat: 51.8225, lng: 5.836667 }, // Stadion de Goffert
  { lat: -22.890916666, lng: -43.228252777 }, // Estadi São Januário
  { lat: 59.972953, lng: 30.220533 }, // Estadi Krestovski
  { lat: 59.972953, lng: 30.220533 }, // Estadi Krestovski
  { lat: 59.972953, lng: 30.220533 }, // Estadi Krestovski
  { lat: 41.379722, lng: 2.118056 }, // Miniestadi
  { lat: 51.44, lng: -2.620278 }, // Ashton Gate Stadium
  { lat: 52.236666666, lng: 6.8375 }, // De Grolsch Veste
  { lat: 50.063611, lng: 19.911944 }, // Estadi Henryk Reyman
  { lat: 43.97125, lng: 12.476972 }, // San Marino Stadium
  { lat: 42.107778, lng: 14.705556 }, // Stadio Aragona
  { lat: 58.153611, lng: 8.028611 }, // Kristiansand Arena
  { lat: 47.970277777, lng: 21.712777777 }, // Városi Stadion
  { lat: 36.185, lng: 37.117778 }, // Aleppo International Stadium
  { lat: 42.796667, lng: -1.636944 }, // Estadi El Sadar
  { lat: 47.376069, lng: 0.72815 }, // Estadi de la Vallée du Cher
  { lat: 48.1953, lng: 15.9006 }, // Q736024
  { lat: 47.549573, lng: 21.638882 }, // Stadion Oláh Gábor Út
  { lat: 45.435356, lng: 10.968647 }, // Estadi Marcantonio Bentegodi
  { lat: 46.938517, lng: 26.354424 }, // Stadionul Ceahlăul
  { lat: 43.583296, lng: 1.434055 }, // Stadium Municipal de Toulouse
  { lat: 50.058056, lng: 19.919722 }, // Marshal Józef Piłsudski Stadium
  { lat: -31.25083333, lng: -61.48138889 }, // Nuevo Monumental Stadium
  { lat: -8.026711, lng: -34.891175 }, // Estadi José do Rego Maciel
  { lat: -34.905053, lng: -56.1562 }, // Estadio Pocitos
  { lat: 39.944167, lng: -0.103611 }, // Estadi de la Ceràmica
  { lat: 41.96812, lng: 21.452619 }, // Cementarnica Stadium
  { lat: -23.951111, lng: -46.338889 }, // Estadi Urbano Caldeira
  { lat: 53.44305556, lng: -2.21555556 }, // Fallowfield Stadium
  { lat: 51.1082, lng: 71.4026 }, // Astanà Arena
  { lat: 47.356997, lng: 8.264067 }, // Stadion Niedermatten
  { lat: 52.457222, lng: 13.568056 }, // An der Alten Försterei
  { lat: 44.928444, lng: 26.003417 }, // Astra Stadium
  { lat: 41.039205555, lng: 28.994741666 }, // Estadi Beşiktaş İnönü
  { lat: 41.1725, lng: 29.05027778 }, // Yusuf Ziya Öniş Stadium
  { lat: 51.066855555, lng: 4.733997222 }, // Municipal Sport Center (Heist-op-den-Berg)
  { lat: 16.84, lng: 42.5964 }, // King Faisal Sport City
  { lat: 42.139381625, lng: 21.714190052 }, // Kumanovo City Stadium
  { lat: 40.261388888, lng: 22.511944444 }, // Katerini Stadium
  { lat: 41.923888888, lng: 42.013333333 }, // Megobroba Stadium
  { lat: 9.913055555, lng: -84.137777777 }, // Estadio Nicolás Masís
  { lat: 9.898888888, lng: -83.675833333 }, // Estadio Rafael Ángel Camacho
  { lat: 50.8042165, lng: 4.9451261 }, // Q16511464
  { lat: 50.8042165, lng: 4.9451261 }, // Q16511464
  { lat: 50.8047, lng: 4.94813 }, // Q16511464
  { lat: 50.8047, lng: 4.94813 }, // Q16511464
  { lat: 32.3, lng: -64.7583 }, // Devonshire Recreation Club Field
  { lat: 18.479, lng: -69.8543 }, // Estadio Parque del Este
  { lat: -3.8199, lng: -60.370592 }, // Q16544157
  { lat: 35.124505, lng: 33.308419 }, // EN THOI Stadium
  { lat: 19.284, lng: -81.2455 }, // Haig Bodden Sports Centre
  { lat: -34.646888888, lng: -58.396277777 }, // Claudio Chiqui Tapia Stadium
  { lat: -33.76227, lng: -61.9739 }, // El Coloso Stadium
  { lat: -34.8747, lng: -57.8644 }, // Genacio Sálice Stadium
  { lat: 9.91417, lng: -84.0431 }, // Q16564649
  { lat: -34.481460011, lng: -58.583108387 }, // Estadi La Quema
  { lat: -34.661944444, lng: -58.631666666 }, // Nuevo Francisco Urbano Stadium
  { lat: -34.79675, lng: -56.067138888 }, // Estadio Campeón del Siglo
  { lat: -21.1901862, lng: -175.2230169 }, // Loto-Tonga Soka Centrek
  { lat: -21.1844, lng: -175.225 }, // Loto-Tonga Soka Centrek
  { lat: 35.8829, lng: 14.4767 }, // Qormi Ground
  { lat: -34.629555555, lng: -58.359583333 }, // Estadi Ministro Brin y Senguel
  { lat: 42.4219, lng: 14.2798 }, // Q16605702
  { lat: 44.0536, lng: 8.20399 }, // stadio Annibale Riva
  { lat: 30.43111111, lng: -91.17805556 }, // LSU Soccer Stadium
  { lat: 38.426100868, lng: -82.409934342 }, // Veterans Memorial Soccer Complex
  { lat: 4.02577, lng: 9.15906 }, // Estadi de Limbé
  { lat: 35.01831, lng: 33.3961 }, // Chalkanoras Stadium
  { lat: 50.438833333, lng: 30.481083333 }, // Lokomotyv Stadium
  { lat: 34.802526, lng: 135.538278 }, // Estadi de futbol de Suita
  { lat: -21.2046, lng: -159.788 }, // Avatiu Field
  { lat: 41.378813, lng: -83.625981 }, // Mickey Cochrane Stadium
  { lat: 40.758055555, lng: -73.843333333 }, // Etihad Park
  { lat: 28.5410645, lng: -81.389035 }, // Inter&Co Stadium
  { lat: 33.891444, lng: 130.888861 }, // Mikuni World Stadium Kitakyūshū
  { lat: 39.7625, lng: 30.4677 }, // New Eskişehir Stadium
  { lat: 37.123888888, lng: 37.3825 }, // Gaziantep Stadium
  { lat: 45.957234, lng: 12.648607 }, // Stadio Ottavio Bottecchia
  { lat: 46.18806, lng: 5.21222 }, // Stade Municipal de Péronnas
  { lat: 63.125, lng: 7.719222222 }, // Kristiansund Stadion
  { lat: 34.948617, lng: 33.587873 }, // Aradippou Municipal Stadium
  { lat: 34.793215, lng: 32.411669 }, // Chloraka Community Stadium
  { lat: 48.46189, lng: 7.94054 }, // Q18333653
  { lat: 1.65108, lng: 11.29933 }, // Estadio de Mongomo
  { lat: 62.601111111, lng: 29.745 }, // Joensuu central sports field
  { lat: 59.973292, lng: 23.442829 }, // Q18662238
  { lat: 51.693504, lng: 8.340226 }, // Stadion am Bruchbaum
  { lat: 32.7679, lng: 35.5141 }, // Tiberias Football Stadium
  { lat: 35.05307, lng: 33.95666 }, // Anagennisi Football Ground
  { lat: 34.987222222, lng: 33.656277777 }, // Oroklini Community Stadium
  { lat: 34.736166666, lng: 33.160694444 }, // Parekklisia Community Stadium
  { lat: 43.046697843, lng: -2.213499729 }, // Q19948037
  { lat: 43.2210502, lng: -2.7254464 }, // Urritxe
  { lat: 41.10192, lng: 16.68687 }, // Q20009816
  { lat: 59.9178125, lng: 10.8066875 }, // Estadi Vålerenga
  { lat: 59.9178125, lng: 10.8066875 }, // Estadi Vålerenga
  { lat: 24.72930556, lng: 46.62369444 }, // Estadi Universitari Rei Saüd
  { lat: 42.58857778, lng: -8.76604444 }, // Estadio da Lomba
  { lat: 60.234757, lng: 24.96253 }, // Oulunkylä Stadium
  { lat: 11.082328, lng: 105.802856 }, // Svay Rieng Stadium
  { lat: -34.155321, lng: -70.748199 }, // Estadio Municipal de Rancagua
  { lat: -22.46027778, lng: -68.92055556 }, // Estadio Zorros del Desierto
  { lat: 62.778469444, lng: 22.815588888 }, // Estadi OmaSP
  { lat: 41.388527777, lng: 41.428611111 }, // Hopa City Stadium
  { lat: 55.9002, lng: -3.7002 }, // Volunteer Park
  { lat: 34.013, lng: -118.285 }, // Banc of California Stadium
  { lat: 44.9528, lng: -93.1651 }, // Allianz Field
  { lat: 33.513888888, lng: -112.132222222 }, // GCU Stadium
  { lat: 53.306666666, lng: 26.5075 }, // Gorodeya Stadium
  { lat: 59.439147, lng: 24.809522 }, // Ajax Stadium
  { lat: 34.9263, lng: 33.597747222 }, // AEK Arena - Georgios Karapatakis
  { lat: 56.893972222, lng: 12.511555555 }, // Falcon Alkoholfri Arena
  { lat: 9.965555555, lng: -84.047777777 }, // Estadio Luis Ángel 'Pipilo' Umaña
  { lat: 37.84777778, lng: 27.25111111 }, // Özer Türk Stadium
  { lat: 48.77871944, lng: 18.62402222 }, // Futbalový štadión Prievidza
  { lat: 46.15222222, lng: 21.32 }, // Stadionul Motorul
  { lat: 47.39062, lng: 8.51128 }, // Förrlibuck stadium
  { lat: 49.577138888, lng: 6.115730555 }, // Estadi de Luxemburg
  { lat: -23.423361111, lng: -45.070111111 }, // Q25420291
  { lat: -5.51574, lng: -38.267901 }, // Arena Coliseu Mateus Aquino
  { lat: 48.069166666, lng: 19.272638888 }, // Q25456607
  { lat: 41.344225, lng: 41.300723 }, // Arhavi City Stadium
  { lat: 35.118793, lng: 33.953348 }, // Famagusta Municipal Stadium
  { lat: 47.19638889, lng: 8.45761111 }, // Eizmoos Stadium
  { lat: 45.865114, lng: 8.9793 }, // Q26258075
  { lat: 52.199051, lng: 20.991883 }, // Gwardia Warsaw Stadium
  { lat: 42.075388888, lng: 13.53675 }, // Stadio Fabio Piccone
  { lat: 60.17777778, lng: 24.78111111 }, // Tapiola Sports Park
  { lat: 40.51036, lng: 21.68247 }, // Ptolemaida Stadium
  { lat: 37.94664, lng: 23.62047 }, // Drapetsona Municipal Stadium 'Yiannis Vazos'
  { lat: 48.924444444, lng: 2.36 }, // Stade de France
  { lat: 51.422222222, lng: -0.982777777 }, // Madejski Stadium
  { lat: 53.483055555, lng: -2.200277777 }, // City of Manchester Stadium
  { lat: 46.768333, lng: 23.572222 }, // Cluj Arena
  { lat: 53.559722222, lng: -113.476111111 }, // Commonwealth Stadium
  { lat: -22.912166666, lng: -43.230163888 }, // Estadi Maracanã
  { lat: 41.933888888, lng: 12.454722222 }, // estadi Olímpic de Roma
  { lat: 51.538611111, lng: -0.016388888 }, // Estadi Olímpic de Londres
  { lat: -33.903461111, lng: 18.411152777 }, // Estadi Green Point
  { lat: -25.753189, lng: 28.223014 }, // Estadi Loftus Versfeld
  { lat: -29.117222222, lng: 26.208888888 }, // Estadi Free State
  { lat: -26.1975, lng: 28.060833333 }, // Estadi Ellis Park
  { lat: -25.461888888, lng: 30.929777777 }, // Estadi Mbombela
  { lat: 55.825863888, lng: -4.252002777 }, // Hampden Park
  { lat: 43.269241, lng: 5.394907 }, // Stade Vélodrome
  { lat: 51.478055555, lng: -3.1825 }, // Millennium Stadium
  { lat: 37.968333333, lng: 23.741111111 }, // estadi Panathinaikó
  { lat: 37.968333333, lng: 23.741111111 }, // estadi Panathinaikó
  { lat: 37.968333333, lng: 23.741111111 }, // estadi Panathinaikó
  { lat: 37.968333333, lng: 23.741111111 }, // estadi Panathinaikó
  { lat: 51.456111111, lng: -0.341666666 }, // Twickenham Stadium
  { lat: 52.378611, lng: 4.786111 }, // NRCA Stadium
  { lat: 53.334956, lng: -6.228253 }, // Aviva Stadium
  { lat: 40.529654, lng: -3.637615 }, // Campo de rugby Las Terrazas
  { lat: -43.541944444, lng: 172.654166666 }, // AMI Stadium
  { lat: -36.875277777, lng: 174.745 }, // Eden Park
  { lat: 53.554444, lng: 9.967778 }, // Millerntor-Stadion
  { lat: 51.630555555, lng: -0.800277777 }, // Adams Park
  { lat: 44.829167, lng: -0.598056 }, // Stade Jacques Chaban-Delmas
  { lat: -38.155833, lng: 176.224167 }, // Rotorua International Stadium
  { lat: 37.466881, lng: 126.845111 }, // Gwangmyeong Velodrome
  { lat: 53.335005555, lng: -6.229202777 }, // Lansdowne Road
  { lat: -29.825, lng: 31.029722 }, // Estadi Kings Park
  { lat: 44.794916666, lng: 10.338444444 }, // Estadi Ennio Tardini
  { lat: 53.654166666, lng: -1.768333333 }, // Kirklees Stadium
  { lat: 50.861822222, lng: -0.083277777 }, // Brighton Community Stadium
  { lat: 53.777777777, lng: -1.572222222 }, // Elland Road
  { lat: 52.055, lng: 1.145277777 }, // Portman Road
  { lat: 52.239444, lng: -0.919722 }, // Franklin's Gardens
  { lat: 25.288695, lng: 51.566465 }, // Estadi 974
  { lat: 38.319167, lng: 140.881944 }, // Yurtec Stadium Sendai
  { lat: 34.984444, lng: 138.481111 }, // IAI Stadium Nihondaira
  { lat: 48.89565, lng: 2.229554 }, // Paris La Défense Arena
  { lat: 49.282639, lng: -123.033222 }, // Empire Field
  { lat: 32.051, lng: 118.769 }, // Wutaishan Stadium
  { lat: 37.01727778, lng: 140.86433333 }, // Iwaki Green Field
  { lat: 37.017327777, lng: 140.864377777 }, // Iwaki Green Field
  { lat: 36.58035278, lng: 138.1675556 }, // Minami Nagano Sports Park Stadium
  { lat: 34.68605, lng: 131.85746 }, // Shimane Football Arena
  { lat: 34.43638889, lng: 132.3933333 }, // Q11484671
  { lat: 35.265638888, lng: 138.621361111 }, // Q11663055
  { lat: 36.78461, lng: -6.34331 }, // Plaza de toros de Sanlúcar de Barrameda
  { lat: 39.9608, lng: -4.82127 }, // Plaza de toros La Caprichosa
  { lat: 40.0666, lng: -2.14021 }, // plaza de toros de Cuenca
  { lat: 40.03677, lng: -6.08857 }, // plaza de toros de Plasencia
  { lat: 38.010739944, lng: -3.376675411 }, // Plaça de toros d'Úbeda
  { lat: 40.64655, lng: -4.70335 }, // plaça de toros d'Àvila
  { lat: 40.62879, lng: -3.1674 }, // plaza de toros de Guadalajara
  { lat: 36.01522, lng: -5.60861 }, // Tarifa bullring
  { lat: 37.48691, lng: -2.78163 }, // Bullring of Baza
  { lat: 40.38627, lng: -3.73895 }, // Plaza de toros de Vista-Alegre
  { lat: 41.327513888, lng: -1.791769444 }, // Plaça de toros d'Ateca
  { lat: 39.201205, lng: -8.627188 }, // Almeirim bullring
  { lat: 38.655, lng: -8.989027777 }, // Q25419525
  { lat: 38.0201, lng: -7.867223 }, // Q25427573
  { lat: 39.606686, lng: -9.073295 }, // Nazaré Bullring
  { lat: 40.360511111, lng: -4.402213888 }, // San Martín de Valdeiglesias bullring
  { lat: 40.212430555, lng: -5.084266666 }, // Arenas de San Pedro bullring
  { lat: 35.685888888, lng: -0.666805555 }, // Bullring of Oran
  { lat: 40.497477, lng: -4.069734 }, // Plaça de toros de Valdemorillo
  { lat: 38.996080555, lng: -1.864127777 }, // Q50364160
  { lat: 38.997634, lng: -1.864892 }, // Q50378557
  { lat: 37.094944444, lng: -8.225472222 }, // Albufeira bullring
  { lat: 38.682444444, lng: -7.103222222 }, // Plaza de toros de Olivenza
  { lat: 42.338639, lng: -1.800889 }, // Q63226613
  { lat: 26.193055555, lng: -80.161111111 }, // Chase Stadium
  { lat: 42.675389, lng: -2.034972 }, // Q73716944
  { lat: 42.114639, lng: -1.789694 }, // Q73716945
  { lat: 43.73415, lng: -0.87409 }, // Arènes de Gamarde-les-Bains
  { lat: 36.697186, lng: -5.383764 }, // Plaza de toros de Villaluenga del Rosario
  { lat: 37.895644, lng: -6.564092 }, // Plaça de toros d'Aracena
  { lat: 39.985267, lng: -3.767775 }, // Añover de Tajo bullring
  { lat: 40.217206, lng: -6.877794 }, // Q101998553
  { lat: 40.680742, lng: -3.967725 }, // Plaza de toros de Moralzarzal
  { lat: 40.299989, lng: -3.2972 }, // Q101998868
  { lat: 40.274658, lng: -4.299281 }, // Q101998869
  { lat: 37.404164, lng: -1.58165 }, // Q101998880
  { lat: 37.404069, lng: -1.579675 }, // Q101998886
  { lat: 42.424722, lng: -2.0835 }, // Q101999064
  { lat: 37.809722222, lng: -2.537222222 }, // Plaça de toros de Huéscar
  { lat: 33.510978, lng: 133.49972 }, // Kōchi Haruno Football Field
  { lat: 41.683664995, lng: -0.89544683 }, // Ibercaja Stadium
  { lat: 52.543161, lng: 13.405359 }, // Friedrich-Ludwig-Jahn-Stadium (Berlin)
  { lat: 43.83489, lng: 4.35963 }, // Amfiteatre de Nimes
  { lat: 37.968333333, lng: 23.741111111 }, // estadi Panathinaikó
  { lat: 37.968333333, lng: 23.741111111 }, // estadi Panathinaikó
  { lat: 37.968333333, lng: 23.741111111 }, // estadi Panathinaikó
  { lat: 37.968333333, lng: 23.741111111 }, // estadi Panathinaikó
  { lat: 63.19027778, lng: 14.65805556 }, // Östersund Ski Stadium
  { lat: 60.983056, lng: 25.634167 }, // Lahti Stadium
  { lat: 39.489444, lng: -0.396389 }, // Estadi Nou Mestalla
  { lat: 43.37861667, lng: 17.59928889 }, // Pecara hall
  { lat: 40.386111, lng: -3.738889 }, // Palacio de Vistalegre
  { lat: 53.969317, lng: -1.0883 }, // Bootham Crescent
  { lat: 51.6839, lng: -4.1476 }, // Stebonheath Park
  { lat: 4.613047, lng: -74.068056 }, // Plaça de toros de Santamaría
  { lat: 53.383436, lng: -2.335158 }, // Moss Lane
  { lat: 42.71549, lng: 2.88997 }, // estadi Aimé Giral
  { lat: 53.516863888, lng: -1.1047 }, // Belle Vue
  { lat: 53.669722, lng: -1.479444 }, // Belle Vue
  { lat: 51.51, lng: -3.581667 }, // Brewery Field
  { lat: 53.699722, lng: -1.6025 }, // Crown Flatt
  { lat: -35.734167, lng: 174.329444 }, // Okara Park
  { lat: 53.765, lng: -1.756944 }, // Odsal Stadium
  { lat: 54.44890833, lng: 18.56173889 }, // Hala Stulecia Sopotu
  { lat: 53.365833, lng: -2.738333 }, // Halton Stadium
  { lat: 53.451667, lng: -2.764444 }, // Knowsley Road, St Helens
  { lat: 53.753889, lng: -0.264722 }, // Craven Park
  { lat: 53.4319, lng: -2.80481 }, // Valerie Park
  { lat: 43.18173, lng: 3.02085 }, // Parc des Sports et de l'Amitié
  { lat: 35.1042, lng: -2.5551 }, // Q3469903
  { lat: 35.149722222, lng: -3.56 }, // Q3469922
  { lat: 53.55491389, lng: -2.65066111 }, // Springfield Park, Wigan
  { lat: 42.70734, lng: 3.0013 }, // estadi Sant Miquel
  { lat: 42.7067, lng: 3.0038 }, // estadi Sant Miquel
  { lat: 43.62519, lng: 1.43547 }, // Stade des Minimes
  { lat: 53.3825, lng: -2.588056 }, // Wilderspool Stadium
  { lat: 37.639167, lng: 21.633056 }, // Stadium at Olympia
  { lat: 54.6487, lng: -3.55105 }, // Borough Park
  { lat: 53.475314, lng: -2.043864 }, // Bower Fold
  { lat: 32.53333333, lng: -117.12138889 }, // Bullring by the Sea
  { lat: 52.406111, lng: -1.525833 }, // Butts Park Arena
  { lat: 53.533694, lng: -1.078081 }, // Castle Park rugby stadium
  { lat: 53.550417, lng: -2.625833 }, // Central Park
  { lat: 53.875278, lng: -1.9025 }, // Cougar Park
  { lat: 54.115, lng: -3.235277777 }, // Craven Park, Barrow-in-Furness
  { lat: 42.732222, lng: -84.488333 }, // Jeff Ishbia Field at McLane Stadium
  { lat: 51.785278, lng: -3.206389 }, // Eugene Cross Park
  { lat: 41.38725, lng: -8.770638888 }, // Póvoa de Varzim Bullfighting Arena
  { lat: 53.662777777, lng: -1.784444444 }, // Fartown Ground, Huddersfield
  { lat: 53.416075, lng: -2.321261 }, // Heywood Road
  { lat: 53.5025, lng: -2.5225 }, // Hilton Park
  { lat: 53.984722, lng: -1.053333 }, // Huntington Stadium
  { lat: 42.840833, lng: -2.664444 }, // Iradier Arena
  { lat: 26.55103, lng: -81.76212 }, // jetBlue Park at Fenway South
  { lat: 43.48777778, lng: -0.77666667 }, // La Moutète
  { lat: 28.041053, lng: -81.963619 }, // RP Funding Center
  { lat: 43.6389, lng: -79.4231 }, // Lamport Stadium
  { lat: 53.491, lng: -2.529 }, // Leigh Sports Village
  { lat: 54.265478, lng: -0.418247 }, // McCain Stadium
  { lat: 51.768019, lng: -0.453564 }, // Pennine Way stadium
  { lat: 54.539722, lng: -3.584167 }, // Recreation Ground
  { lat: 36.634, lng: 137.858 }, // Snow Harp
  { lat: 53.51504, lng: -2.3344 }, // Station Road
  { lat: 51.5939, lng: -3.77595 }, // Talbot Athletic Ground
  { lat: 52.977212, lng: -3.069646 }, // The Rock
  { lat: 53.716111, lng: -1.859167 }, // The Shay
  { lat: 53.724875, lng: -1.888222 }, // Thrum Hall
  { lat: 53.6455, lng: -2.62921 }, // Victory Park, Chorley
  { lat: 42.0669, lng: -87.6928 }, // Welsh–Ryan Arena
  { lat: 53.494, lng: -2.26521 }, // Wheater's Field
  { lat: 51.605, lng: -0.100556 }, // White Hart Lane Community Sports Centre
  { lat: 53.518542, lng: -2.121747 }, // Whitebank Stadium
  { lat: 53.745, lng: -2.98806 }, // Woodlands Memorial Ground
  { lat: 39.228526, lng: -8.688023 }, // Monumental Celestino Graça bullring
  { lat: 51.663469, lng: -3.797161 }, // The Gnoll
  { lat: 53.70722222, lng: -1.63166667 }, // Fox's Biscuits Stadium
  { lat: 40.758055555, lng: -73.843333333 }, // Etihad Park
  { lat: -34.632151118, lng: -58.36505833 }, // Luis Conde Stadium
  { lat: 38.949803, lng: -8.991105 }, // Palha Blanco Bullring
  { lat: 39.201205, lng: -8.627188 }, // Almeirim bullring
  { lat: 38.655, lng: -8.989027777 }, // Q25419525
  { lat: 46.2829401, lng: 11.523786 }, // Centre del fons i de biatló Fabio Canal
  { lat: 53.04416667, lng: -2.97666667 }, // Queensway Stadium
  { lat: 53.80776, lng: -1.62518 }, // McLaren Field
  { lat: 53.2911, lng: -3.7127 }, // Eirias Stadium
  { lat: 53.513638888, lng: -2.276777777 }, // Moor Lane
  { lat: 37.094944444, lng: -8.225472222 }, // Albufeira bullring
  { lat: 41.58523, lng: 12.828778 }, // Palazzetto dello Sport (Cisterna di Latina)
  { lat: 43.73415, lng: -0.87409 }, // Arènes de Gamarde-les-Bains
  { lat: 20.57498978, lng: -100.405273092 }, // Plaza de Toros Santa María
  { lat: 65.001111111, lng: 25.451388888 }, // Heinäpää football stadium
  { lat: -31.3964484, lng: -64.1724512 }, // Q136651225
  { lat: 41.636611111, lng: -0.901805555 }, // Nou Estadi de La Romareda
  { lat: 41.636611111, lng: -0.901805555 }, // Nou Estadi de La Romareda
  { lat: 11.200603515, lng: -4.241121103 }, // Léguéma Stadium
  { lat: 35.672603, lng: 139.718169 }, // Chichibunomiya Rugby Stadium
  { lat: 46.081603, lng: 13.200136 }, // Estadi Friuli
  { lat: 46.783297, lng: 6.647056 }, // Stade Municipal
  { lat: 51.44, lng: -2.620278 }, // Ashton Gate Stadium
  { lat: 45.435356, lng: 10.968647 }, // Estadi Marcantonio Bentegodi
  { lat: 43.583296, lng: 1.434055 }, // Stadium Municipal de Toulouse
  { lat: -41.317222, lng: 174.776944 }, // Athletic Park
  { lat: 44.4922, lng: 11.3098 }, // estadi Renato Dall'Ara
  { lat: 43.632778, lng: -79.418611 }, // BMO Field
  { lat: 52.448056, lng: -1.495556 }, // Ricoh Arena
  { lat: 50.4329, lng: 2.81491 }, // Stade Félix Bollaert
  { lat: -33.891666666, lng: 151.224722222 }, // Sydney Cricket Ground
  { lat: 54.576389, lng: -5.904444 }, // Ravenhill Stadium
  { lat: 45.052184, lng: 7.649993 }, // Stadio di Corso Marsiglia
  { lat: 40.437826, lng: -3.728517 }, // Estadi Nacional Complutense
  { lat: 55.942231, lng: -3.240921 }, // Murrayfield Stadium
  { lat: -45.893611111, lng: 170.490555555 }, // Carisbrook
  { lat: 45.475463, lng: 9.178544 }, // Arena Civica
  { lat: 45.161792, lng: 1.548485 }, // Stade Amédée-Domenech
  { lat: 51.678805555, lng: -4.12775 }, // Stradey Park
  { lat: 45.79001, lng: 3.10755 }, // Parc des sports Marcel-Michelin
  { lat: 44.192608, lng: 0.62052 }, // Stade Armandie
  { lat: 43.4818, lng: -1.537729 }, // Parc des Sports Aguiléra
  { lat: 51.679167, lng: -4.129167 }, // Parc y Scarlets
  { lat: 53.051944, lng: -3.003611 }, // Racecourse Ground
  { lat: 51.450278, lng: -0.344167 }, // Twickenham Stoop
  { lat: 52.624167, lng: -1.133056 }, // Welford Road Stadium
  { lat: 34.668944444, lng: 135.626388888 }, // Hanazono Rugby Stadium
  { lat: 43.119, lng: 5.93656 }, // Stade Mayol
  { lat: 41.926944, lng: 12.472222 }, // Estadi Flaminio
  { lat: -33.970298, lng: 18.468448 }, // Newlands Stadium
  { lat: 42.011739, lng: -4.516136 }, // Estadi Nueva Balastera
  { lat: 51.871667, lng: -2.242778 }, // Kingsholm Stadium
  { lat: 43.48545, lng: -1.4794 }, // Stade Jean Dauger
  { lat: 50.63114, lng: 3.1375 }, // Stadium Lille Métropole
  { lat: 52.674167, lng: -8.6425 }, // Thomond Park
  { lat: 45.025277777, lng: 38.999444444 }, // estadi Kuban
  { lat: 45.680278, lng: 12.213333 }, // Stadio di Monigo
  { lat: 43.621944, lng: 1.415556 }, // Stade Ernest-Wallon
  { lat: -46.416944, lng: 168.362778 }, // Rugby Park Stadium
  { lat: 55.018611, lng: -1.672222 }, // Kingston Park
  { lat: 35.469166666, lng: 139.603611111 }, // Nippatsu Mitsuzawa Stadium
  { lat: -37.781111, lng: 175.268333 }, // Waikato Stadium
  { lat: 53.325611111, lng: -6.229388888 }, // RDS Arena
  { lat: 45.582778, lng: 9.308056 }, // Stadio Brianteo
  { lat: 54.367942, lng: 18.621053 }, // MOSiR Stadium
  { lat: 44.714722, lng: 10.649722 }, // Mapei Stadium - Città del Tricolore
  { lat: -35.318056, lng: 149.134722 }, // Manuka Oval
  { lat: 35.002944, lng: 134.134218 }, // Okayama Prefecture Mimasaka Rugby Soccer Field
  { lat: 24.989444444, lng: 55.463055555 }, // The Sevens
  { lat: -45.869167, lng: 170.524444 }, // Forsyth Barr Stadium
  { lat: 52.362222, lng: 9.780556 }, // Rudolf-Kalweit-Stadion
  { lat: 55.8811, lng: -4.34181 }, // Scotstoun Stadium
  { lat: 45.187474, lng: 5.740194 }, // Stade des Alpes
  { lat: 50.9452, lng: 7.03039 }, // Sportpark Höhenberg
  { lat: -33.94, lng: 18.87361111 }, // Danie Craven Stadium
  { lat: 42.71549, lng: 2.88997 }, // estadi Aimé Giral
  { lat: 38.75193, lng: -9.161882 }, // Estádio Universitário de Lisboa
  { lat: -39.50194444, lng: 176.91277778 }, // McLean Park
  { lat: -40.356666666, lng: 175.601111111 }, // Arena Manawatu
  { lat: -27.441944, lng: 153.017778 }, // Ballymore Stadium
  { lat: -33.006667, lng: 27.905278 }, // Buffalo City Stadium
  { lat: 45.3537, lng: 10.3423 }, // San Michele Stadium
  { lat: -33.981944, lng: 25.639444 }, // Estadi EPRU
  { lat: 34.615339, lng: 135.516572 }, // Yodoko Sakura Stadium
  { lat: 53.451667, lng: -2.764444 }, // Knowsley Road, St Helens
  { lat: 55.6063, lng: -2.78414 }, // Netherdale
  { lat: 43.18173, lng: 3.02085 }, // Parc des Sports et de l'Amitié
  { lat: 51.601389, lng: -3.348056 }, // Sardis Road
  { lat: 44.468893, lng: 26.074991 }, // Stadionul Arcul de Triumf
  { lat: 43.63334, lng: 0.58483 }, // Stade du Moulias
  { lat: 44.92454, lng: 2.42954 }, // Jean Alric stadium
  { lat: 43.712212, lng: -1.045752 }, // Stade Maurice Boyau
  { lat: 44.80944444, lng: 10.32194444 }, // Sergio Lanfranchi Stadium
  { lat: 43.33633, lng: 3.26658 }, // Stade de la Méditerranée
  { lat: 44.825111111, lng: 10.333 }, // Stadio Sergio Lanfranchi
  { lat: 41.841111, lng: 12.47 }, // Stadio Tre Fontane
  { lat: 41.876615, lng: 12.478012 }, // Campo Testaccio
  { lat: 46.0842, lng: 13.239 }, // Rugby Stadium Otello Gerli
  { lat: 45.5115, lng: 10.236 }, // Aldo Invernici Stadium
  { lat: 44.526928, lng: 11.348606 }, // Arcoveggio Stadium
  { lat: 40.846389, lng: 14.224167 }, // Stadio Arturo Collana
  { lat: 44.4058, lng: 8.97889 }, // Stadio Carlini-Bollesan
  { lat: 45.589341666, lng: 8.909780555 }, // Stadio Giovanni Mari
  { lat: 43.875727, lng: 11.109559 }, // Stadio Lungobisenzio
  { lat: 37.4686, lng: 14.0389 }, // Q3967834
  { lat: 40.8618, lng: 14.2744 }, // Stadio Militare dell'Arenaccia
  { lat: 45.0598, lng: 7.6333 }, // Stadio Primo Nebiolo
  { lat: 37.474950592, lng: 15.067406273 }, // Stadio Santa Maria Goretti
  { lat: 52.406111, lng: -1.525833 }, // Butts Park Arena
  { lat: 53.533694, lng: -1.078081 }, // Castle Park rugby stadium
  { lat: -33.868333, lng: 151.109444 }, // Concord Oval
  { lat: 53.875278, lng: -1.9025 }, // Cougar Park
  { lat: 54.4975, lng: 18.530833 }, // National Rugby Stadium
  { lat: 53.9081, lng: -1.68722 }, // Cross Green
  { lat: 53.662777777, lng: -1.784444444 }, // Fartown Ground, Huddersfield
  { lat: 49.3906, lng: 8.6681 }, // Fritz-Grunebaum-Sportpark
  { lat: -34.157, lng: -70.7449 }, // Medialuna de Rancagua
  { lat: -40.5737, lng: -73.1072 }, // Q9031045
  { lat: 40.66701, lng: 22.90822 }, // Agrotikos Asteras Stadium
  { lat: 40.42505, lng: 22.93612 }, // Stadium of Epanomi 'Nikos Sarafis'
  { lat: 53.5013006, lng: -2.0797045 }, // Hurst Cross Stadium
  { lat: 40.296299, lng: 20.017072 }, // Sabaudin Shehu Stadium
  { lat: 53.875425, lng: 27.554848 }, // Lokomotiv Stadium
  { lat: 64.18236111, lng: -51.69680556 }, // Arctic Stadium
  { lat: 47.717217, lng: 8.666693 }, // Berformance Arena
  { lat: 39.168166666, lng: 8.513444444 }, // Stadio Carlo Zoboli
  { lat: 31.92466667, lng: 34.86652778 }, // Ramla Municipal Stadium
  { lat: 8.9596, lng: -75.455916 }, // Estadio Armando Tuirán Paternina
  { lat: 41.374224, lng: 2.050506 }, // Estadi Johan Cruyff
  { lat: 41.63426, lng: 13.321866 }, // Benito Stirpe Stadium
  { lat: 48.081694444, lng: 19.289361111 }, // Kövi Pál Sports Center
  { lat: 38.631052, lng: -90.210921 }, // Energizer Park
  { lat: 53.5175, lng: 28.150833333 }, // Haradski Stadium (Marjina Horka)
  { lat: 63.085278, lng: 21.627778 }, // Q31273635
  { lat: 40.2917128, lng: -3.8260961 }, // Estadi Fernando Torres
  { lat: 47.503035, lng: 19.097929 }, // Puskás Aréna
  { lat: 9.511787, lng: -13.703581 }, // Stade de la mission
  { lat: 11.19069444, lng: -74.19916667 }, // Estadio Sierra Nevada
  { lat: 9.995833333, lng: -84.243611111 }, // Estadio Rafael Bolaños
  { lat: 38.9138, lng: 1.41511 }, // Can Misses
  { lat: 1.481722222, lng: 103.61925 }, // Sultan Ibrahim Stadium
  { lat: -34.878528, lng: -56.129159 }, // Q48781911
  { lat: 40.48388889, lng: -111.97944444 }, // Zions Bank Stadium
  { lat: -3.11189, lng: -60.0175 }, // Q48879597
  { lat: 39.111388888, lng: -84.522222222 }, // TQL Stadium
  { lat: 53.513638888, lng: -2.276777777 }, // Moor Lane
  { lat: 33.471398, lng: 44.373578 }, // Ammo Baba stadium
  { lat: 41.151667, lng: 24.13625 }, // Doxa Drama Stadium
  { lat: 33.4980615, lng: -86.8125946 }, // PNC Field
  { lat: 46.764171029, lng: 23.63032108 }, // Baza Sportivă Dan Anca
  { lat: 40.82979, lng: 17.35274 }, // Q55831780
  { lat: 39.070746, lng: -77.545434 }, // Segra Field
  { lat: 30.388206, lng: -97.719837 }, // Q2 Stadium
  { lat: -11.02979, lng: -68.73639 }, // Q56349556
  { lat: 33.354388888, lng: 44.455583333 }, // Al-Madina Stadium
  { lat: 33.67446, lng: -117.739335 }, // Championship Soccer Stadium
  { lat: 45.573108333, lng: 9.275208333 }, // Q58383927
  { lat: 47.173694, lng: 18.415361 }, // Sóstói Stadion
  { lat: -34.75258, lng: -58.592472222 }, // Estadio Ciudad de Laferrere
  { lat: 34.693194, lng: 32.939278 }, // Limassol Arena
  { lat: 51.338422, lng: 3.293178 }, // Burgemeester Graaf Leopold Lippens Park
  { lat: 55.805, lng: 37.698611111 }, // Cherenkov academy stadium
  { lat: 44.7966, lng: 20.50048 }, // Stadion Hajduk Lion
  { lat: 42.3825, lng: -8.696944444 }, // Q61378808
  { lat: 46.1925, lng: 21.311944444 }, // Stadionul Francisc von Neuman
  { lat: 12.5804, lng: -81.701241666 }, // Erwin O'Neil Stadium
  { lat: 5.943819, lng: -57.032715 }, // Asraf Peerkhan Stadion
  { lat: 42.409805555, lng: 11.869472222 }, // Q63982828
  { lat: 48.021536, lng: 7.830006 }, // Europa-Park-Stadion
  { lat: 39.96846, lng: -83.01709 }, // ScottsMiracle-Gro Field
  { lat: 44.413169235, lng: 26.040313104 }, // Stadionul Steaua
  { lat: 53.879444444, lng: 27.613333333 }, // National Football Stadium
  { lat: -11.724166666, lng: 43.241111111 }, // Stade omnisports de Malouzini
  { lat: 52.728055555, lng: 41.4525 }, // Spartak Stadium
  { lat: 26.193055555, lng: -80.161111111 }, // Chase Stadium
  { lat: 17.010638888, lng: -96.572897222 }, // Estadio Independiente MRCI
  { lat: 37.047534, lng: 35.812629 }, // Ceyhan Stadium
  { lat: 39.720583, lng: 43.040783 }, // Vali Lütfü Yiğenoğlu Stadium
  { lat: 40.989885634, lng: 28.790397364 }, // Yeşilova Kemal Aktaş Stadium
  { lat: 38.2595903, lng: -85.7332636 }, // Lynn Family Stadium
  { lat: 28.479715, lng: 36.488668 }, // King Khalid Sport City Stadium
  { lat: 28.479603, lng: 36.488741 }, // King Khalid Sport City Stadium
  { lat: 32.795143, lng: -79.902983 }, // Patriots Point Soccer Complex
  { lat: 40.646388888, lng: -4.701666666 }, // Estadi Adolfo Suárez
  { lat: 34.62356, lng: 43.626175 }, // Salah Al Din Stadium
  { lat: 39.210277777, lng: -84.506111111 }, // RDI Stadium
  { lat: 44.78875, lng: 20.459111111 }, // Q86666021
  { lat: 41.881727, lng: 12.450746 }, // Trastevere Stadium
  { lat: 51.643056, lng: 17.821389 }, // Ostrów Wielkopolski Municipal Stadium
  { lat: 1.633458269, lng: 7.415458817 }, // Estadi Regional 13 de Junho
  { lat: 50.1103858, lng: 14.2007408 }, // Q89041394
  { lat: -20.27395, lng: 57.47539 }, // Q94368037
  { lat: 23.277482, lng: -106.382939 }, // El Kraken
  { lat: 47.4425, lng: 19.155111111 }, // Bozsik Aréna
  { lat: 47.88928, lng: -3.916541 }, // Q97162444
  { lat: 47.88928, lng: -3.916541 }, // Q97162444
  { lat: 47.88928, lng: -3.916541 }, // Q97162444
  { lat: 50.3345, lng: 18.7764 }, // Sparta Zabrze stadium
  { lat: 52.300167, lng: 20.943833 }, // Hutnik Warszawa stadium
  { lat: 49.17912, lng: 2.23169 }, // Q97464644
  { lat: 44.455888888, lng: 26.056805555 }, // Estadi Rapid-Giulești
  { lat: -37.3326129, lng: -59.143922187 }, // Estadio Municipal General San Martín
  { lat: -27.7928962, lng: -64.2493342 }, // Doctores José y Antonio Castiglione Stadium
  { lat: 20.0809491, lng: 41.5243977 }, // King Saud Sport City
  { lat: 47.841121, lng: 16.257468 }, // Arena Wiener Neustadt
  { lat: 40.946684789, lng: -5.665987632 }, // Q100977301
  { lat: 45.783055555, lng: 24.143611111 }, // Estadi Municipal de Sibiu
  { lat: 50.521369, lng: 22.147389 }, // Stadion Miejski
  { lat: 45.089194444, lng: 27.272361111 }, // Stadionul Orășenesc
  { lat: 44.380583333, lng: 26.087833333 }, // Stadionul Progresul Spartac
  { lat: 44.559722222, lng: 23.526555555 }, // Stadionul Orășenesc
  { lat: 41.59973, lng: 9.27743 }, // Q104875541
  { lat: 41.6003, lng: 9.2777 }, // Q104875541
  { lat: 48.696666666, lng: 21.245277777 }, // Košická Futbalová Aréna
  { lat: -0.349166666, lng: -78.470555555 }, // Estadio de Independiente del Valle
  { lat: 32.073127777, lng: 131.491838888 }, // Ichigo Miyazaki Shintomi Football Stadium
  { lat: 36.3375, lng: 139.645277777 }, // City Football Station
  { lat: 39.866861111, lng: 4.261305555 }, // Estadi de Bintaufa
  { lat: 47.3722, lng: 16.1186 }, // Pinkafeld Stadium
  { lat: 35.55762, lng: 45.37483 }, // Newroz International Stadium
  { lat: 51.03293, lng: 13.80188 }, // Q108544621
  { lat: -34.471694756, lng: -58.507004261 }, // Club Atlético San Isidro Stadium
  { lat: 50.87467, lng: 8.06946 }, // Herkules Arena
  { lat: 26.365, lng: 50.181 }, // Aramco Stadium
  { lat: 40.53453, lng: 34.92282 }, // Çorum City Stadium
  { lat: 40.6406, lng: 48.6355 }, // Shamakhi City Stadium
  { lat: 50.270111111, lng: 19.016194444 }, // Q109652311
  { lat: 53.286944, lng: -3.848056 }, // Y Morfa
  { lat: 43.658620968, lng: 17.949822885 }, // City Stadium Konjic
  { lat: 52.097778, lng: 20.620417 }, // Miejski Stadion Sportowy
  { lat: 44.539212305, lng: 19.230742111 }, // Estadi Lagator
  { lat: 45.77594, lng: 4.93419 }, // Q109750738
  { lat: 4.0154232, lng: 9.2022129 }, // Limbe Centenary Stadium
  { lat: 37.62730409, lng: -0.836669063 }, // Ángel Celdrán Stadium
  { lat: 23.8239025, lng: 90.4699552 }, // Bashundhara Kings Arena
  { lat: 39.0322523, lng: -84.456999 }, // NKU Soccer Stadium
  { lat: 43.316349, lng: 5.433513 }, // Sevan Stadium
  { lat: 34.693333333, lng: 32.938888888 }, // Limassol Arena
  { lat: 45.24892, lng: 19.793708 }, // GAT Arena
  { lat: 43.810833333, lng: 4.356388888 }, // Antonins Stadium
  { lat: 35.428443023, lng: 7.146491503 }, // Amar Hamam Stadium
  { lat: 50.2064, lng: 15.8454 }, // Malšovická aréna
  { lat: -24.18067, lng: -65.31634 }, // La Tablada Stadium
  { lat: 33.430555555, lng: 44.284722222 }, // Tajiat Olympic Stadium
  { lat: 56.908, lng: 24.155 }, // Parc d'Esports LNK
  { lat: -33.343888888, lng: -60.264444444 }, // Unique San Nicolás Stadium
  { lat: 49.143849, lng: -122.665662 }, // Willoughby Community Park Stadium
  { lat: 46.29746, lng: 4.8135 }, // Q118957156
  { lat: 46.29746, lng: 4.8135 }, // Q118957156
  { lat: 9.417138531, lng: -82.523861474 }, // Q119238528
  { lat: 46.00015, lng: 4.70864 }, // Stade Armand Chouffet
  { lat: 51.511972222, lng: -3.608916666 }, // SDM Glass Stadium
  { lat: 38.418378495, lng: 15.910853838 }, // Q122092563
  { lat: 40.641301849, lng: 15.645654106 }, // Donato Curcio stadium
  { lat: -27.7926759, lng: -64.2766388 }, // Arturo 'Jiya' Miranda Stadium
  { lat: 38.951342, lng: 121.61985 }, // Dalian Suoyuwan Football Stadium
  { lat: 61.5003, lng: 23.7853 }, // Estadi de Tammela
  { lat: 3.582795, lng: -76.4857815 }, // Q124249668
  { lat: 31.448625395, lng: 35.101919251 }, // Yatta International Stadium
  { lat: -32.93598553, lng: -71.516054514 }, // Estadio Atlético Municipal de Concón
  { lat: 42.610242119, lng: 14.053522966 }, // Q124540722
  { lat: -27.729777777, lng: -64.248444444 }, // Estadio Ciudad de La Banda
  { lat: -34.670305555, lng: -58.371 }, // Estadio de la Doble Visera
  { lat: 9.082635177, lng: -79.516500873 }, // Q124957151
  { lat: -33.68155287, lng: -71.187220972 }, // Estadio Soinca Bata
  { lat: 46.990866, lng: 12.540609 }, // Q125194815
  { lat: 21.540222682, lng: 39.126873327 }, // Jeddah Central Stadium
  { lat: 51.651111111, lng: 39.147222222 }, // Fakel
  { lat: 43.83489, lng: 4.35963 }, // Amfiteatre de Nimes
  { lat: 36.72038466, lng: -4.410797214 }, // Plaza de toros de la Malagueta
  { lat: 39.466667, lng: -0.37625 }, // Plaça de Bous de València
  { lat: 40.432083, lng: -3.663278 }, // Las Ventas
  { lat: 40.386111, lng: -3.738889 }, // Palacio de Vistalegre
  { lat: 42.815866, lng: -1.639548 }, // Plaza de Toros de Pamplona
  { lat: 4.613047, lng: -74.068056 }, // Plaça de toros de Santamaría
  { lat: 37.88207315, lng: -4.794915465 }, // Plaza de Toros de los Califas
  { lat: 10.253611, lng: -67.599014 }, // Maestranza César Girón
  { lat: 43.2976, lng: -1.9687 }, // Donostia Arena 2016
  { lat: 43.255278, lng: -2.9375 }, // Plaza de Toros de Bilbao
  { lat: 32.53333333, lng: -117.12138889 }, // Bullring by the Sea
  { lat: 25.588511, lng: -103.403385 }, // Coliseo Centenario
  { lat: 41.38725, lng: -8.770638888 }, // Póvoa de Varzim Bullfighting Arena
  { lat: 20.0653, lng: -98.7803 }, // Q5477602
  { lat: 42.840833, lng: -2.664444 }, // Iradier Arena
  { lat: 40.02796389, lng: -3.60360833 }, // Plaza de toros de Aranjuez
  { lat: 38.9975, lng: -1.86361111 }, // plaza de toros de Albacete
  { lat: 19.770391, lng: -104.362403 }, // Q6080278
  { lat: -0.163258, lng: -78.484 }, // Q6080284
  { lat: 37.189072389, lng: -3.607667835 }, // Plaza de toros de Granada
  { lat: 38.988928, lng: -3.379039 }, // Q6080335
  { lat: 28.47, lng: -16.26 }, // Bullring of Santa Cruz de Tenerife
  { lat: 41.63916667, lng: -4.73694444 }, // Plaza de toros de Valladolid
  { lat: 38.162536111, lng: -3.0075 }, // Villanueva del Arzobispo's bullring
  { lat: 41.5102, lng: -5.74552 }, // plaza de toros de Zamora
  { lat: 1.594083333, lng: -75.644 }, // Q6352008
  { lat: 40.325955555, lng: -3.758633333 }, // La Cubierta, Leganés
  { lat: 40.977327, lng: -5.66113 }, // plaza de toros de La Glorieta
  { lat: 37.76754, lng: -3.78331 }, // Plaza de Toros de Jaén
  { lat: 37.26542, lng: -6.95159 }, // Plaza de toros de La Merced
  { lat: 42.471389, lng: -2.437222 }, // plaza de toros de Logroño
  { lat: 41.654444444, lng: -0.891575 }, // bullring of Zaragoza
  { lat: 41.654444444, lng: -0.891575 }, // bullring of Zaragoza
  { lat: 38.874488, lng: -7.184998 }, // Coliseu de Elvas
  { lat: 39.228526, lng: -8.688023 }, // Monumental Celestino Graça bullring
  { lat: 39.874666666, lng: -8.538055555 }, // Abiul Bullring
  { lat: 42.43016, lng: -8.65187 }, // plaza de toros de Pontevedra
  { lat: 38.765277777, lng: -0.613333333 }, // Plaça de Bous de Bocairent
  { lat: 38.949803, lng: -8.991105 }, // Palha Blanco Bullring
  { lat: 38.08887, lng: -1.7992 }, // Cehegín Bullring
  { lat: 38.23652, lng: -1.41347 }, // Q24023637
  { lat: 32.319684, lng: 35.028425 }, // Tulkarm International Stadium
  { lat: -12.0725, lng: -77.054611111 }, // Estadio Víctor Manuel III
  { lat: 24.86, lng: 46.696 }, // King Salman International Stadium
  { lat: 24.46, lng: 46.6 }, // Roshn Stadium
  { lat: 22.4, lng: 39.083333333 }, // King Abdullah Economic City Stadium
  { lat: 24.558757268, lng: 46.671848001 }, // South Riyadh Stadium
  { lat: 28.131088, lng: 34.920757 }, // NEOM Stadium
  { lat: 24.707245551, lng: 46.789358438 }, // Qiddiya Coast Stadium
  { lat: -27.778121, lng: -64.256549 }, // Q129220501
  { lat: 47.970277777, lng: 21.712777777 }, // Városi Stadion
  { lat: 41.86879, lng: -71.38259 }, // Centreville Bank Stadium
  { lat: 6.8650426, lng: 3.7036977 }, // Remo Stars Stadium
  { lat: -27.724688194, lng: -64.239791388 }, // Q130355237
  { lat: 48.664694444, lng: 33.068555555 }, // Olimp Stadium
  { lat: 34.005218, lng: -6.845432 }, // Al Medina Stadium
  { lat: 51.487363, lng: 5.679116 }, // GS Staalwerken Stadion
  { lat: 53.463333333, lng: -2.296666666 }, // New Trafford
  { lat: -10.7308918, lng: 25.4842563 }, // Stade Dominique Diur
  { lat: -1.622715, lng: 29.138792 }, // Stade de mugunga
  { lat: -8.026858814, lng: -79.073437283 }, // Estadio César Acuña Peralta
  { lat: -14.043055555, lng: -75.697222222 }, // Q134698473
  { lat: 42.533527, lng: 1.575941 }, // Nou Estadi d'Encamp
  { lat: 33.959861, lng: -6.889111 }, // Prince Moulay Abdellah Stadium
  { lat: 50.4775034, lng: 4.201314 }, // Q135110334
  { lat: 63.671989023, lng: 22.693998114 }, // Project Liv Arena
  { lat: 63.671989023, lng: 22.693998114 }, // Project Liv Arena
  { lat: 52.997692, lng: -2.214925 }, // Lyme Valley Stadium
  { lat: 11.106505, lng: -13.809515 }, // Q136194292
  { lat: 35.283141513, lng: -2.94515423 }, // Camp de Futbol de l'Espiguera
  { lat: 52.543161, lng: 13.405359 }, // Friedrich-Ludwig-Jahn-Stadium (Berlin)
  { lat: -36.223648, lng: -61.121821 }, // Q137885729
  { lat: 41.636611111, lng: -0.901805555 }, // Nou Estadi de La Romareda
  { lat: 41.636611111, lng: -0.901805555 }, // Nou Estadi de La Romareda
  { lat: 61.508792384, lng: 23.811596653 }, // Kauppi Football Stadium
  { lat: 61.590694444, lng: 9.756611111 }, // Q138532613
  { lat: 14.69912, lng: -16.45445 }, // Q139501807
  { lat: 1.512917457, lng: -50.905332289 }, // Estádio Municipal Nelson da Costa
  { lat: -20.016583, lng: 23.405204 }, // Maun Sports Complex
  { lat: 52.286666666, lng: 20.958888888 }, // Zygmun Szelest Stadium
  { lat: 15.619722222, lng: -16.242222222 }, // Stade Alboury Ndiaye
  { lat: -38.0367, lng: 145.3732 }, // Holm Park Recreation Reserve
  { lat: 33.957222222, lng: -6.891388888 }, // Prince Moulay Abdellah Olympic Annex Stadium
  { lat: 30.591944444, lng: 32.292222222 }, // Suez Canal Stadium
  { lat: 23.725737882, lng: 90.414696512 }, // Shaheed Tajuddin Ahmad Indoor Stadium
  { lat: 13.511597903, lng: 2.116841378 }, // Stade Municipal
  { lat: 4.650202, lng: -74.097157 }, // Vive Claro
  { lat: -33.405093083, lng: -70.661081875 }, // Estadio Independencia
  { lat: 52.244633, lng: 15.525971 }, // Q135000211
  { lat: 28.002566666, lng: -15.404461111 }, // Q135108656
  { lat: 10.041244, lng: -73.24175 }, // Q135206872
  { lat: 52.345689, lng: 4.854888 }, // Q135302483
  { lat: 10.933333333, lng: 108.093888888 }, // Q135438868
  { lat: 18.235277777, lng: 99.489536111 }, // Q135440190
  { lat: 12.418211111, lng: -86.870897222 }, // Rigoberto López Pérez Stadium
  { lat: 11.975377777, lng: -86.104513888 }, // Estadio Roberto Clemente
  { lat: 12.152480555, lng: -86.27225 }, // Roberto Clemente Stadium (Managua)
  { lat: 52.997692, lng: -2.214925 }, // Lyme Valley Stadium
  { lat: 52.682711433, lng: 14.897171791 }, // Q136399782
  { lat: 52.837789545, lng: 15.819363514 }, // Q136514592
  { lat: -2.487727332, lng: 28.899708957 }, // Kamarampaka Stadium
  { lat: 35.272508628, lng: -2.944123351 }, // Pabelló Guillermo García Pezzi
  { lat: 11.200603515, lng: -4.241121103 }, // Léguéma Stadium
  { lat: 42.001549, lng: 12.726261 }, // Q138039517
  { lat: 21.34543, lng: 40.461677 }, // Okadh Sport Club Stadium
  { lat: 22.186027777, lng: 90.757416666 }, // Char Fasson Upazila  Mini Stadium
  { lat: -6.607921, lng: -79.40616 }, // Complejo Juan Pablo II
  { lat: 52.997692, lng: -2.214925 }, // Lyme Valley Stadium
  { lat: 55.874667, lng: 26.550619 }, // Celtnieks Stadium
  { lat: 50.0815, lng: 9.0593 }, // Q2360118
  { lat: 50.9175, lng: 6.94361 }, // Südstadion
  { lat: 51.409028, lng: 6.778639 }, // Schauinsland-Reisen-Arena
  { lat: 46.329876, lng: 11.605704 }, // Estadi de salts Giuseppe Dal Ben
  { lat: 37.913038, lng: 139.036142 }, // Niigata City Athletic Stadium
  { lat: 51.7014, lng: -3.03444 }, // Pontypool Park
  { lat: -1.301389, lng: 36.771389 }, // RFUEA Ground
  { lat: 36.168259, lng: 139.402453 }, // Kumagaya Rugby Stadium
  { lat: 35.121101, lng: 136.942643 }, // Mizuho Rugby Stadium
  { lat: 34.37638889, lng: 132.4216667 }, // Q11484894
  { lat: 39.72155, lng: 140.0992778 }, // Akigin Stadium
  { lat: 32.77508, lng: 129.861207 }, // Nagasaki Municipal Rugby-Soccer Stadium
  { lat: -25.6625, lng: 27.221944 }, // Olympia Park
  { lat: -18.8951, lng: 47.495 }, // Stade Makis
  { lat: 33.891444, lng: 130.888861 }, // Mikuni World Stadium Kitakyūshū
  { lat: 39.327778, lng: 141.892222 }, // Kamaishi Recovery Memorial Stadium
  { lat: 45.64184, lng: 0.17625 }, // Stade Chanzy
  { lat: 42.241388888, lng: 42.685833333 }, // Aia Arena
  { lat: 49.577138888, lng: 6.115730555 }, // Estadi de Luxemburg
  { lat: 29.6345, lng: -95.3899 }, // Aveva Stadium
  { lat: 44.46889, lng: 26.07492 }, // Stadionul Arcul de Triumf (1913)
  { lat: 43.10376, lng: -0.05861 }, // Stade Antoine-Béguère
  { lat: 49.43232, lng: 1.07227 }, // Stade Jean-Mermoz
  { lat: 45.477851, lng: 9.232921 }, // Mario Giuriati Sports Centre
  { lat: 55.94168, lng: -3.24479 }, // Edinburgh Rugby Stadium
  { lat: 41.5676, lng: 44.994 }, // Rustavi Rugby stadium
  { lat: 41.59973, lng: 9.27743 }, // Q104875541
  { lat: 41.6003, lng: 9.2777 }, // Q104875541
  { lat: -34.471694756, lng: -58.507004261 }, // Club Atlético San Isidro Stadium
  { lat: 45.439993, lng: 10.95255 }, // Payanini Center
  { lat: 45.528732853, lng: 11.523104905 }, // Rugby Arena
  { lat: 41.86879, lng: -71.38259 }, // Centreville Bank Stadium
];

export const MONUMENTS_CULTURALS = [
  { lat: 51.812499, lng: -2.7168518 }, // Castell de Monmouth
  { lat: 31.780094444, lng: 35.234302777 }, // Fortalesa Antònia
  { lat: 40.828315, lng: 14.247656 }, // Castell de l'Ou
  { lat: 47.557488542, lng: 10.749441807 }, // castell de Neuschwanstein
  { lat: 53.3402, lng: -1.7772 }, // castell de Peveril
  { lat: 38.349, lng: -0.478 }, // castell de la Santa Bàrbara
  { lat: 49.93955, lng: 14.187933 }, // Castell de Karlštejn
  { lat: 55.9487, lng: -3.20073 }, // castell d'Edimburg
  { lat: 45.702454, lng: 13.712318 }, // Castell de Miramar
  { lat: 50.6875, lng: -1.31389 }, // castell de Carisbrooke
  { lat: 54.8972, lng: -2.94167 }, // castell de Carlisle
  { lat: 10.42222, lng: -75.53806 }, // Castillo San Felipe de Barajas
  { lat: 53.67613, lng: 23.82538 }, // New Grodno Castle
  { lat: 50.058055555, lng: 7.765555555 }, // Stahleck Castle
  { lat: 48.531675138, lng: 12.152121628 }, // Trausnitz Castle
  { lat: 48.39166667, lng: 17.33555556 }, // Červený Kameň Castle
  { lat: 45.135834, lng: 7.623519 }, // Palau reial de Venaria
  { lat: 49.194444, lng: 16.598889 }, // Špilberk Castle
  { lat: 48.7772, lng: 9.17917 }, // Castell Antic
  { lat: 61.0035132, lng: 24.4598186 }, // Castell de Häme
  { lat: 51.576052, lng: -3.2203334 }, // castell de Caerphilly
  { lat: 40.06214, lng: 19.79071 }, // Porto Palermo Fortress
  { lat: 51.5082, lng: -0.076198055 }, // Torre de Londres
  { lat: 35.18222, lng: 24.23389 }, // Frangokàstel·lo
  { lat: 58.812083333, lng: 26.544222222 }, // Laiuse Castle
  { lat: 56.038611111, lng: 12.621944444 }, // Castell de Kronborg
  { lat: 44.76891, lng: 7.675731 }, // Palau de Racconigi
  { lat: 42.594027777, lng: -1.215833333 }, // Castell de Xavier
  { lat: 54.3221, lng: -1.94991 }, // Bolton Castle
  { lat: 49.346944, lng: 2.980278 }, // Castell de Pierrefonds
  { lat: 40.45613, lng: 49.980058 }, // Ramana Tower
  { lat: 48.3792, lng: 16.3089 }, // Burg Kreuzenstein
  { lat: 41.21527778, lng: -4.52555556 }, // castell de Coca
  { lat: 38.837222, lng: 46.980833 }, // Babak Castle
  { lat: 50.966111111, lng: 10.306388888 }, // Castell de Wartburg
  { lat: 59.375555555, lng: 28.200833333 }, // Castell de Hermann
  { lat: 54.9756, lng: -3.524 }, // Caerlaverock Castle
  { lat: 50.810194444, lng: 8.767 }, // Marburg Castle
  { lat: 37.064444444, lng: 49.239722222 }, // Rudkhan Castle
  { lat: 52.2956, lng: -0.38716 }, // Castell de Kimbolton
  { lat: 34.910519, lng: 33.637686 }, // Larnaca Castle
  { lat: 52.860004, lng: -4.1091644 }, // castell de Harlech
  { lat: 56.65805556, lng: 16.35527778 }, // Kalmar Castle
  { lat: 56.95095, lng: 24.100636111 }, // Castell de Riga
  { lat: 44.76938889, lng: 7.67597222 }, // Palau de Racconigi
  { lat: 45.8695494, lng: 15.9407651 }, // Medvedgrad
  { lat: 56.57153905, lng: -5.386192104 }, // Castell Stalker
  { lat: 48.521944444, lng: 26.498333333 }, // Khotyn Fortress
  { lat: 37.89142, lng: 22.870921 }, // Acrocorint
  { lat: 36.533333333, lng: 31.993333333 }, // Alanya Castle
  { lat: 48.842777777, lng: 2.435833333 }, // castell de Vincennes
  { lat: 47.496111111, lng: 19.039722222 }, // castell de Buda
  { lat: 59.906605907, lng: 10.736247885 }, // fortalesa d'Akershus
  { lat: 47.403769444, lng: 16.424438888 }, // Lockenhaus Castle
  { lat: 51.177222, lng: 15.759222 }, // Grodziec Castle
  { lat: 55.9257, lng: -3.14089 }, // Castell de Craigmillar
  { lat: 53.426205, lng: 14.560361 }, // Ducal Castle
  { lat: 50.333333333, lng: 26.516666666 }, // Ostroh Castle
  { lat: 48.087777777, lng: 9.216944444 }, // Sigmaringen Castle
  { lat: 46.75593, lng: 14.45241 }, // Hochosterwitz Castle
  { lat: 49.450833333, lng: 16.318888888 }, // Pernštejn Castle
  { lat: 41.084722222, lng: 29.056111111 }, // Rumeli Hisari
  { lat: 35.595833, lng: 36.057222 }, // castell de Saladí
  { lat: 45.7491, lng: 22.8883 }, // Castell de Hunyad
  { lat: 48.658236, lng: 20.600325 }, // Krásna Hôrka Castle
  { lat: 45.515, lng: 25.3671 }, // Castell de Bran
  { lat: 50.186971166, lng: 12.754438 }, // Loket Castle
  { lat: 50.205, lng: 7.336666666 }, // castell d'Eltz
  { lat: 54.039722222, lng: 19.027777777 }, // Castell de Malbork
  { lat: 55.4885, lng: -1.59351 }, // Castell de Dunstanburgh
  { lat: 47.795, lng: 13.0473 }, // Fortalesa Hohensalzburg
  { lat: 56.403611111, lng: 24.173611111 }, // Castell de Bauska
  { lat: 61.8637134, lng: 28.9012379 }, // Olavinlinna
  { lat: 52.413277777, lng: -4.089503888 }, // Aberystwyth Castle
  { lat: 50.1081657, lng: 11.4638686 }, // Plassenburg
  { lat: 33.511667, lng: 36.301944 }, // Ciutadella de Damasc
  { lat: 48.142222222, lng: 17.1 }, // Castell de Bratislava
  { lat: 48.06545, lng: 16.37254 }, // Franzensburg
  { lat: 50.490277777, lng: 15.135 }, // Kost Castle
  { lat: 49.300277777, lng: 17.393055555 }, // Palau de l'Arquebisbe de Kroměříž
  { lat: 59.34777778, lng: 26.35222222 }, // Rakvere Castle
  { lat: 48.594722, lng: 6.4925 }, // castell de Lunéville
  { lat: 29.195556, lng: 53.230833 }, // Sarvestan Palace
  { lat: 50.6376, lng: -4.36142 }, // Launceston Castle
  { lat: 52.3672, lng: -2.72301 }, // Castell de Ludlow
  { lat: 48.323561111, lng: 8.9674 }, // Burg Hohenzollern
  { lat: 50.51625, lng: 15.230833 }, // castell de Trosky
  { lat: 47.06525, lng: 9.500277777 }, // Gutenberg Castle
  { lat: 55.9785, lng: -3.60097 }, // Linlithgow Palace
  { lat: 42.0463319, lng: 19.493 }, // Rozafa Fortress
  { lat: 53.451266666, lng: 26.472894444 }, // Castell de Mir
  { lat: 51.890589, lng: 0.903047 }, // Colchester Castle
  { lat: 49.808889, lng: 14.926389 }, // Český Šternberk Castle
  { lat: 49.410555555, lng: 8.715833333 }, // Castell de Heidelberg
  { lat: 47.32164244, lng: 7.900932502 }, // Aarburg Castle
  { lat: 48.206388888, lng: 16.365277777 }, // Hofburg
  { lat: 52.243917, lng: 17.090843 }, // Castell de Kórnik
  { lat: 51.166596, lng: 13.471376 }, // Albrechtsburg
  { lat: 46.154694444, lng: 15.651083333 }, // castell de Veliki Tabor
  { lat: 50.037777777, lng: 13.8725 }, // Křivoklát Castle
  { lat: 56.2548, lng: -3.20609 }, // Falkland Palace
  { lat: 58.359166666, lng: 25.595277777 }, // Castell de Viljandi
  { lat: 48.156111111, lng: 12.828888888 }, // Burghausen Castle
  { lat: 56.454652777, lng: -5.436936111 }, // Castell de Dunstaffnage
  { lat: 49.81417, lng: 6.08694 }, // Castell de Berg
  { lat: 50.0544, lng: 19.9366 }, // castell de Wawel
  { lat: 47.38752385, lng: 8.185309862 }, // Castell de Lenzburg
  { lat: 51.483888888, lng: -0.604444444 }, // castell de Windsor
  { lat: 50.271917, lng: 7.649444 }, // Marksburg
  { lat: 39.56375, lng: 2.619338888 }, // castell de Bellver
  { lat: 50.09, lng: 14.4 }, // castell de Praga
  { lat: 49.325, lng: 8.11861 }, // Hambach Castle
  { lat: 47.2689, lng: 11.3944 }, // Hofburg, Innsbruck
  { lat: 50.846125, lng: 14.876189 }, // Grabštejn
  { lat: 53.955833333, lng: -1.08 }, // York Castle
  { lat: 38.71389, lng: -9.13333 }, // Castell de Sant Jordi de Lisboa
  { lat: 39.94166667, lng: 32.865 }, // Ankara Castle
  { lat: 52.69666667, lng: -8.81180556 }, // castell de Bunratty
  { lat: 36.604722222, lng: 47.234166666 }, // Takht-e Soleyman
  { lat: 51.167572222, lng: 13.679611111 }, // castell de Moritzburg
  { lat: 45.471005, lng: 9.179693 }, // Castell Sforzesco
  { lat: 36.14389, lng: -5.35 }, // Moorish Castle
  { lat: 45.736902, lng: 7.489013 }, // castell de Fénis
  { lat: 48.64361, lng: 15.59465 }, // Abadia d'Altenburg
  { lat: 42.875555555, lng: 1.8325 }, // castell de Montsegur
  { lat: 36.199166666, lng: 37.1625 }, // ciutadella d'Alep
  { lat: 48.894166666, lng: 18.044722222 }, // Trenčín Castle
  { lat: 49.261666666, lng: 19.358055555 }, // Castell d'Orava
  { lat: 54.883333333, lng: 24.85 }, // Kernavė
  { lat: 53.139306, lng: -4.276889 }, // castell de Caernarfon
  { lat: 59.325833333, lng: 18.071388888 }, // Tre Kronor Castle
  { lat: 60.4352823, lng: 22.2276388 }, // castell de Turku
  { lat: 45.070028, lng: 7.51025 }, // Castle of Rivoli
  { lat: 54.710342, lng: 20.509558 }, // castell de Königsberg
  { lat: 47.458383333, lng: 8.743380555 }, // Kyburg Castle
  { lat: 46.071571, lng: 11.127037 }, // Castell del Buonconsiglio
  { lat: 56.056388888, lng: -2.650555555 }, // Castell Tantallon
  { lat: 56.2008, lng: -3.39179 }, // Loch Leven Castle
  { lat: 38.871556, lng: -1.093397 }, // Castle of Almansa
  { lat: 57.014753016, lng: -3.391476198 }, // Braemar Castle
  { lat: 52.52, lng: -7.89 }, // Rock of Cashel
  { lat: 50.441388888, lng: 17.769444444 }, // Moszna Castle
  { lat: 60.715833333, lng: 28.728888888 }, // Vyborg Castle
  { lat: 52.99225, lng: -1.491938888 }, // Duffield Castle
  { lat: 59.256111, lng: 17.219167 }, // Gripsholm Castle
  { lat: 46.233888888, lng: 7.364444444 }, // Valère Castle
  { lat: 45.353861111, lng: 24.635222222 }, // Castell de Poenari
  { lat: 48.173888888, lng: 16.978055555 }, // Castell de Devín
  { lat: 40.838376, lng: 14.253807 }, // Castell Nou de Nàpols
  { lat: 56.185158333, lng: -4.050252777 }, // Castell Doune
  { lat: 58.647032416, lng: -3.22448247 }, // Castell de Mey
  { lat: 51.4197, lng: -1.3381 }, // Donnington Castle
  { lat: 47.48292, lng: 13.18851 }, // Castell Hohenwerfen
  { lat: 54.2869, lng: -0.388034 }, // Scarborough Castle
  { lat: 48.8125, lng: 14.315277777 }, // castell de Český Krumlov
  { lat: 31.87996389, lng: 36.82742778 }, // Qasr al-Àzraq
  { lat: 54.4612, lng: -6.08609 }, // Hillsborough Castle
  { lat: 47.21614, lng: -1.54914 }, // Château des ducs de Bretagne
  { lat: 34.672308, lng: 33.041625 }, // Limassol Castle
  { lat: 44.576047, lng: 10.455789 }, // Castell de Canossa
  { lat: 53.343109, lng: -6.267394 }, // Castell de Dublín
  { lat: 42.325555555, lng: -0.611944444 }, // castell de Loarre
  { lat: 52.916111111, lng: -4.2325 }, // Criccieth Castle
  { lat: 49.4579, lng: 11.0759 }, // Nuremberg Castle
  { lat: 47.515277777, lng: 19.081944444 }, // castell de Vajdahunyad
  { lat: 49.935, lng: 6.202778 }, // castell de Vianden
  { lat: 44.837628, lng: 11.619426 }, // Castello Estense
  { lat: 30.531389, lng: 35.560833 }, // castell de Xawbak
  { lat: 55.354639, lng: -4.789292 }, // Castell de Culzean
  { lat: 46.584658, lng: 7.08399 }, // castell de Gruyères
  { lat: 51.222778, lng: 4.3975 }, // Het Steen
  { lat: 53.045416666, lng: -1.35475 }, // castell de Codnor
  { lat: 28.505, lng: -16.190833 }, // Castell de San Andrés
  { lat: 55.609361111, lng: -1.711002777 }, // castell de Bamburgh
  { lat: 49.05222222, lng: 21.17611111 }, // Šariš Castle
  { lat: 47.353055555, lng: -0.449722222 }, // Château de Brissac
  { lat: 48.43150556, lng: 22.68779722 }, // Palanok Castle
  { lat: 51.3898, lng: 0.50163 }, // castell de Rochester
  { lat: 47.581222222, lng: 12.169138888 }, // Kufstein Fortress
  { lat: 57.182222222, lng: 24.850277777 }, // Castell de Turaida
  { lat: 57.174150605, lng: -2.718117701 }, // Castell de Craigievar
  { lat: 56.42260641, lng: -3.438143156 }, // palau de Scone
  { lat: 51.2185, lng: 1.4039 }, // Deal Castle
  { lat: 54.7133, lng: -5.80645 }, // Carrickfergus Castle
  { lat: 51.186944, lng: 0.113889 }, // castell de Hever
  { lat: 42.481731, lng: -1.649563 }, // Palau reial d'Olite
  { lat: 41.65649, lng: -0.89708 }, // Palau de l'Aljaferia
  { lat: 40.00916, lng: 119.75357 }, // Pas de Shanhai
  { lat: 35.31213889, lng: 33.28108333 }, // castell de Sant Hilarió
  { lat: 5.54689, lng: -0.18353 }, // Osu Castle
  { lat: 51.315, lng: 9.416111111 }, // Schloss Wilhelmshöhe
  { lat: 47.601, lng: -0.5444 }, // Château du Plessis-Bourré
  { lat: 50.083055555, lng: 7.765833333 }, // Pfalzgrafenstein Castle
  { lat: 55.415783, lng: -1.706078 }, // Castell d'Alnwick
  { lat: 50.0684554, lng: 22.2345626 }, // Łańcut Castle
  { lat: 59.991666666, lng: 23.651111111 }, // Castell de Raseborg
  { lat: 47.491389, lng: 1.424444 }, // Château de Troussay
  { lat: 47.709738888, lng: 16.331688888 }, // Forchtenstein Castle
  { lat: 47.124759, lng: 0.996858 }, // Château de Loches
  { lat: 5.5466, lng: -0.1827 }, // Osu Castle
  { lat: 34.37444, lng: 37.60583 }, // Kasr al Hayr al-Gharbi
  { lat: 55.176388888, lng: 10.489444444 }, // castell d'Egeskov
  { lat: 56.0695, lng: -3.46461 }, // Dunfermline Palace
  { lat: 54.7749, lng: -1.57558 }, // Castell de Durham
  { lat: 45.439568, lng: 10.988099 }, // Castelvecchio
  { lat: 33.252777777, lng: 35.714722222 }, // Subayba
  { lat: 38.79254167, lng: -9.38959722 }, // Castelo dos Mouros
  { lat: 49.238127777, lng: 1.402752777 }, // Castell Gaillard
  { lat: 53.280148779, lng: -3.825629332 }, // castell de Conwy
  { lat: 48.0927, lng: 16.270361111 }, // Liechtenstein Castle
  { lat: 53.365766666, lng: -6.330572222 }, // Castell d'Ashtown
  { lat: 47.139444444, lng: 9.524444444 }, // castell de Vaduz
  { lat: 47.2156, lng: 0.0622 }, // castell de Montsoreau
  { lat: 47.103889, lng: 0.323333 }, // Château du Rivau
  { lat: 55.54555556, lng: 25.13861111 }, // Voruta
  { lat: 49.77944444, lng: 14.65666667 }, // Konopiště Castle
  { lat: 56.083888888, lng: 12.659722222 }, // Sofiero Palace
  { lat: 40.84362, lng: 14.239329 }, // Castel Sant'Elmo
  { lat: 40.73162, lng: 13.96493 }, // Castello Aragonese d'Ischia
  { lat: 48.86528, lng: 2.36222 }, // Torre del Temple
  { lat: 51.676944444, lng: -4.920555555 }, // Pembroke Castle
  { lat: 56.456162394, lng: -5.654941042 }, // Duart Castle
  { lat: 52.37455, lng: -7.92719 }, // castell de Cahir
  { lat: 57.324, lng: -4.442 }, // castell d'Urquhart
  { lat: 51.482309, lng: -3.1811056 }, // Castell de Cardiff
  { lat: 56.123888888, lng: -3.947777777 }, // Castell de Stirling
  { lat: 36.426944444, lng: 36.225 }, // Bagras
  { lat: 52.65, lng: -3.160555555 }, // castell de Powis
  { lat: 46.048712065, lng: 14.508634679 }, // Castell de Ljubljana
  { lat: 47.004722222, lng: 15.9325 }, // Riegersburg Castle
  { lat: 49.968336, lng: 24.900556 }, // Olesko Castle
  { lat: 50.327217, lng: 19.129144 }, // Będzin Castle
  { lat: 35.151111, lng: 35.949167 }, // Margat
  { lat: 37.031666666, lng: 27.429444444 }, // Castell de Bodrum
  { lat: 57.4485, lng: -6.59004 }, // Castell de Dunvegan
  { lat: 53.222877777, lng: 26.691736111 }, // Castell de Nesvizh
  { lat: 55.936, lng: -4.5628 }, // castell de Dumbarton
  { lat: 51.248888888, lng: 0.63 }, // castell de Leeds
  { lat: 50.8375, lng: -1.115 }, // Portchester Castle
  { lat: 59.435555555, lng: 24.737222222 }, // Castell de Toompea
  { lat: 49.513, lng: 14.170472222 }, // Orlík Castle
  { lat: 58.947222222, lng: 23.538611111 }, // Haapsalu Castle
  { lat: 44.492583, lng: -0.269817 }, // castell de Ròca Talhada
  { lat: 50.842222222, lng: 16.291666666 }, // Książ
  { lat: 60.689497222, lng: -0.849177777 }, // Castell de Muness
  { lat: 42.54416667, lng: -6.59361111 }, // Castell de Ponferrada
  { lat: 51.816389, lng: 5.021389 }, // Loevestein Castle
  { lat: 56.94569, lng: -2.19677 }, // Castell de Dunnottar
  { lat: 53.2349, lng: -0.5409 }, // Castell de Lincoln
  { lat: 53.264908, lng: -4.08957 }, // castell de Beaumaris
  { lat: 52.247777777, lng: 21.014166666 }, // Royal Castle in Warsaw
  { lat: 53.053055555, lng: -3.908333333 }, // Dolwyddelan Castle
  { lat: 51.6439, lng: -2.6757 }, // castell de Chepstow
  { lat: 46.642473, lng: 13.89611 }, // Landskron Castle
  { lat: 48.67333333, lng: 26.5625 }, // Fortalesa de Kamianets-Podilski
  { lat: 49.4388756, lng: 14.1924053 }, // Castell de Zvíkov
  { lat: 57.861944444, lng: 11.999444444 }, // Bohus Fortress
  { lat: 55.211388888, lng: -6.579166666 }, // Dunluce Castle
  { lat: 53.554341666, lng: -6.789755555 }, // Castell de Trim
  { lat: 46.200588, lng: 30.350702 }, // Bilhorod-Dnistrovskyi Fortress
  { lat: 53.5348, lng: -9.284406 }, // Castell d'Ashford
  { lat: 51.030555555, lng: 15.303611111 }, // Czocha Castle
  { lat: 55.3452, lng: -1.61178 }, // castell de Warkworth
  { lat: 51.093333333, lng: -1.804722222 }, // Old Sarum
  { lat: 53.095319444, lng: -7.915541666 }, // castell de Birr
  { lat: 5.103583333, lng: -1.24125 }, // Castell de Cape Coast
  { lat: 50.856111111, lng: -0.553611111 }, // castell d'Arundel
  { lat: 35.07389, lng: 39.07111 }, // Kasr al-Hayr al-Sharki
  { lat: 59.11981, lng: 11.39722 }, // Fredriksten
  { lat: 31.18055556, lng: 35.70138889 }, // Crac de Moab
  { lat: 47.84648, lng: 16.51928 }, // Schloss Esterházy
  { lat: 59.940416666, lng: 30.337638888 }, // Saint Michael's Castle
  { lat: 49.256667, lng: 16.461667 }, // Veveří Castle
  { lat: 53.333055555, lng: -2.695833333 }, // castell de Halton
  { lat: 45.608168, lng: 7.744582 }, // Fort Bard
  { lat: 51.928888888, lng: -8.570833333 }, // Castell de Blarney
  { lat: 37.498969, lng: 15.084386 }, // Castello Ursino
  { lat: 40.320555555, lng: -2.893611111 }, // Reccopolis
  { lat: 40.32055556, lng: -2.89361111 }, // Reccopolis
  { lat: 40.853544, lng: 14.264441 }, // Castel Capuano
  { lat: 52.8945, lng: -0.78256 }, // Castell de Belvoir
  { lat: 47.168055555, lng: 0.236111111 }, // Castell de Chinon
  { lat: 54.6533, lng: -2.71802 }, // Brougham Castle
  { lat: 36.536388888, lng: 31.998055555 }, // Kızıl Kule
  { lat: 50.8702, lng: 0.339214 }, // Castell d'Herstmonceux
  { lat: 48.853333, lng: 2.369167 }, // La Bastilla
  { lat: 54.309255305, lng: 26.282488694 }, // Kreva Castle
  { lat: 53.0779, lng: -2.88023 }, // castell de Holt
  { lat: 38.631944444, lng: -0.860833333 }, // Castell de la Talaia
  { lat: 49.74765, lng: 6.18657 }, // Castell de Fischbach
  { lat: 51.0618, lng: -1.32026 }, // Winchester Castle
  { lat: 50.8192, lng: 0.333114 }, // Castell de Pevensey
  { lat: 42.965555555, lng: 1.605 }, // Castell de Foix
  { lat: 34.7536747, lng: 32.4069594 }, // Paphos Castle
  { lat: 56.870555555, lng: 16.643333333 }, // Borgholm Castle
  { lat: 51.4069, lng: 0.526857 }, // Upnor Castle
  { lat: 50.45766, lng: 3.95546 }, // Mundaneum
  { lat: 33.567, lng: 35.3711 }, // Castell del Mar
  { lat: 52.650277777, lng: -7.249166666 }, // Castell de Kilkenny
  { lat: 48.38138889, lng: 35.13669444 }, // Kodak Fortress
  { lat: 54.6525, lng: 24.933055555 }, // Trakai Island Castle
  { lat: 49.186388888, lng: -0.362777777 }, // Castell de Caen
  { lat: 41.3089, lng: -4.90833 }, // Castle of La Mota
  { lat: 51.535833333, lng: -3.254722222 }, // Q2704850
  { lat: 44.84028, lng: 1.14528 }, // castell de Beynac
  { lat: 39.364167, lng: -9.157646 }, // Castle of Óbidos
  { lat: 51.688611111, lng: -2.456944444 }, // castell de Berkeley
  { lat: 41.447834, lng: -8.290299 }, // castell de Guimarães
  { lat: 45.495, lng: 15.528 }, // Dubovac Castle
  { lat: 41.36342, lng: 2.16617 }, // castell de Montjuïc
  { lat: 53.2892, lng: -3.46425 }, // Rhuddlan Castle
  { lat: 36.536444444, lng: 31.998308333 }, // Kızıl Kule
  { lat: 53.887197222, lng: 25.302783333 }, // Lida Castle
  { lat: 54.686759, lng: 25.290685 }, // torre de Gediminas
  { lat: 47.769722222, lng: 1.444444444 }, // Château de Talcy
  { lat: 56.006111111, lng: -3.516111111 }, // Blackness Castle
  { lat: 49.7764, lng: 22.649366666 }, // Krasiczyn Castle
  { lat: 53.709417, lng: -6.56125 }, // Castell de Slane
  { lat: 52.669722222, lng: -8.625555555 }, // Castell del Rei Joan
  { lat: 34.345833333, lng: 62.188611111 }, // ciutadella d'Herat
  { lat: 58.905571, lng: 24.103875 }, // Koluvere Castle
  { lat: 53.444722222, lng: -6.165 }, // Castell de Malahide
  { lat: 57.313333333, lng: 25.27 }, // Castell de Cēsis
  { lat: 53.6587, lng: -1.49063 }, // Sandal Castle
  { lat: 52.76555556, lng: 25.12166667 }, // Kosava Castle
  { lat: 51.519444444, lng: -0.126944444 }, // Museu Britànic
  { lat: 37.1667361, lng: 34.602231 }, // Lampron
  { lat: 50.0834, lng: 14.3263 }, // Letohrádek Hvězda
  { lat: 50.86375, lng: 17.4669 }, // Brzeg Castle
  { lat: 36.444722222, lng: 50.586111111 }, // fortalesa d'Alamut
  { lat: 51.7518, lng: -1.26248 }, // Castell d'Oxford
  { lat: 55.66907, lng: -1.78475 }, // Castell de Lindisfarne
  { lat: 51.1814, lng: -3.44427 }, // castell de Dunster
  { lat: 44.889065, lng: 11.065453 }, // Castell dels Pico
  { lat: 50.035833333, lng: 19.178333333 }, // Auschwitz
  { lat: 44.668611111, lng: 20.929166666 }, // Smederevo Fortress
  { lat: 55.605, lng: 12.9875 }, // Castell de Malmö
  { lat: 58.24689, lng: 22.47929 }, // Castell de Kuressaare
  { lat: 50.6683, lng: -4.7608 }, // Tintagel Castle
  { lat: 51.7394081, lng: -4.305735 }, // Kidwelly Castle
  { lat: 59.85359, lng: 17.63543 }, // Castell d'Uppsala
  { lat: 58.44597222, lng: 14.88361111 }, // Castell de Vadstena
  { lat: 60.2329039, lng: 20.0806612 }, // Kastelholm Castle
  { lat: 34.665, lng: 32.93416667 }, // Kolossi Castle
  { lat: 41.255, lng: 19.854 }, // Petrelë Fortress
  { lat: 50.24416667, lng: 19.78 }, // Pieskowa Skała
  { lat: 44.888837, lng: 11.065271 }, // Castell dels Pico
  { lat: 51.770297, lng: -2.8500632 }, // Raglan Castle
  { lat: 40.998355, lng: 15.652814 }, // Castle of Melfi
  { lat: 57.061483333, lng: -2.439916666 }, // Castell de Crathes
  { lat: 53.4843, lng: -1.22606 }, // Conisbrough Castle
  { lat: 50.61333333, lng: 19.49305556 }, // Bobolice Castle
  { lat: 59.7038, lng: 17.61941 }, // Skokloster Castle
  { lat: 54.8989, lng: 23.8854 }, // Kaunas Fortress
  { lat: 50.102242, lng: 19.581842 }, // Tenczyn Castle
  { lat: 51.220268, lng: 4.40025 }, // catedral d'Anvers
  { lat: 54.59092, lng: -1.80175 }, // Raby Castle
  { lat: 57.9817, lng: -3.94552 }, // castell de Dunrobin
  { lat: 44.904, lng: 15.937 }, // Ostrožac Castle
  { lat: 41.008333333, lng: 28.98 }, // Santa Sofia
  { lat: 54.686666666, lng: 25.290833333 }, // Complex de Castells de Vílnius
  { lat: 46.694494, lng: 11.144793 }, // Castell de Tirol
  { lat: 58.675, lng: 13.22 }, // Läckö Castle
  { lat: 53.101333333, lng: -0.192611111 }, // Tattershall Castle
  { lat: 42.20942, lng: 20.74558 }, // Fortress of Prizren
  { lat: 49.23638889, lng: 18.73388889 }, // Budatín Castle
  { lat: 50.73888889, lng: 25.32333333 }, // Lubart's Castle
  { lat: 54.6427, lng: -5.94232 }, // Belfast Castle
  { lat: 47.58333, lng: 3.15583 }, // castell de Guédelon
  { lat: 51.128268, lng: 1.3235035 }, // castell de Dover
  { lat: 50.736388888, lng: 16.790277777 }, // Gola Dzierżoniowska Castle
  { lat: 59.273888888, lng: 15.215277777 }, // Castell d'Örebro
  { lat: 48.070555555, lng: 1.323611111 }, // Château de Châteaudun
  { lat: 52.219444444, lng: 21.030833333 }, // Ujazdów Castle
  { lat: 38.111282, lng: 13.35341 }, // Palau dels Normands
  { lat: 55.500833333, lng: 14.230833333 }, // Glimmingehus
  { lat: 39.5675, lng: 2.64722 }, // Palau Reial de l'Almudaina
  { lat: 52.2246, lng: 1.34661 }, // Framlingham Castle
  { lat: 52.949166666, lng: -1.154722222 }, // Castell de Nottingham
  { lat: 55.97944444, lng: 13.13472222 }, // Castell de Knutstorp
  { lat: 58.74847222, lng: 17.01166667 }, // Castell de Nyköping
  { lat: 39.214861111, lng: 46.277611111 }, // Baghaberd
  { lat: 41.642891, lng: 42.97815 }, // Castell de Rabati
  { lat: 52.2796, lng: -1.58561 }, // Castell de Warwick
  { lat: 49.704444444, lng: 16.889722222 }, // Bouzov Castle
  { lat: 34.12, lng: 35.6464 }, // Castell de Biblos
  { lat: 56.2, lng: 24.75 }, // Castell de Biržai
  { lat: 54.53942, lng: 25.64997 }, // castell de Medininkai
  { lat: 54.0498, lng: -2.80562 }, // Lancaster Castle
  { lat: 53.677, lng: 23.823 }, // Old Grodno Castle
  { lat: 51.200527777, lng: 22.571733333 }, // Castell de Lublin
  { lat: 39.46194444, lng: -8.38383056 }, // castell d'Almourol
  { lat: 57.273893959, lng: -5.516050624 }, // Castell d'Eilean Donan
  { lat: 35.8975, lng: 38.480833333 }, // Qal'at Ja'bar
  { lat: 56.6203, lng: -3.0024 }, // castell de Glamis
  { lat: 39.8604, lng: -4.0156 }, // Castillo de San Servando
  { lat: 51.876802, lng: -4.0184755 }, // Dinefwr Castle
  { lat: 44.815833, lng: 1.148889 }, // castell de Castelnaud
  { lat: 5.08275, lng: -1.34807 }, // Sant Jordi de la Mina
  { lat: 5.08274, lng: -1.348211 }, // Sant Jordi de la Mina
  { lat: 54.28404, lng: -1.80685 }, // Middleham Castle
  { lat: 31.7375, lng: 36.010278 }, // Al-Mushatta
  { lat: 44.6611873, lng: 21.6784847 }, // Fortalesa de Golubac
  { lat: 54.968828, lng: -1.610356 }, // Castell de Newcastle upon Tyne
  { lat: 52.935, lng: -3.08972 }, // Castell d'Y Waun
  { lat: 58.167, lng: -4.99563 }, // Ardvreck Castle
  { lat: 53.60145833, lng: 25.82771389 }, // Navahrudak Castle
  { lat: 52.347, lng: -1.59111 }, // castell de Kenilworth
  { lat: 37.0664, lng: 37.3833 }, // Castell de Gaziantep
  { lat: 44.941666666, lng: 1.101944444 }, // castell de Commarque
  { lat: 41.394566666, lng: 43.3148 }, // Fortalesa de Tmogvi
  { lat: 54.898888888, lng: 23.885 }, // Castell de Kaunas
  { lat: 35.127688, lng: 33.943239 }, // Othello Castle
  { lat: 48.249444444, lng: 7.344166666 }, // Château du Haut-Koenigsbourg
  { lat: 43.51527778, lng: 16.2475 }, // Kamerlengo Castle
  { lat: 52.041, lng: -9.531 }, // castell de Ross
  { lat: 35.36666667, lng: 37.23333333 }, // Qasr ibn Wardan
  { lat: 49.9431, lng: 24.9835 }, // Pidhirtsi Castle
  { lat: 42.163611111, lng: 44.703888888 }, // Fortalesa d'Ananuri
  { lat: 51.8767, lng: -2.6157 }, // castell de Goodrich
  { lat: 59.91161, lng: 10.73023 }, // Centre del Premi Nobel de la Pau
  { lat: 46.949167, lng: 7.473889 }, // Centre Paul Klee
  { lat: 38.8932, lng: -77.0192 }, // Newseum
  { lat: 41.025632324, lng: 28.97415319 }, // torre de Gàlata
  { lat: 41.89359444, lng: 12.48316389 }, // Palazzo Nuovo
  { lat: 60.387622222, lng: 5.321580555 }, // Museu de Bergen
  { lat: 38.736666666, lng: -9.154166666 }, // Museu Calouste Gulbenkian
  { lat: 59.934047, lng: 30.30595 }, // Catedral de Sant Isaac
  { lat: 48.170680555, lng: 16.246169444 }, // Hermesvilla
  { lat: 41.003333333, lng: 39.696111111 }, // Hagia Sophia, Trabzon
  { lat: 40.806111, lng: 14.3475 }, // Herculà
  { lat: 49.481972222, lng: 7.031027777 }, // Col·lecció Philippi
  { lat: -6.175388888, lng: 106.827138888 }, // National Monument of Indonesia
  { lat: 42.625555555, lng: 25.399166666 }, // Tomba tràcia de Kazanlâk
  { lat: 19.4325, lng: -99.131388888 }, // Palau Nacional
  { lat: 50.0798433, lng: 14.4304172 }, // Museu Nacional de Praga
  { lat: 47.0739, lng: 15.3913 }, // Castell d'Eggenberg
  { lat: 52.5302, lng: 13.3792 }, // Museu d'Història Natural de Berlín
  { lat: 43.7743, lng: 11.249367 }, // Santa Maria Novella
  { lat: 45.491667, lng: -73.616667 }, // Saint Joseph's Oratory
  { lat: 52.512755555, lng: 13.392505555 }, // Deutscher Dom
  { lat: 19.41111111, lng: -99.1925 }, // Casa taller de Luis Barragán
  { lat: 52.419167, lng: 13.070833 }, // Cecilienhof
  { lat: 51.204648, lng: 3.22447 }, // església de Nostra Senyora de Bruges
  { lat: -22.910833333, lng: -43.173055555 }, // Academia Brasileira de Letras
  { lat: 52.083333, lng: 5.125833 }, // Museu Centraal
  { lat: 37.074881, lng: 37.386158 }, // Zeugma Mosaic Museum
  { lat: 45.4337974, lng: 12.3279355 }, // Palau Grassi
  { lat: 39.7028565, lng: 8.9998843 }, // Su Nuraxi
  { lat: 47.554032, lng: 7.594193 }, // Museu d'Art de Basilea
  { lat: 56.295555555, lng: 16.486111111 }, // Eketorp
  { lat: 52.358333333, lng: 4.881111111 }, // Museu Van Gogh
  { lat: 47.571618654, lng: 10.960754376 }, // Linderhof Palace
  { lat: 48.860642, lng: 2.352245 }, // Centre Pompidou
  { lat: 48.158056, lng: 11.503611 }, // palau de Nymphenburg
  { lat: 39.955683, lng: -75.163217 }, // Acadèmia de Belles Arts de Pennsilvània
  { lat: 47.554167, lng: 7.594167 }, // Museu d'Art de Basilea
  { lat: 43.775288, lng: 11.255986 }, // Palau Mèdici-Riccardi
  { lat: 50.649532647, lng: 14.220484857 }, // Zubrnice
  { lat: 42.644672222, lng: 23.266172222 }, // església de Boiana
  { lat: 59.938888888, lng: 30.295833333 }, // Menshikov Palace (Saint Petersburg)
  { lat: 55.741389, lng: 37.620864 }, // Galeria Tretiakov
  { lat: 41.610275, lng: 1.142588888 }, // Museu de Joguets i Autòmats
  { lat: 48.86408, lng: 2.29713 }, // Palais de Tokyo
  { lat: 38.69709722, lng: -9.20813889 }, // Navy Museum
  { lat: 38.888888888, lng: -77.026 }, // Institució Smithsonian
  { lat: 41.893055555, lng: 12.482777777 }, // Museus Capitolins
  { lat: 43.993183, lng: 22.886818 }, // Baba Vida
  { lat: 38.886666666, lng: -77.0325 }, // Museu Memorial de l'Holocaust dels Estats Units
  { lat: 42.339444444, lng: -71.094166666 }, // Museu de Belles Arts de Boston
  { lat: 40.761666666, lng: -73.9775 }, // Museu d'Art Modern de Nova York
  { lat: 50.3528, lng: 7.17971 }, // Castell de Bürresheim
  { lat: 43.26883, lng: -2.934099 }, // Museu Guggenheim
  { lat: 31.7744237, lng: 35.1772481 }, // Iad va-Xem
  { lat: -34.608858333, lng: -58.373755555 }, // Cabildo de Buenos Aires
  { lat: 43.76845, lng: 11.26274 }, // Basílica de la Santa Creu
  { lat: -41.290555555, lng: 174.781944444 }, // Museu de Nova Zelanda Te Papa Tongarewa
  { lat: 52.521111, lng: 13.295833 }, // Palau de Charlottenburg
  { lat: 40.779444444, lng: -73.963333333 }, // Museu Metropolità d'Art
  { lat: 52.366969444, lng: 4.908441666 }, // Hortus Botanicus Amsterdam
  { lat: 50.6686729, lng: 7.2063442 }, // Castell de Drachenburg
  { lat: 43.773055555, lng: 11.256944444 }, // Santa Maria del Fiore
  { lat: 42.695838888, lng: 23.332969444 }, // catedral d'Alexandre Nevski
  { lat: 45.387461544, lng: -75.695905074 }, // Universitat de Carleton
  { lat: 37.87055556, lng: 32.50472222 }, // Museu Mevlâna
  { lat: 37.97507, lng: 23.74452 }, // Museu Bizantí i Cristià
  { lat: 43.235816, lng: 76.950731 }, // Central State Museum of Kazakhstan
  { lat: 39.915833333, lng: 116.390833333 }, // Ciutat Prohibida
  { lat: 40.185821, lng: 44.488114 }, // Tsitsernakapert
  { lat: 40.417955, lng: -3.714312 }, // Palau Reial de Madrid
  { lat: 54.687877777, lng: 25.270591666 }, // Museu de les víctimes del genocidi
  { lat: 55.735277777, lng: 37.8075 }, // Palace of Kuskovo
  { lat: 49.65369, lng: 8.56858 }, // Abadia de Lorsch
  { lat: 53.211944, lng: 6.565556 }, // Museu Groninger
  { lat: 48.856805555, lng: 2.333277777 }, // École Nationale Supérieure des Beaux-Arts
  { lat: 34.0775, lng: -118.475 }, // Getty Center
  { lat: 37.037942, lng: 27.424097 }, // Mausoleu d'Halicarnàs
  { lat: 52.083333333, lng: 23.652777777 }, // Fortalesa de Brest
  { lat: 52.535, lng: 13.3897 }, // Gedenkstätte Berliner Mauer
  { lat: 40.761444444, lng: -73.977611111 }, // Museu d'Art Modern de Nova York
  { lat: 40.7906971, lng: 8.4489274 }, // Mont d'Accoddi
  { lat: 45.442002, lng: 12.328675 }, // Fontego dei Turchi
  { lat: 48.83397, lng: 2.33245 }, // Catacumbes de París
  { lat: 59.903333, lng: 10.699444 }, // Museu del Fram
  { lat: 52.521, lng: 13.396 }, // Museu de Pèrgam
  { lat: -23.5675667, lng: -46.7183411 }, // Instituto Butantan
  { lat: 23.73755, lng: 90.3941 }, // Bangladesh National Museum
  { lat: -43.5309, lng: 172.6271 }, // Museu de Canterbury
  { lat: 36.445694444, lng: 28.224111111 }, // Palace of the Grand Master of the Knights of Rhodes
  { lat: 40.8975, lng: -4.00458333 }, // La Granja de San Ildefonso
  { lat: 29.725605, lng: -95.390539 }, // Museu de Belles Arts de Houston
  { lat: 41.30839, lng: -72.930958 }, // Galeria d'Art de la Universitat Yale
  { lat: 37.785718, lng: -122.401051 }, // Museu d'Art Modern de San Francisco
  { lat: 32.8414, lng: -96.7776 }, // George W. Bush Presidential Center
  { lat: 51.505561111, lng: -0.085830555 }, // London Dungeon
  { lat: 51.20806, lng: 3.22694 }, // Bruges City Hall
  { lat: 43.768997, lng: 11.256379 }, // Corredor vasarià
  { lat: 64.142952, lng: -21.914603 }, // fal·loteca islandesa
  { lat: 49.76274, lng: 10.82049 }, // Castell de Weißenstein
  { lat: 57.0407, lng: -3.23016 }, // castell de Balmoral
  { lat: 45.81516667, lng: 15.97358333 }, // Museu de les Relacions Trencades
  { lat: 39.716564, lng: 16.493696 }, // Síbaris
  { lat: 43.769444444, lng: 11.256111111 }, // Palazzo Vecchio
  { lat: 45.06898, lng: 7.69324 }, // Mole Antonelliana
  { lat: 49.0011, lng: 8.8129 }, // monestir de Maulbronn
  { lat: 48.146565531, lng: 11.565819516 }, // Gliptoteca de Múnic
  { lat: 49.944344697, lng: 11.57866362 }, // Margravial Opera House
  { lat: 21.303898, lng: -157.848708 }, // Museu d'Art d'Honolulu
  { lat: -22.908798032, lng: -43.175731376 }, // Museu Nacional de Belas Artes
  { lat: 59.321694, lng: 17.886383 }, // castell de Drottningholm
  { lat: 48.146555597, lng: 11.565815194 }, // Gliptoteca de Múnic
  { lat: 34.40275, lng: 132.459027777 }, // castell de Hiroshima
  { lat: 39.454527777, lng: -0.350363888 }, // Ciutat de les Arts i les Ciències
  { lat: 51.021198, lng: 11.248999 }, // Buchenwald
  { lat: 37.8014, lng: -122.3976 }, // Exploratorium
  { lat: 41.082138888, lng: 29.067027777 }, // Anadolu Hisari
  { lat: 55.68566, lng: 12.57748 }, // Palau de Rosenborg
  { lat: 55.842778, lng: 38.181389 }, // Central Air Force Museum
  { lat: 52.364722, lng: 5.068889 }, // Pampus
  { lat: 59.940555555, lng: 30.313611111 }, // Hermitage
  { lat: 55.935, lng: 12.300833333 }, // castell de Frederiksborg
  { lat: 48.20614167, lng: 16.36626667 }, // Biblioteca Nacional d'Àustria
  { lat: 40.416041, lng: -3.694925 }, // Museu Thyssen-Bornemisza
  { lat: 41.99083333, lng: 21.42944444 }, // Museu de la Ciutat de Skopje
  { lat: 49.653888888, lng: 8.568888888 }, // Abadia de Lorsch
  { lat: 48.402222222, lng: 2.700555555 }, // castell de Fontainebleau
  { lat: 26.217030555, lng: 127.719475 }, // castell de Shuri
  { lat: 41.013, lng: 28.984 }, // palau de Topkapı
  { lat: 49.792797617, lng: 9.938889043 }, // Residència de Würzburg
  { lat: 52.5202, lng: 13.3976 }, // Neues Museum
  { lat: 52.358416, lng: 4.881076 }, // Museu Van Gogh
  { lat: 41.6958, lng: 44.8004 }, // Museum of Soviet Occupation
  { lat: 19.426111111, lng: -99.186111111 }, // Museu Nacional d'Antropologia de Mèxic
  { lat: 52.515, lng: 13.379444444 }, // Acadèmia de les Arts de Berlín
  { lat: 44.497707, lng: 11.353538 }, // Pinacoteca Nacional de Bolonya
  { lat: 39.737188, lng: -104.989345 }, // Museu d'Art de Denver
  { lat: 48.8678, lng: 2.3384 }, // Cabinet des médailles
  { lat: 43.85498951, lng: 18.40264142 }, // National Museum of Bosnia and Herzegovina
  { lat: 43.7727, lng: 11.255817 }, // Museu dell'Opera del Duomo
  { lat: 48.208161111, lng: 16.374911111 }, // Mozarthaus Vienna
  { lat: 52.21512, lng: 21.03582 }, // Palau Łazienki
  { lat: 4.601919444, lng: -74.072 }, // Museu de l'Or
  { lat: 50.4508, lng: 8.04178 }, // Memorial de Hadamar
  { lat: 52.6281, lng: 1.29678 }, // Castell de Norwich
  { lat: 51.381, lng: -2.35949 }, // Banys Romans de Bath
  { lat: 31.842165, lng: 34.968367 }, // Mini Israel
  { lat: 42.25008, lng: 11.767854 }, // Necròpoli de Monterozzi
  { lat: 59.781266666, lng: 13.233208333 }, // Mårbacka
  { lat: 40.3699226, lng: 49.8363876 }, // Nizami Museum of Azerbaijani Literature
  { lat: 40.421944, lng: -3.712778 }, // Reial Acadèmia de Ciències Exactes, Físiques i Naturals
  { lat: 43.7677682, lng: 11.24370253 }, // Capella Brancacci
  { lat: 48.855277777, lng: 2.280833333 }, // casa de Balzac
  { lat: 34.016989, lng: -118.288781 }, // Museu d'Història Natural del Comtat de Los Angeles
  { lat: 59.3252155, lng: 18.0708309 }, // Museu Nobel
  { lat: 41.903044, lng: 12.466307 }, // castell de Sant'Angelo
  { lat: 31.77578889, lng: 35.21691111 }, // Heichal Shlomo
  { lat: 27.71555556, lng: 85.32 }, // Museu del Palau de Narayanhiti
  { lat: 41.385216, lng: 2.180893 }, // Museu Picasso de Barcelona
  { lat: 44.473361, lng: 26.076556 }, // Museu Satului de Bucarest
  { lat: 47.256111111, lng: -0.0725 }, // Castell de Saumur
  { lat: 40.626388888, lng: 22.948333333 }, // Torre Blanca (Tessalònica)
  { lat: 49.753889, lng: 6.635556 }, // Karl-Marx-House museum
  { lat: 61.112821, lng: 10.478433 }, // Maihaugen
  { lat: 40.6154591, lng: 22.9567319 }, // New Mosque
  { lat: 42.359444444, lng: -83.064722222 }, // Institut d'Arts de Detroit
  { lat: 41.897915, lng: 12.481639 }, // Galleria Doria Pamphilj
  { lat: 51.3167, lng: 9.4 }, // Parc Wilhelmshöhe
  { lat: 18.926667, lng: 72.832222 }, // Chhatrapati Shivaji Maharaj Vastu Sangrahalaya
  { lat: 42.268055555, lng: 2.959444444 }, // Teatre-Museu Dalí
  { lat: 36.205, lng: 37.15 }, // National Museum of Aleppo
  { lat: 43.807917, lng: 11.250282 }, // Vil·la dels Mèdici a Careggi
  { lat: 61.4232522, lng: 6.7628574 }, // Norwegian Glacier Museum
  { lat: 38.79635278, lng: -9.39603056 }, // Quinta da Regaleira
  { lat: 52.845833333, lng: 5.678888888 }, // Estació de bombament D.F. Wouda
  { lat: 41.006278, lng: 28.974556 }, // Museu d'Art Turc i Islàmic d'Istanbul
  { lat: 44.471904, lng: 26.077597 }, // Museu Satului de Bucarest
  { lat: 43.768448, lng: 11.24403 }, // Capella Brancacci
  { lat: 34.291388888, lng: 108.959444444 }, // Daming Palace
  { lat: 31.776111111, lng: 35.227777777 }, // Torre de David
  { lat: 36.209361111, lng: 36.178055555 }, // gruta de Sant Pere
  { lat: 41.903426175, lng: 12.499017895 }, // Museu Nacional Romà
  { lat: 43.08444444, lng: 25.65 }, // Església dels Quaranta Sants Màrtirs (Tàrnovo)
  { lat: 56.15888889, lng: 10.19166667 }, // Den Gamle By
  { lat: 50.1422, lng: 7.16694 }, // Reichsburg Cochem
  { lat: 51.2289208, lng: 4.404667 }, // Museum aan de Stroom
  { lat: 37.5785, lng: 126.98 }, // Museu Nacional d'Art Modern i Contemporani
  { lat: 41.897669, lng: 12.481145 }, // Galleria Doria Pamphilj
  { lat: 43.695555555, lng: 25.988055555 }, // esglésies rupestres d'Ivànovo
  { lat: 52.3625, lng: 4.921111111 }, // Wereldmuseum Amsterdam
  { lat: 57.69472222, lng: 11.98916667 }, // Museum of World Culture
  { lat: 37.968417, lng: 23.728472 }, // Museu de l'Acròpoli d'Atenes
  { lat: 40.436911, lng: -3.685848 }, // Museu Lázaro Galdiano
  { lat: 40.435404, lng: -3.692539 }, // Museu Sorolla
  { lat: 44.419776, lng: 34.05552 }, // Vorontsov Palace
  { lat: 44.41125, lng: 8.93212 }, // Palazzo Rosso
  { lat: 43.770398, lng: 11.258008 }, // Museu Nacional del Bargello
  { lat: -1.35194444, lng: 36.7125 }, // Karen Blixen Museum
  { lat: 52.380556, lng: 4.640278 }, // Museu Teyler
  { lat: 51.208333, lng: 3.226944 }, // basílica de la Santa Sang
  { lat: 55.946944, lng: -3.19 }, // Museu Nacional d'Escòcia
  { lat: 39.9478, lng: -75.1481 }, // Parc Històric Nacional de la Independència
  { lat: 51.440555555, lng: -0.060833333 }, // Museum Horniman
  { lat: 37.8269, lng: -122.423 }, // presó d'Alcatraz
  { lat: 61.495833333, lng: 23.781666666 }, // Museu dels Moomin
  { lat: 38.8883, lng: -77.0166 }, // National Museum of the American Indian
  { lat: 40.78472222, lng: -73.95805556 }, // Museu Cooper-Hewitt
  { lat: 41.763711, lng: -72.673086 }, // Wadsworth Atheneum
  { lat: 43.936786111, lng: 12.446436111 }, // Palazzo Pubblico
  { lat: 31.230278, lng: 121.470556 }, // Museu de Shanghai
  { lat: 37.175986111, lng: -3.599036111 }, // Capella Reial de Granada
  { lat: 34.063056, lng: -118.355833 }, // Ranxo La Brea
  { lat: 52.375076, lng: 4.899363 }, // Museu Amstelkring
  { lat: 42.313611111, lng: -71.033333333 }, // Biblioteca i Museu Presidencial de John F. Kennedy
  { lat: 42.64027778, lng: 18.11083333 }, // Museu de Dubrovnik
  { lat: 40.711388888, lng: -74.013611111 }, // Memorial i Museu Nacional de l'Onze de Setembre
  { lat: 40.1787, lng: 44.5142 }, // Museu d'Història d'Armènia
  { lat: 59.723333333, lng: 30.415833333 }, // Tsàrskoie Seló
  { lat: 40.75621111, lng: -73.92396389 }, // Museum of the Moving Image (Nova York)
  { lat: 5.01876, lng: -74.0093 }, // Catedral de Sal de Zipaquirá
  { lat: 52.0956046, lng: 5.8174138 }, // Museu Kroller-Müller
  { lat: 36.337858888, lng: 43.139405 }, // Mosul Museum
  { lat: 52.373166666, lng: 4.891361111 }, // Paleis op de Dam
  { lat: 5.55675, lng: -0.20613 }, // Museu Nacional de Ghana
  { lat: 52.095833333, lng: 5.816944444 }, // Museu Kroller-Müller
  { lat: 27.7156, lng: 85.32 }, // Museu del Palau de Narayanhiti
  { lat: 47.506833333, lng: 19.065138888 }, // Casa del Terror
  { lat: 40.424052777, lng: -3.717777777 }, // Temple de Debod
  { lat: 40.366388888, lng: 49.8325 }, // Baku Museum of Miniature Books
  { lat: 37.364723, lng: 14.334553 }, // vil·la romana del Casale
  { lat: 43.58691667, lng: 1.49327778 }, // Cité de l'espace
  { lat: 40.036363888, lng: -3.608180555 }, // Palau d'Aranjuez
  { lat: 44.138851, lng: 12.243729 }, // Biblioteca Malatestiana
  { lat: 51.215517, lng: 4.405316 }, // Museu Mayer van der Bergh d'Anvers
  { lat: 41.897985, lng: 12.481562 }, // Galleria Doria Pamphilj
  { lat: 44.94278, lng: 34.12056 }, // Neàpolis d'Escítia
  { lat: 55.68137, lng: 12.57579 }, // Rundetårn
  { lat: 43.767681, lng: 11.256023 }, // Museu Galileu
  { lat: 41.32546, lng: 19.820205 }, // National Art Gallery of Albania
  { lat: 44.467777777, lng: 34.143611111 }, // Palau de Livàdia
  { lat: 55.56513611, lng: 36.715525 }, // Kubinka Tank Museum
  { lat: 54.361234, lng: 18.649421 }, // Centre Europeu Solidarność
  { lat: 52.5417, lng: 13.5011 }, // Memorial de la presó de Hohenschönhausen
  { lat: 41.880264, lng: 12.492764 }, // termes de Caracal·la
  { lat: 39.044969557, lng: -94.580960249 }, // Museu d'Art Nelson-Atkins
  { lat: 38.920833333, lng: 27.841666666 }, // Tiatira
  { lat: 31.568225, lng: 74.308174 }, // Lahore Museum
  { lat: 42.93245, lng: -78.875618 }, // Museu d'Art AKG de Buffalo
  { lat: 41.901337, lng: 12.472968 }, // Palazzo Altemps
  { lat: 51.523694444, lng: -0.161 }, // Sherlock Holmes Museum
  { lat: 41.0267555, lng: 28.9727457 }, // Jewish Museum of Turkey
  { lat: 51.2269, lng: 6.95056 }, // Neanderthal Museum
  { lat: 38.898515, lng: 27.849235 }, // Tiatira
  { lat: 42.250444444, lng: 11.769861111 }, // Necròpoli de Monterozzi
  { lat: 40.285, lng: 69.618055555 }, // Historical Museum of Sughd
  { lat: 34.063333333, lng: -118.359166666 }, // Museu d'Art del Comtat de Los Angeles
  { lat: -22.90590833, lng: -43.16952222 }, // Museu Històric Nacional
  { lat: 48.57911, lng: 7.75061 }, // Musée alsacien
  { lat: 19.43638889, lng: -99.13944444 }, // Museu Nacional d'Art de Mèxic
  { lat: 53.896666666, lng: 27.555555555 }, // Belarusian National History and Culture Museum
  { lat: 59.9319, lng: 30.3049 }, // Casa de Nabókov
  { lat: 40.438131, lng: -3.722069 }, // Museu d'Amèrica
  { lat: 41.7893, lng: -87.59746 }, // Institut Oriental de Chicago
  { lat: 48.888611, lng: 9.009722 }, // Tomba de Hochdorf
  { lat: 47.915, lng: 106.91833333 }, // Temple Choijin Lama
  { lat: 58.2633, lng: 57.43033 }, // Gulag de Perm 36
  { lat: 40.41779, lng: -3.70071 }, // Reial Acadèmia de Belles Arts de Sant Ferran
  { lat: 52.374167, lng: 4.898056 }, // Oude Kerk
  { lat: 52.993333333, lng: 6.564166666 }, // Museu de Drenthe
  { lat: 38.985737, lng: 9.016026 }, // Nora
  { lat: 37.184888888, lng: -3.600944444 }, // Universitat de Granada
  { lat: 53.9598, lng: -1.09771 }, // National Railway Museum
  { lat: 51.4069, lng: 7.0083 }, // Vila Hügel
  { lat: 37.9778, lng: 23.7354 }, // Numismatic Museum of Athens
  { lat: 59.941666666, lng: 30.304444444 }, // Kunstkàmera
  { lat: 35.8975, lng: 14.51125 }, // Museu Arqueològic Nacional
  { lat: 59.325, lng: 18.096388888 }, // ABBA: The Museum
  { lat: 33.889166666, lng: -117.819444444 }, // Biblioteca i Museu Presidencial Richard Nixon
  { lat: 23.141667, lng: -82.356667 }, // Museu de la Revolució
  { lat: 52.376609, lng: 4.633598 }, // Frans Hals Museum
  { lat: -64.816666666, lng: -63.5 }, // Port Lockroy
  { lat: 46.923055555, lng: 4.0375 }, // Bibracte
  { lat: 48.3544, lng: 15.8847 }, // Zwentendorf Nuclear Power Plant
  { lat: 52.518055555, lng: 13.396944444 }, // Museu Alemany d'Història
  { lat: -15.950222, lng: -5.683022 }, // Longwood House
  { lat: 12.12543, lng: 15.07743 }, // Museu Nacional del Txad
  { lat: 48.86218, lng: 2.28741 }, // Musée de l'Homme
  { lat: 48.22843, lng: 15.33123 }, // Abadia de Melk
  { lat: 44.454383333, lng: 26.083677777 }, // Museu Nacional del Camperol Romanès
  { lat: 6.442833333, lng: 3.402861111 }, // Nigerian National Museum, Lagos
  { lat: 39.03234, lng: 125.75205 }, // Korean Revolution Museum
  { lat: 26.9255, lng: 75.8236 }, // Palau de Jaipur
  { lat: 50.466361, lng: 30.517514 }, // Ukrainian National Chornobyl Museum
  { lat: 41.38039, lng: 2.1206365 }, // Museu del FC Barcelona
  { lat: 51.485577, lng: -3.177128 }, // Museu i Galeria Nacional de Cardiff
  { lat: 40.55823, lng: 14.262628 }, // Vil·la de Júpiter
  { lat: 44.830474, lng: 11.628959 }, // Palazzo Schifanoia
  { lat: 19.355143, lng: -99.162525 }, // Museu Frida Kahlo
  { lat: 53.5438229, lng: 9.9889448 }, // Miniatur Wunderland
  { lat: 56.97055, lng: 24.22766 }, // Museu del Motor de Riga
  { lat: 48.889166666, lng: 9.003333333 }, // Tomba de Hochdorf
  { lat: 53.187375, lng: 5.543752777 }, // Planetari Eise Eisinga
  { lat: 39.8108, lng: -86.1575 }, // The Children's Museum of Indianapolis
  { lat: -64.825277777, lng: -63.494444444 }, // Port Lockroy
  { lat: 49.4829, lng: 8.46177 }, // Mannheim Palace
  { lat: 38.914166666, lng: -77.063333333 }, // Dumbarton Oaks
  { lat: 38.936922, lng: -9.326395 }, // Palau de Mafra
  { lat: 41.906388888, lng: 12.475555555 }, // Ara Pacis
  { lat: 48.82861111, lng: 2.2225 }, // Manufacture nationale de Sèvres
  { lat: 51.4975, lng: -0.174722222 }, // Science Museum de Londres
  { lat: 43.776646, lng: 11.261259 }, // Museu Arqueològic Nacional de Florència
  { lat: 55.68889, lng: 12.57861 }, // Galeria Nacional de Dinamarca
  { lat: 51.483666666, lng: -0.005944444 }, // Old Royal Naval College
  { lat: 36.237777777, lng: 36.384722222 }, // Alalakh
  { lat: 25.743611, lng: -80.210278 }, // Vizcaya Museum and Gardens
  { lat: 1.28611, lng: 103.859 }, // ArtScience Museum
  { lat: 43.383679, lng: -4.292743 }, // El Capricho
  { lat: 40.4178, lng: -3.7007 }, // Reial Acadèmia de Belles Arts de Sant Ferran
  { lat: 49.940945102, lng: 11.582061647 }, // Wahnfried
  { lat: 52.121431, lng: 4.986347 }, // Castle de Haar
  { lat: 59.43264722, lng: 24.73943056 }, // Museu Vabamu de les Ocupacions i la Llibertat
  { lat: 48.860361, lng: 2.324444 }, // Palais de la Légion d'Honneur
  { lat: 41.69605, lng: 44.80026 }, // Museu Simon Janashia de Geòrgia
  { lat: 32.0775, lng: 34.786666666 }, // Museu d'Art de Tel-Aviv
  { lat: 43.3775, lng: -1.749167 }, // Abbadia Castle
  { lat: 43.776222, lng: 11.26225 }, // Museu Arqueològic Nacional de Florència
  { lat: 13.757826, lng: 100.492307 }, // Bangkok National Museum
  { lat: 48.866111111, lng: 2.310833333 }, // Palais de la Découverte
  { lat: 46.9244, lng: 4.035 }, // Bibracte
  { lat: 39.91555556, lng: 116.39083333 }, // Museu del Palau
  { lat: 42.465632151, lng: 59.613558731 }, // Museu d'Art de Nukus
  { lat: 40.369477777, lng: 49.840122222 }, // Museu Nacional d'Història de l'Azerbaidjan
  { lat: 53.916305555, lng: 27.537888888 }, // Belarusian Great Patriotic War Museum
  { lat: 36.158333333, lng: -86.776111111 }, // Country Music Hall of Fame and Museum
  { lat: 31.775480555, lng: 35.2331 }, // Institut del Temple
  { lat: 48.863033562, lng: 2.333716397 }, // Museu d'Arts Decoratives
  { lat: 43.775, lng: 11.253888888 }, // Basílica de San Lorenzo
  { lat: 4.6155, lng: -74.0683 }, // Colombian National Museum
  { lat: 18.4775, lng: -69.88275 }, // Palau d'en Jaume Colom
  { lat: 40.671206, lng: -73.963631 }, // Museu de Brooklyn
  { lat: 45.46735, lng: 9.19004 }, // Gallerie d'Italia – Milano
  { lat: 59.341666666, lng: 18.054722222 }, // Observatori d'Estocolm
  { lat: 52.5066, lng: 13.3818 }, // Martin-Gropius-Bau
  { lat: 30.005916666, lng: 31.230666666 }, // Museu Copte
  { lat: 42.3782, lng: -71.1148 }, // Museu Peabody d'Arqueologia i Etnologia
  { lat: 26.2397585, lng: 50.5915421 }, // Beit Al Quran
  { lat: 49.253055555, lng: 4.034444444 }, // Palau de Tau
  { lat: 55.749577777, lng: 37.613411111 }, // Kremlin Armoury
  { lat: 51.218294444, lng: 4.398163888 }, // Casa taller museu Plantin-Moretus
  { lat: 40.41087, lng: -3.691398 }, // Reial Jardí Botànic de Madrid
  { lat: 44.819444444, lng: 20.442222222 }, // Museum of Contemporary Art, Belgrade
  { lat: 51.759028, lng: -1.256416 }, // Museu d'Història Natural de la Universitat d'Oxford
  { lat: 44.8051, lng: 20.4707 }, // Nikola Tesla Museum, Belgrade, Serbia
  { lat: 48.645555555, lng: 1.817777777 }, // Château de Rambouillet
  { lat: 43.296937, lng: 5.361139 }, // Museu de les Civilitzacions d'Europa i de la Mediterrània
  { lat: 53.624166666, lng: 11.418888888 }, // Schwerin Castle
  { lat: 38.639306, lng: -90.294491 }, // Museu d'Art de Saint Louis
  { lat: 1.91667, lng: -76.2333 }, // Parc arqueològic de San Agustín
  { lat: 41.658333333, lng: -83.559444444 }, // Museu d'Art de Toledo
  { lat: 41.993805555, lng: 21.430916666 }, // Casa memorial de la Mare Teresa
  { lat: 43.77251, lng: 11.24598 }, // Església de Ognissanti (Florència)
  { lat: 41.508888888, lng: -81.611666666 }, // Museu d'Art de Cleveland
  { lat: 52.412672222, lng: 13.06975 }, // palau de marbre
  { lat: 48.01298, lng: 15.59865 }, // Lilienfeld Abbey
  { lat: 41.00444444, lng: 28.97666667 }, // Great Palace Mosaic Museum
  { lat: 38.714722222, lng: -9.127777777 }, // Convent de Sant Vicenç de Fora
  { lat: 44.8198, lng: 20.45627 }, // Ethnographic Museum, Belgrade
  { lat: 50.940542, lng: 6.958931 }, // Römisch-Germanisches Museum
  { lat: 50.0425, lng: 8.046666666 }, // Monestir Eberbach
  { lat: 31.784444444, lng: 35.235833333 }, // Museu Rockefeller
  { lat: 41.368611111, lng: 2.16 }, // Fundació Joan Miró
  { lat: 43.62333333, lng: 22.67722222 }, // Belogradchik Fortress
  { lat: -22.49583, lng: -44.56278 }, // Itatiaia National Park
  { lat: 60.163093, lng: 24.947773 }, // Museu d'Arquitectura Finlandesa
  { lat: 17.371426, lng: 78.480347 }, // Salar Jung Museum
  { lat: 51.0528, lng: 13.7364 }, // Grünes Gewölbe
  { lat: -36.860277777, lng: 174.777777777 }, // Museu Memorial de Guerra d'Auckland
  { lat: 52.3673, lng: 4.903844 }, // Museu Històric Jueu
  { lat: 47.2686, lng: 11.3933 }, // Golden Roof
  { lat: 39.8734381, lng: 8.4410191 }, // Tharros
  { lat: 40.521288, lng: -3.77506 }, // Palau Reial d'El Pardo
  { lat: 50.35453889, lng: 30.51223056 }, // National Museum of Folk Architecture and Folkways of Ukraine
  { lat: 60.1631269, lng: 24.9478223 }, // Museu d'Arquitectura Finlandesa
  { lat: 43.3618, lng: -5.8463 }, // Universitat d'Oviedo
  { lat: -33.8743, lng: 151.213 }, // Museu Australià
  { lat: 43.819722222, lng: 18.337222222 }, // Túnel de Sarajevo
  { lat: 43.730833333, lng: 7.425277777 }, // Museu Oceanogràfic de Mònaco
  { lat: 40.425833, lng: -3.700833 }, // Madrid History Museum
  { lat: 48.30719, lng: 16.32664 }, // Klosterneuburg Monastery
  { lat: 41.91421, lng: 12.492144 }, // Galeria Borghese
  { lat: 41.999083, lng: 12.096765 }, // Necròpoli de la Banditaccia
  { lat: 41.917046, lng: 12.4799803 }, // Galeria Nacional d'Art Modern i Contemporani
  { lat: 41.92807, lng: 12.46648 }, // MAXXI
  { lat: 43.667277777, lng: -79.400111111 }, // Bata Shoe Museum
  { lat: 60.1717, lng: 24.9369 }, // Sinebrychoff Art Museum
  { lat: 28.601861111, lng: 77.214361111 }, // Gandhi Smriti
  { lat: 25.2868, lng: 51.549728 }, // National Museum of Qatar
  { lat: 43.152777777, lng: -77.580277777 }, // Museu George Eastman
  { lat: 34.746433, lng: -92.258464 }, // Centre Presidencial Clinton
  { lat: 60.1700846, lng: 24.9439789 }, // Ateneum
  { lat: 51.571388888, lng: -0.1675 }, // Kenwood House
  { lat: 44.748611111, lng: 33.881944444 }, // Palau de Bakhtxissarai
  { lat: 25.611111111, lng: 85.143888888 }, // Patna Museum
  { lat: 43.775204, lng: 11.253117 }, // Capella funerària dels Mèdici
  { lat: 49.383526939, lng: 8.565925958 }, // Schwetzingen Palace
  { lat: 30.2857, lng: -97.7292 }, // Biblioteca i Museu Presidencial de Lyndon Baines Johnson
  { lat: 41.031111, lng: 28.939167 }, // sant Salvador de Cora
  { lat: 21.025277777, lng: 105.846388888 }, // Hỏa Lò Prison
  { lat: 48.2069, lng: 14.3783 }, // Monestir de Sant Florià
  { lat: 32.78756, lng: -96.800893 }, // Museu d'Art de Dallas
  { lat: 44.770277777, lng: 20.468333333 }, // Banjica concentration camp
  { lat: -37.803337, lng: 144.971445 }, // Museu de Melbourne
  { lat: 24.6311, lng: 46.7133 }, // fort Masmak
  { lat: 52.4311, lng: 10.7919 }, // Autostadt
  { lat: 23.06, lng: 72.580833 }, // Sabarmati Ashram
  { lat: 48.8877, lng: 2.3406 }, // Musée de Montmartre
  { lat: 11.549444444, lng: 104.917777777 }, // Tuol Sleng
  { lat: 41.5074, lng: 19.79401 }, // Gjergj Kastrioti Skënderbeu National Museum
  { lat: 51.217222222, lng: 4.409444444 }, // Rubenshuis
  { lat: 68.244, lng: 13.7566 }, // Lofotr Viking Museum
  { lat: 47.8, lng: 13.04333333 }, // Casa natal de Wolfgang Amadeus Mozart
  { lat: 39.932668, lng: 32.854894 }, // Museu Etnològic d'Ankara
  { lat: 60.16251131, lng: 24.93291378 }, // Sinebrychoff Art Museum
  { lat: 42.15, lng: 24.75305556 }, // Plovdiv Regional Ethnographic Museum
  { lat: 37.7715, lng: -122.468694444 }, // Museu de Belles Arts de San Francisco
  { lat: 48.848903228, lng: 2.357040967 }, // Institut del Món Àrab
  { lat: 45.440555555, lng: 12.333888888 }, // Ca' d'Oro
  { lat: 45.441, lng: 12.33146 }, // Ca' Pesaro
  { lat: 32.113811111, lng: 34.805261111 }, // Bet ha-Tefutsot
  { lat: 37.97593889, lng: 23.74040833 }, // Museu Benaki
  { lat: 51.758611111, lng: -1.255 }, // Museu Pitt-Rivers
  { lat: 39.606388888, lng: 19.926111111 }, // Mon Repos
  { lat: -22.354247222, lng: -44.653294444 }, // Itatiaia National Park
  { lat: 59.916806, lng: 10.735472 }, // Museu d'Història Cultural
  { lat: 48.2186, lng: 16.3631 }, // Sigmund Freud Museum
  { lat: 22.5449, lng: 88.3425 }, // Victoria Memorial
  { lat: 52.5188, lng: 13.3648 }, // Haus der Kulturen der Welt
  { lat: 48.203333333, lng: 16.358888888 }, // MuseumsQuartier
  { lat: 35.81019444, lng: -78.70288889 }, // Museu d'Art de Carolina del Nord
  { lat: 39.113888888, lng: -84.496944444 }, // Museu d'Art de Cincinnati
  { lat: 41.994444444, lng: 21.432222222 }, // Porta Macedonia
  { lat: 48.2812, lng: 14.1138 }, // castell de Hartheim
  { lat: 41.029166666, lng: 28.946388888 }, // església de la Mare de Déu Benauradíssima
  { lat: 33.7628, lng: -84.3928 }, // World of Coca-Cola
  { lat: 41.928467, lng: 12.468314 }, // MAXXI
  { lat: 52.3675, lng: 4.905278 }, // Sinagoga portuguesa d'Amsterdam
  { lat: 50.44833333, lng: 30.51305556 }, // Golden Gate
  { lat: 52.5092869, lng: 13.3644977 }, // Staatliche Museen
  { lat: 60.163118, lng: 24.9478097 }, // Museu d'Arquitectura Finlandesa
  { lat: 44.804694444, lng: 10.325833333 }, // Teatro Farnese
  { lat: -6.176111111, lng: 106.821666666 }, // Museu Nacional d'Indonèsia
  { lat: 50.830889, lng: 4.518497 }, // Museu Reial de l'Àfrica Central
  { lat: 40.84341, lng: 14.241129 }, // Certosa di San Martino
  { lat: 52.373889, lng: 4.891944 }, // Nieuwe Kerk
  { lat: 36.721653, lng: -4.4185762 }, // Museu Picasso de Màlaga
  { lat: 25.288469292, lng: 51.549263096 }, // National Museum of Qatar
  { lat: 13.773888888, lng: 100.512777777 }, // Vimanmek Mansion
  { lat: 40.415555555, lng: 50.008611111 }, // Ateshgah of Baku
  { lat: 44.804918055, lng: 10.326008055 }, // Teatro Farnese
  { lat: 40.01731389, lng: 126.21513333 }, // International Friendship Exhibition
  { lat: 21.02, lng: -101.26638889 }, // Mòmies de Guanajuato
  { lat: 50.035833, lng: 19.178333 }, // Museu Estatal d'Auschwitz–Birkenau
  { lat: 5.54772222, lng: 95.31508333 }, // Aceh Tsunami Museum
  { lat: 52.515833, lng: 13.397222 }, // Friedrichswerder Church
  { lat: 60.1749794, lng: 24.93156068 }, // National Museum of Finland
  { lat: 41.717611111, lng: 44.783333333 }, // Georgian National Centre of Manuscripts
  { lat: 52.366111111, lng: 4.916666666 }, // Natura Artis Magistra
  { lat: 38.900051, lng: -77.029315 }, // Museu Nacional de Dones Artistes
  { lat: 54.075127, lng: 37.526385 }, // Iàsnaia Poliana
  { lat: 47.6215, lng: -122.3486 }, // Museu de la Cultura Pop
  { lat: 49.9761, lng: 9.14167 }, // Schloss Johannisburg
  { lat: 35.836416666, lng: 14.528027777 }, // Għar Dalam
  { lat: 50.087222222, lng: 14.427777777 }, // Torre de la pólvora
  { lat: 54.831666666, lng: 9.543611111 }, // Castell de Glücksburg
  { lat: 52.374106, lng: 4.912392 }, // NEMO
  { lat: 52.370278, lng: 4.890833 }, // Museu d'Amsterdam
  { lat: 48.923611111, lng: 24.709166666 }, // Ivano-Frankivsk Regional Art Museum
  { lat: 59.903611, lng: 10.698056 }, // Museu Kon-Tiki
  { lat: 44.749009, lng: 33.882104 }, // Palau de Bakhtxissarai
  { lat: 40.748803, lng: -73.981556 }, // Pierpont Morgan Library
  { lat: 40.418267, lng: -3.706192 }, // Convent de les Descalces Reials
  { lat: 48.2425, lng: 15.2025 }, // Castell d'Artstetten
  { lat: 54.900833, lng: 23.910556 }, // Museu Žmuidzinavičius
  { lat: 51.205500909, lng: 3.221590802 }, // catedral de Bruges
  { lat: 59.326666666, lng: 18.071666666 }, // palau reial d'Estocolm
  { lat: 32.103152777, lng: 34.796416666 }, // Museu de la Terra d'Israel
  { lat: 36.721771, lng: -4.41847 }, // Museu Picasso de Màlaga
  { lat: 60.163125, lng: 24.947745 }, // Museu d'Arquitectura Finlandesa
  { lat: 31.220278, lng: 121.537778 }, // Shanghai Science and Technology Museum
  { lat: -12.880277777, lng: -41.372222222 }, // Parc nacional de la Chapada Diamantina
  { lat: 3.14292, lng: 101.689 }, // Islamic Arts Museum Malaysia
  { lat: 31.631214, lng: -7.986771 }, // palau Mnebhi
  { lat: 55.822777777, lng: 37.639722222 }, // Monument to the Conquerors of Space
  { lat: 36.809444444, lng: 10.134444444 }, // Museu del Bardo
  { lat: 37.9775, lng: 23.73277778 }, // National Historical Museum
  { lat: 38.073333, lng: 46.3 }, // Azerbaijan Museum
  { lat: 34.259516666, lng: -118.819744444 }, // Biblioteca Presidencial Ronald Reagan
  { lat: 34.4675, lng: 69.12 }, // Museu de Kabul
  { lat: 28.463946, lng: -16.249471 }, // Museu de la Naturalesa i l'Home
  { lat: 55.753333333, lng: 37.612222222 }, // Manège de Moscou
  { lat: 41.790555555, lng: -87.582777777 }, // Kenneth C. Griffin Museum of Science and Industry
  { lat: 42.006, lng: 12.099595 }, // Necròpoli de la Banditaccia
  { lat: -12.51089, lng: -41.57586 }, // Parc nacional de la Chapada Diamantina
  { lat: 40.4277, lng: -3.7124 }, // palau de Llíria
  { lat: 48.313888888, lng: 15.421666666 }, // Aggstein Castle
  { lat: 51.526525195, lng: -0.135332174 }, // Royal Asiatic Society of Great Britain and Ireland
  { lat: 22.616666666, lng: -83.716666666 }, // Vall de Viñales
  { lat: 59.906944444, lng: 10.753611111 }, // Òpera d'Oslo
  { lat: 46.15, lng: 9.45 }, // Dubino
  { lat: 48.88665, lng: 2.34295 }, // Basílica del Sacré Cœur
  { lat: 40.713, lng: -74.0135 }, // One World Trade Center
  { lat: 41.878611, lng: -87.635833 }, // Torre Willis
  { lat: -22.951915648, lng: -43.210464122 }, // Crist Redemptor de Rio de Janeiro
  { lat: 29.657777777, lng: 91.116944444 }, // palau de Potala
  { lat: 46.133333333, lng: 9.416666666 }, // Piantedo
  { lat: 49, lng: 89 }, // massís de l'Altai
  { lat: 41.890277777, lng: 12.492222222 }, // Colosseu
  { lat: 46.5, lng: 8.5 }, // Alps suïssos
  { lat: 51.053427, lng: 13.740206 }, // Brühl's Terrace
  { lat: 34.1014, lng: -118.344966666 }, // Passeig de la Fama de Hollywood
  { lat: 51.501, lng: -0.142 }, // Palau de Buckingham
  { lat: 52.5075, lng: 13.390277777 }, // Checkpoint Charlie
  { lat: 47.6204, lng: -122.3491 }, // Space Needle
  { lat: -33.857058, lng: 151.214897 }, // Palau de l'Òpera de Sydney
  { lat: 21.4225, lng: 39.826111111 }, // la Meca
  { lat: 38.897777777, lng: -77.036666666 }, // Casa Blanca
  { lat: 42.359987, lng: -71.056315 }, // Faneuil Hall
  { lat: 46.216666666, lng: 9.45 }, // Novate Mezzola
  { lat: 40.752777777, lng: -73.977222222 }, // Grand Central Terminal
  { lat: 46.133333333, lng: 9.366666666 }, // Colico
  { lat: 45.463968, lng: 9.190578 }, // catedral de Milà
  { lat: 45.109594, lng: 7.641247 }, // Juventus Stadium
  { lat: 13.4125, lng: 103.866666666 }, // Angkor Vat
  { lat: 31.236666666, lng: 121.502777777 }, // Shanghai World Financial Center
  { lat: 41.045555555, lng: 29.034027777 }, // Pont dels màrtirs del 15 de juliol
  { lat: -7.60793, lng: 110.20384 }, // Borobudur
  { lat: 37.819722222, lng: -122.478611111 }, // Pont Golden Gate
  { lat: 59.953829, lng: 31.038866 }, // Oreshek Fortress
  { lat: 43.08, lng: -79.071 }, // cascades del Niàgara
  { lat: 42.717011111, lng: 12.113272222 }, // Catedral d'Orvieto
  { lat: 37.750834514, lng: 14.993220288 }, // Etna
  { lat: 40.689209166, lng: -74.044425277 }, // estàtua de la Llibertat
  { lat: 27.175, lng: 78.041944444 }, // Taj Mahal
  { lat: 35.18, lng: 129.075 }, // Busan
  { lat: 30.328888888, lng: 35.440277777 }, // Petra d'Aràbia
  { lat: 1.284444444, lng: 103.855833333 }, // Marina Bay
  { lat: 35.955277777, lng: 52.109166666 }, // Muntanya Damavand
  { lat: 41.02, lng: 28.973055555 }, // pont de Gàlata
  { lat: -3.066666666, lng: 37.359166666 }, // Kilimanjaro
  { lat: 45.438008, lng: 12.335639 }, // Pont de Rialto
  { lat: 45.434055555, lng: 12.340861111 }, // Pont dels sospirs
  { lat: 30.328611, lng: 35.441944 }, // Petra d'Aràbia
  { lat: 40.253333333, lng: 116.2175 }, // Tombes de la dinastia Ming
  { lat: 29.97915, lng: 31.13422 }, // piràmide de Quèops
  { lat: 35.360555555, lng: 138.7275 }, // mont Fuji
  { lat: 40.748333333, lng: -73.985555555 }, // Empire State Building
  { lat: -25.695277777, lng: -54.436666666 }, // cascades de l'Iguaçú
  { lat: -15.825, lng: -69.325 }, // llac Titicaca
  { lat: 51.529444, lng: -0.126944 }, // Biblioteca Britànica
  { lat: 40.416666666, lng: 116.083333333 }, // Gran Muralla Xinesa
  { lat: 34.385, lng: 109.273055555 }, // exèrcit de guerrers de terracota
  { lat: 37.551216, lng: 126.988276 }, // N Seoul Tower
  { lat: 51.178888888, lng: -1.826111111 }, // Stonehenge
  { lat: 46.172222222, lng: 9.381388888 }, // Sorico
  { lat: 40.183888888, lng: 29.061944444 }, // Bursa Grand Mosque
  { lat: 23.88611111, lng: 70.21666667 }, // Dholavira
  { lat: 42.551162, lng: 12.715247611 }, // Cascata delle Marmore
  { lat: 37.17634, lng: -3.58821 }, // Alhambra
  { lat: 51.5125, lng: -0.1225 }, // Covent Garden
  { lat: 59.32888889, lng: 18.11833333 }, // Rosendal Palace
  { lat: 40.758611111, lng: -73.979194444 }, // Rockefeller Center
  { lat: 55.754166666, lng: 37.62 }, // plaça Roja
  { lat: 38.870833333, lng: -77.055 }, // El Pentàgon
  { lat: 54.476388888, lng: 19.767777777 }, // llacuna del Vístula
  { lat: 41.902222222, lng: 12.453416666 }, // basílica de Sant Pere del Vaticà
  { lat: 40.7575, lng: -73.985833333 }, // Times Square
  { lat: -0.666666666, lng: -90.55 }, // illes Galápagos
  { lat: 37.939722, lng: 27.348611 }, // Efes
  { lat: 25.197222222, lng: 55.274166666 }, // Burj Khalifa
  { lat: 51.50067, lng: -0.12457 }, // Big Ben
  { lat: 20.683055555, lng: -88.568611111 }, // Chichén Itzá
  { lat: 41.0053851, lng: 28.9768247 }, // mesquita blava
  { lat: 50.941388888, lng: 6.958333333 }, // Catedral de Colònia
  { lat: 52.504444444, lng: 13.441111111 }, // Mur de Berlín
  { lat: 5.970055555, lng: -62.536222222 }, // Salto Angel
  { lat: 36.4687843, lng: 29.4034195 }, // Saklıkent Canyon
  { lat: 37.939722, lng: 27.340833 }, // Efes
  { lat: 45.57595, lng: -122.115361111 }, // Multnomah Falls
  { lat: -20.33333, lng: -67.7 }, // Salar de Uyuni
  { lat: 45.9, lng: 9.416666666 }, // Ballabio
  { lat: 46.0432, lng: 9.3061 }, // Bellano
  { lat: 51.4994, lng: -0.127367 }, // Abadia de Westminster
  { lat: 55.024166666, lng: -2.2925 }, // Mur d'Adrià
  { lat: 37.971527, lng: 23.726601 }, // Partenó
  { lat: 52.520833333, lng: 13.409444444 }, // Fernsehturm de Berlín
  { lat: 41.016111111, lng: 28.963888888 }, // mesquita de Solimà
  { lat: 52.516272222, lng: 13.377722222 }, // Porta de Brandenburg
  { lat: 25.500613, lng: -80.444357 }, // Coral Castle
  { lat: 55.750833333, lng: 37.618333333 }, // Tsar Kolokol
  { lat: 31.77286389, lng: 35.22951667 }, // Zion Gate
  { lat: 41.900833333, lng: 12.483055555 }, // Fontana di Trevi
  { lat: 40.413888888, lng: -3.692222222 }, // Museu del Prado
  { lat: 51.503333333, lng: -0.119722222 }, // London Eye
  { lat: 45.049166666, lng: 1.176111111 }, // Coves de Lascaux
  { lat: 3.157777777, lng: 101.711666666 }, // Torres Petronas
  { lat: 41.898611111, lng: 12.476944444 }, // Panteó
  { lat: 29.546944444, lng: 103.76925 }, // Gran Buda de Leshan
  { lat: 35.297961111, lng: 25.163155555 }, // Cnossos
  { lat: 51.477833333, lng: -0.001388888 }, // Observatori Reial de Greenwich
  { lat: 35.297961, lng: 25.163156 }, // Cnossos
  { lat: 36.983333333, lng: -110.1 }, // Monument Valley
  { lat: 49.16472222, lng: 20.28222222 }, // Tatranská Lomnica
  { lat: 52.508333333, lng: 13.3375 }, // Jardí Zoològic de Berlín
  { lat: 45.433666666, lng: 12.340416666 }, // Palau Ducal
  { lat: 36.564722222, lng: -118.772777777 }, // Parc Nacional Sequoia
  { lat: 40.705666666, lng: -73.996333333 }, // Pont de Brooklyn
  { lat: 52.521666666, lng: 13.413611111 }, // Alexanderplatz
  { lat: 11.061, lng: 106.526 }, // Túnel de Cu Chi
  { lat: 49.377222222, lng: 10.178888888 }, // Rothenburg ob der Tauber
  { lat: 51.998055555, lng: -0.741111111 }, // Bletchley Park
  { lat: 45.434444444, lng: 12.339722222 }, // basílica de Sant Marc
  { lat: 48.884167, lng: 2.332222 }, // Moulin Rouge
  { lat: 55.751666666, lng: 37.617777777 }, // Kremlin de Moscou
  { lat: 36.015833333, lng: -114.737777777 }, // Presa Hoover
  { lat: 40.783055555, lng: -73.958888888 }, // Museu Guggenheim
  { lat: 33.809, lng: -117.919 }, // Disneyland
  { lat: 51.508055555, lng: -0.128055555 }, // Trafalgar Square
  { lat: 52.622222222, lng: 1.309166666 }, // Carrow Road
  { lat: 51.053055555, lng: 13.733888888 }, // Zwinger
  { lat: 31.778444444, lng: 35.22975 }, // basílica del Sant Sepulcre
  { lat: 51.514444444, lng: -0.080277777 }, // 30 St Mary Axe
  { lat: 34.134102777, lng: -118.321694444 }, // Hollywood Sign
  { lat: 38.633333333, lng: 42.816666666 }, // llac Van
  { lat: 6.438344444, lng: 80.888455555 }, // Udawalawe National Park
  { lat: 43.642752777, lng: -79.387147222 }, // Torre CN
  { lat: 55.819722222, lng: 37.611666666 }, // Torre Ostankino
  { lat: 40.7825, lng: -73.966111111 }, // Central Park
  { lat: 59.390277777, lng: 18.016944444 }, // palau d'Ulriksdal
  { lat: 49.197222222, lng: 20.070833333 }, // Morskie Oko
  { lat: 38.8913, lng: -77.0259 }, // Museu Nacional d'Història Natural
  { lat: 55.7525, lng: 37.623055555 }, // catedral de Sant Basili
  { lat: 38.889475, lng: -77.035244444 }, // Monument a Washington
  { lat: 41.047330729, lng: 29.026808738 }, // mesquita d'Ortaköy
  { lat: 43.9508, lng: 4.8075 }, // Palau dels Papes
  { lat: 20.9, lng: 107.2 }, // badia de Hạ Long
  { lat: 37.8267199, lng: -122.4228329 }, // Presó d'Alcatraz
  { lat: 29.9725, lng: 31.128333333 }, // piràmides d'Egipte
  { lat: 11.18, lng: 119.39 }, // Q111483
  { lat: 56.796891, lng: -5.003675 }, // Ben Nevis
  { lat: 35.658611111, lng: 139.745555555 }, // Torre de Tòquio
  { lat: 41.8922, lng: 12.4852 }, // Fòrum Romà
  { lat: 52.521388888, lng: 13.395555555 }, // Illa dels Museus
  { lat: 31.774722222, lng: 35.233888888 }, // Dung Gate
  { lat: 25.696666666, lng: 32.644444444 }, // Luxor
  { lat: 40.774078, lng: -73.965863 }, // Cinquena Avinguda
  { lat: 40.699444444, lng: -74.039722222 }, // Ellis Island
  { lat: 48.886944444, lng: 2.341111111 }, // Montmartre
  { lat: 22.29, lng: 114.17 }, // Victoria Harbour
  { lat: 51.503333333, lng: -0.1275 }, // Downing Street
  { lat: 52.519166666, lng: 13.401111111 }, // Catedral de Berlín
  { lat: 50.054477777, lng: 19.935588888 }, // Sigismund's Chapel
  { lat: 43.9473, lng: 4.5355 }, // pont del Gard
  { lat: 31.780833333, lng: 35.236944444 }, // Lions' Gate
  { lat: 37.7425, lng: -119.5375 }, // Parc Nacional de Yosemite
  { lat: 51.051944444, lng: 13.741666666 }, // Frauenkirche
  { lat: 55.6168339, lng: 37.682817 }, // Palau + parc de Tsaritsyno
  { lat: 44.080277777, lng: 3.0225 }, // Viaducte de Millau
  { lat: 56.000277777, lng: -3.841666666 }, // Falkirk Wheel
  { lat: 48.854722222, lng: 2.3475 }, // île de la Cité
  { lat: 36.456938888, lng: -116.865280555 }, // Death Valley
  { lat: 52.518611111, lng: 13.376111111 }, // Reichstag
  { lat: 51.505555555, lng: -0.075277777 }, // Pont de la Torre
  { lat: 50.8449844, lng: 4.349988 }, // Manneken Pis
  { lat: 55.240833333, lng: -6.511666666 }, // Calçada del Gegant
  { lat: 37.971666666, lng: 23.726111111 }, // Acròpolis d'Atenes
  { lat: 31.776947222, lng: 35.23425 }, // Mur de les Lamentacions
  { lat: 29.97527, lng: 31.13768 }, // Esfinx de Giza
  { lat: 45.434, lng: 12.338 }, // plaça de Sant Marc
  { lat: 31.776528, lng: 35.227694 }, // Jaffa Gate
  { lat: 43.116666666, lng: -79.066666666 }, // Niagara Falls
  { lat: 53.75, lng: 21.716666666 }, // Śniardwy
  { lat: 53.580555555, lng: -2.535555555 }, // Reebok Stadium
  { lat: 37.968333333, lng: 23.741111111 }, // estadi Panathinaikó
  { lat: 6.24, lng: 80.28 }, // Reserva forestal de Sinharaja
  { lat: 50.1156, lng: 8.70314 }, // Zoològic de Frankfurt
  { lat: 38.728055555, lng: -109.54 }, // Parc Nacional dels Arcs
  { lat: 43.07484, lng: 12.60581 }, // Basílica de Sant Francesc d'Assís
  { lat: 7.293611111, lng: 80.641388888 }, // Temple de la Dent
  { lat: 48.846944444, lng: 2.337222222 }, // Jardin du Luxembourg
  { lat: 51.51, lng: -0.134444444 }, // Piccadilly Circus
  { lat: 34.509444444, lng: 136.788333333 }, // Meoto Iwa
  { lat: 38.833333333, lng: 33.333333333 }, // Llac Tuz
  { lat: 41.902222222, lng: 12.453333333 }, // Pietat
  { lat: 38.691388888, lng: -9.215833333 }, // torre de Belém
  { lat: -47.15, lng: -70.666666666 }, // cova de les Mans
  { lat: 52.936111111, lng: -9.470833333 }, // penya-segats de Moher
  { lat: 51.106111111, lng: -2.317777777 }, // Stourhead
  { lat: 41.051666666, lng: 28.991388888 }, // Nişantaşı
  { lat: 31.241669444, lng: 121.494716666 }, // Torre Perla Oriental
  { lat: 45.813055555, lng: 15.977222222 }, // Ban Jelačić Square
  { lat: 1.386944444, lng: 103.800833333 }, // Bukit Timah Nature Reserve
  { lat: 42.133333333, lng: 23.340277777 }, // Monestir de Rila
  { lat: 7.956944444, lng: 80.759722222 }, // Sigiriya
  { lat: 12.97277778, lng: 100.88888889 }, // Sanctuary of Truth
  { lat: 55.69286, lng: 12.59926 }, // La Sireneta
  { lat: 28.3722, lng: -81.5494 }, // Walt Disney World Resort
  { lat: 31.625971, lng: -7.989098 }, // Djemà-el-Fna
  { lat: 51.499586, lng: -0.163517 }, // Harrods
  { lat: 27.710495, lng: 85.348645 }, // temple de Pashupatinath
  { lat: -17.38425, lng: -66.134955555 }, // Crist de la Concòrdia
  { lat: 48.14166, lng: 11.57726 }, // Feldherrnhalle
  { lat: 38.889277777, lng: -77.050138888 }, // Lincoln Memorial
  { lat: 45.442222222, lng: 12.326388888 }, // Gran Canal
  { lat: 59.94, lng: 30.328611111 }, // església del Salvador sobre la Sang Vessada
  { lat: 52.540963, lng: 13.212589 }, // Spandau Citadel
  { lat: 55.8552662, lng: 14.1452987 }, // església de Vittskövle
  { lat: 41.03416667, lng: 28.97888889 }, // avinguda d'Istiklâl
  { lat: -19.592472, lng: 17.933667 }, // Meteorit Hoba
  { lat: 25.3125, lng: -80.6875 }, // Parc Nacional dels Everglades
  { lat: 26.95, lng: 94.166666666 }, // Majuli
  { lat: 38.670556, lng: 34.839167 }, // Capadòcia
  { lat: 64.313834, lng: -20.299494 }, // Geysir
  { lat: 48.84211, lng: 2.32198 }, // Torre Montparnasse
  { lat: 53.6947251, lng: -6.4755655 }, // Newgrange
  { lat: 43.767988888, lng: 11.253191666 }, // Ponte Vecchio
  { lat: 43.76798889, lng: 11.25319167 }, // Ponte Vecchio
  { lat: 36.857778, lng: -111.372222 }, // Antelope Canyon
  { lat: 50.116944, lng: 14.406111 }, // Jardí Zoològic de Praga
  { lat: 60.8629126, lng: 7.1145617 }, // Flåm Line
  { lat: 19.484444, lng: -99.117222 }, // Basílica de Santa Maria de Guadalupe
  { lat: 35.827777777, lng: 14.442222222 }, // Ħaġar Qim
  { lat: 35.676111111, lng: 139.699166666 }, // Santuari Meiji
  { lat: 54.706388888, lng: 20.511666666 }, // Catedral de Königsberg
  { lat: 39.9495, lng: -75.1503 }, // Liberty Bell
  { lat: 1.35278, lng: 103.778 }, // Bukit Timah Nature Reserve
  { lat: 51.216389, lng: 4.423333 }, // Zoo d'Anvers
  { lat: 41.8859, lng: 12.4857 }, // Circ Màxim
  { lat: 55.749166666, lng: 37.590555555 }, // Arbat Street
  { lat: 41.091111111, lng: 29.061388888 }, // Fatih Sultan Mehmet Bridge
  { lat: 55.672777777, lng: 12.521388888 }, // Zoo de Copenhaguen
  { lat: 59.925555555, lng: 30.296111111 }, // Teatre Mariïnski
  { lat: 48.8575, lng: 2.341666666 }, // Pont Nou
  { lat: 58.950277777, lng: 17.584444444 }, // Tullgarn Palace
  { lat: 59.32222222, lng: 18.14861111 }, // galeria Thielska
  { lat: 37.975, lng: 23.7225 }, // àgora d'Atenes
  { lat: 41.898981604, lng: 12.473143934 }, // Piazza Navona
  { lat: 52.39, lng: -4 }, // sender de la costa de Gal·les
  { lat: 44.877222222, lng: 22.4175 }, // Băile Herculane
  { lat: 59.934227777, lng: 30.324594444 }, // Catedral de Kazan
  { lat: -8.62113889, lng: 115.08675 }, // Tanah Lot
  { lat: 37.769722222, lng: -122.476944444 }, // Golden Gate Park
  { lat: 48.2075, lng: 16.3939 }, // Hundertwasserhaus
  { lat: 35.826666666, lng: 14.436388888 }, // Mnajdra
  { lat: 37.31836, lng: -121.95076 }, // Winchester Mystery House
  { lat: 51.053611111, lng: 13.810833333 }, // Loschwitz Bridge
  { lat: 47.50222, lng: 19.03472 }, // Bastió dels Pescadors
  { lat: 26.86666667, lng: 100.23333333 }, // Old Town of Lijiang
  { lat: 48.85, lng: 10.5 }, // Nördlingen
  { lat: 44.59, lng: -1.21166667 }, // Duna de Pyla
  { lat: 37.596111111, lng: 23.079166666 }, // teatre d'Epidaure
  { lat: 55.239558653, lng: -6.33251013 }, // Carrick-a-Rede Rope Bridge
  { lat: 55.703055555, lng: 37.530277777 }, // Gratacels de Stalin
  { lat: 55.66767, lng: 37.66657 }, // Kolómenskoie
  { lat: 19.413055555, lng: -99.197777777 }, // Chapultepec
  { lat: 35.046111111, lng: -90.025833333 }, // Graceland
  { lat: 35.744611111, lng: 51.375333333 }, // Milad Tower
  { lat: 59.3275, lng: 18.054722 }, // Ajuntament d'Estocolm
  { lat: 40.853611111, lng: 14.250555555 }, // Museu Arqueològic Nacional de Nàpols
  { lat: 38.688055555, lng: 128.200277777 }, // Mount Kumgang Tourist Region
  { lat: 41.010580555, lng: 28.967933333 }, // Gran Basar
  { lat: 41.9107, lng: 12.47635 }, // Flaminio Obelisk
  { lat: 58.450555555, lng: 14.891388888 }, // abadia de Vadstena
  { lat: 50.2639, lng: 10.9814 }, // Veste Coburg
  { lat: 51.998888888, lng: -9.742777777 }, // Carrantuohill
  { lat: 42.919411, lng: -0.7275039 }, // Mesa de los Tres Reyes
  { lat: 52.055, lng: 1.145277777 }, // Portman Road
  { lat: 37.974167, lng: 23.738333 }, // National Garden of Athens
  { lat: 43.058196, lng: 12.580268 }, // Porciúncula
  { lat: 48.8675, lng: 2.329444444 }, // Place Vendôme
  { lat: 51.059019, lng: 13.726853 }, // Yenidze
  { lat: 22.254105555, lng: 113.905144444 }, // Tian Tan Buddha
  { lat: 50.2715, lng: 8.56666 }, // Saalburg
  { lat: 41.130261, lng: 16.870281 }, // Basílica de Sant Nicolau
  { lat: 41.8827, lng: -87.6233 }, // Cloud Gate
  { lat: 37.5798841, lng: 126.9767996 }, // Gyeongbokgung
  { lat: 35.028055555, lng: -111.023333333 }, // Meteor Crater
  { lat: 1.300555555, lng: 103.874444444 }, // Singapore Indoor Stadium
  { lat: 50.288333, lng: 18.973056 }, // Estadi de Silèsia
  { lat: 52.966, lng: -6.463 }, // Lugnaquilla
  { lat: 41.894722222, lng: 12.483055555 }, // Monument nacional a Víctor Manuel II
  { lat: 50.8125, lng: 19.097222222 }, // Monestir de Jasna Góra
  { lat: 1.283319, lng: 103.86527 }, // Jardins de la Badia
  { lat: 54.1097, lng: -1.58139 }, // Abadia de Fountains
  { lat: 59.324722222, lng: 18.064722222 }, // església de Riddarholm
  { lat: 31.8328, lng: 120.425 }, // Huaxi Village
  { lat: 37.984084, lng: 23.728344 }, // Omonoia Square
  { lat: 55.754722222, lng: 37.6215 }, // GUM
  { lat: 45.438888888, lng: 10.994444444 }, // Arena di Verona
  { lat: 56.844388888, lng: 60.609111111 }, // Church of All Saints
  { lat: 35.714555555, lng: 139.796638888 }, // Sensō-ji Temple
  { lat: 39.371222222, lng: 38.121583333 }, // Gran mesquita de Divriği
  { lat: 40.5075, lng: 43.572777777 }, // Aní
  { lat: 45.65, lng: 21.6 }, // Buziaș
  { lat: 40.1626, lng: 25.8289 }, // Gökçeada
  { lat: 41.013794444, lng: 28.957175 }, // mesquita Şehzade
  { lat: 7.75491, lng: 4.550625 }, // Osun-Osogbo
  { lat: 7.755555555, lng: 4.552222222 }, // Osun-Osogbo
  { lat: 48.2347, lng: 16.4169 }, // Vienna International Centre
  { lat: 40.233058, lng: 25.903047 }, // Gökçeada
  { lat: 41.0426, lng: 29.0399 }, // Palau de Beylerbeyi
  { lat: 41.019722, lng: 28.949722 }, // mesquita del Conqueridor
  { lat: 49.179444444, lng: 20.088055555 }, // Rysy
  { lat: 58.384166666, lng: 13.654166666 }, // abadia de Varnhem
  { lat: 36.936111111, lng: -111.484166666 }, // Llac Powell
  { lat: 55.829722222, lng: 37.632222222 }, // Exhibition of achievements of national economy
  { lat: 43.06888889, lng: 12.61694444 }, // Basilica di Santa Chiara
  { lat: 34.74675, lng: -92.289222222 }, // Capitoli Estatal d'Arkansas
  { lat: -17.16666667, lng: 145.53333333 }, // Altiplà Atherton
  { lat: 41.00972, lng: 28.98111 }, // església de la Santa Pau
  { lat: 50.08699, lng: 14.4207 }, // Rellotge Astronòmic de Praga
  { lat: 49.166666666, lng: 20.133333333 }, // Alt Tatras
  { lat: 43.1075, lng: 131.888056 }, // Zolotoi Rog
  { lat: 55.750926, lng: 37.617053 }, // Catedral de la Dormició
  { lat: 24.412, lng: 54.474 }, // Mesquita de Xeic Zayed
  { lat: 35.632777777, lng: 139.880555555 }, // Tokyo Disneyland
  { lat: 37.939138888, lng: 27.34075 }, // Biblioteca de Cels
  { lat: 47.9039, lng: 20.3794 }, // castell d'Eger
  { lat: 48.17694, lng: 11.55667 }, // BMW Welt
  { lat: 46.39472, lng: 14.08722 }, // Vintgar Gorge
  { lat: 34.101389, lng: -118.326667 }, // Hollywood Boulevard
  { lat: 41.02111111, lng: 29.00416667 }, // Maiden's Tower
  { lat: 53.815833333, lng: -3.055277777 }, // Blackpool Tower
  { lat: -13.163333333, lng: -72.545555555 }, // Machu Picchu
  { lat: 44.460472222, lng: -110.828138888 }, // Old Faithful
  { lat: 54.4775, lng: 9.486666666 }, // Danevirke
  { lat: 20.214722222, lng: -87.428888888 }, // Tulum
  { lat: 48.866667, lng: 2.306111 }, // avenue Montaigne
  { lat: -33.870278, lng: 151.208889 }, // Sydney Tower
  { lat: 36.1075, lng: -121.625833333 }, // Big Sur
  { lat: 59.950277777, lng: 30.316666666 }, // Catedral de Sant Pere i Sant Pau
  { lat: 52.913055555, lng: -4.099166666 }, // Portmeirion
  { lat: 50.452777777, lng: 30.514444444 }, // catedral de Santa Sofia de Kíiv
  { lat: 59.858055555, lng: 17.633333333 }, // Catedral d'Uppsala
  { lat: 1.289389, lng: 103.863222 }, // Singapore Flyer
  { lat: 59.35861, lng: 18.12139 }, // Millesgården
  { lat: 47.421666666, lng: 10.3425 }, // Nebelhorn
  { lat: 35.920833333, lng: 14.377777777 }, // Skorba
  { lat: 41.012763888, lng: 28.964861111 }, // Torre de Beyazit
  { lat: 59.3815, lng: 13.5065 }, // Karlstad Cathedral
  { lat: 50.03805, lng: 19.95844 }, // Túmul de Krakus
  { lat: -8.3741, lng: 115.45222 }, // Besakih
  { lat: 41.90611, lng: 12.48278 }, // Spanish Steps
  { lat: 3.2374, lng: 101.683905555 }, // coves de Batu
  { lat: -36.848472222, lng: 174.762305555 }, // Sky Tower (Auckland)
  { lat: 56.333789, lng: 43.971308 }, // Alexander Nevsky Cathedral, Nizhny Novgorod
  { lat: 60.17038775, lng: 24.95212383 }, // Catedral d'Hèlsinki
  { lat: 48.741388888, lng: 44.535277777 }, // Mamàiev Kurgan
  { lat: 52.501666666, lng: 13.341111111 }, // Kaufhaus des Westens
  { lat: 41.898055555, lng: 12.478333333 }, // Santa Maria sopra Minerva
  { lat: 39.886111111, lng: 32.856111111 }, // Atakule
  { lat: 31.778956, lng: 35.244959 }, // Chapel of the Ascension
  { lat: 36.12, lng: -115.1725 }, // Las Vegas Strip
  { lat: 13.750138888, lng: 100.492027777 }, // Gran Palau de Bangkok
  { lat: 13.743688888, lng: 100.488919444 }, // Wat Arun
  { lat: 41.016389, lng: 28.970556 }, // Basar de les espècies
  { lat: 51.128333333, lng: 71.430555555 }, // Bayterek
  { lat: 60.170378, lng: 24.952177 }, // Catedral d'Hèlsinki
  { lat: 55.754675, lng: 37.572968 }, // Casa Blanca de Moscou
  { lat: 32.731389, lng: -117.145278 }, // Balboa Park
  { lat: 39.94444444, lng: 32.85777778 }, // Hacı Bayram Mosque
  { lat: 5.39833333, lng: 100.27305556 }, // Kek Lok Si
  { lat: 41.656882, lng: -0.878327 }, // Basílica del Pilar
  { lat: 50.061678, lng: 19.937384 }, // Sukiennice
  { lat: 19.433888888, lng: -99.140555555 }, // Torre Latinoamericana
  { lat: 10.740555555, lng: 13.571666666 }, // Paisatge cultural de Sukur
  { lat: 43.803333333, lng: 75.535 }, // Tamgalí
  { lat: 38.281388888, lng: 26.374166666 }, // Alaçatı
  { lat: 37.077777777, lng: 30.570833333 }, // Karain Cave
  { lat: 41.01599, lng: 28.95557 }, // aqüeducte de Valent
  { lat: 51.541388888, lng: -0.146388888 }, // Mercat de Camden
  { lat: 33.51373, lng: 36.3152 }, // Bab Tuma
  { lat: 40.61929, lng: 40.29486 }, // Uzungöl
  { lat: 13.800833333, lng: 100.551388888 }, // Chatuchak Weekend Market
  { lat: 21.259722222, lng: -157.81175 }, // Diamond Head
  { lat: 55.750277777, lng: 37.617777777 }, // Catedral de l'Arcàngel Miquel
  { lat: 41.016875, lng: 28.972141 }, // Mesquita Nova d'Istanbul
  { lat: 22.889722222, lng: -109.915555555 }, // Cabo San Lucas
  { lat: 40.0705295, lng: 29.222009805 }, // Ulu Dağ
  { lat: 48.580923, lng: 7.74063 }, // Petite France
  { lat: 13.751388888, lng: 100.492777777 }, // Wat Phra Kaew
  { lat: 42.419129, lng: 11.628128 }, // Volci
  { lat: 51.906111111, lng: 4.465833333 }, // Euromast
  { lat: 36.117698, lng: -115.16815 }, // High Roller
  { lat: 59.921084, lng: 30.388518 }, // monestir d'Alexandre Nevski
  { lat: 48.891666666, lng: 2.240833333 }, // La Défense
  { lat: 35.869166666, lng: 14.511944444 }, // temples de Tarxien
  { lat: 36.460555555, lng: 34.145 }, // Kızkalesi
  { lat: 41.06, lng: 28.948611111 }, // Miniatürk
  { lat: 10.78305556, lng: 79.1325 }, // Prahadisvarar Temple
  { lat: 8.3132636, lng: 9.9642313 }, // Donga River
  { lat: 24.63, lng: 51.296 }, // Al-Udayd
  { lat: 40.415, lng: -3.683888888 }, // Parc del Retiro
  { lat: 36.246969444, lng: 137.633333333 }, // Kamikochi
  { lat: -24.9958, lng: 31.5919 }, // Skukuza
  { lat: 37.801944444, lng: -122.418888888 }, // Lombard Street
  { lat: 6.577222222, lng: 3.321111111 }, // Aeroport Internacional Murtala Mohammed
  { lat: 37, lng: -2.45 }, // Desert de Tabernas
  { lat: 24.559166666, lng: -81.784166666 }, // Conch Republic
  { lat: 39.903611111, lng: 116.395 }, // Museu Nacional de la Xina
  { lat: 31.016666666, lng: 78.4125 }, // Yamunotri
  { lat: 50.447222222, lng: 30.521944444 }, // Khreshchatyk
  { lat: -38.260662, lng: 175.109446 }, // Waitomo Caves
  { lat: 59.939166666, lng: 30.315833333 }, // Alexander Column
  { lat: 41.047947222, lng: 28.933786111 }, // mesquita d'Eyüp Sultan
  { lat: 42.8514829, lng: 68.3029696 }, // Otrar
  { lat: 41.0494, lng: 29.0111 }, // Palau de Yıldız
  { lat: 56.4164, lng: 40.4431 }, // Kremlin de Súzdal
  { lat: 38.62257, lng: 42.24668 }, // Nemrut
  { lat: 34.1313, lng: -118.49 }, // Mulholland Drive
  { lat: 41.90982, lng: 12.47645 }, // Santa Maria dei Miracoli
  { lat: 49.2, lng: 19.75 }, // Tatres occidentals
  { lat: 50.266111, lng: 19.025278 }, // Spodek
  { lat: 42.418888888, lng: 11.631666666 }, // Volci
  { lat: 54.674444444, lng: 25.289444444 }, // Porta de l'Aurora
  { lat: 36.56674, lng: 29.14467 }, // Ölüdeniz
  { lat: 22.3225, lng: 114.170555555 }, // Mong Kok
  { lat: 53.4803, lng: -2.2487 }, // John Rylands Library
  { lat: 37.776388888, lng: -122.433055555 }, // Painted Ladies
  { lat: 33.128735667, lng: 73.645213113 }, // Mangla Dam
  { lat: 51.508888888, lng: -0.126944444 }, // St. Martin in the Fields
  { lat: 5.3193393, lng: -61.7953505 }, // Parc Nacional Canaima
  { lat: -8.829166666, lng: 115.084333333 }, // Pura Luhur
  { lat: 36.542222222, lng: 31.99 }, // Damlataş Cave
  { lat: 51.511111111, lng: -0.117777777 }, // Somerset House
  { lat: 57.640277777, lng: 18.294444444 }, // Muralla de Visby
  { lat: 59.61252778, lng: 16.54125 }, // catedral de Västerås
  { lat: 27.970833333, lng: -15.6125 }, // Roque Nublo
  { lat: 51.521944444, lng: -0.071666666 }, // Brick Lane
  { lat: 56.66444444, lng: 16.36527778 }, // Kalmar Cathedral
  { lat: 34.124166666, lng: -118.241944444 }, // Forest Lawn Memorial Park
  { lat: 40.8648, lng: -73.9319 }, // The Cloisters
  { lat: 65.024444444, lng: 35.710555555 }, // Solovetsky Monastery
  { lat: 40.69, lng: 39.65833333 }, // Monestir de la Santíssima Mare de Déu de Sumelà
  { lat: 52.009444, lng: -0.733333 }, // Stadium MK
  { lat: 31.76007, lng: 35.24749 }, // Pool of Siloam
  { lat: 54.34794, lng: 18.65573 }, // Green Gate
  { lat: 37.808313, lng: -122.415673 }, // Fisherman's Wharf
  { lat: 41.002778, lng: 28.971944 }, // Església dels Sants Sergi i Bacus
  { lat: 52.200278, lng: 0.119444 }, // Museu Fitzwilliam
  { lat: 50.840820379, lng: 4.393361137 }, // Royal Museum of the Armed Forces and Military History
  { lat: 9.3, lng: 10.5 }, // Yankari National Park
  { lat: 37.9936, lng: 30.8884 }, // Eğridir Gölü
  { lat: 20.02388889, lng: 75.17916667 }, // Temple de Kailāsanātha
  { lat: 9.919722222, lng: 78.119444444 }, // Temple de Minakxi
  { lat: 41.008611, lng: 28.971111 }, // Column of Constantine
  { lat: 36.542330555, lng: 31.988222222 }, // Damlataş Cave
  { lat: 31.77930556, lng: 35.22627778 }, // New Gate
  { lat: 1.255, lng: 103.821666666 }, // Universal Studios Singapore
  { lat: 60.169472222, lng: 24.952277777 }, // Senate Square
  { lat: 34.238333333, lng: 134.651388888 }, // Remolins de Naruto
  { lat: 59.37558, lng: 17.03452 }, // catedral de Strängnäs
  { lat: 43.646447, lng: 40.332206 }, // Rosa Khutor Alpine Resort
  { lat: 19.432778, lng: -99.133333 }, // Plaza de la Constitución
  { lat: 58.411111111, lng: 15.616666666 }, // Linköping Cathedral
  { lat: 55.75, lng: 37.615833333 }, // Gran Palau del Kremlin
  { lat: -8.15, lng: 114.5 }, // West Bali National Park
  { lat: 24.531666666, lng: 54.443055555 }, // Sadiyat
  { lat: 31.778888888, lng: 35.236944444 }, // Porta Daurada
  { lat: 47.609444444, lng: -122.341666666 }, // Pike Place Market
  { lat: 51.144444444, lng: -2.698611111 }, // torre de Glastonbury
  { lat: 60.1675, lng: 24.94777778 }, // Esplanadi park
  { lat: 54.347924839, lng: 18.65562983 }, // Green Gate
  { lat: 39.433333333, lng: 23.05 }, // Pèlion
  { lat: 41.01759104, lng: 28.96874786 }, // Mesquita de Rüstem Paşa
  { lat: 24.05796, lng: 55.78086 }, // Jebel Hafeet
  { lat: 33.807778, lng: -117.919167 }, // Disney California Adventure
  { lat: 35.5628, lng: -83.4986 }, // muntanyes Great Smoky
  { lat: 19.4361792, lng: -99.1546288 }, // Monumento a la Revolución
  { lat: 41.010277777, lng: 28.970277777 }, // Nuruosmaniye Mosque
  { lat: 55.8631, lng: -4.2346 }, // Catedral de Glasgow
  { lat: 13.758888888, lng: 100.497222222 }, // Khaosan Road
  { lat: 60.18833333, lng: 24.94027778 }, // Linnanmäki
  { lat: 41.01222222, lng: 28.98 }, // Gülhane
  { lat: 31.783, lng: 35.23375 }, // Herod's Gate
  { lat: 43.233055555, lng: 76.976111111 }, // Kok Tobe
  { lat: 43.447, lng: -2.785 }, // Gaztelugatxe
  { lat: 59.925, lng: 30.292 }, // Gran Sinagoga de Sant Petersburg
  { lat: 56.870833333, lng: -5.446388888 }, // Glenfinnan
  { lat: 56.32865, lng: 44.002862 }, // Nizhny Novgorod Kremlin
  { lat: 51.11013889, lng: 17.04458333 }, // Panorama de Racławice
  { lat: 39.41636952, lng: 46.29681587 }, // Wings of Tatev
  { lat: 35.960848, lng: 14.3413 }, // Popeye Village
  { lat: -0.915277777, lng: 36.456944444 }, // Mont Longonot
  { lat: 1.32101, lng: 103.70703 }, // Jurong Bird Park
  { lat: -0.002222222, lng: -78.455833333 }, // Ciudad Mitad del Mundo
  { lat: 51.598888888, lng: -0.238611111 }, // RAF Museum London
  { lat: 41.04941111, lng: 29.00993611 }, // Yıldız Hamidi Mosque
  { lat: 41.8767, lng: 12.4815 }, // Porta San Paolo
  { lat: 14.838888888, lng: -17.234444444 }, // Lake Retba
  { lat: 59.92222, lng: 30.30028 }, // catedral de Sant Nicolau del Mar
  { lat: 59.922378, lng: 30.300128 }, // catedral de Sant Nicolau del Mar
  { lat: 33.093722222, lng: 44.580722222 }, // Arc de Ctesifont
  { lat: 1.30214, lng: 103.859 }, // Masjid Sultan
  { lat: 31.770555555, lng: 35.235 }, // Pool of Siloam
  { lat: 51.7534, lng: -1.2539 }, // Càmara Radcliffe
  { lat: 49.250556, lng: 19.933889 }, // Giewont
  { lat: 40.1752128, lng: 29.1726885 }, // Cumalıkızık
  { lat: 59.57416667, lng: 17.84444444 }, // Rosersberg Palace
  { lat: 43.691111111, lng: 7.2475 }, // Passeig dels Anglesos
  { lat: 59.32593, lng: 18.06573 }, // Swedish House of Nobility
  { lat: 48.742277777, lng: 44.537083333 }, // La Mare Pàtria us crida!
  { lat: 60.47305557, lng: 22.00472223 }, // Moominworld
  { lat: 59.326667, lng: 18.071667 }, // Royal Armoury
  { lat: 43.718333333, lng: 22.600277777 }, // Cova Magura
  { lat: 41.04833333, lng: 29.01555556 }, // Yıldız Park
  { lat: -34.577111, lng: -58.403593 }, // Museu d'Art Llatinoamericà de Buenos Aires
  { lat: 36.7, lng: 138.491666666 }, // terres altes de Shiga
  { lat: 65.64611, lng: 22.02861 }, // poble església de Gammelstad
  { lat: 48.8525, lng: 2.34694444 }, // Shakespeare and Company (llibreria)
  { lat: 38.7244, lng: -9.11389 }, // National Azulejo Museum
  { lat: 39.562444444, lng: 19.90425 }, // Achilleion
  { lat: 44.6, lng: -110.5 }, // Parc Nacional de Yellowstone
  { lat: 50.44573189, lng: 30.503419811 }, // Victor Kosenko Museum
  { lat: 52.5175, lng: 13.40277778 }, // Humboldt Forum
  { lat: 19.41555556, lng: -99.19138889 }, // Los Pinos
  { lat: 35.294331, lng: -2.93353 }, // Coves del Conventic
  { lat: 35.659502777, lng: 139.700544444 }, // Shibuya scramble crossing
  { lat: 50.051392, lng: 19.948572 }, // Sinagoga de Kazimierz
  { lat: 31.768727777, lng: 35.212836111 }, // The Museum for Islamic Art
  { lat: 24.7051751, lng: 93.8174446 }, // Museu de la Pau d'Imphal
  { lat: 54.72416667, lng: 55.93611111 }, // Bashkir State Art Museum (Nesterov Museum)
  { lat: 43.776944444, lng: 11.258888888 }, // Galleria dell'Accademia
  { lat: 43.574166666, lng: 1.476944444 }, // L'Envol des pionniers
  { lat: 42.946666666, lng: 25.430277777 }, // Cova de Bacho Kiro
  { lat: 48.858296, lng: 2.294479 }, // Torre Eiffel
  { lat: 39.821944444, lng: 26.028888888 }, // Bozcaada
  { lat: 29.3987, lng: 110.6982 }, // Pont de vidre de Zhangjiajie
  { lat: 52.268889, lng: 4.547222 }, // Keukenhof
  { lat: 42.6403, lng: 23.4328 }, // Vrana Palace
  { lat: 1.28683, lng: 103.855 }, // Merlion Park
  { lat: 63.8203253, lng: 20.276306522 }, // Bildmuseet
  { lat: 52.525083333, lng: 13.369388888 }, // Berlin Hauptbahnhof
  { lat: 54.16667, lng: 19 }, // Żuławy
  { lat: 36.841111111, lng: -2.471944444 }, // Alcazaba y Murallas del Cerro de San Cristóbal
  { lat: 41.660011, lng: 20.735508 }, // Submerged church of St. Nicholas (Mavrovo)
  { lat: 38.418861111, lng: 27.128666666 }, // İzmir Clock Tower
  { lat: 50.4259, lng: 18.8498 }, // Historic Silver Mine in Tarnowskie Góry
  { lat: 1.31078, lng: 103.865637 }, // Kallang
  { lat: 41.326594, lng: 19.816486 }, // Casa de les Fulles
  { lat: 50.614833333, lng: 30.474 }, // Mezhyhirya
  { lat: 39.66934444, lng: 66.99335278 }, // Museu d'Afrasiab
  { lat: 60.18947563, lng: 24.88309986 }, // Tamminiemi
  { lat: 38.8893, lng: -77.050122 }, // Statue of Abraham Lincoln
  { lat: 41.904, lng: 12.453 }, // Ciutat del Vaticà
  { lat: -26.15550093, lng: 28.083643609 }, // Satyagraha House
  { lat: 41.03093056, lng: 28.97982222 }, // The Museum of Innocence
  { lat: 43.769849, lng: 11.263607 }, // Casa Buonarroti
  { lat: -8.41639, lng: 115.315 }, // Tirta Empul Temple
  { lat: 50.929444444, lng: 29.904611111 }, // Ivankiv Historical and Local History Museum
  { lat: 43.76981, lng: 11.263593 }, // Casa Buonarroti
  { lat: 37.556422, lng: -77.474706 }, // Museu de Belles Arts de Virgínia
  { lat: -1.930886, lng: 30.060713 }, // Centre memorial de Kigali
  { lat: 48.52883333, lng: 25.03763889 }, // National Museum of Hutsulshchyna and Pokuttya Folk Art
  { lat: 40.41502, lng: -3.69091 }, // Reial Acadèmia Espanyola
  { lat: -25.409722, lng: -49.267222 }, // Museu Oscar Niemeyer
  { lat: 63.827222222, lng: 20.268055555 }, // Museu de guitarres a Umeå, Suècia
  { lat: 41.52305556, lng: 23.39833333 }, // Kordopulov House
  { lat: 40.379692231, lng: 49.847986908 }, // Museu del Ferrocarril de l'Azerbaidjan
  { lat: 39.95527778, lng: 26.24916667 }, // Museu de Troia
  { lat: 51.207984, lng: 3.225295 }, // Campanar de Bruges
  { lat: 40.6239, lng: 22.955 }, // Museu de la Cultura Bizantina
  { lat: 44.8415535, lng: 34.9578524 }, // Genoese Fortress
  { lat: 57.91722222, lng: 26.57666667 }, // Tamme-Lauri oak
  { lat: 51.5081, lng: -0.0972222 }, // Shakespeare's Globe
  { lat: 41.203055555, lng: 29.111666666 }, // Pont Yavuz Sultan Selim
  { lat: 41.31361111, lng: 69.27888889 }, // Amir Timur Museum
  { lat: 47.20694444, lng: 38.93138889 }, // birthplace of Anton Chekhov
  { lat: 43.861991, lng: 18.428524 }, // Museu de la Infància en Guerra
  { lat: 43.31822, lng: 11.332226 }, // Torre del Mangia
  { lat: 35.293543, lng: -2.93394 }, // Museu de Melilla
  { lat: 56.23406, lng: 37.96861 }, // Abramcevo
  { lat: 46.971995, lng: 32.006714 }, // Mykolaiv Regional Museum of Local History
  { lat: 39.0200902, lng: 125.7545591 }, // Korean Central History Museum
  { lat: 33.896339, lng: 35.505141 }, // Saint George Greek Orthodox Cathedral
  { lat: 46.84527778, lng: 35.38138889 }, // Melitopol Museum
  { lat: 40.755, lng: 29.515555555 }, // Osmangazi Bridge
  { lat: -8.551557, lng: 115.468844 }, // Pura Goa Lawah
  { lat: -8.41194444, lng: 115.58694444 }, // Tirta Gangga
  { lat: 43.7779, lng: 11.259393 }, // Museu Nacional de San Marco
  { lat: 49.216030555, lng: 28.408375 }, // Pirogov's Estate Museum in Vinnytsia
  { lat: 43.17685, lng: 24.07265 }, // Prohodna Cave
  { lat: 36.244722222, lng: 29.985555555 }, // St. Nicholas Church, Demre
  { lat: 50.088055555, lng: 14.410555555 }, // Franz Kafka Museum
  { lat: 54.68222222, lng: 25.28944444 }, // Casa dels Signataris
  { lat: 22.377122322, lng: 114.185405013 }, // Hong Kong Heritage Museum
  { lat: 40.19305556, lng: 44.51472222 }, // Museu Charles Aznavour
  { lat: 40.14111111, lng: 44.53527778 }, // Erebuni Museum
  { lat: 45.762291666, lng: 4.822555555 }, // Basilica Notre-Dame de Fourvière
  { lat: 47.09333, lng: 37.55083 }, // Kuindzhi Art Museum
  { lat: 38.15348, lng: 41.20373 }, // Pont de Malabadi
  { lat: 6.235, lng: 80.055 }, // Ambalangoda
  { lat: 63.82611111, lng: 20.25483333 }, // Old House of Bank
  { lat: 15.99486, lng: 107.99625 }, // Golden Bridge
  { lat: 50.093611111, lng: 14.405416666 }, // Queen Anne's Summer Palace
  { lat: 40.82261, lng: 14.42919 }, // Vesuvi
  { lat: -1.930833, lng: 30.060833 }, // Centre memorial de Kigali
  { lat: 41.313588608, lng: 69.279030016 }, // Amir Timur Museum
  { lat: 41.7825, lng: -87.585555555 }, // Barack Obama Presidential Center
  { lat: 41.32667, lng: 19.81647 }, // Casa de les Fulles
  { lat: 1.55472222, lng: 110.34361111 }, // Sarawak State Museum
  { lat: 31.62159167, lng: -7.98223056 }, // Palau de la Baiya
  { lat: 41.04166667, lng: 29.00555556 }, // Istanbul Naval Museum
  { lat: 31.799369444, lng: 34.642058333 }, // Museu de la Cultura Filistea
  { lat: 42.00388889, lng: 21.43277778 }, // Museum of Contemporary Art Skopje
  { lat: 54.72027778, lng: 55.94694444 }, // National Museum of the Republic of Bashkortostan
  { lat: 36.443888888, lng: 28.224166666 }, // Mesquita de Solimà de Rodes
  { lat: 40.410478, lng: -3.714391 }, // San Francisco el Grande
  { lat: -8.5516, lng: 115.4689 }, // Pura Goa Lawah
  { lat: 30.4973844, lng: 47.8609902 }, // Museu de Bàssora
  { lat: 64.259709606, lng: -21.122771625 }, // Lögberg
  { lat: 45.7788131, lng: 15.9818579 }, // Croatian Museum of Contemporary Art
  { lat: 43.047611111, lng: 24.1879 }, // Saeva dupka cave
  { lat: 44.78666667, lng: 20.45166667 }, // Museum of Yugoslav History
  { lat: 31.77248333, lng: 35.1815 }, // Herzl Museu
  { lat: 31.7726, lng: 35.1814 }, // Herzl Museu
  { lat: 50.087108305, lng: 14.420606888 }, // antic ajuntament de Praga
  { lat: 41.373888888, lng: -123.998055555 }, // Redwood National and State Parks
  { lat: 48.853, lng: 2.3498 }, // Notre-Dame de París
  { lat: 25.21912, lng: 55.2821 }, // Museu del Futur
  { lat: 35.557569, lng: 45.425819 }, // Museu de Silêmanî
  { lat: 40.86700556, lng: 14.25053333 }, // Palau de Capodimonte
  { lat: 52.368825906, lng: 4.893061712 }, // Allard Pierson
  { lat: 43.1758, lng: 24.0731 }, // Prohodna Cave
  { lat: 29.3515, lng: 110.4615 }, // Bailong Elevator
  { lat: 40.050164, lng: 26.21928 }, // Memorial dels Màrtirs de Çanakkale
  { lat: 43.2, lng: 27.918055555 }, // Roman Thermae in Varna
  { lat: 48.86967, lng: 2.30786 }, // avinguda dels Camps Elisis
  { lat: 41.902956, lng: 12.454433 }, // Capella Sixtina
  { lat: 50.0975, lng: 14.424833333 }, // National Technical Museum
  { lat: 30.0075, lng: 31.248333333 }, // Museu Nacional de la Civilització Egipcia
  { lat: 13.42380556, lng: 103.856 }, // Phnom Bakheng
  { lat: 41.889444, lng: 12.482778 }, // arc de Janus
  { lat: 13.44756, lng: 103.858856 }, // Terrace of the Leper King
  { lat: 17.548611111, lng: 103.358333333 }, // Ban Chiang
  { lat: 13.44214951, lng: 103.9589721 }, // Banteay Samré
  { lat: 36.9825, lng: 30.46444444 }, // Termessos
  { lat: 36.828275, lng: 28.625838 }, // Caune
  { lat: 36.523611, lng: 30.552222 }, // Faselis
  { lat: 36.9572, lng: 41.5053 }, // Tell Leilan
  { lat: 13.445656, lng: 103.856013 }, // Phimeanakas
  { lat: 37.708964, lng: 28.722332 }, // Afrodísias
  { lat: 25.75, lng: 32.6143 }, // KV43
  { lat: 38.071, lng: 30.166 }, // Apamea de Frígia
  { lat: 33.247222222, lng: 35.693333333 }, // Paneas
  { lat: 36.483, lng: 43.25 }, // Tepe Gaura
  { lat: 13.42981, lng: 103.89825 }, // Banteay Kdei
  { lat: 35.302494444, lng: 44.247622222 }, // Nuzi
  { lat: 36.982469, lng: 30.464189 }, // Termessos
  { lat: 41.892175, lng: 12.481689 }, // Temple de Júpiter Capitolí
  { lat: 37.186111111, lng: 21.925 }, // Itome
  { lat: 40.387777777, lng: 27.870555555 }, // Cízic
  { lat: 24.977777777, lng: 32.873333333 }, // temple d'Edfú
  { lat: 30.572777777, lng: 31.51 }, // Bubastis
  { lat: 25.44, lng: 32.36 }, // KV4
  { lat: 41.891867, lng: 12.496281 }, // Termes de Trajà
  { lat: 38.304239, lng: 31.189704 }, // Antioquia de Pisídia
  { lat: 37.754277777, lng: 23.533333333 }, // temple d'Afea
  { lat: 13.431, lng: 103.906708333 }, // Srah Srang
  { lat: 36.522806, lng: 30.549049 }, // Faselis
  { lat: 40.228356, lng: 26.417225 }, // Sestos
  { lat: 16.704, lng: -91.065 }, // Bonampak
  { lat: 35.416666666, lng: 36.4 }, // Apamea
  { lat: 17.424361111, lng: -10.410388888 }, // Awdaghost
  { lat: 41.89195, lng: 12.48478 }, // Basilica Julia
  { lat: 37.183333, lng: 40.933333 }, // Dara
  { lat: 32.09583, lng: 35.46139 }, // Alexandrium
  { lat: 33.247222222, lng: 35.693888888 }, // Paneas
  { lat: 36.825278, lng: 28.623056 }, // Caune
  { lat: 13.435, lng: 103.889166666 }, // Ta Prohm
  { lat: 34.206195, lng: 43.87985 }, // gran mesquita de Samarra
  { lat: 44.064, lng: 10.017 }, // Luni
  { lat: 22.2, lng: 31.46 }, // Faras
  { lat: 13.447101, lng: 103.877363 }, // Thommanon
  { lat: 47.53319, lng: 7.72229 }, // Augusta Ràurica
  { lat: 38.306111111, lng: 31.189166666 }, // Antioquia de Pisídia
  { lat: 40.216666666, lng: 26.383333333 }, // Sestos
  { lat: 38.07166667, lng: 30.16555556 }, // Apamea de Frígia
  { lat: 13.43463611, lng: 103.80011111 }, // West Mebon
  { lat: 38.48333333, lng: 23.18194444 }, // Gla
  { lat: -25.929167, lng: 27.788889 }, // Kromdraai
  { lat: 40.166666666, lng: 90.583333333 }, // Lop Desert
  { lat: -8.51882222, lng: 115.25838333 }, // Ubud Monkey Forest
  { lat: 1.28762, lng: 103.861 }, // The Helix Bridge
  { lat: 58.497416666, lng: 31.311472222 }, // Saviour Church on Nereditsa
  { lat: 36.93889, lng: 31.17222 }, // Aspendos
  { lat: 33.06667, lng: 44.25 }, // Sippar
  { lat: 38.082498, lng: 13.527452 }, // Solunt
  { lat: 59.9381, lng: 30.3172 }, // General Staff Building, Saint Petersburg
  { lat: 41.891388888, lng: 12.495277777 }, // Domus Aurea
  { lat: 41.0546272, lng: 29.0281901 }, // Ortaköy
  { lat: 28.53611111, lng: 30.65555556 }, // Oxirrinc
  { lat: 41.8886, lng: 12.4641 }, // Aqua Traiana
  { lat: 38.177222222, lng: 26.785 }, // Teos
  { lat: 36.85097, lng: 30.78343 }, // Cascades de Düden
  { lat: 41.8468009, lng: 12.563348 }, // Aqua Marcia
  { lat: 36.183333333, lng: 29.883333333 }, // Kekova
  { lat: 30.193921, lng: 53.167188 }, // Tomb of Cyrus the Great
  { lat: 47.564139, lng: 19.049472 }, // Aquíncum
  { lat: 38.09305556, lng: 13.53138889 }, // Solunt
  { lat: 37.074, lng: 22.3673 }, // Mistràs
  { lat: 50.938055555, lng: 6.956944444 }, // Colonia Claudia Ara Agrippinensium
  { lat: 25.085, lng: -77.320833333 }, // Atlantis Paradise Island
  { lat: 41.327717, lng: 19.819647 }, // Tirana Clock Tower
  { lat: 33.812796, lng: -117.918971 }, // castell de la Bella Dorment
  { lat: 24.533, lng: 54.40001 }, // Louvre Abu Dhabi
  { lat: 48.8802, lng: 2.2843 }, // Hotel Concorde Lafayette
  { lat: 1.404709, lng: 103.79105 }, // Singapore Zoo
  { lat: 38.199104, lng: 26.837477 }, // Teos
  { lat: 41.90595, lng: 12.48205833 }, // Piazza di Spagna
  { lat: 27.329166666, lng: 68.138888888 }, // Mohenjo-Daro
  { lat: 43.253055555, lng: 77.484444444 }, // llac Iessik
  { lat: 36.9382, lng: 31.1732 }, // Aspendos
  { lat: 38.888888888, lng: -77.000277777 }, // Capitol Hill
  { lat: 25.293333, lng: 32.556389 }, // Esna
  { lat: 48.884625, lng: 2.338430555 }, // Wall of Love
  { lat: 34.1571, lng: -118.3257 }, // Walt Disney Studios
  { lat: 41.902301, lng: 12.453293 }, // necròpolis del Vaticà
  { lat: 37.464359, lng: 22.428524 }, // Tègea
  { lat: 51.75275, lng: -0.35519833 }, // Verolamium
  { lat: 33.35372, lng: 44.20229 }, // Dur-Kurigalzu
  { lat: 44.442857, lng: 26.093472 }, // Calea Victoriei
  { lat: 24.690277777, lng: 46.685277777 }, // Al Faisaliah Centre
  { lat: 41.891389, lng: -87.599722 }, // Navy Pier
  { lat: 59.0014818, lng: -3.2297227 }, // Cercle de Brodgar
  { lat: -45.57, lng: -72.066111111 }, // Regió d'Aysén
  { lat: 37.708333333, lng: 28.723611111 }, // Afrodísias
  { lat: 37.455333, lng: 22.4205 }, // Tègea
  { lat: 35.627777777, lng: 38.756388888 }, // Rusafa al-Sham
  { lat: 45.8146268, lng: 15.9732508 }, // Lotrščak Tower
  { lat: 30.962222, lng: 46.104444 }, // Ur
  { lat: 1.307777777, lng: 103.8525 }, // Little India
  { lat: 43.12805556, lng: 77.08083333 }, // Shymbulak
  { lat: 40.933714, lng: 24.973299 }, // Ancient Abdera
  { lat: 36.740633, lng: -5.165853 }, // Pont nou (Ronda)
  { lat: 36.9638, lng: 30.7269 }, // Cascades de Düden
  { lat: 48.841944, lng: 2.349722 }, // rue Mouffetard
  { lat: 52.516603, lng: 13.371931 }, // Soviet War Memorial
  { lat: 22.521388888, lng: 72.249444444 }, // Lothal
  { lat: 41.8490622, lng: 12.5541753 }, // Aqua Claudia
  { lat: 13.441252, lng: 103.858738 }, // el Bayon
  { lat: 29.425833, lng: -98.486111 }, // missió d'El Álamo
  { lat: 39.94018889, lng: 116.38963611 }, // La Torre del Timbal i la Torre de la Campana
  { lat: 32.11, lng: 34.98 }, // cova de Qessem
  { lat: 45.78276, lng: 14.20366 }, // cova de Postojna
  { lat: 32.653055555, lng: 73.01 }, // Khewra Salt Mine
  { lat: 32.391997222, lng: 44.341688888 }, // Borsippa
  { lat: 18.346666666, lng: -66.753333333 }, // Observatori d'Arecibo
  { lat: 38.082466, lng: 13.527583 }, // Solunt
  { lat: 1.28261, lng: 103.845 }, // Sri Mariamman Temple, Singapore
  { lat: 41.889828, lng: 12.490605 }, // Arc de Constantí
  { lat: 34.835, lng: 36.865833333 }, // Qatna
  { lat: 39.9575, lng: 26.238888888 }, // Troia
  { lat: 46.364444444, lng: 14.094722222 }, // llac Bled
  { lat: 36.721181444, lng: -4.415746493 }, // Alcazaba
  { lat: 36.250801, lng: 29.993638 }, // Mira
  { lat: 59.9537, lng: 30.3644 }, // Kresty Prison
  { lat: -8.523389, lng: 115.286333 }, // Goa Gajah
  { lat: 51.889852, lng: 0.901298 }, // Camulodúnum
  { lat: 37.28972222, lng: 13.59 }, // vall dels Temples
  { lat: 33.058829, lng: 44.252153 }, // Sippar
  { lat: 29.988888888, lng: 52.874722222 }, // Naqsh-e Rostam
  { lat: 27.661666666, lng: 30.905555555 }, // Al-Amārna
  { lat: -13.072777777, lng: 48.914722222 }, // Reserva d'Ankarana
  { lat: 43.4052, lng: 39.9492 }, // Sirius Arena
  { lat: 34.9032, lng: 40.530445 }, // Terqa
  { lat: 54.466666666, lng: 8.716666666 }, // Rungholt
  { lat: -8.27061, lng: 115.16658 }, // Pura Ulun Danu Bratan
  { lat: 44.611349, lng: 33.492508 }, // Quersonès
  { lat: 56.416666666, lng: 40.4425 }, // Catedral de la Nativitat
  { lat: 32.008333333, lng: 48.520833333 }, // Choqa Zanbil
  { lat: 41.90817, lng: 12.504491 }, // Aqua Alexandrina
  { lat: 14.871666666, lng: -90.664166666 }, // Mixco Viejo
  { lat: 59.32306667, lng: 17.885 }, // Drottningholmsteatern
  { lat: 47.215555555, lng: 0.062222222 }, // Castell de Montsoreau - Museu d'Art Contemporani
  { lat: 63.82361111, lng: 20.27138889 }, // Scharinska villa
  { lat: 29.713333333, lng: 105.706944444 }, // escultures rupestres de Dazu
  { lat: -12.595, lng: 49.155 }, // Amber Mountain National Park
  { lat: 38.652777777, lng: 34.863055555 }, // Parc Nacional de Göreme
  { lat: 62.3028818, lng: 21.6608659 }, // Wolf Cave
  { lat: 31.776111111, lng: 35.235833333 }, // Mesquita d'Al-Aqsa
  { lat: 41.873292, lng: 12.498955 }, // Muralla Aureliana
  { lat: 45.043418, lng: 36.231299 }, // Kimmèrikon
  { lat: 39.9575, lng: 26.238889 }, // Troia
  { lat: 63.836666666, lng: 20.161666666 }, // Umedalens Skulpturpark
  { lat: 31.7747, lng: 35.2278 }, // muralles de Jerusalem
  { lat: 41.65456, lng: -0.87585 }, // Catedral del Salvador en la seva Epifania de Saragossa
  { lat: 36.259166666, lng: 29.985277777 }, // Mira
  { lat: 8.335, lng: 80.410833333 }, // Anuradhapura
  { lat: -2.332777777, lng: 34.566666666 }, // Parc Nacional del Serengeti
  { lat: 59.40305556, lng: 18.35972222 }, // Fortalesa de Vaxholm
  { lat: 38.4132, lng: 23.672817 }, // Lefkandi
  { lat: 37.876625479, lng: -4.777884095 }, // Puente romano
  { lat: 23.27, lng: 56.745 }, // Jaciment arqueològic d'Al-Ain
  { lat: 51.892, lng: 0.898 }, // Camulodúnum
  { lat: 23.594719444, lng: 25.2335 }, // Cave of Swimmers
  { lat: 43.361944444, lng: 79.090555555 }, // Parc nacional de Xarín
  { lat: 41.8824, lng: 12.4986 }, // Porta Metronia
  { lat: 41.900135, lng: 12.50868 }, // Aqua Tepula
  { lat: 1.305083333, lng: 103.831908333 }, // Orchard Road
  { lat: 28.320833333, lng: -16.413611111 }, // piràmides de Güímar
  { lat: -34.607939, lng: -58.364911 }, // Puente de la Mujer
  { lat: 30.84105, lng: 29.66349 }, // Abu Mena
  { lat: 44.611627, lng: 33.493302 }, // Quersonès
  { lat: 32.49138889, lng: 36.71055556 }, // Salkhad
  { lat: 36.366667, lng: 43.15 }, // Nínive
  { lat: 36.359444, lng: 43.152778 }, // Nínive
  { lat: 55.7525, lng: 37.6214 }, // Torre del Salvador
  { lat: 21.091, lng: -89.5903 }, // Dzibilchaltún
  { lat: 29.934444, lng: 52.891389 }, // Persèpolis
  { lat: 34.320833333, lng: 71.945833333 }, // Takht-i-Bahi
  { lat: 29.808333333, lng: 31.205833333 }, // piràmide roja
  { lat: 27.6260861, lng: 38.5475976 }, // Tayma
  { lat: 37.659722, lng: 27.297778 }, // Priene
  { lat: 32.816666666, lng: 21.85 }, // Cirene
  { lat: 26.814166666, lng: 37.9475 }, // Madaïn Salih
  { lat: 28.898055555, lng: 52.539166666 }, // Palau d'Artaxerxes
  { lat: 40.037222222, lng: 94.804166666 }, // coves de Mogao
  { lat: 32.823041, lng: 21.85727 }, // Cirene
  { lat: 37.911527777, lng: 27.333972222 }, // Casa de la Verge Maria
  { lat: 22.336944444, lng: 31.625555555 }, // Abu Simbel
  { lat: 30.9, lng: 30.616667 }, // Nàucratis
  { lat: 40.750556, lng: 14.489722 }, // Pompeia
  { lat: 25.720555555, lng: 32.610277777 }, // Tebes
  { lat: 14.390555555, lng: 104.680277777 }, // Preah Vihear
  { lat: 31.8708, lng: 35.4439 }, // Torre de Jericó
  { lat: 32.708807, lng: 20.950755 }, // Ptolemaida
  { lat: 42.316666666, lng: 59.158611111 }, // Köneürgenç
  { lat: 29.228611111, lng: 30.966666666 }, // Lahun
  { lat: 44.166666666, lng: 40 }, // Mezmaiskaya cave
  { lat: 15.334547, lng: 76.462162 }, // Hampi
  { lat: 21.1725, lng: 94.86 }, // Bagan
  { lat: 19.6925, lng: -98.8438 }, // piràmide del Sol
  { lat: 32.881111111, lng: 35.575 }, // Cafarnaüm
  { lat: 35.098055555, lng: 26.261388888 }, // Zakros
  { lat: 29.935, lng: 52.89 }, // Persèpolis
  { lat: 13.827494444, lng: -89.356158333 }, // Joya de Cerén
  { lat: 32.70694737, lng: 20.952920252 }, // Ptolemaida
  { lat: 41.15694444, lng: 126.18722222 }, // Capitals i tombes de l'antic regne de Koguryö
  { lat: 33.6263, lng: 35.7838 }, // Joub Jannine
  { lat: 14.21389794, lng: 44.40287441 }, // Zafar
  { lat: 27.8075, lng: 30.872777777 }, // Antinòupolis
  { lat: 27.186944444, lng: 31.171388888 }, // Assiut
  { lat: 19.6996, lng: -98.844 }, // Piràmide de la Lluna
  { lat: 26.791667, lng: 37.952778 }, // Madaïn Salih
  { lat: 15.333794444, lng: -91.492744444 }, // Zaculeu
  { lat: 47.19753, lng: 102.82379 }, // Karakorum
  { lat: 30.90071, lng: 30.591777 }, // Nàucratis
  { lat: 29.897777777, lng: 31.203333333 }, // Piràmide de Sahure
  { lat: 25.74025, lng: 32.602358 }, // Vall dels Reis
  { lat: -16.554722222, lng: -68.673333333 }, // Tiwanaku
  { lat: 32.9, lng: 21.9667 }, // Apoŀlònia de Cirenaica
  { lat: 33.850494444, lng: 36.009827777 }, // Rayak
  { lat: 40.644166666, lng: 22.122222222 }, // Mieza
  { lat: 26.142194, lng: 32.669722 }, // Dandara
  { lat: 40.8, lng: 14.55 }, // Poggiomarino
  { lat: 47.48092744, lng: 8.220067498 }, // Vindonissa
  { lat: 13.979555555, lng: -89.674416666 }, // Tazumal
  { lat: 52.64926, lng: 59.5715 }, // Arkaim
  { lat: 37.971944, lng: 23.726389 }, // temple d'Atena
  { lat: 34.8065, lng: 48.516247 }, // Ecbàtana
  { lat: 25.6167, lng: 32.5333 }, // Armant
  { lat: 43.773888888, lng: 4.8325 }, // Glanum
  { lat: 32.105, lng: 34.930416666 }, // Antipatris
  { lat: 38.38194444, lng: 38.36111111 }, // Arslantepe
  { lat: 49.7494, lng: -113.625 }, // Precipici dels bisons de Head-Smashed-In
  { lat: 36.742658, lng: 34.537894 }, // Solos
  { lat: 34.5576, lng: 36.52 }, // Cadeix
  { lat: 42.458699, lng: -6.759002 }, // Las Médulas
  { lat: 37.385, lng: 27.25638889 }, // Dídima
  { lat: -16.561388888, lng: -68.679444444 }, // Pumapunku
  { lat: 36.685833, lng: 27.375 }, // Cnidos
  { lat: 52.0805, lng: 93.66378 }, // Arzhan
  { lat: 36.472593, lng: 37.094795 }, // Arpad
  { lat: 41.901666666, lng: 12.455277777 }, // Circ de Neró
  { lat: 41.894283, lng: 12.486844 }, // Temple of Mars Ultor
  { lat: 39.886613, lng: 44.57943 }, // Artàxata
  { lat: 33.99845, lng: 36.198792 }, // Baalbek Stones
  { lat: 9.0068286, lng: -79.485149 }, // Panamá la Vieja
  { lat: 36.331944444, lng: 29.289722222 }, // Letoon
  { lat: 16.9, lng: -90.966666666 }, // Yaxchilán
  { lat: 40.112, lng: 44.729 }, // temple de Garní
  { lat: 46.8233, lng: 13.4437 }, // Teúrnia
  { lat: 49.5, lng: 9.5 }, // Limes Germanicus
  { lat: 35.9575, lng: 39.0475 }, // Tuttul
  { lat: 43.838194, lng: 4.356111 }, // Maison carrée
  { lat: 41.891911, lng: 12.479483 }, // Teatre de Marcel
  { lat: 38.759166666, lng: 26.936388888 }, // Cime
  { lat: 49.7597, lng: 6.64402 }, // Augusta dels Trèvers
  { lat: 42.023888888, lng: 12.401388888 }, // Veïs
  { lat: 25.71983333, lng: 32.60077778 }, // temple de Medinet Habu
  { lat: 36.741944444, lng: 34.54 }, // Solos
  { lat: 46.88, lng: 7.049 }, // Avènticum
  { lat: 36.690171, lng: 27.371637 }, // Cnidos
  { lat: 31.322222, lng: 45.636111 }, // Eanna
  { lat: -2.99622, lng: 35.3524 }, // Laetoli
  { lat: 46.6992, lng: 14.365 }, // Virunum
  { lat: 41.89305, lng: 12.48617 }, // Forum de Nerva
  { lat: 16.129, lng: -91.785 }, // Chinkultic
  { lat: 41.8983, lng: 12.478 }, // Saepta Julia
  { lat: 55.3827, lng: 14.0544 }, // pedres d'Ale
  { lat: -27.335555555, lng: -55.517222222 }, // Nuestra Señora de Loreto
  { lat: 49.7497, lng: 6.64222 }, // Termes imperials de Trèveris
  { lat: 37.44119, lng: -6.0445003 }, // Itàlica
  { lat: 29.8, lng: 31.233333333 }, // Dashur
  { lat: 41.12083333, lng: 126.17861111 }, // Gungnae
  { lat: 38.761848, lng: 26.942154 }, // Cime
  { lat: 51.428611111, lng: -1.854166666 }, // Avebury
  { lat: 15.756138888, lng: -7.971444444 }, // Kunbi Salih
  { lat: 37.971343, lng: 23.725775 }, // Calcoteca
  { lat: 35.45, lng: 44.38333333 }, // Arrapha
  { lat: 34.006111111, lng: 36.208611111 }, // Baalbek
  { lat: 34.396386, lng: 64.515888 }, // minaret de Jam
  { lat: 66.689441, lng: 82.253343 }, // Mangazeia
  { lat: 41.892777777, lng: 12.484722222 }, // arc de Septimi Sever
  { lat: 37.662777777, lng: 62.1925 }, // Merv
  { lat: 33.967222222, lng: 36.657222222 }, // Yabrud
  { lat: 32.638331884, lng: 14.290496459 }, // Leptis Magna
  { lat: 29.871111111, lng: 31.216666666 }, // piràmide esglaonada de Djoser
  { lat: 30.129527777, lng: 31.288888888 }, // Heliòpolis
  { lat: 37.6675, lng: 32.828333333 }, // Çatalhöyük
  { lat: 53.0486903, lng: -9.1400214 }, // dolmen de Poulnabrone
  { lat: 13.433333333, lng: 103.833333333 }, // Angkor
  { lat: 31.3259, lng: 45.6374 }, // Uruk
  { lat: 42.952, lng: 21.67 }, // Justiniana Prima
  { lat: 40.39975, lng: 23.880112 }, // Acant
  { lat: 17.484166666, lng: -92.046388888 }, // Palenque
  { lat: 30.633333333, lng: 72.866666666 }, // Harappa
  { lat: 26.185167, lng: 31.918889 }, // Abidos
  { lat: 32.449809, lng: 35.613423 }, // Pel·la
  { lat: 42.016666666, lng: 21.391944444 }, // Scupi
  { lat: 32.450001, lng: 35.616669 }, // Pel·la
  { lat: 37.530233, lng: 27.278369 }, // Milet
  { lat: 22.335277777, lng: 75.415833333 }, // Mandu
  { lat: 34.116666666, lng: 35.65 }, // Biblos
  { lat: 19.6925, lng: -98.843888888 }, // Teotihuacan
  { lat: 31.315555555, lng: 35.353888888 }, // Masada
  { lat: 25.666666666, lng: 9 }, // Tassili n'Ajjer
  { lat: 34.015363, lng: 36.200556 }, // Baalbek
  { lat: 36.674042592, lng: 38.120998 }, // Til Barsip
  { lat: 37.056527777, lng: 10.062258333 }, // Útica
  { lat: 34.1959, lng: 43.88568 }, // Samarra
  { lat: 37.05861111, lng: 37.86583333 }, // Zeugma
  { lat: 33.093611, lng: 44.580556 }, // Ctesifont
  { lat: 37.63786111, lng: 21.63 }, // Temple de Zeus Olímpic
  { lat: 33.745685, lng: 72.815207 }, // Tàxila
  { lat: 20.026388888, lng: 75.179166666 }, // Ellora
  { lat: 37.054967, lng: 10.061128 }, // Útica
  { lat: 39.026452, lng: 31.266575 }, // Amòrion
  { lat: 32.18922, lng: 48.257785 }, // Susa
  { lat: 34.810555555, lng: -2.408333333 }, // Cova de Taforalt
  { lat: 32.189444444, lng: 48.256111111 }, // Susa
  { lat: 17.222094444, lng: -89.623613888 }, // Tikal
  { lat: 38.795555555, lng: 22.536666666 }, // Termòpiles
  { lat: 36.1333, lng: 42.5167 }, // Qattara
  { lat: 41.895833333, lng: 12.484166666 }, // Columna de Trajà
  { lat: 39.0225, lng: 31.295 }, // Amòrion
  { lat: 33.093611, lng: 44.580833 }, // Ctesifont
  { lat: 35.107222, lng: 132.4375 }, // Iwami Ginzan
  { lat: 38.483055555, lng: 22.505555555 }, // Castàlia
  { lat: 37.531111, lng: 27.275556 }, // Milet
  { lat: 37.992359, lng: 23.708059 }, // Acadèmia platònica
  { lat: 34.119501, lng: 35.646846 }, // Biblos
  { lat: 40.393962, lng: 23.885983 }, // Acant
  { lat: 29.85, lng: 31.233333333 }, // Saqqara
  { lat: 43.83489, lng: 4.35963 }, // Amfiteatre de Nimes
  { lat: 25.718372, lng: 32.65805 }, // Karnak
  { lat: 40.019722222, lng: 34.615277777 }, // Hattusa
  { lat: 54.491111111, lng: 9.565277777 }, // Hedeby
  { lat: 43.677746, lng: 4.630924 }, // Amfiteatre d'Arle
  { lat: 32.126111111, lng: 45.230833333 }, // Nippur
  { lat: 33.745833333, lng: 72.7875 }, // Tàxila
  { lat: 51.595266666, lng: -55.531222222 }, // L'Anse aux Meadows
  { lat: 32.636748, lng: 14.2922 }, // Leptis Magna
  { lat: 32.487222222, lng: 3.681388888 }, // Mzab
  { lat: 40.065278, lng: 46.905833 }, // Tigranakert
  { lat: 37.808962, lng: 22.710279 }, // Nèmea
  { lat: 40.887799, lng: 17.391103 }, // Egnàcia
  { lat: 41.892138888, lng: 12.486688888 }, // Temple d'Antoní i Faustina
  { lat: 38.382709, lng: 26.480827 }, // Èritres de Jònia
  { lat: 41.894444444, lng: 12.498333333 }, // catacumbes romanes
  { lat: 26.338333333, lng: 31.891666666 }, // Girga
  { lat: 45.62277778, lng: 23.31027778 }, // Sarmizegethusa
  { lat: 39.490556, lng: 26.336667 }, // Assos
  { lat: 41.891707, lng: 12.486206 }, // Temple de Vesta
  { lat: 34.4, lng: 69.366666666 }, // Mes Aynak
  { lat: 36.04916667, lng: 14.26944444 }, // temples megalítics de Malta
  { lat: 31.196388888, lng: 30.744722222 }, // Buto
  { lat: 39.491621, lng: 26.339656 }, // Assos
  { lat: 39.3317, lng: 31.5809 }, // Pessinunt
  { lat: 26.141667, lng: 32.670278 }, // Temple d'Hathor de Denderah
  { lat: 33.018333333, lng: 35.569166666 }, // Hassor
  { lat: 38.372548, lng: 21.533275 }, // Calidó
  { lat: 36.962229, lng: 30.855068 }, // Perge
  { lat: 25.728333333, lng: 32.601388888 }, // Deir al-Madinah
  { lat: 35.869558333, lng: 14.506883333 }, // Hipogeu d'Ħal-Saflieni
  { lat: 33.844166666, lng: 36.546666666 }, // Maalula
  { lat: 41.888888888, lng: 12.480277777 }, // Cloaca Maxima
  { lat: 37.975138888, lng: 23.723166666 }, // Odèon d'Agripa
  { lat: 34.48222222, lng: 135.81305556 }, // Asuka
  { lat: 20.448058333, lng: -97.378241666 }, // El Tajín
  { lat: 40.140647, lng: 44.537949 }, // Erebuní
  { lat: 41.890717, lng: 12.488585 }, // Arc de Titus
  { lat: 74.716667, lng: -91.85 }, // illa de Beechey
  { lat: -9.592775, lng: -77.178452777 }, // Chavín de Huántar
  { lat: 27.774438888, lng: 30.801111111 }, // Hermòpolis Magna
  { lat: 50.5127, lng: 6.6108 }, // Aqüeducte d'Eifel
  { lat: 41.876489, lng: 12.480898 }, // piràmide de Cesti
  { lat: 30.466667, lng: 31.183333 }, // Athribis (Baix Egipte)
  { lat: 31.6674, lng: 45.8877 }, // Umma
  { lat: 51.975, lng: 5.34 }, // Dorestad
  { lat: -20.595583333, lng: 14.372583333 }, // Twyfelfontein
  { lat: 35.643333333, lng: 36.668333333 }, // Maarat an-Numan
  { lat: 28.188888888, lng: 30.769438888 }, // Akoris
  { lat: 41.8914573, lng: 12.5152419 }, // Porta Maggiore
  { lat: 36.960353, lng: 30.853686 }, // Perge
  { lat: 26.233611111, lng: 50.520555555 }, // Qal'at al-Bahrain
  { lat: 45.462907, lng: 9.185321 }, // Mediolànum
  { lat: 29.932778, lng: 31.161111 }, // piràmide de Khaba
  { lat: 41.876388888, lng: 12.480833333 }, // piràmide de Cesti
  { lat: 38.14222222, lng: 41.00138889 }, // Tigranocerta
  { lat: 18.53333333, lng: 31.81666667 }, // Napata
  { lat: 25.720555555, lng: 32.610555555 }, // Colossos de Mèmnon
  { lat: 32.755556, lng: 36.616667 }, // Qanawat
  { lat: 41.798333333, lng: 12.710833333 }, // Tusculum
  { lat: 38.381944, lng: 26.479047 }, // Èritres de Jònia
  { lat: 13.463055555, lng: 103.894444444 }, // Neak Pean
  { lat: -19.94888889, lng: -69.63305556 }, // Gegant d'Atacama
  { lat: 32.0928, lng: 44.7833 }, // Marad
  { lat: 32.76002778, lng: 44.61286111 }, // Kutha
  { lat: 25.721427777, lng: 32.608680555 }, // temple d'Amenhotep III
  { lat: 31.088055555, lng: 30.945555555 }, // Xois
  { lat: 34.26327, lng: 108.8089 }, // Epang Palace
  { lat: 19.447083333, lng: -96.404111111 }, // Cempoala
  { lat: 37.97402, lng: 23.74334 }, // Liceu
  { lat: 35.267777777, lng: 36.566666666 }, // Xaizar
  { lat: 36.336266, lng: 27.921321 }, // Camiros
  { lat: 26.17361111, lng: 68.32305556 }, // Chāñhu-daro
  { lat: 20.4898, lng: -87.7251 }, // Cobá
  { lat: 41.893055555, lng: 12.485277777 }, // Cúria Hostília
  { lat: 40.641805555, lng: 22.952277777 }, // Church of Hosios David
  { lat: 13.46455, lng: 103.91284 }, // Ta Som
  { lat: 32.598593, lng: 35.858417 }, // Capitolias
  { lat: 37.518333333, lng: 38.605555555 }, // Nevalı Çori
  { lat: 30.595277777, lng: 61.331944444 }, // Xahr-i Sokhta
  { lat: 50.8137, lng: -2.47474 }, // Gegant de Cerne Abbas
  { lat: 37.0759, lng: 15.2754 }, // Teatre grecoromà de Siracusa
  { lat: 36.368115, lng: 6.613303 }, // Cirta
  { lat: 31.56694, lng: 35.63361 }, // Maquerunt
  { lat: 14.6328, lng: -90.5491 }, // Kaminaljuyú
  { lat: 37.970833, lng: 23.73 }, // monument de Lisícrates
  { lat: 37.969372222, lng: 23.733077777 }, // Temple de Zeus Olímpic
  { lat: 38.11555556, lng: 27.14222222 }, // Colofó
  { lat: 33.137222, lng: 44.517222 }, // Selèucia del Tigris
  { lat: 46.691895, lng: 31.901597 }, // Òlbia
  { lat: 52.492083333, lng: 60.177944444 }, // Sintashta
  { lat: 29.0333, lng: 33.45 }, // Maghara
  { lat: 28.8, lng: 57.766667 }, // Cultura de Jiroft
  { lat: 41.892930555, lng: 12.485402777 }, // Cúria Júlia
  { lat: 35.060067, lng: 24.949458 }, // Gortina
  { lat: 41.87613889, lng: 12.50075 }, // Tomba dels Escipions
  { lat: 37.325, lng: 69.525 }, // Shortugai
  { lat: 34.754, lng: 113.676 }, // Cultura d'Erligang
  { lat: 40.550001, lng: 19.733353 }, // Bil·lis
  { lat: 34.943204, lng: 135.703232 }, // Nagaoka-kyō
  { lat: 41.9667, lng: 12.8009 }, // Temple de Vesta (Tívoli)
  { lat: 29.372448, lng: 31.172034 }, // Meidum
  { lat: 16.316666666, lng: -88.8 }, // Nim Li Punit
  { lat: -33.393, lng: 22.215 }, // Coves de Cango
  { lat: 13.352669, lng: 103.97389101 }, // Lolei
  { lat: 28.208611, lng: 113.021667 }, // Mawangdui
  { lat: 38.435035, lng: 105.987167 }, // Western Xia Mausoleums
  { lat: 51.5777, lng: -1.56675 }, // Cavall blanc d'Uffington
  { lat: 37.175, lng: 21.92 }, // Messene
  { lat: 41.852013, lng: 12.520701 }, // Túmul de Cecília Metel·la
  { lat: 26.809166666, lng: 33.486666666 }, // Mons Claudianus
  { lat: 32.3325, lng: 35.751666666 }, // Ajlun
  { lat: 37.564519, lng: 38.471342 }, // Samòsata
  { lat: -14.818611111, lng: -75.116666666 }, // Cahuachi
  { lat: -13.394742, lng: -72.872243 }, // Choquequirao
  { lat: 36.3675, lng: 6.61194444 }, // Cirta
  { lat: 37.145655555, lng: 38.783961111 }, // Edessa
  { lat: 40.346685, lng: 26.699162 }, // Làmpsac
  { lat: 37.970404, lng: 23.727777 }, // Teatre de Dionís
  { lat: 35.109166666, lng: 25.7925 }, // Gournia
  { lat: 37.05, lng: 22 }, // Messene
  { lat: 37.176482, lng: 38.776168 }, // Edessa
  { lat: 37.616619, lng: 22.391896 }, // Mantinea
  { lat: 34.502222, lng: 135.807222 }, // Fujiwara-kyō
  { lat: 46.7, lng: 31.9 }, // Òlbia
  { lat: 36.1553, lng: -109.509 }, // Monument Nacional del Canyó de Chelly
  { lat: 38.2935, lng: 23.1549 }, // Tèspies
  { lat: 47.705, lng: 42.273056 }, // Sarkel
  { lat: 45.4401, lng: 10.98877 }, // Arco dei Gavi
  { lat: 32.1952, lng: 34.8068 }, // Arsuf
  { lat: 28.593980555, lng: 30.851630555 }, // Sharuna
  { lat: 13.434245, lng: 103.800588 }, // West Baray
  { lat: 25.44, lng: 32.36 }, // KV63
  { lat: 41.01083333, lng: 21.3425 }, // Heraclea Lincestis
  { lat: -25.895147, lng: 27.801324 }, // Malapa
  { lat: 19.301667, lng: -99.181667 }, // Cuicuilco
  { lat: -8.135, lng: -78.991388888 }, // Huaca de la Luna
  { lat: 44.5475, lng: 28.774722 }, // Hístria
  { lat: 52.344, lng: -3.049 }, // Muralla d'Offa
  { lat: 36.33622, lng: 27.921281 }, // Camiros
  { lat: 41.893333333, lng: 12.484444444 }, // Presó Mamertina
  { lat: -5.7825, lng: 144.33 }, // Kuk
  { lat: 41.892456, lng: 12.485367 }, // Presó Mamertina
  { lat: 44.5475, lng: 28.77472222 }, // Hístria
  { lat: 40.29275, lng: 23.354527777 }, // Olint
  { lat: 18.50691667, lng: -89.48633333 }, // Chicanná
  { lat: -9.2, lng: -77.7 }, // Guitarrero Cave
  { lat: 35.98724353, lng: 38.11024189 }, // Emar
  { lat: 18.35833056, lng: -88.35202778 }, // Cerros
  { lat: 40.416077777, lng: 16.816763888 }, // Metapont
  { lat: 37.5275, lng: 22.8743 }, // Àsine
  { lat: 35.063333, lng: 24.946944 }, // Gortina
  { lat: 36.7, lng: 65.787 }, // Tillia tepe
  { lat: 37.595252, lng: 27.433117 }, // Miünt
  { lat: 13.435473, lng: 103.920452 }, // Pre Rup
  { lat: 41.85887778, lng: 12.51105833 }, // Catacumba de Sant Cal·lixt
  { lat: 41.908798668, lng: 12.507940792 }, // Castra Praetoria
  { lat: 37.971666666, lng: 23.719444444 }, // Pnyx
  { lat: 32.75411, lng: 35.283791 }, // Seforis
  { lat: 31.7433, lng: 45.8767 }, // Zabalam
  { lat: 37.616666666, lng: 22.383333333 }, // Mantinea
  { lat: 37.07611, lng: 15.275 }, // Teatre grecoromà de Siracusa
  { lat: 19.24357184, lng: -98.33994922 }, // Cacaxtla
  { lat: 16.763927777, lng: -89.117591666 }, // El Caracol (Belize)
  { lat: 38.303559, lng: 23.158322 }, // Tèspies
  { lat: 31.771638888, lng: 35.229013888 }, // David's Tomb
  { lat: 40.153889, lng: 44.451111 }, // Teishebaini
  { lat: -9.55666667, lng: -78.23583333 }, // Chankillo
  { lat: 40.343889, lng: 26.683611 }, // Làmpsac
  { lat: 41.892777777, lng: 12.485 }, // Comitium
  { lat: 16.901219444, lng: -92.009675 }, // Toniná
  { lat: 40.540278, lng: 19.7375 }, // Bil·lis
  { lat: 39.234166666, lng: 88.939444444 }, // Miran
  { lat: 37.59444444, lng: 27.42777778 }, // Miünt
  { lat: 19.600802, lng: 30.409731 }, // Kerma
  { lat: 37.57955, lng: 38.481316666 }, // Samòsata
  { lat: 40.292595, lng: 23.342665 }, // Olint
  { lat: 41.011111111, lng: 21.3425 }, // Heraclea Lincestis
  { lat: 42.598333333, lng: 21.193333333 }, // Monestir de Gračanica
  { lat: 36.533333333, lng: 37.95 }, // Manbij
  { lat: 27.35, lng: 68.71666667 }, // Kot Diji
  { lat: 33.1, lng: 44.52 }, // Selèucia del Tigris
  { lat: 13.41972, lng: 103.89965 }, // Prasat Kravan
  { lat: 37.64897, lng: 24.0301 }, // cap Súnion
  { lat: 32.753055555, lng: 35.279166666 }, // Seforis
  { lat: 37.103611111, lng: 36.678611111 }, // Samal
  { lat: 27.757219444, lng: 30.91 }, // Deir al-Bersha
  { lat: 47.270556, lng: 39.341389 }, // Tanais
  { lat: 18.353888888, lng: -88.350555555 }, // Cerros
  { lat: 55.6825, lng: 14.233888888 }, // The King's Grave
  { lat: 41.8927578, lng: 12.4774218 }, // Circ Flamini
  { lat: 17.07222222, lng: -89.4 }, // Yaxhá
  { lat: 32.15, lng: 44.5 }, // Dilbat
  { lat: 40.383126, lng: 16.822782 }, // Metapont
  { lat: 31.3, lng: 30.08333333 }, // Canop
  { lat: 13.34389509, lng: 103.97271574 }, // Preah Ko
  { lat: 36.840027777, lng: 40.068694444 }, // Tell el Fakhariya
  { lat: 36.811944, lng: 41.955833 }, // Hamoukar
  { lat: 11.037997222, lng: -73.925191666 }, // Ciudad Perdida
  { lat: 35.155833333, lng: 40.43 }, // Circèsion
  { lat: 14.837963888, lng: -89.142441666 }, // Copán
  { lat: 29.085556, lng: 30.934444 }, // Heracleòpolis Magna
  { lat: 37.256404, lng: 35.898549 }, // Anazarb
  { lat: 37.892222222, lng: 21.374444444 }, // Elis
  { lat: 37.596719, lng: 22.799814 }, // Tirint
  { lat: 30.683436, lng: 104.010911 }, // Jinsha
  { lat: 20.359444444, lng: -89.771388888 }, // Uxmal
  { lat: 61.11767375, lng: 21.7751687 }, // Sammallahdenmäki
  { lat: 36.047265, lng: 14.269095 }, // Ġgantija
  { lat: 25.731666666, lng: 32.609166666 }, // Sheikh Abd al-Gurnah
  { lat: 25.740833333, lng: 32.602222222 }, // KV61
  { lat: 29.2125, lng: 67.670833 }, // Mehrgarh
  { lat: 37.597777777, lng: 23.074444444 }, // Epidaure
  { lat: 36.260565, lng: 29.313364 }, // Pàtara
  { lat: 41.89444444, lng: 12.48555556 }, // Fòrums Imperials
  { lat: -10.893611111, lng: -77.520277777 }, // Caral
  { lat: 37.891781, lng: 21.375091 }, // Elis
  { lat: 37.972083333, lng: 23.726527777 }, // Erectèon
  { lat: 32.585277777, lng: 35.184444444 }, // Meguidó
  { lat: 56.085732275, lng: -5.478923123 }, // Dunadd
  { lat: 37.256, lng: 35.9 }, // Anazarb
  { lat: 31.741900825, lng: 35.459944301 }, // Qumran
  { lat: -20.27, lng: 30.933 }, // Gran Zimbabwe
  { lat: 38.488314, lng: 28.040286 }, // Sardes
  { lat: 34.549444444, lng: 40.89 }, // Mari
  { lat: 38.488333, lng: 28.040278 }, // Sardes
  { lat: 32.683055555, lng: 35.87 }, // Raphana
  { lat: 37.599444444, lng: 22.799722222 }, // Tirint
  { lat: 29.9725, lng: 31.128333 }, // piràmide de Micerí
  { lat: 40.7625, lng: 29.9175 }, // Nicomèdia
  { lat: 35.456666666, lng: 43.2625 }, // Assur
  { lat: 30.2, lng: 53.179444444 }, // Pasàrgades
  { lat: 41.888333333, lng: 12.486944444 }, // Palatí
  { lat: 37.876595114, lng: -4.781380585 }, // Alcázar Nuevo
  { lat: 36.26214722, lng: 46.68780833 }, // Tresor de Ziwiyeh
  { lat: 37.223055555, lng: 38.9225 }, // Göbekli Tepe
  { lat: -18.771666666, lng: 21.754166666 }, // Tsodilo
  { lat: 40.848611, lng: 14.053611 }, // Cumes
  { lat: 40.76, lng: 22.519167 }, // Pel·la
  { lat: 25.136797222, lng: 85.443827777 }, // Nalanda
  { lat: 29.560011111, lng: 31.220944444 }, // piràmide de Senusret I
  { lat: 30.976944444, lng: 31.88 }, // Tanis
  { lat: 41.892722, lng: 12.484556 }, // Umbilicus Urbis Romae
  { lat: 40.760033, lng: 22.525642 }, // Pel·la
  { lat: 37.63328, lng: 23.160067 }, // Epidaure
  { lat: 59.336666666, lng: 17.545 }, // Birka
  { lat: 13.443302, lng: 103.859682 }, // Angkor Thom
  { lat: 31.285833333, lng: 45.853611111 }, // Larsa
  { lat: 37.260375, lng: -108.494444 }, // Parc Nacional de Mesa Verde
  { lat: 29.08333, lng: 30.93333 }, // Heracleòpolis Magna
  { lat: 37.886080468, lng: -4.867785472 }, // Madínat az-Zahrà
  { lat: 36.098055555, lng: 43.328888888 }, // Nimrud
  { lat: 30.81583, lng: 45.99583 }, // Eridu
  { lat: 35.051267, lng: 24.810922 }, // Festos
  { lat: 36.260278, lng: 29.314167 }, // Pàtara
  { lat: 31.524672222, lng: 35.110758333 }, // cova de Macpelà
  { lat: 29.976, lng: 31.130972 }, // piràmide de Khefren
  { lat: 52.098888888, lng: -131.2175 }, // SGang Gwaii
  { lat: 31.2833, lng: 45.8498 }, // Larsa
  { lat: 40.847123, lng: 14.056082 }, // Cumes
  { lat: 35.05123, lng: 24.814267 }, // Festos
  { lat: 41.284722222, lng: 31.414722222 }, // Heraclea Pòntica
  { lat: 42.468108, lng: 19.265639 }, // Doclea
  { lat: 37.926208333, lng: 22.9726 }, // muralla d'Hexamilion
  { lat: 25.739644444, lng: 32.637805555 }, // necròpolis dels Antef
  { lat: 35.68333333, lng: 36.53333333 }, // Al-Bara
  { lat: 8.91138889, lng: -83.4775 }, // esferes de pedra de Costa Rica
  { lat: 27.440277777, lng: 30.818333333 }, // Al-Qusiya
  { lat: 29.79166667, lng: 31.22361111 }, // piràmide negra
  { lat: 37.6801, lng: 30.5253 }, // Sagalassos
  { lat: 32.7, lng: 36.566666666 }, // As-Suwayda
  { lat: 24.833429166, lng: 10.333319444 }, // Tadrart Acacus
  { lat: 25.727777777, lng: 32.610555555 }, // Ramesseum
  { lat: 29.80555556, lng: 31.22277778 }, // piràmide blanca
  { lat: 37.27777778, lng: 27.58638889 }, // Iasos
  { lat: 25.734444444, lng: 32.711944444 }, // Nag al-Madamud
  { lat: 32.536388888, lng: 44.420833333 }, // Etemenanki
  { lat: 26.109072222, lng: 34.275997222 }, // El-Quseir
  { lat: 47.084444444, lng: 2.396388888 }, // Avàricum
  { lat: 38.863055555, lng: 125.415 }, // Conjunt de tombes de Koguryö
  { lat: 34.8265, lng: 35.908186 }, // Maratos
  { lat: 25.583038888, lng: 32.533611111 }, // Tufium
  { lat: 31.98, lng: 44.39 }, // Hira
  { lat: 30.786228, lng: 31.82253 }, // Avaris
  { lat: 35.80551, lng: 103.044378 }, // Coves de Binglingsi
  { lat: 25.097222222, lng: 32.779444444 }, // Nekhen
  { lat: 25.116666666, lng: 32.8 }, // El-Kab
  { lat: 38.637072222, lng: 22.895780555 }, // Abes
  { lat: 20.208611111, lng: -90.484166666 }, // Illa de Jaina
  { lat: 38.587, lng: 22.917 }, // Abes
  { lat: -8.110555555, lng: -79.075 }, // Chan Chan
  { lat: 14.7358, lng: -90.9962 }, // Iximché
  { lat: 38.073611111, lng: 26.967222222 }, // Lèbedos
  { lat: 45.2366, lng: 36.4175 }, // Nimfèon
  { lat: 13.44654, lng: 103.91997 }, // Mebon oriental
  { lat: 37.67805556, lng: 30.51944444 }, // Sagalassos
  { lat: 25.7275, lng: 32.593055555 }, // vall de les Reines
  { lat: 33.123611111, lng: 45.931388888 }, // Der
  { lat: 41.941944, lng: 12.775278 }, // vil·la Adriana
  { lat: 45.237602, lng: 36.417269 }, // Nimfèon
  { lat: 38.077883, lng: 26.964722 }, // Lèbedos
  { lat: 41.891388888, lng: 12.486666666 }, // Casa de les Vestals
  { lat: 41.85891389, lng: 12.50552778 }, // Catacombs of Domitilla
  { lat: 25.733330555, lng: 32.7125 }, // Nag al-Madamud
  { lat: 37.278149, lng: 27.585572 }, // Iasos
  { lat: 25.733491666, lng: 32.612833333 }, // Asasif
  { lat: 32.516666666, lng: 36.483333333 }, // Bosrà
  { lat: 41.887846, lng: 12.480973 }, // Aqua Appia
  { lat: 29.570277777, lng: 31.231111111 }, // Lisht
  { lat: 36.829722222, lng: 38.015 }, // Carquemix
  { lat: 18.105, lng: -89.810555555 }, // Calakmul
  { lat: 34.835278, lng: 35.9075 }, // Maratos
  { lat: 41.284722, lng: 31.414722 }, // Heraclea Pòntica
  { lat: 41.901666666, lng: 12.501666666 }, // Muralla Serviana
  { lat: 36.50953, lng: 43.22931 }, // Dur Xarrukin
  { lat: 15.023333333, lng: -91.171944444 }, // Regne K'iche' de Q'umarkaj
  { lat: 44.716471, lng: 21.166605 }, // Viminacium
  { lat: 30.795, lng: 34.775 }, // Avdat
  { lat: 27.931388888, lng: 30.875280555 }, // Aldea Beni Hasan
  { lat: 41.892436, lng: 12.478533 }, // Pòrtic d'Octàvia
  { lat: 15.951333333, lng: 75.814638888 }, // Pattadakal
  { lat: 34.9925, lng: 69.3106 }, // Alexandria Paropamisos
  { lat: 48.6675, lng: -3.858611111 }, // Cairn de Barnenez
  { lat: 34.547, lng: 38.274 }, // temple de Baal
  { lat: 16.929722222, lng: -89.891666666 }, // Nojpetén
  { lat: 37.825317, lng: 15.266688 }, // Naxos
  { lat: 32.6885184, lng: 35.31799793 }, // Qafzeh Cave
  { lat: 31.781388888, lng: 35.235833333 }, // Betzatà
  { lat: 52.8294, lng: -1.49393 }, // cementiri de Heath Wood
  { lat: 30.88, lng: 34.63 }, // Subayta
  { lat: 36.83681604, lng: -107.99981253 }, // Aztec Ruins National Monument
  { lat: 59.0487138, lng: -3.3417499 }, // Skara Brae
  { lat: 37.970167, lng: 23.732 }, // Arc d'Hadrià
  { lat: 13.47638889, lng: 104.23833333 }, // Beng Mealea
  { lat: 50.615, lng: 97.384722222 }, // Por-Bajin
  { lat: 42.00972222, lng: 61.02722222 }, // Ayaz-Kala
  { lat: 51.420833, lng: 45.9625 }, // Ukek
  { lat: 41.908083333, lng: 12.496916666 }, // Jardins de Sal·lusti
  { lat: -27.889527777, lng: -55.345 }, // Santa María la Mayor
  { lat: 36.96261102, lng: -2.521640046 }, // Los Millares
  { lat: 22.65019444, lng: 31.99152778 }, // Ibrim
  { lat: 14.531939954, lng: 102.940334775 }, // Phanom Rung historical park
  { lat: 47.593333333, lng: -3.079722222 }, // alineaments de Carnac
  { lat: 44.966111111, lng: 19.610555555 }, // Sírmium
  { lat: 18.409230555, lng: 31.771002777 }, // Al-Kurru
  { lat: 57.077222222, lng: 9.9125 }, // Lindholm Høje
  { lat: 41.88583333, lng: 12.50916667 }, // Porta San Giovanni
  { lat: 19.596778, lng: -90.229083 }, // Edzna
  { lat: 47.539166666, lng: 4.500555555 }, // Alèsia
  { lat: 31.28083333, lng: 35.125 }, // Tel Arad
  { lat: 31.775689, lng: 35.23104 }, // Èlia Capitolina
  { lat: 32.2874, lng: 35.3378 }, // Tirsà
  { lat: 41.875952, lng: 12.475694 }, // Monte Testaccio
  { lat: 41.900555555, lng: 12.478611111 }, // rellotge de sol d'August
  { lat: 13.43424511, lng: 103.80034637 }, // Baray
  { lat: 41.89024, lng: 12.48623 }, // Domus Tiberiana
  { lat: 49.75, lng: 6.63028 }, // Barbara Baths
  { lat: 23.943055555, lng: 35.489444444 }, // Berenice Troglodytica
  { lat: 15.948333333, lng: 75.816666666 }, // Pattadakal
  { lat: 14.343055555, lng: 100.541944444 }, // Wat Chaiwatthanaram
  { lat: 40.2195, lng: 16.6704 }, // Heraclea de Lucània
  { lat: 38.91667, lng: -6.33333 }, // Augusta Emèrita
  { lat: 50.695, lng: -2.47 }, // Castell de Maiden, Dorset
  { lat: 41.90277778, lng: 12.49833333 }, // Termes de Dioclecià
  { lat: 37.027222222, lng: 21.695 }, // Palau de Nèstor
  { lat: 36.207643, lng: 36.519208 }, // Harem
  { lat: 36.124449, lng: 35.921192 }, // Selèucia de Piera
  { lat: 37.597785, lng: 27.958833 }, // Alabanda
  { lat: 46.200948, lng: 30.350539 }, // Tira
  { lat: 13.445833333, lng: 103.858611111 }, // Terrace of the Elephants
  { lat: -23.58861111, lng: -65.40277778 }, // Pucará de Tilcara
  { lat: 18.804305555, lng: -99.296638888 }, // Xochicalco
  { lat: 18.516666666, lng: -89.466666666 }, // Becan
  { lat: 13.59888275, lng: 103.96285057 }, // Banteay Srei
  { lat: 13.443767, lng: 103.856169 }, // Baphuon
  { lat: 40.213021, lng: 16.678299 }, // Heraclea de Lucània
  { lat: 41.89, lng: 12.495 }, // Ludus Magnus
  { lat: 34.27444444, lng: 109.0475 }, // Jaciment arqueològic de Banpo
  { lat: 41.891895, lng: 12.485994 }, // Arch of Augustus
  { lat: 35.067777777, lng: -107.565277777 }, // North Acomita Village
  { lat: -27.3906017, lng: -55.5807445 }, // Missió jesuítica de Santa Ana
  { lat: 15.02352778, lng: -91.17198889 }, // Regne K'iche' de Q'umarkaj
  { lat: 32.704166666, lng: 35.128055555 }, // Bet Xearim
  { lat: 29.903944, lng: 31.194195 }, // Abu Ghurab
  { lat: 41.77916667, lng: 12.26666667 }, // Portus
  { lat: 44.73277778, lng: 21.23055556 }, // Viminacium
  { lat: 37.551195, lng: 22.718214 }, // Lerna
  { lat: 31.499722222, lng: 35.919722222 }, // Um er-Rasas
  { lat: 30.946111111, lng: 29.518611111 }, // Taposiris Magna
  { lat: 41.888056, lng: 12.484444 }, // Lupercal
  { lat: 38.626349, lng: 22.764982 }, // Elatea
  { lat: 41.891944444, lng: 12.486388888 }, // Règia
  { lat: 18.41666667, lng: -88.78333333 }, // Kohunlich
  { lat: 15.404419, lng: 45.355844 }, // Mara Bilquis
  { lat: 41.90611, lng: 12.47639 }, // Mausoleu d'August
  { lat: -13.57083333, lng: -71.78305556 }, // Tipón
  { lat: 17.166666666, lng: -91.2625 }, // Piedras Negras
  { lat: 41.891942, lng: 12.484728 }, // Basílica Semprònia
  { lat: 41.891111111, lng: 12.48 }, // Forum Holitorium
  { lat: 30.032222, lng: 31.074722 }, // Piràmide inacabada d'Abu Rawash
  { lat: 32.615982, lng: 34.927477 }, // Dor
  { lat: 33.968888888, lng: 51.404722222 }, // Sialk
  { lat: 50.6399, lng: -2.0589 }, // castell de Corfe
  { lat: -14.293333333, lng: 34.279166666 }, // Art rupestre de Chongoni
  { lat: 19.435, lng: -99.131389 }, // Temple Major
  { lat: 37.591796, lng: 27.985429 }, // Alabanda
  { lat: 41.765, lng: 101.145 }, // Khara-Khoto
  { lat: 17.733333, lng: -94.8 }, // Zona Arqueológica de San Lorenzo
  { lat: 30.912777777, lng: 31.242777777 }, // Busiris
  { lat: 54.991588, lng: -2.359504 }, // Vindolanda
  { lat: 11.193183333, lng: 40.599888888 }, // Hadar (Etiòpia)
  { lat: 31.8370932, lng: 35.5464968 }, // Qasr el Yahud
  { lat: -13.520111, lng: -71.975722 }, // Coricancha
  { lat: 36.87416667, lng: 37.55888889 }, // Tilbeşar
  { lat: 24.451944444, lng: 32.928055555 }, // temple de Kom Ombo
  { lat: 41.885633, lng: 12.488719 }, // Septizodium
  { lat: 41.784444444, lng: 82.504722222 }, // Coves de Kizil
  { lat: 41.312191, lng: 19.445263 }, // Amfiteatre de Durrës
  { lat: -13.507778, lng: -71.982222 }, // Sacsayhuamán
  { lat: 18.5667, lng: 31.9167 }, // Nuri
  { lat: 41.894166666, lng: 12.486666666 }, // Fòrum d'August
  { lat: 36.83055556, lng: 49.45916667 }, // Marlik
  { lat: 41.892345, lng: 12.485106 }, // Lacus Curtius
  { lat: 52.9337, lng: -1.47359 }, // Derventio
  { lat: 41.892930555, lng: 12.484244444 }, // temple de la Concòrdia
  { lat: 32.6174277, lng: 34.9163642 }, // Dor
  { lat: 38.646, lng: 22.783 }, // Elatea
  { lat: 27, lng: 31.41667 }, // Cultura Badariana
  { lat: 44.8702, lng: 13.84185 }, // Temple d'August de Pula
  { lat: 37.823989, lng: 15.273976 }, // Naxos
  { lat: -24.158611111, lng: 29.176944444 }, // Makapansgat
  { lat: 58.494241, lng: 31.29792 }, // Rurikovo Gorodische
  { lat: 53.702916666, lng: -6.449166666 }, // Dowth
  { lat: 13.425229, lng: 103.858073 }, // Baksei Chamkrong
  { lat: -12.902777777, lng: -73.205833333 }, // Vilcabamba
  { lat: 46.20111111, lng: 30.35055556 }, // Tira
  { lat: 30.96222222, lng: 31.2425 }, // Sebenitos
  { lat: 13.335986111, lng: 103.974116666 }, // Bakong
  { lat: 15.368888888, lng: 47.023611111 }, // Xabwa
  { lat: 34.858397, lng: 35.859448 }, // Arwad
  { lat: 49.7092, lng: 6.54944 }, // Columna d'Igel
  { lat: 36.55389, lng: 29.42079 }, // Tlos
  { lat: 31.776958333, lng: 35.238958333 }, // Tomb of Absalom
  { lat: 24.0252109, lng: 32.8842688 }, // Agilkia
  { lat: 30.005, lng: 31.2375 }, // Fustat
  { lat: 36.467249, lng: 34.148625 }, // Còricos
  { lat: 39.671325, lng: 66.987708333 }, // Afrasiab
  { lat: 37.835833333, lng: 29.1075 }, // Laodicea del Licos
  { lat: 36.872063, lng: 14.447679 }, // Camarina
  { lat: -27.25528, lng: -55.53167 }, // San Ignacio Miní
  { lat: 25.3244, lng: 87.2867 }, // Vikramaśīla University
  { lat: 31.56527778, lng: 34.84916667 }, // Tel Laquix
  { lat: 6.841944, lng: 158.332222 }, // Nan Madol
  { lat: 33.1815, lng: 44.6991 }, // Opis
  { lat: 15.325, lng: 76.465 }, // Vijayanagara
  { lat: 36.8825, lng: 7.75 }, // Hipona
  { lat: 30.320833333, lng: 30.848888888 }, // cultura de Merimde
  { lat: 42.26361111, lng: 21.95361111 }, // Kòkino
  { lat: 41.83763, lng: 44.72166 }, // Armazi
  { lat: 40.42, lng: 15.005555555 }, // Pèstum
  { lat: -7.45, lng: 110.85 }, // Sangiran
  { lat: 37.980475, lng: 22.722718 }, // Sició
  { lat: -27.056, lng: -55.753 }, // Missió jesuítica de Jesús de Tavarangué
  { lat: 38.373403, lng: 34.735034 }, // Ciutat subterrània de Derinkuyu
  { lat: 31.304167, lng: 30.100556 }, // Heracleion
  { lat: -27.255306, lng: -55.5315 }, // San Ignacio Miní
  { lat: 30.37583, lng: -107.95556 }, // Paquimé
  { lat: 32.778841, lng: 35.659411 }, // Hippos
  { lat: 24.633333333, lng: 32.933333333 }, // Djebel al-Silsila
  { lat: 40.63224, lng: 22.951737 }, // Arch of Galerius and Rotunda
  { lat: 36.8267852, lng: 40.0396697 }, // Tell Halaf
  { lat: 51.662222222, lng: 6.453888888 }, // Limes Germanicus inferior
  { lat: 41.894008, lng: 12.484936 }, // Forum of Caesar
  { lat: 41.88926, lng: 12.480908 }, // Temple de Portunus
  { lat: 37.855246, lng: 29.136425 }, // Laodicea del Licos
  { lat: 19.431111111, lng: 103.1525 }, // Plana de les gerres
  { lat: 36.48915, lng: 29.25835 }, // Pinara
  { lat: 37.166388888, lng: 69.410833333 }, // Ai-Khanum
  { lat: 32.039166666, lng: 35.727222222 }, // Al-Salt
  { lat: 36.489655, lng: 29.256891 }, // Pinara
  { lat: -34.414444444, lng: 21.2225 }, // Cova de Blombos
  { lat: 30.551944444, lng: 32.098611111 }, // Heroòpolis
  { lat: -18.178355555, lng: -63.818988888 }, // Fort de Samaipata
  { lat: 40.593031, lng: 23.79204 }, // Estagira
  { lat: 42.546944444, lng: 20.266388888 }, // Monestir de Visoki Dečani
  { lat: 31.772616, lng: 35.235944 }, // Acra
  { lat: 34.856111111, lng: 35.858333333 }, // Arwad
  { lat: 16.9, lng: -89.9 }, // Petén Basin
  { lat: 25.732777777, lng: 32.628055555 }, // temple de Seti I
  { lat: 17.114128567, lng: -88.862352544 }, // Actun Tunichil Muknal
  { lat: 25.005, lng: 85.063 }, // Barabar
  { lat: 43.539561, lng: 16.483426 }, // Salona
  { lat: 37.984104, lng: 22.711145 }, // Sició
  { lat: 38.514444444, lng: -123.243611111 }, // Fort Ross
  { lat: 33.643888888, lng: 36.693611111 }, // Al-Dumayr
  { lat: 38.653888888, lng: -90.064444444 }, // Cahokia
  { lat: 31.28, lng: -4.28 }, // Sigilmasa
  { lat: 10.310277777, lng: -3.563055555 }, // Ruïnes de Loropéni
  { lat: 32.77888889, lng: 35.65944444 }, // Hippos
  { lat: 30.32206, lng: 35.45145 }, // Al Khazneh
  { lat: 40.59083333, lng: 23.79416667 }, // Estagira
  { lat: 41.012072, lng: 24.284576 }, // Filipos
  { lat: 29.981666666, lng: 52.909444444 }, // Istakhr
  { lat: 26.174913, lng: 31.9078587 }, // Umm al-Qa'ab
  { lat: 18.6375, lng: -88.75902778 }, // Dzibanche
  { lat: 51.868888888, lng: 8.9175 }, // Externsteine
  { lat: 25.88305556, lng: 67.93222222 }, // Ranikot Fort
  { lat: 41.449444444, lng: 23.263694444 }, // Heraclea Síntica
  { lat: 44.82, lng: 20.46 }, // Singidúnum
  { lat: 25.7, lng: 32.639166666 }, // temple de Luxor
  { lat: 36.46527778, lng: 34.15416667 }, // Còricos
  { lat: 37.970843, lng: 23.724524 }, // Odèon d'Herodes Àtic
  { lat: 32.283333333, lng: 48.516666666 }, // Gundixapur
  { lat: 25.7375, lng: 32.6075 }, // Deir el-Bahari
  { lat: 15.263611111, lng: 39.660555555 }, // Adulis
  { lat: 42.852777777, lng: 89.529166666 }, // Gaochang
  { lat: 41.433395, lng: 23.250111 }, // Heraclea Síntica
  { lat: 39.944336111, lng: 32.858266666 }, // Monument d'Ancira
  { lat: 35.065833333, lng: -107.623611111 }, // Acomita Lake
  { lat: 33.048278, lng: 35.102652 }, // Aczib
  { lat: 43.677638888, lng: 4.630694444 }, // Monuments romans i romànics d'Arle
  { lat: 41.891944444, lng: 12.488333333 }, // Basílica de Maxenci
  { lat: 33.75, lng: 44.75 }, // Eixnunna
  { lat: 42.023611111, lng: 21.418611111 }, // aqüeducte de Skopje
  { lat: 40.422631, lng: 15.005569 }, // Pèstum
  { lat: 41.891997, lng: 12.487397 }, // Temple de Ròmul
  { lat: 26.564166666, lng: 31.746111111 }, // Akhmim
  { lat: 31.772358, lng: 35.235673 }, // Túnel d'Ezequies
  { lat: 18.373333333, lng: -89.358888888 }, // Río Bec
  { lat: 36.2748, lng: 114.4002 }, // Ye
  { lat: 29.896111111, lng: 31.203611111 }, // Abusir al-Melek
  { lat: 37.67194444, lng: 26.88555556 }, // Herèon de Samos
  { lat: 41.9022, lng: 12.4533 }, // Tomba de Sant Pere
  { lat: 31.56526, lng: 46.18964 }, // Girsu
  { lat: 20.248425, lng: -89.647297222 }, // Kabah
  { lat: 64.13527778, lng: -140.51861111 }, // Coves de Bluefish
  { lat: 42.618056, lng: 25.305556 }, // Seutòpolis
  { lat: 31.95, lng: 45.966667 }, // Adab
  { lat: 32.717778, lng: 44.779444 }, // Jemdet Nasr
  { lat: 31.8475, lng: 35.186388888 }, // Gabaon
  { lat: 43.539444444, lng: 16.483055555 }, // Salona
  { lat: 36.872287, lng: 14.447788 }, // Camarina
  { lat: 38.227122, lng: 58.150076 }, // Nasa
  { lat: 27.904169444, lng: 30.873061111 }, // Speos Artemidos
  { lat: 35.16286, lng: 25.44506 }, // Cova de Dicte
  { lat: 35.488888888, lng: 6.255833333 }, // Lambaesis
  { lat: 41.3616, lng: 21.538475 }, // Markovi Kuli
  { lat: 27.33388889, lng: 79.27111111 }, // Sankissa
  { lat: 38.31944444, lng: 23.31666667 }, // Cadmea
  { lat: 36.553889, lng: 29.420789 }, // Tlos
  { lat: 41.894, lng: 12.4843 }, // Porta Fontinalis
  { lat: 37.822685, lng: 82.771896 }, // Niya
  { lat: 46.998333333, lng: -85.11 }, // SS Edmund Fitzgerald
  { lat: 41.895556, lng: 12.484572 }, // basílica Úlpia
  { lat: 37.69194444, lng: 22.77472222 }, // Herèon d'Argos
  { lat: 53.69284, lng: -6.44932 }, // Brú na Bóinne
  { lat: 52.788378, lng: 17.744691 }, // Biskupin
  { lat: 42.95051742, lng: 89.06393051 }, // Jiaohe
  { lat: -7.3743, lng: 111.3578 }, // Trinil
  { lat: 31.56552, lng: 34.84894 }, // Tel Laquix
  { lat: 41.115, lng: 20.791 }, // Samuil's Fortress
  { lat: 33.01696, lng: 9.09946 }, // parc Nacional de Jbil
  { lat: 48.210833333, lng: 16.370277777 }, // Vindobona
  { lat: 40.195277777, lng: 26.405 }, // Abidos de Mísia
  { lat: 53.044444444, lng: 57.063888888 }, // Cova de Kapova
  { lat: 48.210833, lng: 16.370278 }, // Vindobona
  { lat: 40.196017, lng: 26.406964 }, // Abidos de Mísia
  { lat: 37.951147222, lng: 58.212408333 }, // Nasa
  { lat: 29.193119444, lng: 30.642130555 }, // Medinet Madi
  { lat: 13.445277777, lng: 103.877777777 }, // Chau Say Tevoda
  { lat: 17.090194, lng: -89.142212 }, // Xunantunich
  { lat: 36.883651, lng: 7.755129 }, // Hipona
  { lat: 31.854980555, lng: -8.872505555 }, // Djebel Irhoud
  { lat: 30.032222222, lng: 31.074722222 }, // Abu Rawash
  { lat: 36, lng: 46 }, // Mutsatsir
  { lat: 54.345277777, lng: -6.718611111 }, // Emain Macha
  { lat: 31.778888888, lng: 34.851111111 }, // Ecron
  { lat: 25.733333333, lng: 32.6 }, // KV55
  { lat: 22.93863333, lng: 77.61438056 }, // abrics rupestres de Bhimbetka
  { lat: 15.269444444, lng: -89.040277777 }, // Quiriguá
  { lat: 22.248327, lng: 107.042276 }, // Art rupestre de Zuojiang Huashan
  { lat: 42, lng: 21.434444444 }, // Fortalesa de Skopje
  { lat: 36.124, lng: 35.922 }, // Selèucia de Piera
  { lat: 25.71875, lng: 32.65760803 }, // Gran Temple d'Amon
  { lat: 36.3965579, lng: 30.4735419 }, // Olimp
  { lat: 41.895611, lng: 12.486194 }, // Mercats de Trajà
  { lat: 41.013056, lng: 24.286389 }, // Filipos
  { lat: 38.670353, lng: 26.753208 }, // Focea
  { lat: 41.90222222, lng: 12.45333333 }, // Grutes vaticanes
  { lat: 25.715280555, lng: 32.591111111 }, // palau de Malkatta
  { lat: -6.16194444, lng: -78.02136111 }, // Sarcophagi of Karajía
  { lat: 22.73113, lng: 32.26261 }, // Amada
  { lat: 35.588055555, lng: 42.718333333 }, // Hatra
  { lat: 59.8693725, lng: -1.2910305 }, // Jarlshof
  { lat: 29.790277777, lng: 31.209166666 }, // piràmide encorbada
  { lat: 17.65, lng: 33.983333 }, // Aloa
  { lat: 17.76463547, lng: -88.347498094 }, // Altún Ha
  { lat: 41.89157222, lng: 12.48588889 }, // Font de Juturna
  { lat: 39.197142, lng: 29.617577 }, // Azanos
  { lat: 45.278059, lng: 36.974881 }, // Fanagòria
  { lat: 13.4447, lng: 103.882 }, // Ta Keo
  { lat: 37.9262, lng: 23.9937 }, // Brauró
  { lat: 25.90972222, lng: 67.92361111 }, // Amri
  { lat: 34.762361111, lng: 48.437194444 }, // Ganj Nameh
  { lat: 41.9001, lng: 21.6134 }, // Taurèsium
  { lat: -27.132, lng: -55.702 }, // Santísima Trinidad del Paraná
  { lat: 36.1225, lng: 114.318611111 }, // Yin Xu
  { lat: 39.69654167, lng: 39.646625 }, // Altıntepe
  { lat: 37.29555556, lng: 36.25361111 }, // Karatepe
  { lat: 45.189, lng: 36.825 }, // Fanagòria
  { lat: -13.480833, lng: -71.964722 }, // Tampumachay
  { lat: 51.6667, lng: 6.45 }, // Colonia Ulpia Traiana
  { lat: 41.2, lng: 28.333333333 }, // muralla anastasiana
  { lat: 35.015833333, lng: 33.423055555 }, // Idàlion
  { lat: 39.2043, lng: 29.6105 }, // Azanos
  { lat: 26.175717, lng: 31.937782 }, // Temple d'Ahmose I
  { lat: 38.240833333, lng: 34.306111111 }, // Vall d'Ihlara
  { lat: 25.44, lng: 32.36 }, // KV2
  { lat: 44.873, lng: 13.85 }, // amfiteatre de Pula
  { lat: 40.004444444, lng: 44.578333333 }, // Dvin
  { lat: 36.354349, lng: 36.36153 }, // Amuq
  { lat: 9.27988, lng: 117.981 }, // Tabon Caves
  { lat: 37.9715, lng: 23.7249 }, // temple de Nice Àptera
  { lat: 30.1295, lng: 31.2889 }, // El Mataria
  { lat: 51.1925, lng: -1.7875 }, // Murs de Durrington
  { lat: 35.257679, lng: 25.738816 }, // Olunt
  { lat: 41.55173889, lng: 21.97497222 }, // Estobos
  { lat: 36.33416667, lng: 36.84416667 }, // Antigues ciutats del nord de Síria
  { lat: 37.96596389, lng: 67.15651111 }, // crani de Teshik-Tash
  { lat: 16.018888888, lng: 75.881944444 }, // Aihole
  { lat: 43.32944444, lng: -8.41527778 }, // Castro d'Elviña
  { lat: 17.18, lng: -89.36 }, // Nakum
  { lat: 36.21666667, lng: 43.41666667 }, // Balawat
  { lat: 22.731111, lng: 32.2625 }, // Amada
  { lat: 40.331504, lng: 26.599366 }, // Egospòtamos
  { lat: 43.225, lng: 27.585 }, // Marcianòpolis
  { lat: 36.362742, lng: 29.327378 }, // Xanthos
  { lat: 68.938777777, lng: 27.292305555 }, // Ukonsaari
  { lat: 59.943768, lng: 30.406766 }, // Nyenschantz
  { lat: 41.896963, lng: 12.510719 }, // Aqua Julia
  { lat: 35.019966, lng: 33.412994 }, // Idàlion
  { lat: 35.05916667, lng: 24.79277778 }, // Agia Triada
  { lat: 34.796725, lng: 33.343719444 }, // Khirokitia
  { lat: 36.35136, lng: 25.40356 }, // Akrotiri (Santorí)
  { lat: 16.91666667, lng: -96.4 }, // Mitla
  { lat: 31.777363888, lng: 45.509761111 }, // Xuruppak
  { lat: 40.364072222, lng: 26.630833333 }, // Egospòtamos
  { lat: 29.777778, lng: 51.570833 }, // Bishapur
  { lat: 39.948888888, lng: -75.15 }, // Independence Hall de Filadèlfia
  { lat: 33.614398, lng: 113.661403 }, // Jiahu
  { lat: 38.418611111, lng: 27.142836111 }, // Antiga Esmirna
  { lat: 41.892638888, lng: 12.484611111 }, // Rostra
  { lat: -6.51583, lng: -79.8442 }, // Túcume
  { lat: 41.899722222, lng: 12.479444444 }, // temple d'Hadrià
  { lat: 18.223055555, lng: 30.743888888 }, // Old Dongola
  { lat: -18.759167, lng: 47.562778 }, // Turó reial d'Ambohimanga
  { lat: 31.69972, lng: 34.84694 }, // Gat (Israel)
  { lat: 31.382777777, lng: 46.004444444 }, // Badtibira
  { lat: -27.073888888, lng: -109.322777777 }, // Anakena
  { lat: 37.429722222, lng: 21.900277777 }, // Basses
  { lat: 41.531391, lng: 21.977716 }, // Estobos
  { lat: -6.41791667, lng: -77.92333333 }, // Kuélap
  { lat: 30.964722222, lng: 30.768333333 }, // Sais
  { lat: 41.966664, lng: 44.207505 }, // Uplistsikhe
  { lat: 17.043888888, lng: -96.767777777 }, // Monte Albán
  { lat: 24.752229, lng: 67.521983 }, // Daybul
  { lat: 23.96101, lng: 32.86669 }, // Kalabsha
  { lat: 31.988, lng: 35.976 }, // ʿAin Ghazal
  { lat: 52.6643, lng: -2.64753 }, // Viroconium
  { lat: -12.258056, lng: -76.9 }, // Pachacamac
  { lat: -20.15, lng: 34.716666666 }, // Sofala
  { lat: 50.48253056, lng: 1.72129167 }, // Quentovic
  { lat: 59.894444444, lng: 17.638888888 }, // Gamla Uppsala
  { lat: 37.952222222, lng: 27.365833333 }, // İsa Bey Mosque
  { lat: 38.6675, lng: 26.758055555 }, // Focea
  { lat: 34.747, lng: 40.73 }, // Dura Europos
  { lat: 42.8, lng: 75.2667 }, // Suyab
  { lat: 36.39685, lng: 30.474637 }, // Olimp
  { lat: 43.671388888, lng: 4.636944444 }, // Aliscamps
  { lat: 41.8875, lng: 12.515 }, // Amfiteatre Castrense
  { lat: 32.209447222, lng: 35.285430555 }, // Pou de Jacob
  { lat: 38.423889, lng: 27.142778 }, // Antiga Esmirna
  { lat: 41.6531, lng: 12.4726 }, // Lavinium
  { lat: 15.76324, lng: 108.124446 }, // Mỹ Sơn
  { lat: 29.47, lng: 74.13 }, // Kalibangan
  { lat: 39.516666666, lng: 67.566666666 }, // Sarazm
  { lat: 29.5749, lng: 31.2253 }, // piràmide d'Amenemhet I
  { lat: 35.256511111, lng: 25.731758333 }, // Olunt
  { lat: 35.025, lng: 33.24166667 }, // Tamassos
  { lat: 39.546389, lng: 20.787778 }, // Dodona
  { lat: 16.41194444, lng: -90.18833333 }, // Aguateca
  { lat: 42.358021111, lng: 116.185158888 }, // Xanadú
  { lat: 35.484237, lng: 6.468666 }, // Timgad
  { lat: 43.22504, lng: 27.585033 }, // Marcianòpolis
  { lat: 40.806666666, lng: 14.345555555 }, // Vil·la dels Papirs
  { lat: 36.357132, lng: 29.319255 }, // Xanthos
  { lat: 36.341388888, lng: 36.316111111 }, // Amuq
  { lat: 33.585555555, lng: 35.398055555 }, // temple d'Eshmun
  { lat: 35.16200602, lng: 33.88318429 }, // Éngomi
  { lat: 36.120771, lng: -5.342395 }, // Cova de Gorham
  { lat: 36.838333333, lng: 36.164444444 }, // Issos
  { lat: 37.973686, lng: 23.7246 }, // Eleusínion
  { lat: 33.249, lng: 35.652 }, // Tel Dan
  { lat: 34.832041666, lng: 67.826802777 }, // Budes de Bamian
  { lat: 39.53574, lng: 3.33062 }, // coves del Drac
  { lat: 41.909303447, lng: 12.50130183 }, // Porta Pia
  { lat: 39.5870597, lng: 64.0116725 }, // Paikend
  { lat: 45.54638889, lng: 12.39888889 }, // Altinum
  { lat: 36.32056, lng: 5.73667 }, // Djémila
  { lat: 36.891388888, lng: 25.648611111 }, // Keros
  { lat: -13.231162, lng: -72.424788 }, // Patallaqta
  { lat: 40.15931, lng: 44.29514 }, // Zvartnots
  { lat: 31.93351249, lng: 45.28520718 }, // Isin
  { lat: -3.309166666, lng: 40.016666666 }, // Ruins of Gedi
  { lat: 37.664119444, lng: 32.210711111 }, // Listra
  { lat: 36.74416667, lng: 36.95916667 }, // Cirros
  { lat: 38.85, lng: 35.633333333 }, // Kültepe
  { lat: 53.5775, lng: -6.611944444 }, // pujol de Tara
  { lat: 25.718333333, lng: 32.658333333 }, // Temple de Karnak
  { lat: 17.278341, lng: -90.380587 }, // El Perú (lloc arqueològic)
  { lat: 48.113333333, lng: 16.861388888 }, // Carnunt
  { lat: 18.5368, lng: 31.8276 }, // Gebel Barkal
  { lat: 41.896906, lng: 12.476997 }, // Termes d'Agripa
  { lat: 51.189630555, lng: -1.786738888 }, // Woodhenge
  { lat: 41.8885, lng: 12.4869 }, // Domus Flàvia
  { lat: 30.4175, lng: 57.706666666 }, // Shahdad
  { lat: 18.46666667, lng: -95.43333333 }, // Tres Zapotes
  { lat: 41.88656, lng: 12.469321 }, // Aqua Alsietina
  { lat: 36.946388888, lng: 11.099166666 }, // Kerkouane
  { lat: 39.650103, lng: 31.97857 }, // Gòrdion
  { lat: 52.089722222, lng: 1.338888888 }, // Sutton Hoo
  { lat: 35.813888888, lng: 4.793333333 }, // Qàlat Bani Hammad
  { lat: 58.9966, lng: -3.1882 }, // Maeshowe
  { lat: 40.025, lng: 34.63278 }, // Yazılıkaya
  { lat: 40.548232, lng: 26.75081 }, // Lisimaquea
  { lat: 39.6504791, lng: 31.9784831 }, // Gòrdion
  { lat: 16.281111, lng: -88.965 }, // Lubaantún
  { lat: -28.549078, lng: -54.555889 }, // São Miguel das Missões
  { lat: 35.78888889, lng: 129.22666667 }, // Àrees històriques de Gyeongju
  { lat: 37.663542, lng: 32.211378 }, // Listra
  { lat: 40.58, lng: 26.88 }, // Lisimaquea
  { lat: 31.244722222, lng: 34.840833333 }, // Tel Be'er Sheva
  { lat: 28.524655555, lng: 77.185069444 }, // Pilar de ferro de Delhi
  { lat: 32.90995, lng: 35.63053611 }, // Betsaida
  { lat: 17.75505, lng: -89.920430555 }, // El Mirador
  { lat: 31.751402777, lng: 35.235197222 }, // tomba de Talpiot
  { lat: 36.734662, lng: 36.948956 }, // Cirros
  { lat: 38.35816667, lng: 26.76758333 }, // Clazòmenes
  { lat: 31.24482, lng: 34.84013 }, // Tel Be'er Sheva
  { lat: 46.192777777, lng: 9.022222222 }, // Three Castles of Bellinzona
  { lat: 38.373889, lng: 26.785278 }, // Clazòmenes
  { lat: 47.18056, lng: 23.22361 }, // Porolissum
  { lat: 41.89259, lng: 12.48614 }, // Basílica Emília
  { lat: 36.958843, lng: 35.625744 }, // Mopsuèstia
  { lat: 38.08347222, lng: 23.18827778 }, // Peges
  { lat: 36.51698, lng: 22.98865 }, // Pavlopetri
  { lat: 39.00933, lng: 20.73353 }, // Nicòpolis de l'Epir
  { lat: 43.21305556, lng: 27.86444444 }, // necròpolis de Varna
  { lat: 42.299996133, lng: 12.357367066 }, // Falerii
  { lat: 37.422413, lng: 23.131286 }, // cova Frankhthi
  { lat: 45.21907, lng: 36.71406 }, // Tmutarakan
  { lat: 25.901666666, lng: 32.724166666 }, // Naqada
  { lat: 41.088085, lng: -5.703584 }, // Via de la plata
  { lat: 37.893752, lng: 34.560186 }, // Tíana
  { lat: 36.95778, lng: 35.619478 }, // Mopsuèstia
  { lat: 41.846, lng: 12.561 }, // Anio Novus
  { lat: 13.333333, lng: 103.966667 }, // Hariharalaya
  { lat: 39.75194444, lng: 26.15861111 }, // Alexandria de la Tròada
  { lat: 19.0575, lng: -98.301944 }, // Gran Piràmide de Cholula
  { lat: 43.31027778, lng: 21.94888889 }, // Mediana
  { lat: 37.866342, lng: 12.469267 }, // Mòtia
  { lat: 28.8, lng: 30.91666667 }, // Teudjoi
  { lat: 46.949722222, lng: 35.469444444 }, // Kamianà Mohyla
  { lat: 21.91666667, lng: 31.28333333 }, // Buhen
  { lat: 35.0375, lng: -107.623888888 }, // Skyline-Ganipa
  { lat: 37.852692, lng: 27.527104 }, // Magnèsia del Meandre
  { lat: 42.211388888, lng: 20.735833333 }, // església de la Mare de Déu de Ljeviš
  { lat: 52.524333333, lng: -0.436222222 }, // castell de Fotheringhay
  { lat: 34.569176111, lng: 108.214733055 }, // Mausoleu Qianling
  { lat: 40.079727, lng: 26.37442 }, // Dàrdan
  { lat: 40.703055555, lng: 14.498888888 }, // Estàbia
  { lat: -4.72444, lng: 35.83389 }, // Kondoa
  { lat: 17.764318837, lng: -88.652457731 }, // Lamanai
  { lat: 17.43933, lng: -99.15958 }, // Grutes de Juxtlahuaca, Parc Natural
  { lat: 17.393561111, lng: -89.634533333 }, // Uaxactún
  { lat: 13.612777777, lng: 104.1125 }, // Phnom Kulen
  { lat: 35.918551, lng: 14.368563 }, // Ta 'Ħaġrat
  { lat: 25.719496, lng: 32.6012 }, // Medinet Habu
  { lat: 36.2475, lng: 36.376388888 }, // Tell Tayinat
  { lat: 39.73138889, lng: 45.20361111 }, // Areni-1
  { lat: 30.79937, lng: 31.834217 }, // Pi-Ramsès
  { lat: 35.555797222, lng: 44.930291666 }, // Jarmo
  { lat: 37.831664, lng: 22.641069 }, // Fliünt
  { lat: 30.993719, lng: 104.199826 }, // Sanxingdui
  { lat: 25.75, lng: 32.6143 }, // KV17
  { lat: 32.558055555, lng: 34.936388888 }, // Cova de Kebara
  { lat: 41.57305556, lng: 41.57361111 }, // Fortalesa de Gonio
  { lat: 13.461959, lng: 103.871591 }, // Preah Khan
  { lat: 32.6425, lng: -91.408333333 }, // Poverty Point
  { lat: 59.03083333, lng: 10.1075 }, // Kaupang
  { lat: 43.3825, lng: -4.11611111 }, // Cova d'Altamira i art rupestre paleolític del nord d'Espanya
  { lat: 41.207, lng: 35.42 }, // Nerik
  { lat: 32.85388889, lng: 36.62944444 }, // Shahba
  { lat: 38.084923, lng: 23.197116 }, // Peges
  { lat: 30.011666666, lng: 52.407777777 }, // Anxan
  { lat: 32.276111, lng: 35.195 }, // Samària
  { lat: 45.016731, lng: 21.833347 }, // Peștera cu Oase
  { lat: 36.1690795, lng: 36.5808694 }, // Qalb Loze
  { lat: 40.369697, lng: 23.159151 }, // Petralona cave
  { lat: 31.66583, lng: 35.24139 }, // Heròdium
  { lat: 45.35083333, lng: 36.46861111 }, // Panticapea
  { lat: 17.155555555, lng: -89.061111111 }, // Cahal Pech
  { lat: 32.595555555, lng: 35.521388888 }, // fortalesa de Belvoir
  { lat: 29.462838888, lng: 34.86005 }, // Pharaoh's Island
  { lat: 20.063472222, lng: -99.341138888 }, // Tula
  { lat: 41.03333333, lng: -7.11666667 }, // Llocs d'art rupestre prehistòric de la vall del Côa
  { lat: 34.5505, lng: 38.2687 }, // Teatre romà de Palmira
  { lat: 35.8667, lng: 38.4 }, // Tell Abu Hureyra
  { lat: 40.075833333, lng: 26.362777777 }, // Dàrdan
  { lat: -7.55, lng: 112.366667 }, // Trowulan
  { lat: 32.595556, lng: 35.521389 }, // fortalesa de Belvoir
  { lat: 13.28573, lng: 103.81218 }, // Phnom Krom
  { lat: 39.0253, lng: -83.4305 }, // Serpent Mound
  { lat: 25.72, lng: 32.600833 }, // Medinet Habu
  { lat: 41.8877, lng: 12.4866 }, // Domus Augustana
  { lat: 40.233895, lng: 34.695575 }, // Alaca Höyük
  { lat: 37.5843, lng: 30.0845 }, // Hacilar
  { lat: 20.17775833, lng: -89.65217778 }, // Sayil
  { lat: 32.6367, lng: -91.4114 }, // Poverty Point
  { lat: 37.97147, lng: 23.72538 }, // santuari d'Àrtemis Braurònia
  { lat: 34.38166667, lng: 109.25388889 }, // mausoleu de Qin Shi Huang
  { lat: 39.76128, lng: 26.152555 }, // Alexandria de la Tròada
  { lat: 19.600802, lng: 30.409731 }, // Kerma kingdom
  { lat: 37.868333333, lng: 12.468611111 }, // Mòtia
  { lat: 36.128611111, lng: 29.685833333 }, // derelicte d'Uluburun
  { lat: -9.039422777, lng: 39.551702222 }, // Songo Mnara
  { lat: 45.338611, lng: 36.468056 }, // Panticapea
  { lat: 20.89108611, lng: -88.13626389 }, // Ek' Balam
  { lat: 34.387529, lng: 47.132096 }, // Taq-e Bostan
  { lat: 32.276389, lng: 35.195 }, // Samària
  { lat: 19.00083333, lng: -88.2325 }, // Chacchoben
  { lat: 30.648333333, lng: 34.422222222 }, // Cadeix-Barnea
  { lat: 16.445833333, lng: -90.295833333 }, // Dos Pilas
  { lat: 31.097, lng: 34.652 }, // Haluza
  { lat: 43.128342, lng: 20.415669 }, // Stari Ras
  { lat: 44.593055555, lng: 33.801388888 }, // Mangub
  { lat: -41.504722222, lng: -73.204444444 }, // Monte Verde
  { lat: 39.957222222, lng: 26.238888888 }, // Hisarlik Hill
  { lat: 41.8916, lng: 12.4844 }, // Temple d'August (Roma)
  { lat: 18.10527778, lng: -94.03166667 }, // La Venta
  { lat: 32.557719444, lng: 34.936672222 }, // Cova de Kebara
  { lat: 37.84547222, lng: 22.64633333 }, // Fliünt
  { lat: 41.898212, lng: 12.509286 }, // aqüeducte d'Anio Vetus
  { lat: 44.561111111, lng: 22.024166666 }, // Lepenski Vir
  { lat: 37.853091, lng: 27.533091 }, // Magnèsia del Meandre
  { lat: 35.99861111, lng: 36.99805556 }, // Kinnasrin
  { lat: -20.143291666, lng: 28.423436111 }, // Khami
  { lat: 26, lng: 32.816666666 }, // Coptos
  { lat: 30.956280555, lng: 31.5172 }, // Per-Banebdjedet
  { lat: 42.955427, lng: 89.539726 }, // Coves de Bezeklik
  { lat: 18.06666667, lng: -88.6 }, // Cuello
  { lat: 14.92340556, lng: -92.17982222 }, // Izapa
  { lat: 24.446944, lng: 80.845 }, // Bharhut
  { lat: 36.8006, lng: 44.2433 }, // Shanidar
  { lat: 41.754166666, lng: 12.2875 }, // Òstia
  { lat: 37.823445, lng: 34.570473 }, // Tíana
  { lat: 37.9525, lng: 27.36777778 }, // Basilica of St. John
  { lat: 15.22067184, lng: 102.49385834 }, // Phimai historical park
  { lat: 39.008011, lng: 20.736054 }, // Nicòpolis de l'Epir
  { lat: 53.961667, lng: -1.080556 }, // Eboracum
  { lat: 32.05570278, lng: 35.28953611 }, // Siló
  { lat: 29.838888888, lng: 31.215277777 }, // mastaba del faraó
  { lat: 37.966577224, lng: 23.732714673 }, // Cinosarges
  { lat: 52.5242, lng: -0.43572 }, // castell de Fotheringhay
  { lat: 41.296388888, lng: 16.151666666 }, // Cannes
  { lat: 35.689444, lng: 39.8225 }, // Halabiye
  { lat: 41.57433333, lng: 41.57231667 }, // Fortalesa de Gonio
  { lat: 39.025858, lng: -83.430444 }, // Serpent Mound
  { lat: 37.694535, lng: 26.930548 }, // Túnel d'Eupalí
  { lat: 41.892777777, lng: 12.483611111 }, // Tabulàrium de Roma
  { lat: 20.629444444, lng: -89.460555555 }, // Mayapan
  { lat: 46.074444444, lng: 18.227777777 }, // Necròpoli paleocristiana de Pécs
  { lat: 34.00666667, lng: -6.82027778 }, // Xal·la
  { lat: 42.6447, lng: 11.9858 }, // Volsinii
  { lat: 42.079059725, lng: 13.411468116 }, // Alba Fucens
  { lat: 41.854779007, lng: 12.520688609 }, // Circ Màxenci
  { lat: 29.036733, lng: 33.459407 }, // Serabit al-Khadim
  { lat: 45.82, lng: 14.245833333 }, // Cross Cave
  { lat: 40.36069444, lng: -4.44161111 }, // Toros de Guisando
  { lat: 14.645833333, lng: -91.736111111 }, // Takalik Abaj
  { lat: 13.78333333, lng: 104.53333333 }, // Koh Ker
  { lat: 36.993055555, lng: 28.206111111 }, // Sedir Island
  { lat: 42.001666666, lng: 12.108333333 }, // Caere
  { lat: 37.394042, lng: 13.280904 }, // Heraclea Minoa
  { lat: 26.566666666, lng: 50.066666666 }, // Tarout Island
  { lat: 29.450555555, lng: 31.084166666 }, // Filadèlfia
  { lat: 34.7125, lng: 33.1419 }, // Amatunt
  { lat: 16.511666666, lng: -90.061111111 }, // Ceibal
  { lat: 36.459361, lng: 36.852083 }, // Ain Dara
  { lat: 12.867283, lng: 105.040025 }, // Sambor Prei Kuk
  { lat: 31.8819, lng: 35.4598 }, // Khírbat al-Màfjar
  { lat: 20.36082, lng: -89.76964 }, // Piràmide de l'endeví
  { lat: 35.179352, lng: 25.656128 }, // Lató
  { lat: 35.96168, lng: 54.037505 }, // Hecatòmpilos
  { lat: -26.01604, lng: 27.73456 }, // Sterkfontein
  { lat: 38.21942, lng: 24.02684 }, // Ramnunt
  { lat: 31.592963, lng: 34.898241 }, // Mareshah
  { lat: -8.59638889, lng: 31.24027778 }, // Kalambo
  { lat: 35.9995, lng: 136.296 }, // Ichijōdani Asakura Family Historic Ruins
  { lat: 9.15, lng: 77.72 }, // Kalugumalai
  { lat: 34.712354, lng: 33.130332 }, // Amatunt
  { lat: -2.539722222, lng: -78.875 }, // Ingapirca
  { lat: 42.59185096, lng: 21.18603553 }, // Ulpiana
  { lat: 36.154544, lng: 54.384964 }, // Tepe Hisar
  { lat: 48.88333, lng: 16.65 }, // Dolní Věstonice (jaciment arqueològic)
  { lat: 34.792222222, lng: 74.19 }, // Sharada Peeth
  { lat: 36.729762, lng: 66.885233 }, // Mesquita de Hàji-Piyadah
  { lat: 32.51773, lng: 36.48157 }, // Teatre romà de Bosrà
  { lat: 32.189111111, lng: 46.281722222 }, // Wasit
  { lat: 35.293455, lng: 25.492197 }, // palau de Màlia
  { lat: 25.4833, lng: 32.4833 }, // Gebelein
  { lat: 24.96111111, lng: 89.34277778 }, // Mahasthangarh
  { lat: 58.993888888, lng: -3.208055555 }, // Roques de Stenness
  { lat: 25.986594444, lng: 85.125591666 }, // Vaisali
  { lat: 24.1025, lng: 32.88888889 }, // Qubbet al-Hawa
  { lat: 59.3493, lng: -2.91085 }, // Knap of Howar
  { lat: 31.4225, lng: -7.801111111 }, // Aghmat
  { lat: 38.43333333, lng: 23.5925 }, // Àulida
  { lat: 16.95836111, lng: -96.45013889 }, // Yagul
  { lat: 18.317, lng: 44.545 }, // Bir Hima
  { lat: 32.90277778, lng: 35.74055556 }, // Gamala
  { lat: 41.893333333, lng: 12.484722222 }, // Escales Gemònies
  { lat: 31.520533, lng: 34.432547 }, // Gaza synagogue
  { lat: 44.156666666, lng: 66.963888888 }, // Sighnak
  { lat: 10.232944, lng: 105.162994 }, // Óc Eo
  { lat: 41.892622, lng: 12.487611 }, // Temple de la Pau
  { lat: 22.25, lng: 31.216666666 }, // Nabta Playa
  { lat: 33.246111, lng: 35.693333 }, // Banias
  { lat: 54.977391, lng: 49.054257 }, // Bolghar
  { lat: 16.269444, lng: 33.275 }, // Temple de Naga
  { lat: 50.1585597, lng: -5.6044974 }, // Men-an Tol, a Cornualla
  { lat: 37.975556, lng: 23.726111 }, // Biblioteca d'Hadrià
  { lat: 47.431111, lng: 102.659444 }, // Ordu-Baliq
  { lat: 25.75, lng: 32.6143 }, // KV58
  { lat: 8.7025, lng: 38.608333333 }, // Melka Kunture
  { lat: -8.01611111, lng: 112.20916667 }, // Penataran
  { lat: 34.233333333, lng: 108.75 }, // Haojing
  { lat: 41.894194444, lng: 12.484805555 }, // Temple de Venus Genetrix
  { lat: 35.293888888, lng: 25.490833333 }, // palau de Màlia
  { lat: -13.51055556, lng: -71.97166667 }, // Q'inqu
  { lat: 21.4919, lng: 39.19 }, // Tomb of Eve
  { lat: 60.8282, lng: -45.7815 }, // Hvalsey
  { lat: 58.69995, lng: 11.33641 }, // Gravats Rupestres de Tanum
  { lat: 37.20388889, lng: 15.18194444 }, // Mègara Hiblea
  { lat: 25.964403, lng: 33.504066 }, // Wadi Hammamat
  { lat: -25.929167, lng: 27.788889 }, // Swartkrans
  { lat: 35.179924, lng: 25.656483 }, // Lató
  { lat: 24.06, lng: 32.871111111 }, // Sehel
  { lat: 41.928611111, lng: 60.820833333 }, // Toprak-kala
  { lat: 31.859166666, lng: 34.919166666 }, // Guèzer
  { lat: 40.99047533, lng: 20.51868439 }, // Tombes de Selca e Poshtme
  { lat: 42.74759, lng: 75.248425 }, // Balasagun
  { lat: 24.88288116, lng: 88.12802887 }, // Gaur
  { lat: 31.859872, lng: 34.919644 }, // Guèzer
  { lat: 37.72473, lng: 22.315266 }, // Orcomen
  { lat: 20.1725, lng: -89.579 }, // Labná
  { lat: 41.116477777, lng: 1.255230555 }, // Tàrraco
  { lat: -34.207863, lng: 22.089515 }, // Pinnacle Point
  { lat: 35.961666666, lng: 54.0375 }, // Hecatòmpilos
  { lat: 37.9786, lng: 23.719 }, // Dipilo
  { lat: 31.593055555, lng: 34.898333333 }, // Mareshah
  { lat: 50.8, lng: 75.6 }, // Bayanaul National Park
  { lat: 33.375, lng: 43.716666666 }, // Al-Anbar
  { lat: 41.7325, lng: -49.946944444 }, // derelicte de l'RMS Titanic
  { lat: 37.391111111, lng: 59.566666666 }, // Abiward
  { lat: 41.9297, lng: 12.5087 }, // catacumbes de Priscil·la
  { lat: 37.970556, lng: 23.726111 }, // Estoa d'Èumenes
  { lat: 59.36, lng: 17.52 }, // Hovgården
  { lat: 34.255475, lng: 71.950688888 }, // Seri Bahlol
  { lat: 11.90266924, lng: 79.81993436 }, // Arikamedu
  { lat: 32.901268, lng: 35.737351 }, // Gamala
  { lat: 19.7833, lng: 45.15 }, // Qaryat al-Faw
  { lat: 31.026111, lng: 35.063889 }, // Mamshit
  { lat: 58.14942, lng: 68.52048 }, // Isker
  { lat: 31.7766543, lng: 35.2431377 }, // Tomb of the Prophets Haggai, Zechariah and Malachi
  { lat: 32.557852777, lng: 35.327952777 }, // Jezrael
  { lat: 37.69, lng: 26.942555555 }, // Pitagorèon
  { lat: 39.5507, lng: 46.0286 }, // Zorats Karer
  { lat: 38.213333333, lng: 62.0375 }, // Gonur Tepe
  { lat: 24.103, lng: 32.8903 }, // Qubbet al-Hawa
  { lat: 56.17583333, lng: 40.50916667 }, // Sungir
  { lat: -7.74393, lng: 110.49284 }, // Sewu
  { lat: 37.393952777, lng: 13.280747222 }, // Heraclea Minoa
  { lat: 31.87171944, lng: 35.44456389 }, // Tel es-Sultan
  { lat: 34.350136, lng: 106.005973 }, // Coves de Maijishan
  { lat: 70.6086, lng: -52.1819 }, // Qilakitsoq
  { lat: 32.908611111, lng: 35.801111111 }, // Rujm el-Hiri
  { lat: -13.4833615, lng: -71.9618069 }, // Puca Pucara
  { lat: 29.609166666, lng: 118.99 }, // llac Qiandao
  { lat: -13.32925278, lng: -72.19644167 }, // Moray
  { lat: 36.553448, lng: 29.069352 }, // Gemiler Island
  { lat: 37.725676, lng: 22.314403 }, // Orcomen
  { lat: -6.99385, lng: 107.056083333 }, // Gunung Padang Megalithic Site
  { lat: 24.0257642, lng: 32.8841999 }, // Temple of Isis in Philae
  { lat: -8.534166666, lng: 120.460277777 }, // Liang Bua
  { lat: 37.96722222, lng: 23.72138889 }, // Monument de Filopap
  { lat: 39.965778, lng: 8.448278 }, // Gegants de Mont'e Prama
  { lat: 60.9871, lng: -45.4229 }, // Garðar
  { lat: 35.596243, lng: 10.0569 }, // Rakkada
  { lat: 60.8856, lng: -149.424 }, // Sunrise
  { lat: 45.742222222, lng: 14.460277777 }, // Cross Cave
  { lat: 37.270777777, lng: 37.837916666 }, // Rum Kalesi
  { lat: 18.249239, lng: 44.451839 }, // Bir Hima
  { lat: 47.5, lng: 51.73333333 }, // Saraitxuk
  { lat: 37.203717, lng: 15.181777 }, // Mègara Hiblea
  { lat: 33.49971944, lng: 35.87333056 }, // Aaiha
  { lat: 40.6667, lng: 16.6083 }, // Sassi di Matera
  { lat: 31.214166666, lng: 29.885 }, // Illa de Faro
  { lat: 37.2908, lng: 13.5844 }, // Temple de Zeus Olímpic (Agrigent)
  { lat: 54.543333333, lng: -1.926666666 }, // Barnard Castle
  { lat: 45.522638888, lng: 141.924361111 }, // Viquipèdia:Proves de Wikidata
  { lat: 32.91137222, lng: 35.563775 }, // Karraza, Khirbat
  { lat: 39.498888888, lng: 26.935833333 }, // Adramítium
  { lat: 32.21361111, lng: 35.28194444 }, // Siquem
  { lat: 35.783333333, lng: 37.483333333 }, // Khanasir
  { lat: 34.006066666, lng: 36.203944444 }, // temple de Bacus
  { lat: -0.891338055, lng: 34.326106944 }, // Thimlich Ohinga
  { lat: 29.17, lng: 76.07 }, // Rakhi Garhi
  { lat: 42.36, lng: -8.03194 }, // Castro de San Cibrao de Las
  { lat: 41.714722, lng: 25.465278 }, // Perperícon
  { lat: 20.18333333, lng: 85.83333333 }, // Dhauli
  { lat: 43.128417, lng: 27.472528 }, // Solnitsata
  { lat: 53.2079, lng: -4.2355 }, // Q2519821
  { lat: 23.65, lng: 90.616666666 }, // Sonargaon
  { lat: 25.476805555, lng: 30.556041666 }, // Temple of Hibis
  { lat: 16.014183333, lng: -90.039038888 }, // Cancuén
  { lat: 31.186944, lng: 29.904722 }, // Catacombs of Kom el Shoqafa
  { lat: 9.97244412, lng: -83.691397964 }, // Monument Nacional Guayabo
  { lat: 35.138305555, lng: 139.649111111 }, // Viquipèdia:Proves de Wikidata
  { lat: 3.94777778, lng: 36.18722222 }, // Koobi Fora
  { lat: 40.0819, lng: 44.0333 }, // Armavir
  { lat: 29.1166, lng: 30.75 }, // Crocodilopolis
  { lat: 39.9465, lng: 32.853 }, // Roman Baths of Ankara
  { lat: -14.6975, lng: -75.135 }, // línies de Nazca
  { lat: 45.517354, lng: 22.787654 }, // Sarmizegethusa
  { lat: 52.269532, lng: 10.484651 }, // Viquipèdia:Proves de Wikidata
  { lat: 40.8866, lng: 71.4506 }, // Akhsikath
  { lat: 45.4685, lng: 9.1824 }, // Viquipèdia:Proves de Wikidata
  { lat: 34.308333333, lng: 108.858333333 }, // Chang'an
  { lat: 42.124336, lng: 22.0503 }, // Stone town of Kuklica
  { lat: 39.862927, lng: 64.073183 }, // Varakhsha
  { lat: 41.89241, lng: 12.47989 }, // Temple de Belona
  { lat: 37.0363, lng: 22.4502 }, // Amicles
  { lat: 40.7484, lng: -73.9857 }, // Viquipèdia:Proves de Wikidata
  { lat: 54.711472222, lng: 20.509305555 }, // Königsberg
  { lat: 27.443, lng: 83.12615 }, // Piprahwa
  { lat: 20.78, lng: 79.63 }, // Pauni
  { lat: 17.133598, lng: -89.26217 }, // Naranjo
  { lat: 3.813889, lng: 113.781389 }, // Niah National Park
  { lat: 36, lng: 139 }, // Viquipèdia:Proves de Wikidata
  { lat: 20.36, lng: 79.51 }, // Bramhapuri
  { lat: 58.19756, lng: -6.74513 }, // Pedres de Callanish
  { lat: 45.295833333, lng: 35.478333333 }, // Arabat Fortress
  { lat: 40.7492, lng: 14.4844 }, // temple d'Apol·lo
  { lat: 40.715707, lng: 43.721908 }, // Regne de Xirak
  { lat: 53.1651, lng: 0.0169 }, // Castell de Bolingbroke
  { lat: 29.97611111, lng: 31.13277778 }, // altiplà de Gizeh
  { lat: 36.85791667, lng: 60.432375 }, // Altin Tepe
  { lat: 36.66258, lng: 22.36244 }, // Apidima Cave
  { lat: -15.72111111, lng: -70.15833333 }, // Sillustani
  { lat: 40.48055556, lng: 21.2875 }, // Dispilio
  { lat: 42.10529, lng: 22.05516 }, // Stone town of Kuklica
  { lat: 37.639167, lng: 21.633056 }, // Stadium at Olympia
  { lat: 31.808957, lng: 35.10378 }, // Kiriath-Jearim
  { lat: 36.5951, lng: 2.44077 }, // Tipasa
  { lat: 43.508341, lng: 16.439568 }, // Temple of Jupiter, Split
  { lat: 37.035173, lng: 27.41724 }, // Halicarnàs
  { lat: 13.800616666, lng: -89.389144444 }, // San Andrés (El Salvador)
  { lat: 35.301608, lng: 48.303881 }, // Ali-Sadr Cave
  { lat: 38.703888888, lng: 39.25 }, // Kharpurt
  { lat: 27.32916667, lng: 68.13888889 }, // grans banys de Mohenjo-Daro
  { lat: 25.9833949, lng: 51.0272187 }, // Zubara
  { lat: 33.5116, lng: 36.3038 }, // temple de Júpiter
  { lat: 29.78777778, lng: 34.98888889 }, // Timna
  { lat: 31.2009, lng: 29.8994 }, // Caesareum of Alexandria
  { lat: 67.962778, lng: -28.9525 }, // Viquipèdia:Proves de Wikidata
  { lat: 8.43491667, lng: 38.61211111 }, // jaciment de les esteles de Tiya
  { lat: 32.80528, lng: 12.485 }, // Sabrata
  { lat: 31.39, lng: 34.68 }, // Siclag
  { lat: 26.7956, lng: 82.1943 }, // Ram Janmabhoomi
  { lat: 56.026404, lng: 92.736156 }, // Afontova Gora
  { lat: 31.65, lng: 65.25 }, // Mundigak
  { lat: 37.4444, lng: 35.8103 }, // Sis
  { lat: 37.971694444, lng: 23.725111111 }, // Propileu d'Atenes
  { lat: 27.517073, lng: 82.050619 }, // Shravasti
  { lat: 39.495498, lng: 26.937518 }, // Adramítium
  { lat: 26.1068, lng: 34.2745 }, // Quseir al-Qadim
  { lat: 9.93333333, lng: -83.66666667 }, // Monument Nacional Guayabo
  { lat: -7.767311111, lng: 110.472336111 }, // Kalasan
  { lat: 37.9074, lng: 29.146 }, // Hieràpolis de Frígia
  { lat: 43.217925, lng: 25.612232 }, // Nicòpolis del Danubi
  { lat: 41.89008333, lng: 12.49066667 }, // Meta Sudans
  { lat: 31.213222222, lng: 29.884333333 }, // Illa de Faro
  { lat: -9.93083333, lng: -76.27944444 }, // Kotosh
  { lat: 54.97203, lng: 50.40348 }, // Bilär
  { lat: 29.81141667, lng: 39.86830556 }, // Dúmat al-Jandal
  { lat: 24.283333333, lng: 148.5 }, // Viquipèdia:Proves de Wikidata
  { lat: 40.6975, lng: -6.6611 }, // Siega Verde
  { lat: 36.472222222, lng: 37.094722222 }, // Tell Rifaat
  { lat: 37.5995, lng: -0.9841 }, // teatre romà de Cartagena
  { lat: 37.455521, lng: 22.420416 }, // Temple d'Atena Àlea
  { lat: 17.383336111, lng: 78.404169444 }, // Golkonda
  { lat: 52.519319444, lng: 13.513480555 }, // Viquipèdia:Proves de Wikidata
  { lat: 33.111638, lng: 35.529517 }, // Quèdeix de Neftalí
  { lat: 37.925, lng: 29.125833333 }, // Hieràpolis de Frígia
  { lat: 41.114594, lng: 20.793806 }, // Ancient Theatre of Ohrid
  { lat: 41.11273611, lng: 20.79124444 }, // Plaošnik
  { lat: 32.481944444, lng: 35.019444444 }, // En Esur
  { lat: 36.473333333, lng: 37.097222222 }, // Tell Rifaat
  { lat: 31.9547, lng: 35.9343 }, // Ciutadella d'Amman
  { lat: 40.125, lng: 49.375 }, // Pintures rupestres de Gobustan
  { lat: 37.2897, lng: 13.5922 }, // Temple de la Concòrdia (Agrigent)
  { lat: 27.883333333, lng: 128.223611111 }, // Viquipèdia:Proves de Wikidata
  { lat: 49.333888888, lng: 88.395277777 }, // Conjunts de petròglifs de l'Altai mongol
  { lat: 29.333333333, lng: 30.616666666 }, // Crocodilopolis
  { lat: 17.6775, lng: -89.86855556 }, // Nakbé
  { lat: 37.79802778, lng: 68.85436111 }, // Ajina-Tepa
  { lat: 32.68403056, lng: 35.66539722 }, // Hamat Gader
  { lat: 30.37078, lng: 35.447756 }, // Beidha
  { lat: 40.886569, lng: 71.450602 }, // Akhsikath
  { lat: 34.2721, lng: 47.4758 }, // Ganj Dareh
  { lat: 42.35722222, lng: 42.19388889 }, // Arqueòpolis
  { lat: 40.823055555, lng: 75.288888888 }, // Tash Rabat
  { lat: 34.368611111, lng: 41.981944444 }, // Anah
  { lat: 43.21722222, lng: 25.61111111 }, // Nicòpolis del Danubi
  { lat: 13.4125, lng: 103.866666666 }, // Yasodharapura
  { lat: 37.037778, lng: 27.424167 }, // Halicarnàs
  { lat: 36.594243, lng: 2.441918 }, // Tipasa
  { lat: 30.95, lng: 29.51667 }, // Taposiris Magna
  { lat: 41.69111111, lng: 26.55572222 }, // Palau d'Edirne
  { lat: 26.15655, lng: 34.241583 }, // Quseir al-Qadim
  { lat: 40.7492, lng: 14.4883 }, // temple d'Isis
  { lat: -32.386666666, lng: 18.452777777 }, // Diepkloof
  { lat: 38.005, lng: 27.19305556 }, // oracle de Claros
  { lat: 35.226055555, lng: 140.083944444 }, // Viquipèdia:Proves de Wikidata
  { lat: 54.41067, lng: 11.20079 }, // Viquipèdia:Proves de Wikidata
  { lat: 20.6084, lng: 79.8559 }, // Bramhapuri
  { lat: 36.874497, lng: 40.89817 }, // Chagar Baçar
  { lat: 31.951673, lng: 35.939363 }, // Teatre romà d'Amman
  { lat: 37.0916, lng: 39.3027 }, // Karahan Tepe
  { lat: 51.1642, lng: -2.82639 }, // Sweet Track
  { lat: 45.5158, lng: 22.7881 }, // Sarmizegethusa
  { lat: 37.882184, lng: 23.452205 }, // Cave of Euripides
  { lat: 53.2612, lng: -1.19793 }, // Creswell Crags
  { lat: 25.7, lng: 32.63944444 }, // Abu Haggag Mosque
  { lat: 16.01667, lng: -90.05 }, // Cancuén
  { lat: 25.111404, lng: 55.838957 }, // Jabal Al Fayah
  { lat: 38.5025, lng: 43.34 }, // Fortalesa de Van
  { lat: 29.240916666, lng: 71.0525 }, // tomba de Bibi Jawindi
  { lat: 19.51666667, lng: 74.7 }, // Daimabad
  { lat: 28.998611111, lng: 109.966944444 }, // Llocs del sistema tusi
  { lat: 37.348569, lng: 33.361453 }, // Derbe
  { lat: 49.609444444, lng: 6.128888888 }, // Gëlle Fra
  { lat: 59.93667, lng: 30.315 }, // avinguda Nevski
  { lat: 42.147858, lng: 24.748343 }, // Mesquita Dzhumaia
  { lat: 37.054722222, lng: 27.228055555 }, // Mindos
  { lat: 41.113, lng: 20.08 }, // Elbasan Fortress
  { lat: 40.087299, lng: 20.222267 }, // Antigonea de Caònia
  { lat: 51.2699437, lng: 39.1981888 }, // Novovoronezh Nuclear Power Plant
  { lat: 41.89143207, lng: 12.51529992 }, // Túmul d'Eurísac
  { lat: 32.655548, lng: 35.677841 }, // Gàdara
  { lat: -22.9489, lng: -43.1656 }, // Urca
  { lat: 60.5, lng: 29.41666667 }, // Línia Mannerheim
  { lat: 51.5987, lng: -4.93673 }, // capella de Sant Govan
  { lat: 40.074, lng: 20.141 }, // Castell de Gjirokastra
  { lat: 34.553297, lng: 38.270467 }, // temple de Baal Shamin
  { lat: 37.023333333, lng: -4.548055555 }, // Conjunt arqueològic dels dòlmens d'Antequera
  { lat: 37.438889, lng: 33.163889 }, // Derbe
  { lat: 65.024444, lng: 35.710556 }, // Illes Solovietski
  { lat: 43.257426729, lng: 17.894667922 }, // Blagaj, Mostar
  { lat: 55.53339, lng: 37.59434 }, // Butovo firing range
  { lat: 28.043558333, lng: -15.661255555 }, // Risco Caido
  { lat: 68.974716, lng: 33.058946 }, // Lenin
  { lat: 29.0616, lng: 119.184 }, // Longyou Caves
  { lat: 28, lng: 40.9 }, // Rock Art in the Hail Region of Saudi Arabia
  { lat: 48.716087, lng: 44.531389 }, // Pavlov's House
  { lat: 42.20888889, lng: 20.74138889 }, // Sinan Pasha Mosque in Prizren
  { lat: -2.13, lng: -78.09 }, // jaciments arqueològics de la vall d'Upano
  { lat: 10.783055555, lng: 79.1325 }, // Great Living Chola Temples
  { lat: 55.70719224, lng: 37.42012266 }, // cementiri de Kúntsevo
  { lat: 43.1506, lng: -4.62028 }, // Liébana
  { lat: 39.3556929, lng: 22.841248 }, // Sesklo
  { lat: 54.43408, lng: 13.57527 }, // Prora
  { lat: 25.72275, lng: 32.601611111 }, // Ascensió d'Aton
  { lat: 36.089930555, lng: -5.774611111 }, // Baelo Claudia
  { lat: 36.7565, lng: 139.5994 }, // Santuaris i temples de Nikkō
  { lat: 37.971538758, lng: 23.726709403 }, // Prepartenó
  { lat: 54.4396, lng: 13.5667 }, // Prora
  { lat: 41.9964, lng: 44.4061 }, // Grakliani Hill
  { lat: 46.07694444, lng: 18.22805556 }, // Mosque of Pasha Qasim
  { lat: 57.709375, lng: 27.860513 }, // Izborsk
  { lat: 40.839444444, lng: 23.862777777 }, // Tomba d'Amfípolis
  { lat: 62.887958, lng: 34.679591 }, // Sandarmokh
  { lat: 42.65750278, lng: 21.16226667 }, // National Library of Kosovo
  { lat: 43.81027778, lng: 28.58305556 }, // Mesquita de Mangalia
  { lat: 40.42291, lng: -3.75595 }, // Casa de Campo
  { lat: 35.79, lng: 129.332222222 }, // Bulguksa
  { lat: 38.45999508, lng: 34.752265051 }, // Kaymaklı Underground City
  { lat: 20.628286, lng: -103.769989 }, // paisatge d'agaves i els antics tallers de la indústria del tequila
  { lat: 41.327806, lng: 19.819361 }, // Et'hem Bey Mosque
  { lat: 39.212777777, lng: 45.405555555 }, // Momine Khatun Mausoleum
  { lat: 39.09361111, lng: 16.08416667 }, // Coreca Caves
  { lat: 47.797777777, lng: 13.046944444 }, // Catedral de Salzburg
  { lat: 38.98861111, lng: 141.11027778 }, // Monuments històrics de Hiraizumi
  { lat: 59.996486, lng: 30.42213 }, // Piskaryovskoye Memorial Cemetery
  { lat: 37.429655, lng: 21.900387 }, // Temple d'Apol·lo (Figàlia)
  { lat: 39.26305556, lng: -76.58 }, // Fort McHenry
  { lat: 55.083888888, lng: 36.571388888 }, // Obninsk Nuclear Power Plant
  { lat: 39.201872222, lng: 45.413888888 }, // Yusif ibn Kuseyir Mausoleum
  { lat: 35.237263888, lng: 128.873725 }, // Gaya Tumuli
  { lat: -3.130277777, lng: -60.023333333 }, // Teatro Amazonas
  { lat: 27.576455, lng: 83.054978 }, // Kapilavastu
  { lat: 41.32641992, lng: 19.82605219 }, // Tanners' Bridge
  { lat: 41.32877778, lng: 19.81930556 }, // Palace of Culture of Tirana
  { lat: 55.724722222, lng: 37.554166666 }, // Cementiri de Novodévitxi
  { lat: 28.666388888, lng: 77.228888888 }, // Kashmiri Gate
  { lat: 45.133333, lng: 20.233333 }, // Battle of Slankamen
  { lat: 31.76841, lng: 35.23288 }, // Akeldama
  { lat: 59.95566, lng: 30.33746 }, // Aurora
  { lat: 43.3089, lng: -5.05635 }, // Cova de Covadonga
  { lat: 36.691233842, lng: -5.270069845 }, // Cueva de la Pileta
  { lat: 55.768055555, lng: 37.548333333 }, // Cementiri de Vagànkovo
  { lat: 42.3594, lng: 20.5092 }, // Terzi Bridge
  { lat: 47.904666666, lng: 20.376361111 }, // Eger minaret
  { lat: 43.104085, lng: 17.926821 }, // Daorson
  { lat: 18.9025, lng: -89.3175 }, // Valeriana
  { lat: 56.766388888, lng: 38.784444444 }, // Pleshcheyevo Lake
  { lat: 55.7432, lng: 37.5674 }, // Moscow Kiyevsky railway station
  { lat: 36.7475, lng: 139.6105556 }, // Santuaris i temples de Nikkō
  { lat: 31.837222222, lng: 35.550277777 }, // Al-Maghtas
  { lat: 43.2753, lng: -79.8554 }, // HMCS Haida
  { lat: 33.044722222, lng: 35.226111111 }, // Castell de Montfort
  { lat: -22.897111, lng: -43.187394 }, // Valongo Wharf
  { lat: -22.842143012, lng: -43.26699613 }, // Olaria Atlético Clube
  { lat: 43.669444444, lng: 28.5325 }, // Durankulak
  { lat: 55.80150062, lng: 37.45757342 }, // Institut Gamaleia de Recerca en Epidemiologia i Microbiologia
  { lat: 37.57442, lng: 126.95663 }, // Presó de Seodaemun
  { lat: 41.899166666, lng: 20.046111111 }, // Spaç Prison
  { lat: 43.26944444, lng: 26.91 }, // Tombul Mosque (Shumen)
  { lat: 42.66699722, lng: 21.167 }, // King's Mosque in Pristina
  { lat: 35.688322222, lng: 139.754388888 }, // castell d'Edo
  { lat: 22.9975, lng: 120.20281111 }, // Fort Provintia
  { lat: 38.482269, lng: 22.501279 }, // Temple d'Apol·lo (Delfos)
  { lat: 48.208722222, lng: 16.369805555 }, // Pestsäule
  { lat: 31.6205, lng: 74.8806 }, // Jallianwala Bagh
  { lat: 55.57874, lng: 37.45595 }, // Camp d'afusellament Kommunarka
  { lat: 38.6096223, lng: 43.0849849 }, // monestir de Ktuts
  { lat: 31.773788888, lng: 35.180261111 }, // Plaça del Mont Herzl
  { lat: 32.655277777, lng: 35.678611111 }, // Gàdara
  { lat: 37.738028, lng: 24.05375 }, // Teatre de Tòricos
  { lat: 44.35, lng: 19.883333333 }, // Brankovina
  { lat: 44.0233, lng: 20.9007 }, // Šumarice Memorial Park
  { lat: 34.553383, lng: 38.269936 }, // temple de Baal Shamin
  { lat: 37.280733333, lng: 127.010202777 }, // Fortalesa de Hwaseong
  { lat: 36.879166666, lng: 38.105555555 }, // Tomb of Suleyman Shah
  { lat: 59.95546, lng: 30.33778 }, // Aurora
  { lat: 55.75774168, lng: 37.62948612 }, // Polytechnical Museum
  { lat: -19.865833, lng: -43.970833 }, // Mineirão
  { lat: 50.364166666, lng: 7.605638888 }, // Emperor William Memorial at Deutsches Eck
  { lat: 37.056359, lng: 27.229636 }, // Mindos
  { lat: 49.796388888, lng: 9.1575 }, // Limes germanico-retico
  { lat: 44.700414, lng: 19.383724 }, // Stjepan Filipović
  { lat: 42.661161111, lng: 20.265619444 }, // Patriarcat de Peć
  { lat: 40.1147, lng: 43.6708 }, // Yerevandashat
  { lat: 55.75378, lng: 37.619308 }, // Necròpolis de la Muralla del Kremlin
  { lat: 40.41824, lng: -3.71037 }, // Teatro Real
  { lat: 38.964527777, lng: 125.715816666 }, // Arc de la reunificació
  { lat: 3.63386, lng: NaN }, // Fallen Astronaut
  { lat: 43.174436725, lng: -2.28236514 }, // Santuari de Loiola
  { lat: 40.408571429, lng: -3.693996097 }, // Museu Reina Sofia
  { lat: 19.427, lng: -99.16771 }, // Monument a la Independència
  { lat: 60.18206, lng: 24.913342 }, // Monument a Sibelius
  { lat: 28.488888888, lng: -16.316111111 }, // Catedral de La Laguna
  { lat: 52.21472222, lng: 21.02805556 }, // Frederic Chopin Monument in Warsaw
  { lat: 55.759111111, lng: 37.627611111 }, // Pedra Solovetski
  { lat: 44.823027777, lng: 20.447694444 }, // Pobednik
  { lat: 37.380277777, lng: -5.993611111 }, // Palacio de San Telmo
  { lat: 25.034444444, lng: 121.521666666 }, // Chiang Kai-shek Memorial Hall
  { lat: 51.502413377, lng: -0.177742437 }, // Albert Memorial
  { lat: 13.764917, lng: 100.538291 }, // Victory Monument
  { lat: 44.688694444, lng: 20.515805555 }, // Monument to the Unknown Hero
  { lat: 49.981028, lng: 7.899833 }, // Niederwalddenkmal
  { lat: 42.881388888, lng: -8.545833333 }, // Hospital Reial de Santiago de Compostel·la
  { lat: 10.0674441, lng: 1.1345348 }, // Koutammakou
  { lat: 52.24972222, lng: 20.99388889 }, // Monument to the Ghetto Heroes
  { lat: 58.521154, lng: 31.275232 }, // Millennium of Russia
  { lat: 40.366166666, lng: 49.83725 }, // Torre de la donzella
  { lat: 38.995728, lng: -1.856202 }, // Cathedral of San Juan de Albacete
  { lat: 53.34972, lng: -6.26028 }, // Spire
  { lat: 43.385833333, lng: -8.406388888 }, // Torre d'Hèrcules
  { lat: 21.03666667, lng: 105.83472222 }, // mausoleu de Ho Chi Minh
  { lat: 38.940686, lng: -0.246097 }, // Sant Jeroni de Cotalba
  { lat: 54.4122, lng: 10.2306 }, // Torre de la marina
  { lat: -16.5544, lng: -68.6741 }, // Porta del Sol
  { lat: 37.98404, lng: -1.12865 }, // Catedral Múrcia
  { lat: -34.592963, lng: -58.373192 }, // Torre Monumental
  { lat: 50.09472308, lng: 14.41598833 }, // monument a Stalin
  { lat: 37.17599, lng: -3.59904 }, // S.A.I. Catedral Metropolitana de la Encarnación
  { lat: 41.30849444, lng: 19.840175 }, // Mother Albania
  { lat: 58.9414, lng: 5.67134 }, // Sverd i fjell
  { lat: 51.41305556, lng: 11.10972222 }, // Kyffhäuser Monument
  { lat: 40.768055555, lng: -73.981944444 }, // Columbus Circle
  { lat: 40.413556, lng: -3.682056 }, // Palau de Cristall del Retiro
  { lat: 41.0054, lng: 28.9748 }, // Walled Obelisk
  { lat: 42.33644444, lng: -7.86286111 }, // Catedral d'Ourense
  { lat: 51.501833, lng: -0.140639 }, // Victoria Memorial
  { lat: 48.918333333, lng: 11.860555555 }, // Befreiungshalle
  { lat: 43.383611111, lng: -5.328888888 }, // Sidrón Cave
  { lat: 28.10083333, lng: -15.41472222 }, // catedral de Canàries
  { lat: -33.76555556, lng: 18.9425 }, // Afrikaans Language Monument
  { lat: 28.49055556, lng: -16.32027778 }, // Iglesia de la Concepción
  { lat: 48.85305556, lng: 2.36916667 }, // elefant de la Bastilla
  { lat: 28.46444, lng: -16.24894 }, // església Matriu de la Concepción
  { lat: 42.4578, lng: -6.056 }, // Palau Episcopal d'Astorga
  { lat: 51.911666666, lng: 8.839444444 }, // Hermannsdenkmal
  { lat: 55.952416666, lng: -3.193277777 }, // Scott Monument
  { lat: 52.241111111, lng: 21.011388888 }, // Tomba del Soldat desconegut (Varsòvia)
  { lat: 41.6569, lng: -4.72361 }, // Museu Nacional d'Escultura
  { lat: 21.028611, lng: 105.835556 }, // Van Mieu, Temple of Literature
  { lat: 43.38333, lng: -4.11667 }, // cova d'Altamira
  { lat: 43.12733333, lng: -5.81430556 }, // Santa Cristina de Ḷḷena
  { lat: 37.39265415, lng: -6.000126118 }, // Museo de Bellas Artes de Sevilla
  { lat: 40.114166666, lng: -5.738888888 }, // Monestir de Yuste
  { lat: 42.819722222, lng: -1.641111111 }, // Catedral de Santa María de la Asunción de Pamplona
  { lat: 50.0549, lng: 19.89328 }, // monticle de Kościuszko
  { lat: 55.75146, lng: 37.61793 }, // Tsar Puixka
  { lat: 45.812315, lng: 9.085934 }, // Casa del Fascio
  { lat: 41.32302222, lng: 19.82156667 }, // Piràmide de Tirana
  { lat: 38.8709, lng: -77.0587 }, // Pentagon Memorial
  { lat: 37.765024782, lng: -3.789899576 }, // catedral de Jaén
  { lat: 17.36160692, lng: 78.47465723 }, // Charminar
  { lat: 54.6867363, lng: 25.2975462 }, // Tres Creus de Vílnius
  { lat: 40.423645, lng: -3.689422 }, // Museu Arqueològic Nacional d'Espanya
  { lat: 51.5073, lng: -0.12755 }, // Charing Cross
  { lat: 42.69055556, lng: 21.12361111 }, // Gazimestan
  { lat: 24.875277777, lng: 67.040833333 }, // Mazar-e-Qaid
  { lat: 41.652678, lng: -4.723415 }, // Catedral de Valladolid
  { lat: 37.382455145, lng: -5.996296078 }, // Torre del Oro
  { lat: 40.411944, lng: -3.686944 }, // Bosc dels Absents
  { lat: 40.418611, lng: -3.691667 }, // Palau de Cibeles de Madrid
  { lat: 43.265974, lng: -2.93785 }, // Museu de Belles Arts de Bilbao
  { lat: 39.06327, lng: 125.78905 }, // Palau del Sol de Kumsusan
  { lat: 41.965027, lng: 21.39441 }, // Millennium Cross
  { lat: 37.88218, lng: 58.3333 }, // Arc de la Neutralitat
  { lat: 38.26694444, lng: -0.69833333 }, // Misteri d'Elx
  { lat: 50.42915, lng: 30.568663888 }, // Monument to the Founders of Kyiv
  { lat: 10.1, lng: 1.066666666 }, // Koutammakou
  { lat: 34.231984, lng: -82.894506 }, // Georgia Guidestones
  { lat: 40.19525, lng: 44.524817 }, // Mare Armènia
  { lat: 55.68931, lng: 12.59763 }, // Font de Gefjon
  { lat: 28.35128, lng: -16.369782 }, // Basílica de Nostra Senyora de la Candelaria
  { lat: 55.752777777, lng: 37.6225 }, // Monument to Minin and Pozharsky
  { lat: 38.693676, lng: -9.20569 }, // Monumento aos Descobrimentos
  { lat: 36.680555555, lng: -6.14 }, // Alcázar
  { lat: 36.720042, lng: -4.42012 }, // Iglesia Catedral de la Encarnación
  { lat: 47.5114, lng: 19.0814 }, // Monument a Stalin
  { lat: 41.37580278, lng: 2.17776111 }, // Monument a Colom
  { lat: 43.362583, lng: -5.843081 }, // Catedral de San Salvador d'Oviedo
  { lat: 59.8914, lng: 30.3194 }, // Moscow Triumphal Gate
  { lat: 39.0321027, lng: 125.753063 }, // Gran Monument del turó de Mansu
  { lat: 52.24725, lng: 21.013388888 }, // Columna de Segimon
  { lat: 40.96069, lng: -5.666 }, // Catedral Nova de Salamanca
  { lat: 39.903055555, lng: 116.391666666 }, // Monument to the People's Heroes
  { lat: 43.014194444, lng: -7.559888888 }, // Muralla romana de Lugo
  { lat: 41.036944, lng: 28.985 }, // Republic Monument
  { lat: 43.38027778, lng: -5.86833333 }, // Sandura Miguella de Lillo
  { lat: 36.838197052, lng: -2.46728015 }, // Iglesia Catedral de Nuestra Señora de la Encarnación
  { lat: 55.828228, lng: 37.646689 }, // Obrer i Dona del Kolkhoz
  { lat: 56.13881, lng: -3.91802 }, // Wallace Monument
  { lat: 49.002138888, lng: -122.756527777 }, // Peace Arch
  { lat: 40.4199, lng: -3.6921 }, // Palau de Linares
  { lat: 52.24944444, lng: 21.00583333 }, // Monument a l'Aixecament de Varsovia
  { lat: 41.327516, lng: 19.818896 }, // Skanderbeg Monument
  { lat: 56.951555555, lng: 24.113222222 }, // Monument a la Llibertat
  { lat: 55.754722222, lng: 37.616111111 }, // Tomb of the Unknown Soldier
  { lat: 51.1789, lng: -1.82528 }, // Stonehenge, Avebury i llocs propers relacionats
  { lat: 34.394142, lng: 132.452776 }, // Children's Peace Monument
  { lat: 40.950181, lng: -4.125623 }, // Catedral de Segòvia
  { lat: 13.756666666, lng: 100.501666666 }, // Democracy Monument
  { lat: 43.376944444, lng: -4.11975 }, // cova d'Altamira
  { lat: 43.744777777, lng: 7.401802777 }, // Trofeu dels Alps
  { lat: 47.921944444, lng: 38.740277777 }, // Savur-Mohila
  { lat: 42.431198, lng: -8.646964 }, // Ruins of San Domingos Convent
  { lat: 33.693333333, lng: 73.068333333 }, // Monument del Pakistan
  { lat: 42.01111111, lng: -4.53694444 }, // Catedral de Palència
  { lat: 52.349305555, lng: 14.560361111 }, // Monument a la Viquipèdia
  { lat: 27.646017, lng: 85.474774 }, // Kailashnath Mahadev Statue
  { lat: 31.6209, lng: 74.2947 }, // Tomb of Nur Jahan
  { lat: 42.843055555, lng: -6.831666666 }, // Os Ancares
  { lat: 42.755025, lng: -8.246761 }, // San Lourenzo de Carboeiro
  { lat: 31.6315, lng: -7.9872 }, // Koubba Ba'Adiyn
  { lat: 47.126666666, lng: 8.751388888 }, // abadia d'Einsiedeln
  { lat: 40.417186111, lng: -3.696780555 }, // Teatro de la Zarzuela
  { lat: 37.39325278, lng: -5.99188056 }, // Metropol Parasol
  { lat: 39.85227778, lng: -0.48825 }, // Catedral de Sogorb
  { lat: 40.96045, lng: -5.66646 }, // Catedral Antiga de Salamanca
  { lat: 41.068411, lng: -2.641267 }, // catedral de Sigüenza
  { lat: 55.770111111, lng: 37.642638888 }, // Wall of Grief
  { lat: 37.3012464, lng: -3.13626 }, // catedral de Guadix
  { lat: 42.298919, lng: -1.957528 }, // catedral de Calahorra
  { lat: 42.850763934, lng: -2.672462787 }, // Catedral de Santa María de Vitòria
  { lat: 38.92444444, lng: -6.34805556 }, // aqüeducte de los Milagros
  { lat: 44.11756, lng: 15.2198 }, // Monument to the Sun
  { lat: 28.17103, lng: 112.95466 }, // Estàtua del jove Mao Zedong
  { lat: 36.681967852, lng: -6.140979311 }, // Antigua Colegiata de Nuestro Señor San Salvador
  { lat: 37.881185, lng: 58.382362 }, // Independence Monument, Ashgabat
  { lat: 31.773661, lng: 35.182131 }, // National Memorial Hall (Mount Herzl)
  { lat: 37.638702, lng: 21.629352 }, // Filipeu
  { lat: 38.87844444, lng: -6.96941389 }, // Catedral de Badajoz
  { lat: 68.9928995, lng: 33.0710498 }, // Memorial to Defenders of the Soviet Arctic during the Great Patriotic War
  { lat: 43.0092, lng: -7.5583 }, // Catedral de Lugo
  { lat: 42.441083333, lng: -2.953527777 }, // catedral de Santo Domingo de la Calzada
  { lat: 31.774991666, lng: 35.178016666 }, // Monument a Víctimes del Terrorisme a Israel
  { lat: 54.849027777, lng: 83.106055555 }, // Monument al ratolí de laboratori
  { lat: 50.449543, lng: 30.525381 }, // Independence Monument
  { lat: 30.759, lng: 76.8074 }, // Open Hand Monument
  { lat: 35.88777778, lng: -5.31666667 }, // Cathedral of St Mary of the Assumption
  { lat: 42.424886, lng: 18.771043 }, // Fortifications of Kotor
  { lat: 42.6607, lng: 21.1583 }, // Newborn monument
  { lat: 42.45777778, lng: -6.05694444 }, // Catedral d'Astorga
  { lat: 41.498888888, lng: -5.754444444 }, // Catedral de Zamora
  { lat: 38.986324, lng: -3.93096 }, // Catedral de Ciudad Real
];