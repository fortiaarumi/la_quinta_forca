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

      REGLES ESTRICTES DE FORMAT (CRÍTIQUES PER PODER-HO CANTAR BÉ):
      1. MAI, SOTA CAP CONCEPTE, facis servir números en dígits (ex: 32, 100, 5000). Escriu-los SEMPRE TOT EN LLETRES (ex: trenta-dos, cent, cinc mil).
      2. MAI escriguis l'abreviatura "km". Has d'escriure sempre la paraula sencera: "quilòmetres".
      3. PROHIBIT utilitzar les paraules "Suno", "IA", "Bot", "Llama" o "oceà". Parla només dels jugadors i els seus errors de geografia.
      4. El to ha de ser una sàtira intel·ligent, irònica i divertida en català col·loquial, sense caure en insults infantils o repetitius. Fes rimes enginyoses.

      CONTEXT DEL JOC:
      Riu-te de com el jugador ha confós el "Lloc de la foto real" amb "On ha posat el pin el jugador". Fes befa de la distància cega en quilòmetres.
      
      DADES REALS DE LA PARTIDA (Utilitza NOMÉS aquests noms i llocs, NO t'inventis ciutats noves per fer rima):
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

