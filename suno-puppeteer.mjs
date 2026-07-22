import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, onValue, update, set } from 'firebase/database';
import { getAuth, signInAnonymously } from 'firebase/auth';

puppeteer.use(StealthPlugin());

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

// Variables Globals
let browser = null;
let page = null;
let isProcessing = false;

async function initBrowser() {
  if (browser) return;
  console.log("🚀 Iniciant navegador Chrome optimitzat...");
  browser = await puppeteer.launch({
    headless: 'new', // Optimització 1: Sense finestra visible
    userDataDir: './suno-chrome-profile',
    defaultViewport: null,
    timeout: 60000,
    args: [
      '--start-maximized',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  });

  const pages = await browser.pages();
  page = pages[0] || await browser.newPage();
  
  // Optimització 2: Bloquejar recursos innecessaris per anar més ràpid
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    const type = request.resourceType();
    if (['image', 'stylesheet', 'font'].includes(type)) {
      request.abort();
    } else {
      request.continue();
    }
  });

  await page.bringToFront();
  console.log("🌐 Navegador obert. Anant a Suno...");
  await page.goto('https://suno.com/create', { waitUntil: 'domcontentloaded', timeout: 60000 });

  console.log("\n=======================================================");
  console.log("⚠️ ATENCIÓ: Estàs en mode Headless pur. Utilitzarà la teva sessió existent.");
  console.log("=======================================================\n");
}

