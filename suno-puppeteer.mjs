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
  console.log("🚀 Iniciant navegador Chrome...");
  browser = await puppeteer.launch({
    headless: false, // Ha de ser false per evitar bloquejos i permetre a l'usuari fer el primer login
    userDataDir: './suno-chrome-profile', // Guarda la sessió per no haver de fer login cada cop
    defaultViewport: null,
    args: ['--start-maximized']
  });
  
  page = await browser.newPage();
  
  // Interceptar respostes de xarxa per pescar l'àudio
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/api/feed/') || url.includes('/api/generate/')) {
      // Això ho deixem per si cal debugar, però Suno canvia molt les rutes
    }
  });

  console.log("🌐 Navegador obert. Anant a Suno...");
  await page.goto('https://suno.com/create', { waitUntil: 'networkidle2' });
  
  console.log("\n=======================================================");
  console.log("⚠️ ATENCIÓ: Si és el teu primer cop, has de fer LOGIN a Suno manualment a la finestra que s'ha obert!");
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
    
    // Indicar que estem treballant
    await update(ref(db, `rooms/${roomId}/songState`), { status: 'generating_music' });
    console.log(`📝 Processant cançó per a la sala ${roomId}. Gènere: ${songState.genre}`);
    
    // 1. Assegurar-nos que estem a la pàgina de creació
    if (!page.url().includes('/create')) {
      await page.goto('https://suno.com/create', { waitUntil: 'networkidle2' });
    }

    // Esperar a que la pàgina carregui bé
    await new Promise(r => setTimeout(r, 3000));
    
    // 2. Comprovar si estem en mode "Custom" (Lletres personalitzades)
    // El botó de Custom ha d'estar activat.
    const customSwitchSelector = 'button[role="switch"]'; // Suno sol tenir un switch o botó per Custom Mode
    // Comprovem si hi ha un textarea per a lletres (lyrics)
    let hasLyricsArea = await page.$('textarea[placeholder*="Lyrics"]');
    
    if (!hasLyricsArea) {
      console.log("🔄 Activant mode Custom (Lletres)...");
      // Intentar fer clic al botó de 'Custom' (això depèn molt del disseny de Suno)
      // Busquem un botó que digui 'Custom'
      const customButtons = await page.$$('button');
      for (const btn of customButtons) {
        const text = await page.evaluate(el => el.textContent, btn);
        if (text && text.toLowerCase().includes('custom')) {
          await btn.click();
          await new Promise(r => setTimeout(r, 1000));
          break;
        }
      }
    }

    // Tornem a buscar l'àrea de text
    hasLyricsArea = await page.$('textarea[placeholder*="Lyrics"]');
    if (!hasLyricsArea) {
      throw new Error("No s'ha trobat el quadre de text per posar la lletra. Pots haver de fer login o l'interfície de Suno ha canviat.");
    }

    // 3. Omplir la lletra
    console.log("✍️ Escrivint lletra...");
    // Buidar l'àrea primer
    await page.click('textarea[placeholder*="Lyrics"]', { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type('textarea[placeholder*="Lyrics"]', songState.lyrics, { delay: 10 });
    
    // 4. Omplir l'estil (Genre)
    console.log("🎸 Escrivint estil...");
    const styleInputs = await page.$$('input[placeholder*="Style"], input[placeholder*="Genre"]');
    if (styleInputs.length > 0) {
      await styleInputs[0].click({ clickCount: 3 });
      await styleInputs[0].press('Backspace');
      await styleInputs[0].type(songState.genre, { delay: 10 });
    } else {
      console.log("⚠️ No s'ha trobat l'input d'estil, provant textareas genèriques...");
    }

    // 5. Títol de la cançó
    const titleInputs = await page.$$('input[placeholder*="Title"]');
    if (titleInputs.length > 0) {
      await titleInputs[0].click({ clickCount: 3 });
      await titleInputs[0].press('Backspace');
      await titleInputs[0].type('Sátira de La Quinta Forca', { delay: 10 });
    }

    // 6. Fer clic a Generate / Create
    console.log("▶️ Fent clic a Crear Cançó...");
    let clicked = false;
    const generateButtons = await page.$$('button');
    for (const btn of generateButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && (text.toLowerCase().includes('create') || text.toLowerCase().includes('generate'))) {
        await btn.click();
        clicked = true;
        break;
      }
    }
    
    if (!clicked) throw new Error("No s'ha trobat el botó de generar.");

    // 7. Esperar a que l'àudio aparegui
    console.log("⏳ Esperant a que Suno acabi de generar la música (pot trigar fins a 2-3 minuts)...");
    
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
