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
  console.log("🚀 Iniciant navegador Chrome (Això pot trigar una mica el primer cop)...");
  browser = await puppeteer.launch({
    headless: false,
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

  // Reutilitzar la pestanya per defecte en comptes d'obrir-ne de noves
  const pages = await browser.pages();
  page = pages[0] || await browser.newPage();
  await page.bringToFront();

  console.log("🌐 Navegador obert. Anant a Suno...");
  await page.goto('https://suno.com/create', { waitUntil: 'domcontentloaded', timeout: 60000 });

  console.log("\n=======================================================");
  console.log("⚠️ ATENCIÓ: Si és el teu primer cop, fes LOGIN a Suno manualment (recomanat Discord).");
  console.log("Un cop tinguis la sessió iniciada, el bot començarà a treballar automàticament.");
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

    await page.bringToFront();
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

    // Normalment en Custom Mode, textareas[0] és Lyrics i textareas[1] és Style (si és textarea)
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
      // De vegades l'estil és un input normal
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

    // Deixem que Suno posi el títol automàticament per evitar sobreescriure l'estil

    // Crear
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

    // Activem l'interceptor de respostes de xarxa per pescar l'MP3 directament de l'API de Suno
    // Així no depenem de si el botó de Play està visible o no
    let audioUrl = null;
    const responseHandler = async (response) => {
      try {
        const url = response.url();
        if (url.includes('/api/feed') || url.includes('/api/generate')) {
          const clips = await response.json().catch(() => null);
          if (Array.isArray(clips) && clips.length > 0) {
            // Busquem exclusivament clips que estiguin TOTALMENT COMPLETATS i no siguin silenci
            const completedClip = clips.find(c =>
              (c.status === 'complete' || c.status === 'COMPLETE') &&
              c.audio_url &&
              !c.audio_url.includes('sil-100')
            );

            if (completedClip) {
              audioUrl = completedClip.audio_url;
            } else {
              // Si encara s'està generant, ignorem i esperem al proper "poll" que fa la web de Suno
              const streamingClip = clips.find(c => c.status === 'streaming');
              if (streamingClip) {
                console.log("  ...Suno està generant (streaming)... esperant la versió completa.");
              }
            }
          }
        }
      } catch (e) { }
    };

    page.on('response', responseHandler);

    console.log("⏳ Esperant la música (pot trigar fins a 2 minuts)...");

    let attempts = 0;
    while (attempts < 60 && !audioUrl) {
      attempts++;
      await new Promise(r => setTimeout(r, 4000));

      if (audioUrl) {
        console.log(`🎉 Àudio REAL trobat per xarxa! URL: ${audioUrl}`);
        break;
      }
    }

    // Netejem l'interceptor
    page.off('response', responseHandler);

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