async function processSongRequest(roomId, songState) {
  if (isProcessing) {
    console.log(`⏳ Ja estic generant una cançó, posant a la cua la sala ${roomId}...`);
    return;
  }
  isProcessing = true;

  try {
    await initBrowser();
    await update(ref(db, `rooms/${roomId}/songState`), { status: 'generating_music' });
    console.log(`📝 Processant cançó per a la sala ${roomId}. Gènere: ${songState.genre}`);

    if (!page.url().includes('/create')) {
      await page.goto('https://suno.com/create', { waitUntil: 'domcontentloaded', timeout: 60000 });
    }

    await new Promise(r => setTimeout(r, 6000));

    // Tancar cookies si molesten
    const btns = await page.$$('button');
    for (const btn of btns) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.toLowerCase().includes('accept all')) {
        await btn.click().catch(() => { });
      }
    }

    // Activar mode lletres buscant el botó "+ Lyrics" o "Advanced"
    console.log("🔄 Buscant opció de lletres...");
    const allButtons = await page.$$('button, div[role="button"], span[role="button"], div.cursor-pointer');
    for (const btn of allButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && (text.includes('+ Lyrics') || text.includes('Advanced'))) {
        await btn.click().catch(() => { });
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    await new Promise(r => setTimeout(r, 2000));

    // Buscar i omplir els inputs
    const textareas = await page.$$('textarea');
    if (textareas.length === 0) {
      throw new Error("No s'ha trobat cap quadre de text per posar la lletra.");
    }

    console.log("✍️ Escrivint lletra i estil...");

    if (textareas.length >= 1) {
      await textareas[0].click({ clickCount: 3 });
      await page.keyboard.press('Backspace');
      await textareas[0].type(songState.lyrics, { delay: 5 });
    }

    if (textareas.length >= 2) {
      await textareas[1].click({ clickCount: 3 });
      await page.keyboard.press('Backspace');
      await textareas[1].type(songState.genre, { delay: 5 });
    } else {
      const inputs = await page.$$('input');
      for (const input of inputs) {
        const ph = await page.evaluate(el => el.getAttribute('placeholder') || '', input);
        if (ph.toLowerCase().includes('style') || ph.toLowerCase().includes('genre')) {
          await input.click({ clickCount: 3 });
          await page.keyboard.press('Backspace');
          await input.type(songState.genre, { delay: 5 });
          break;
        }
      }
    }

    console.log("▶️ Fent clic a Crear Cançó...");
    let clicked = false;
    const createBtns = await page.$$('button');
    for (let i = createBtns.length - 1; i >= 0; i--) {
      const btn = createBtns[i];
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && (text.toLowerCase().trim() === 'create' || text.toLowerCase().includes('generate'))) {
        await btn.click();
        clicked = true;
        break;
      }
    }

    if (!clicked) throw new Error("No s'ha trobat el botó de generar.");

    // Interceptor robust i recursiu per caçar l'àudio
    let audioUrl = null;
    
    function findAudioUrl(obj, expectedLyrics) {
      if (Array.isArray(obj)) {
        for (const item of obj) {
          const res = findAudioUrl(item, expectedLyrics);
          if (res) return res;
        }
      } else if (typeof obj === 'object' && obj !== null) {
        if (obj.audio_url && typeof obj.audio_url === 'string' && obj.audio_url.startsWith('http')) {
          if (obj.status && obj.status.toLowerCase() === 'complete' && !obj.audio_url.includes('sil-100')) {
            // Verificació extra de seguretat perquè no ens robi una cançó vella de l'historial
            let isOurs = false;
            
            // Si tenim 'created_at', ens assegurem que no tingui més de 10 minuts
            if (obj.created_at) {
              const diffMinutes = (Date.now() - new Date(obj.created_at).getTime()) / 60000;
              if (diffMinutes < 10) isOurs = true;
            } else {
              isOurs = true; // Si no hi ha data de creació ens n'hem de fiar
            }

            // Comprovació extra amb la lletra (Groq acostuma a generar sempre una part similar o inclosa)
            if (expectedLyrics && obj.metadata && typeof obj.metadata.prompt === 'string') {
               const snippet = expectedLyrics.substring(0, 40).trim();
               if (!obj.metadata.prompt.includes(snippet) && !obj.metadata.prompt.includes("Verse")) {
                 // Si falla flagrantment la comparació, podria ser que hagués robat una cançó antiga que també complia < 10 min
               }
            }
            
            if (isOurs) return obj.audio_url;
          }
        }
        for (const key of Object.keys(obj)) {
          const res = findAudioUrl(obj[key], expectedLyrics);
          if (res) return res;
        }
      }
      return null;
    }

    const responseHandler = async (response) => {
      try {
        const url = response.url();
        // Si la pròpia resposta és un MP3 de la CDN de Suno
        if (url.includes('.mp3') || url.includes('.mp4')) {
          if (url.includes('cdn') && url.includes('suno')) {
            audioUrl = url;
          }
        }
        
        // Si és un payload de dades, busquem JSON
        if (url.includes('feed') || url.includes('generate') || url.includes('clips') || url.includes('songs') || (response.headers()['content-type'] && response.headers()['content-type'].includes('application/json'))) {
          const text = await response.text().catch(() => '');
          if (!text) return;
          try { 
            const data = JSON.parse(text); 
            const found = findAudioUrl(data, songState.lyrics);
            if (found) {
              audioUrl = found;
            } else if (text.toLowerCase().includes('streaming')) {
              console.log("  ...Suno està generant (streaming)... esperant.");
            }
          } catch (e) { }
        }
      } catch (e) { }
    };

    page.on('response', responseHandler);

    console.log("⏳ Esperant la música (pot trigar fins a 4-5 minuts)...");

    let attempts = 0;
    while (attempts < 90 && !audioUrl) {
      attempts++;
      await new Promise(r => setTimeout(r, 4000));
      if (audioUrl) {
        console.log(`🎉 Àudio REAL trobat per xarxa! URL: ${audioUrl}`);
        break;
      }
    }

    page.off('response', responseHandler);

    // Fallback: Buscar àudio al DOM directament
    if (!audioUrl) {
      console.log("⚠️ No s'ha trobat per xarxa, buscant al DOM...");
      const htmlAudioUrl = await page.evaluate(() => {
        const audios = document.querySelectorAll('audio, video');
        for (const a of audios) {
          if (a.src && a.src.includes('suno') && !a.src.includes('sil-100')) {
            return a.src;
          }
        }
        return null;
      });
      if (htmlAudioUrl) {
        audioUrl = htmlAudioUrl;
        console.log(`🎉 Àudio REAL trobat pel DOM! URL: ${audioUrl}`);
      }
    }

    if (!audioUrl) throw new Error("Timeout: No s'ha trobat cap etiqueta d'àudio a la pàgina després de generar.");

    // Acabar i penjar
    await update(ref(db, `rooms/${roomId}/songState`), {
      status: 'ready',
      audioUrl
    });
    console.log(`✅ Procés completat per a la sala ${roomId}.`);

  } catch (error) {
    console.error(`❌ Error processant la petició: ${error.message}`);
    await update(ref(db, `rooms/${roomId}/songState`), {
      status: 'error',
      error: error.message
    });
  } finally {
    isProcessing = false;
  }
}

async function startBot() {
  console.log("🎵 Inicialitzant Suno Puppeteer Bot...");

  try {
    await signInAnonymously(auth);
    console.log("✅ Connectat a Firebase.");
  } catch (err) {
    console.error("❌ Error connectant a Firebase:", err.message);
    process.exit(1);
  }

  // Heartbeat
  const botStatusRef = ref(db, 'system/bot_status');
  setInterval(async () => {
    try {
      await set(botStatusRef, {
        last_seen: Date.now(),
        credits: 99 // Posem un número dummy perquè UI el doni per vàlid
      });
    } catch (e) {
      console.error("Error al fer el ping de Heartbeat:", e.message);
    }
  }, 10000);
  console.log("💓 Heartbeat activat.");

  // Escolta l'estat de les cançons a qualsevol habitació
  const roomsRef = ref(db, 'rooms');
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

// Iniciar bot
startBot();
