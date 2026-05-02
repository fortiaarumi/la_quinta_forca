import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, child } from 'firebase/database';
import { readFileSync } from 'fs';

// Llegim les variables del .env.local
const envFile = readFileSync('.env.local', 'utf8');
const envLines = envFile.split('\n');
const env = {};
envLines.forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    env[key.trim()] = value.trim();
  }
});

const firebaseConfig = {
  apiKey: env['NEXT_PUBLIC_FIREBASE_API_KEY'],
  authDomain: env['NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'],
  databaseURL: env['NEXT_PUBLIC_FIREBASE_DATABASE_URL'],
  projectId: env['NEXT_PUBLIC_FIREBASE_PROJECT_ID'],
  storageBucket: env['NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'],
  messagingSenderId: env['NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'],
  appId: env['NEXT_PUBLIC_FIREBASE_APP_ID']
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

async function checkData() {
  const dbRef = ref(db);
  const snapshot = await get(child(dbRef, `rooms`));
  if (snapshot.exists()) {
    const rooms = snapshot.val();
    const roomIds = Object.keys(rooms);
    // Agafem l'última sala
    const latestRoomId = roomIds[roomIds.length - 1];
    const room = rooms[latestRoomId];
    
    console.log("=== ÚLTIMA SALA: " + latestRoomId + " ===");
    console.log("Game Mode: " + room.gameMode);
    
    // Check guesses
    if (room.rounds) {
      room.rounds.forEach((round, i) => {
        if (round.guesses) {
          console.log(`Ronda ${i + 1}:`);
          Object.entries(round.guesses).forEach(([playerId, guess]) => {
            console.log(`  Jugador ${playerId}: Distància: ${guess.distance}`);
            console.log(`    actualCountry: ${guess.actualCountry}`);
            console.log(`    guessCountry: ${guess.guessCountry}`);
          });
        }
      });
    }
    
    if (room.songState) {
        console.log("=== ÚLTIM PROMPT ===");
        console.log(room.songState.prompt);
    }
  } else {
    console.log("No data available");
  }
  process.exit(0);
}

checkData();
