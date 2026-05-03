import { NextResponse } from 'next/server';
// @ts-ignore
import Groq from 'groq-sdk';

export const runtime = 'edge';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

const genres = [
  'Tecno', 'Dembow', 'Sardana trap', 'Reggaeton', 'Death Metal',
  'Jazz upbeat', 'Rumba Catalana', 'Punk rock', 'Ska', 'Pop alegre'
];



export async function POST(request: Request) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return new Response(JSON.stringify({ error: 'Variable GROQ_API_KEY NOT FOUND a Vercel' }), { status: 500 });
    }

    const { guesses } = await request.json();

    // Generar prompt per a l'LLM
    const genre = genres[Math.floor(Math.random() * genres.length)];
    const prompt = `
      Ets un lletrista brillant, sarcàstic i humorístic. Has d'escriure la lletra d'una CANÇÓ SATÍRICA per riure't d'uns jugadors que han fet una partida pèssima a un joc d'endevinar on s'ha fet una foto al mapa.

      REGLES ESTRICTES DE FORMAT I CONTINGUT (CRÍTIQUES):
      1. ÉS OBLIGATORI INCLOURE ELS NOMS DELS LLOCS EXACTES que t'indico a les dades. Has de mencionar explícitament "El lloc real" i "On ha posat el pin" dins de la lletra.
      2. MAI, SOTA CAP CONCEPTE, facis servir números en dígits (ex: 32, 100). Escriu-los SEMPRE TOT EN LLETRES (ex: trenta-dos).
      3. MAI escriguis l'abreviatura "km". Has d'escriure sempre la paraula sencera: "quilòmetres".
      4. PROHIBIT utilitzar les paraules "Suno", "IA", "Bot", "Llama" o "oceà".
      5. NO t'inventis cap ciutat ni país que no estigui a les dades.

      CONTEXT DEL JOC I COM FER LA BROMA:
      Riu-te de la distància entre el lloc real i on ha posat el pin. 
      ATENCIÓ: Si el país real i el país on ha posat el pin SÓN EL MATEIX (per exemple, la foto era als Estats Units i ha posat el pin als Estats Units), la teva burla s'ha de centrar en com és possible fallar per tants quilòmetres sense sortir del mateix país!
      
      DADES REALS DE LA PARTIDA A INCLOURE OBLIGATÒRIAMENT:
      ${guesses}

      ESTRUCTURA OBLIGATÒRIA:
      Fes servir els tags: [Intro], [Verse], [Pre-Chorus], [Chorus], [Bridge], [Outro].
      
      RETORNA ÚNICAMENT LA LLETRA DE LA CANÇÓ. CAP COMENTARI.
    `;

    console.log("=== PROMPT GEOGRÀFIC ENVIAT A L'LLM ===");
    console.log(guesses);
    console.log("=======================================");

    // 1. Demanar Lletra a Groq (Llama 3)
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.8,
    });

    let lyrics = chatCompletion.choices[0]?.message?.content || 'Quin desastre de geògrafs, no trobeu ni casa vostra.';

    // Netejar possible brossa conversacional si l'LLM es despista
    lyrics = lyrics.replace(/tens una idea molt divertida/i, '').trim();
    lyrics = lyrics.replace(/^Aquí tens.*?:/gim, '').trim();
    // Assegurar-nos que comença amb un tag (ex: [Intro] o [Verse]) i no amb frases de presentació de la IA
    const firstBracketIndex = lyrics.indexOf('[');
    if (firstBracketIndex > 0) {
      lyrics = lyrics.substring(firstBracketIndex).trim();
    }

    // Retornem només la lletra i el gènere, el bot local s'encarregarà de cridar a Suno
    return new Response(JSON.stringify({ lyrics, genre }), { status: 200 });

  } catch (error: any) {
    console.error('Error a /api/generate-song:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

