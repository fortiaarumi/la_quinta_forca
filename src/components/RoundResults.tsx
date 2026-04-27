'use client';

import { useEffect, useRef } from 'react';
import { Room } from '@/lib/types';

interface Props {
  room: Room;
  round: number;
  isHost: boolean;
  playerId: string;
  onNext: () => void;
  mapsReady: boolean;
}

const COLORS = ['#EF4444', '#3B82F6', '#10B981', '#F59E0B'];

export default function RoundResults({ room, round, isHost, playerId, onNext, mapsReady }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const actual = room.locations?.[round];
  const guesses = room.rounds?.[round]?.guesses ?? {};
  const playerIds = Object.keys(room.players);

  useEffect(() => {
    if (!mapRef.current || !mapsReady || !actual) return;

    const actualLatLng = new google.maps.LatLng(actual.lat, actual.lng);
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(actualLatLng);

    const map = new google.maps.Map(mapRef.current, {
      zoom: 3,
      center: actualLatLng,
      disableDefaultUI: true,
      zoomControl: true,
      mapTypeId: google.maps.MapTypeId.TERRAIN,
    });

    // Marcador de la ubicació real (estrella groga)
    new google.maps.Marker({
      position: actualLatLng,
      map,
      zIndex: 10,
      title: 'Ubicació real',
      icon: {
        path: 'M 0,-15 L 3.5,-5 L 14,-5 L 5.5,2 L 8.5,13 L 0,7 L -8.5,13 L -5.5,2 L -14,-5 L -3.5,-5 Z',
        fillColor: '#FBBF24',
        fillOpacity: 1,
        strokeColor: '#92400E',
        strokeWeight: 1.5,
        scale: 1.2,
        anchor: new google.maps.Point(0, 0),
      },
    });

    // Marcadors i línies de cada jugador
    playerIds.forEach((pid, i) => {
      const guess = guesses[pid];
      if (!guess) return;
      const guessLatLng = new google.maps.LatLng(guess.lat, guess.lng);
      bounds.extend(guessLatLng);
      const color = COLORS[i % COLORS.length];

      new google.maps.Marker({
        position: guessLatLng,
        map,
        zIndex: 5,
        title: room.players[pid]?.name,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 9,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2.5,
        },
      });

      new google.maps.Polyline({
        path: [guessLatLng, actualLatLng],
        map,
        strokeColor: color,
        strokeOpacity: 0.85,
        strokeWeight: 2.5,
        geodesic: true,
      });
    });

    map.fitBounds(bounds, 80);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapsReady, actual]);

  if (!actual) return null;

  return (
    <div className="flex flex-col h-screen bg-gray-900">
      {/* Mapa de resultats */}
      <div ref={mapRef} className="flex-1 min-h-0" />

      {/* Panell de puntuacions */}
      <div className="bg-gray-900 border-t border-gray-700/50 p-5 flex-shrink-0">
        <h2 className="text-white text-xl font-black text-center mb-1">
          Resultats — Ronda {round + 1}
        </h2>
        <p className="text-gray-500 text-xs text-center mb-4 font-mono">
          {actual.lat.toFixed(4)}, {actual.lng.toFixed(4)}
        </p>

        {/* Targetes de jugadors */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {playerIds.map((pid, i) => {
            const guess = guesses[pid];
            const player = room.players[pid];
            const color = COLORS[i % COLORS.length];
            const isMe = pid === playerId;
            return (
              <div
                key={pid}
                className={`rounded-xl p-4 ${isMe ? 'ring-2 ring-white/20' : ''}`}
                style={{ background: `${color}18`, borderLeft: `3px solid ${color}` }}
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-white font-bold text-sm truncate">
                    {player?.name}{isMe ? ' (Tu)' : ''}
                  </span>
                </div>
                {guess ? (
                  <>
                    <div className="text-gray-400 text-xs">
                      {Math.round(guess.distance).toLocaleString()} km
                    </div>
                    <div className="text-yellow-400 font-black text-xl">
                      +{guess.score.toLocaleString()}
                    </div>
                  </>
                ) : (
                  <div className="text-gray-500 text-xs italic">Sense endevinança</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Total acumulat */}
        <div className="bg-gray-800 rounded-xl p-3 mb-4 flex justify-around">
          {playerIds.map((pid) => (
            <div key={pid} className="text-center">
              <div className="text-gray-400 text-xs mb-1">{room.players[pid]?.name}</div>
              <div className="text-yellow-400 font-black text-lg">
                {(room.totalScores?.[pid] ?? 0).toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        {/* Botó / espera */}
        {isHost ? (
          <button
            onClick={onNext}
            className="w-full bg-green-500 hover:bg-green-400 active:scale-[0.98] text-white font-black py-3.5 rounded-xl text-lg transition-all shadow-lg shadow-green-500/20"
          >
            {round >= 4 ? '🏆 Resultats Finals' : 'Ronda Següent →'}
          </button>
        ) : (
          <div className="text-center text-gray-500 py-3.5 text-sm">
            Esperant que el host continuï...
          </div>
        )}
      </div>
    </div>
  );
}
