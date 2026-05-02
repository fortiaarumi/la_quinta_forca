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
  
  console.log("🌐 Navegador obert. Anant a Suno...");
  await page.goto('https://suno.com/create', { waitUntil: 'networkidle2' });
  
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
    
    if (!page.url().includes('/create')) {
      await page.goto('https://suno.com/create', { waitUntil: 'networkidle2' });
    }

    await new Promise(r => setTimeout(r, 4000));
    
    // Tancar cookies si molesten
    const btns = await page.$$('button');
    for (const btn of btns) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.toLowerCase().includes('accept all')) {
        await btn.click().catch(() => {});
      }
    }

    // Activar mode lletres buscant el botó "+ Lyrics" o "Advanced"
    console.log("🔄 Buscant opció de lletres...");
    const allButtons = await page.$$('button, div[role="button"], span[role="button"], div.cursor-pointer');
    for (const btn of allButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && (text.includes('+ Lyrics') || text.includes('Advanced'))) {
        await btn.click().catch(() => {});
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

    // Títol
    const inputs = await page.$$('input');
    for (const input of inputs) {
      const ph = await page.evaluate(el => el.getAttribute('placeholder') || '', input);
      if (ph.toLowerCase().includes('title')) {
        await input.click({ clickCount: 3 });
        await page.keyboard.press('Backspace');
        await input.type('Sátira La Quinta Forca', { delay: 5 });
        break;
      }
    }

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

    console.log("⏳ Esperant la música (pot trigar fins a 2 minuts)...");

    
    // Esperem 15 segons inicials per donar temps a que aparegui a la llista
    await new Promise(r => setTimeout(r, 15000));
    
    let audioUrl = null;
    let attempts = 0;
    
    // Busquem etiquetes d'àudio a la pàgina periòdicament
    while (attempts < 60 && !audioUrl) {
      attempts++;
      await new Promise(r => setTimeout(r, 3000));
      
      const audios = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('audio')).map(a => a.src).filter(src => src && src.includes('suno'));
      });
      
      if (audios.length > 0) {
        // Agafem el més recent o el primer que surti
        audioUrl = audios[0];
        console.log(`🎉 Àudio trobat a la web! URL: ${audioUrl}`);
        break;
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
