import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, update, set } from 'firebase/database';
import { getAuth, signInAnonymously } from 'firebase/auth';

// Utilitats d'entorn
const ENV = process.env;

// Connexió Firebase
const firebaseConfig = {
  apiKey: ENV.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: ENV.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: ENV.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: ENV.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: ENV.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: ENV.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: ENV.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

// Extreu el token real de la cookie de Suno
function extractSessionToken(cookieStr) {
  const match = cookieStr.match(/__session=([^;]+)/);
  if (!match) throw new Error('Cookie no conté __session');
  return match[1].trim();
}

async function startBot() {
  console.log("🎵 Inicialitzant Suno Bot Local (Comunitat)...");
  
  if (!ENV.SUNO_COOKIES) {
    console.error("❌ ERROR: No s'ha trobat SUNO_COOKIES a .env.local");
    process.exit(1);
  }

  try {
    await signInAnonymously(auth);
    console.log("✅ Connectat a Firebase.");
  } catch (err) {
    console.error("❌ Error connectant a Firebase:", err.message);
    if (err.message.includes('auth/operation-not-allowed') || err.message.includes('auth/admin-restricted-operation')) {
      console.error("\n⚠️ IMPORTANT: Perquè el bot funcioni, has d'anar a la Consola de Firebase -> Authentication -> Sign-in method -> i habilitar 'Anonymous' (Anònim).\n");
    }
    process.exit(1);
  }

  // Lògica de Heartbeat (Ping cada 10 segons)
  const botStatusRef = ref(db, 'system/bot_status');
  setInterval(async () => {
    try {
      // Obtenir els crèdits seria genial, però com a mínim enviem que estem vius
      await set(botStatusRef, {
        last_seen: Date.now(),
        credits: 50 // TODO: Obtenir crèdits reals de la API de Suno si és possible
      });
    } catch (e) {
      console.error("Error al fer el ping de Heartbeat:", e.message);
    }
  }, 10000);
  console.log("💓 Heartbeat activat.");

  // Escoltar l'estat de les cançons a qualsevol habitació
  const roomsRef = ref(db, 'rooms');
  console.log("🎧 Escoltant peticions de cançons satíriques...");

  onValue(roomsRef, async (snapshot) => {
    if (!snapshot.exists()) return;
    const rooms = snapshot.val();
    
    for (const roomId of Object.keys(rooms)) {
      const room = rooms[roomId];
      if (room.songState?.status === 'waiting_for_bot') {
        console.log(`\n🚀 Nova petició detectada a la sala: ${roomId}`);
        await processSongRequest(roomId, room.songState);
      }
    }
  });
}

// Lògica per interactuar amb Suno
async function processSongRequest(roomId, songState) {
  try {
    // Indicar que estem treballant
    await update(ref(db, `rooms/${roomId}/songState`), { status: 'generating_music' });
    console.log(`  📝 Lletra generada rebuda. Creant música (${songState.genre})...`);

    const cookies = ENV.SUNO_COOKIES.split(',').map(c => c.trim());
    let clipId = null;

    // Provem les cookies
    for (const cookie of cookies) {
      try {
        const token = extractSessionToken(cookie);
        const payload = {
          prompt: songState.lyrics,
          title: 'Sátira Geogràfica',
          tags: songState.genre,
          makeInstrumental: false,
          mv: 'chirp-v3-5'
        };

        const generateRes = await fetch('https://studio-api-prod.suno.com/api/generate/v2-web/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
          },
          body: JSON.stringify(payload)
        });

        if (!generateRes.ok) throw new Error(`Suno API error: ${generateRes.status}`);
        const generateData = await generateRes.json();
        
        if (generateData.clips && generateData.clips.length > 0) {
          clipId = generateData.clips[0].id;
          console.log(`  ✅ Generació iniciada. Clip ID: ${clipId}`);
          break;
        }
      } catch (e) {
        console.log(`  ⚠️ Error amb una cookie: ${e.message}`);
      }
    }

    if (!clipId) {
      throw new Error("No s'ha pogut iniciar la generació a Suno. Revisa les cookies i els crèdits.");
    }

    // Fer polling manual fins que l'audio estigui a punt
    console.log("  ⏳ Esperant a que l'àudio estigui a punt...");
    let audioUrl = null;
    let attempts = 0;
    
    while (attempts < 30) { // Max ~2.5 minuts
      await new Promise(r => setTimeout(r, 5000));
      attempts++;
      
      const token = extractSessionToken(cookies[0]); // Usem la primera cookie per consultar
      const feedRes = await fetch(`https://studio-api-prod.suno.com/api/feed/v2?ids=${clipId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': 'Mozilla/5.0'
        }
      });
      
      if (feedRes.ok) {
        const feedData = await feedRes.json();
        const clip = feedData[0];
        if (clip) {
          if (clip.status === 'streaming' || clip.status === 'complete' || clip.status === 'COMPLETE') {
            audioUrl = clip.audio_url;
            console.log(`  🎉 Àudio llest! URL: ${audioUrl}`);
            break;
          } else if (clip.status === 'error' || clip.status === 'ERROR') {
            throw new Error("Error intern de Suno al generar l'àudio");
          }
        }
      }
    }

    if (!audioUrl) throw new Error("Timeout esperant l'àudio de Suno");

    // Acabar i penjar
    await update(ref(db, `rooms/${roomId}/songState`), { 
      status: 'ready', 
      audioUrl 
    });
    console.log(`  ✅ Procés completat per a la sala ${roomId}.`);

  } catch (error) {
    console.error(`  ❌ Error processant la petició: ${error.message}`);
    await update(ref(db, `rooms/${roomId}/songState`), { 
      status: 'error', 
      error: error.message 
    });
  }
}

// Iniciar bot
startBot();
