'use client';

import { useState, useEffect, useRef } from 'react';
import { ref, onValue, update } from 'firebase/database';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/authContext';
import { sendFriendRequest } from '@/lib/friendUtils';
import { Room } from '@/lib/types';
import { useAudio } from '@/lib/AudioContext';
import confetti from 'canvas-confetti';
import { useRouter } from 'next/navigation';

interface Props {
  roomId: string;
  room: Room;
  playerId: string;
  onRestart: () => void; // 👈 AFEGIT: Funció per reiniciar la partida
  isHost: boolean;       // 👈 AFEGIT: Saber si soc l'amfitrió
}

const MAX_SCORE = 25000;

export default function FinalResults({ roomId, room, playerId, onRestart, isHost }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [myFriends, setMyFriends] = useState<string[]>([]);
  const [friendReqSent, setFriendReqSent] = useState<Record<string, boolean>>({});
  const [songVolume, setSongVolume] = useState(1);
  const { playCelebration, playDecepcion, stopAllMusic } = useAudio();
  const [grayscale, setGrayscale] = useState(false);
  const songRef = useRef<HTMLAudioElement | null>(null);
  const [songCurrentTime, setSongCurrentTime] = useState(0);
  const [songDuration, setSongDuration] = useState(0);

  // Manual d'instal·lació
  const [showManual, setShowManual] = useState(false);
  const [manualTab, setManualTab] = useState<'windows' | 'mac' | 'linux'>('windows');

  // Estat del bot de comunitat
  const [botAlive, setBotAlive] = useState(false);
  const [botCredits, setBotCredits] = useState<number | null>(null);

  // Escolta l'estat del bot a Firebase
  useEffect(() => {
    const botStatusRef = ref(db, 'system/bot_status');
    const unsub = onValue(botStatusRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const now = Date.now();
        // Bot actiu si el last_seen és de fa menys de 30 segons
        const isAlive = data.last_seen && (now - data.last_seen < 30000);
        setBotAlive(isAlive);
        setBotCredits(data.credits ?? null);
      } else {
        setBotAlive(false);
      }
    });

    // Validació cada 5 segons per si el bot mor de cop i Firebase no canvia
    const interval = setInterval(() => {
      setBotAlive(prev => prev); // Forçar re-avaluació si cal, encara que el listener ho fa
    }, 5000);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    const friendsRef = ref(db, `users/${user.uid}/friends`);
    const unsub = onValue(friendsRef, (snap) => {
      if (snap.exists()) setMyFriends(Object.keys(snap.val()));
    });
    return () => unsub();
  }, [user]);

  const sorted = Object.entries(room.players)
    .map(([id, player]) => ({
      id,
      name: player.name,
      score: room.totalScores?.[id] ?? 0,
      isAdmin: (player as any).isAdmin, // Afegim això!
    }))
    .sort((a, b) => b.score - a.score);

  const winner = sorted[0];
  const iWon = winner?.id === playerId;

  useEffect(() => {
    // Aturem la música general
    stopAllMusic();

    if (iWon) {
      playCelebration();
      // Confeti durant 5 segons
      const duration = 5 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: Math.random(), y: Math.random() - 0.2 } }));
      }, 250);
      
      return () => clearInterval(interval);
    } else {
      playDecepcion();
      // Blanc i negre durant 5 segons
      setGrayscale(true);
      const timeout = setTimeout(() => {
        setGrayscale(false);
      }, 5000);
      
      return () => clearTimeout(timeout);
    }
  }, [iWon, playCelebration, playDecepcion, stopAllMusic]);

  // Lògica de la Cançó Satírica
  const handleGenerateSong = async () => {
    if (!isHost) return;
    try {
      await update(ref(db, `rooms/${roomId}/songState`), { status: 'generating_lyrics', error: null });
      
      // Recopilar les pitjors tirades per al prompt
      const guesses = Object.entries(room.players).map(([id, p]) => {
        let maxDist = 0;
        let worstGuessCountry = '';
        let worstActualCountry = '';
        for (let i = 0; i < 5; i++) {
          const guessObj = room.rounds?.[i]?.guesses?.[id];
          if (guessObj && guessObj.distance > maxDist) {
            maxDist = guessObj.distance;
            worstGuessCountry = guessObj.guessCountry || "lloc desconegut";
            worstActualCountry = guessObj.actualCountry || "lloc desconegut";
          }
        }
        if (maxDist > 0) {
          return `- Jugador: ${p.name}\n  Lloc de la foto: ${worstActualCountry}\n  On ha posat el pin: ${worstGuessCountry}\n  Distància de l'error: ${Math.round(maxDist)} quilòmetres\n`;
        }
        return `- Jugador: ${p.name} (ha jugat perfecte i no ha fallat gens)\n`;
      }).join('\\n');

      const res = await fetch('/api/generate-song', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guesses })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error desconegut al generar la cançó');
      }

      await update(ref(db, `rooms/${roomId}/songState`), { 
        status: 'waiting_for_bot', 
        lyrics: data.lyrics,
        genre: data.genre,
        prompt: guesses // Passem el prompt original per si el bot el necessita
      });
    } catch (err: any) {
      await update(ref(db, `rooms/${roomId}/songState`), { status: 'error', error: err.message });
    }
  };

  // Polling ja no cal, el bot actualitzarà Firebase directament


  const handlePlaySong = async () => {
    if (!isHost) return;
    await update(ref(db, `rooms/${roomId}/songState`), { status: 'playing' });
  };

  // Sincronització de la reproducció per a tots
  useEffect(() => {
    if (room.songState?.status === 'playing' && room.songState?.audioUrl) {
      stopAllMusic(); // Parem la música de fons
      if (!songRef.current) {
        songRef.current = new Audio(room.songState.audioUrl);
      }
      
      const audio = songRef.current;
      
      const updateTime = () => setSongCurrentTime(audio.currentTime);
      const updateDuration = () => setSongDuration(audio.duration);
      
      audio.addEventListener('timeupdate', updateTime);
      audio.addEventListener('loadedmetadata', updateDuration);
      
      audio.volume = songVolume;
      audio.play().catch(e => console.error("Auto-play prevengut pel navegador", e));
      
      return () => {
        audio.removeEventListener('timeupdate', updateTime);
        audio.removeEventListener('loadedmetadata', updateDuration);
      };
    } else if (songRef.current) {
      songRef.current.pause();
    }
  }, [room.songState?.status, room.songState?.audioUrl, stopAllMusic, songVolume]);

  useEffect(() => {
    if (songRef.current) songRef.current.volume = songVolume;
  }, [songVolume]);

  const formatTime = (time: number) => {
    if (!time || isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 text-white flex flex-col items-center justify-center p-8 transition-all duration-1000"
      style={{ filter: grayscale ? 'grayscale(100%)' : 'grayscale(0%)' }}
    >
      <div className="w-full max-w-md">
        {/* Capçalera */}
        <div className="text-center mb-10">
          <div className="text-8xl mb-4 drop-shadow-2xl">{iWon ? '🏆' : '🌍'}</div>
          <h1 className="text-5xl font-black mb-2">Fi del Joc!</h1>
          <p className="text-gray-400 text-xl">
            {iWon
              ? 'Has guanyat! Quines habilitats geogràfiques!'
              : `${winner?.name} guanya!`}
          </p>
        </div>

        {/* Classificació */}
        <div className="space-y-4 mb-10">
          {sorted.map((p, i) => {
            const isMe = p.id === playerId;
            const pct = Math.min(100, Math.round((p.score / MAX_SCORE) * 100));
            const medals = ['🥇', '🥈', '🥉'];
            return (
              <div
                key={p.id}
                className={`rounded-2xl p-5 transition-all ${
                  isMe
                    ? 'bg-gradient-to-r from-yellow-500/15 to-green-500/15 border-2 border-yellow-500/40 shadow-xl'
                    : 'bg-gray-800 border border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{medals[i] ?? '🎮'}</span>
                    <div>
                      <div className="font-black text-xl flex items-center gap-2">
                        {p.name} 
                        {p.isAdmin && <span className="text-[10px] bg-red-600 text-white px-2 py-1 rounded-md font-black uppercase tracking-widest shadow-[0_0_15px_rgba(220,38,38,0.5)]">👑 ADMIN</span>}
                      </div>
                      {isMe && <div className="text-xs text-gray-400">Tu</div>}
                      {/* 👈 AFEGIT: Botó d'afegir amic a la pantalla final */}
                      {user && !isMe && !myFriends.includes(p.id) && (
                        <button
                          onClick={async () => {
                            await sendFriendRequest(user.uid, p.id);
                            setFriendReqSent(prev => ({ ...prev, [p.id]: true }));
                          }}
                          disabled={friendReqSent[p.id]}
                          className={`mt-1 text-[9px] uppercase font-black px-2 py-1 rounded transition-all ${
                            friendReqSent[p.id] ? 'bg-emerald-500/20 text-emerald-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg active:scale-95'
                          }`}
                        >
                          {friendReqSent[p.id] ? '✓ Petició Enviada' : '+ Afegir Amic'}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-black text-yellow-400">
                      {p.score.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">/ 25.000 pts</div>
                  </div>
                </div>
                {/* Barra de progrés */}
                <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-green-500 to-emerald-400"
                    style={{ width: `${pct}%`, transition: 'width 1s ease-out' }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* ── NOU: GRUP DE BOTONS I CANÇÓ ── */}
        <div className="flex flex-col gap-3">
          
          {/* SECCIÓ CANÇÓ SATÍRICA */}
          <div className="bg-gray-800/80 p-4 rounded-xl border border-gray-700 mt-2 text-center shadow-inner">
            {!room.songState || room.songState.status === 'idle' ? (
              isHost ? (
                botAlive && (botCredits === null || botCredits > 0) ? (
                  <button
                    onClick={handleGenerateSong}
                    className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 text-white font-bold py-3 rounded-lg text-sm transition-all uppercase tracking-wider shadow-lg"
                  >
                    🎵 Generar Cançó Satírica (Gratis)
                  </button>
                ) : (
                  <div className="flex flex-col gap-2">
                    <button disabled className="w-full bg-gray-700 text-gray-500 font-bold py-3 rounded-lg text-sm uppercase tracking-wider cursor-not-allowed">
                      {!botAlive ? '💤 Bot Apagat (Terminal no activa)' : '💳 Bot Sense Crèdits a Suno'}
                    </button>
                    
                    <div className="mt-3 p-3 bg-indigo-900/40 border border-indigo-700/50 rounded-lg text-left text-sm text-indigo-200">
                      <p className="font-bold mb-1 flex items-center gap-2">
                        <span>💡</span> Vols generar cançons tu mateix?
                      </p>
                      <p className="text-xs opacity-80 mb-2">
                        Aquest joc és open-source! Qualsevol jugador pot fer de servidor per generar música.
                      </p>
                      <button 
                        onClick={() => setShowManual(true)}
                        className="text-[10px] bg-indigo-500 hover:bg-indigo-400 text-white px-3 py-1.5 rounded-md font-black uppercase tracking-widest transition-all active:scale-95 mb-2"
                      >
                        📖 Llegir Manual d'Instal·lació
                      </button>
                      <p className="text-[10px] italic text-indigo-400">
                        Un cop engegat, aquest botó es posarà verd per a tothom automàticament!
                      </p>
                    </div>
                  </div>
                )
              ) : (
                <div className="text-gray-500 text-xs italic">
                  El Host pot generar una cançó satírica si el Bot està actiu.
                </div>
              )
            ) : null}

            {/* MODAL MANUAL D'INSTAL·LACIÓ */}
            {showManual && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl shadow-indigo-500/20">
                  <div className="p-6 border-b border-white/10 flex justify-between items-center bg-indigo-900/20">
                    <h2 className="text-2xl font-black text-white">Manual d'Instal·lació del Bot 🤖</h2>
                    <button onClick={() => setShowManual(false)} className="text-gray-400 hover:text-white text-3xl leading-none">×</button>
                  </div>
                  
                  <div className="flex bg-slate-800/50 p-1 m-4 rounded-xl border border-white/5">
                    {(['windows', 'mac', 'linux'] as const).map(os => (
                      <button
                        key={os}
                        onClick={() => setManualTab(os)}
                        className={`flex-1 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${manualTab === os ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                      >
                        {os}
                      </button>
                    ))}
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 pt-0 text-left space-y-6 text-gray-300 text-sm leading-relaxed">
                    <section>
                      <h3 className="text-indigo-400 font-black uppercase tracking-wider text-xs mb-3 flex items-center gap-2">
                        <span className="bg-indigo-500/20 p-1 rounded">1</span> Requisits Previs
                      </h3>
                      <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-3">
                        {manualTab === 'windows' && (
                          <>
                            <p>• <strong>Node.js:</strong> Descarrega l'instal·lador "LTS" a <a href="https://nodejs.org/" target="_blank" className="text-emerald-400 underline">nodejs.org</a> i instal·la'l (següent, següent...).</p>
                            <p>• <strong>Git:</strong> Descarrega Git a <a href="https://git-scm.com/download/win" target="_blank" className="text-emerald-400 underline">git-scm.com</a>.</p>
                          </>
                        )}
                        {manualTab === 'mac' && (
                          <>
                            <p>• <strong>Node.js:</strong> Instal·la'l des de <a href="https://nodejs.org/" target="_blank" className="text-emerald-400 underline">nodejs.org</a> (pkg) o via Homebrew (<code>brew install node</code>).</p>
                            <p>• <strong>Git:</strong> Normalment ja ve amb Xcode, si no: <code>brew install git</code>.</p>
                          </>
                        )}
                        {manualTab === 'linux' && (
                          <>
                            <p>• <strong>Node.js:</strong> <code>sudo apt update && sudo apt install nodejs npm</code></p>
                            <p>• <strong>Git:</strong> <code>sudo apt install git</code></p>
                          </>
                        )}
                      </div>
                    </section>

                    <section>
                      <h3 className="text-indigo-400 font-black uppercase tracking-wider text-xs mb-3 flex items-center gap-2">
                        <span className="bg-indigo-500/20 p-1 rounded">2</span> Descarregar el Repositori
                      </h3>
                      <p>Obre la teva terminal (CMD o PowerShell a Windows, Terminal a Mac/Linux) i escriu:</p>
                      <pre className="bg-black p-3 rounded-lg border border-white/10 text-xs text-emerald-400 overflow-x-auto">
                        git clone https://github.com/fortiaarumi/la_quinta_forca.git{"\n"}
                        cd la_quinta_forca{"\n"}
                        npm install
                      </pre>
                    </section>

                    <section>
                      <h3 className="text-indigo-400 font-black uppercase tracking-wider text-xs mb-3 flex items-center gap-2">
                        <span className="bg-indigo-500/20 p-1 rounded">3</span> Configurar la connexió
                      </h3>
                      <div className="space-y-3">
                        <p>Aquesta nova versió del bot no necessita cookies complicades, sinó que <strong>obrirà el navegador sol per tu</strong>!</p>
                        <p className="mt-4">A la carpeta del joc, crea un fitxer nou i anomena'l <strong>exactament</strong> <code>.env.local</code>. Obre'l i enganxa-hi això (les teves claus de Firebase de la partida):</p>
                        <pre className="bg-black p-3 rounded-lg border border-white/10 text-[10px] text-indigo-300 overflow-x-auto whitespace-pre">
{`NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAAnY3p5bGIah3-yPeT3nqFslfcvgnUS58
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=onsom-dade5.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://onsom-dade5-default-rtdb.europe-west1.firebasedatabase.app
NEXT_PUBLIC_FIREBASE_PROJECT_ID=onsom-dade5
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=onsom-dade5.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=812916118386
NEXT_PUBLIC_FIREBASE_APP_ID=1:812916118386:web:136e4c7504a00340db43eb`}
                        </pre>
                      </div>
                    </section>

                    <section>
                      <h3 className="text-indigo-400 font-black uppercase tracking-wider text-xs mb-3 flex items-center gap-2">
                        <span className="bg-indigo-500/20 p-1 rounded">4</span> Executar el Bot de Navegador Automàtic
                      </h3>
                      <p>Torna a la terminal i posa el bot en marxa amb aquest comandament:</p>
                      <pre className="bg-black p-3 rounded-lg border border-white/10 text-xs text-emerald-400">
                        node --env-file=.env.local suno-puppeteer.mjs
                      </pre>
                      <p className="text-xs text-yellow-400 mt-2 font-bold">⚠️ EL PRIMER COP QUE L'OBRIS:</p>
                      <ol className="text-xs text-gray-400 list-decimal pl-5 space-y-1">
                        <li>S'obrirà una finestra de Google Chrome automàticament.</li>
                        <li>Has d'anar-hi i iniciar sessió a Suno.com manualment.</li>
                        <li>A partir de llavors, ja pots minimitzar-la. El bot mourà el ratolí sol quan calgui fer una cançó!</li>
                      </ol>
                      <p className="text-xs text-gray-500 mt-2 italic">⚠️ No tanquis la terminal mentre vulguis que el bot estigui actiu!</p>
                    </section>
                  </div>
                  
                  <div className="p-6 border-t border-white/10 bg-indigo-900/10 flex justify-center">
                    <button 
                      onClick={() => setShowManual(false)}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-black px-10 py-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-indigo-500/30 uppercase tracking-widest text-xs"
                    >
                      Entès, ho tinc! 🚀
                    </button>
                  </div>
                </div>
              </div>
            )}

            {room.songState?.status === 'generating_lyrics' && (
              <div className="text-indigo-400 font-bold animate-pulse text-sm">✍️ Escrivint lletra satírica...</div>
            )}

            {room.songState?.status === 'waiting_for_bot' && (
              <div className="text-blue-400 font-bold animate-pulse text-sm flex flex-col items-center gap-2">
                <span>🤖 Enviant instruccions al Bot de la Comunitat...</span>
                <span className="text-xs text-gray-500">Comprovant connexió local</span>
              </div>
            )}

            {room.songState?.status === 'generating_music' && (
              <div className="text-purple-400 font-bold animate-pulse text-sm flex flex-col items-center gap-2">
                <span>🎧 Composant la música ({room.songState.genre})...</span>
                <span className="text-xs text-gray-500">Això pot trigar uns minuts!</span>
              </div>
            )}

            {room.songState?.status === 'ready' && isHost && (
              <button
                onClick={handlePlaySong}
                className="w-full bg-green-600 hover:bg-green-500 active:scale-95 text-white font-bold py-3 rounded-lg text-sm transition-all uppercase tracking-wider shadow-lg shadow-green-500/20"
              >
                ▶️ Reproduir Cançó
              </button>
            )}
            
            {room.songState?.status === 'ready' && !isHost && (
              <div className="text-green-400 font-bold text-sm">🎵 La cançó està llesta! Esperant que el Host la reprodueixi...</div>
            )}

            {room.songState?.status === 'playing' && (
              <div className="text-left w-full mt-2 bg-black/40 p-4 rounded-lg">
                <div className="text-green-400 font-bold text-center mb-2 animate-pulse">🔊 Sonant ara: Sàtira {room.songState.genre}</div>
                
                {/* Progress bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>{formatTime(songCurrentTime)}</span>
                    <span>{formatTime(songDuration)}</span>
                  </div>
                  <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-green-500 h-full transition-all duration-300 ease-linear"
                      style={{ width: `${songDuration > 0 ? (songCurrentTime / songDuration) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4 justify-center">
                  <button 
                    onClick={() => {
                      if (songRef.current) {
                        songRef.current.currentTime = 0;
                        songRef.current.play();
                      }
                    }}
                    className="mr-2 text-xs bg-indigo-600 hover:bg-indigo-500 px-3 py-1 rounded-full text-white transition-colors font-bold shadow-md shadow-indigo-500/20"
                    title="Tornar a reproduir"
                  >
                    🔄 Repetir
                  </button>
                  <span className="text-xs text-gray-400">Volum:</span>
                  <input 
                    type="range" 
                    min="0" max="1" step="0.01" 
                    value={songVolume} 
                    onChange={(e) => setSongVolume(parseFloat(e.target.value))}
                    className="w-24 accent-purple-500"
                  />
                  {room.songState.audioUrl && (
                    <a href={room.songState.audioUrl} download="satira.mp3" target="_blank" rel="noopener noreferrer" className="ml-2 text-xs bg-gray-700 hover:bg-gray-600 px-2 py-1 rounded text-white transition-colors">
                      ⬇️ MP3
                    </a>
                  )}
                </div>
                <div className="text-gray-300 text-xs italic whitespace-pre-line text-center">
                  {room.songState.lyrics}
                </div>
              </div>
            )}

            {room.songState?.status === 'error' && (
              <div className="flex flex-col gap-3 w-full text-left bg-black/40 p-4 rounded-lg border border-red-500/30 mt-2">
                <div className="text-red-400 font-bold text-sm text-center mb-1">❌ El bot de Suno ha fallat</div>
                <div className="text-gray-400 text-xs text-center italic mb-2">{room.songState.error}</div>
                
                {room.songState.lyrics && (
                  <>
                    <div className="text-indigo-300 text-xs text-center border-t border-white/10 pt-3 mb-2">
                      No pateixis! Aquí tens la lletra i l'estil per crear-la tu mateix a Suno.com:
                    </div>
                    <div className="bg-gray-900 p-3 rounded border border-gray-700">
                      <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-black">Estil Musical (Style of Music):</div>
                      <div className="text-sm text-emerald-400 font-bold mb-3 select-all cursor-pointer hover:bg-emerald-400/10 p-1 rounded transition-colors">{room.songState.genre}</div>
                      
                      <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1 font-black">Lletra (Lyrics):</div>
                      <div className="text-xs text-gray-300 italic whitespace-pre-line select-all cursor-pointer font-mono bg-black/50 p-2 rounded hover:bg-black/80 transition-colors">
                        {room.songState.lyrics}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {isHost ? (
            <button
              onClick={onRestart}
              className="w-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white font-black py-4 rounded-xl text-lg transition-all shadow-xl shadow-emerald-500/20 uppercase tracking-wide border-b-4 border-emerald-700"
            >
              🔄 Jugar de nou la revenja!
            </button>
          ) : (
            <div className="w-full bg-gray-800 border border-gray-700 text-gray-400 font-bold py-4 rounded-xl text-sm text-center uppercase tracking-wide">
              ⏳ Esperant l'amfitrió...
            </div>
          )}

          <button
            onClick={() => router.push('/')}
            className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 active:scale-95 text-white font-bold py-4 rounded-xl text-sm transition-all uppercase tracking-widest text-gray-400 hover:text-white"
          >
            🏠 Tornar a l'inici
          </button>
        </div>
      </div>
    </div>
  );
}