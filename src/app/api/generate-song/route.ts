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
      Ets un lletrista mordaç i un comediant espectacular. Has d'escriure la lletra d'una CANÇÓ SATÍRICA i molt divertida per riure't d'uns jugadors que han fet una partida pèssima a un joc de geografia (han de situar una foto al mapa).

      ATENCIÓ - ESTIL MUSICAL: L'estil d'aquesta cançó serà "${genre}". 
      Has d'adaptar el vocabulari, l'actitud i el ritme de la lletra perquè encaixi PERFECTAMENT amb aquest gènere.

      CONTEXT DE LA BROMA (MOLT IMPORTANT):
      La gràcia de la cançó NO és inventar-se històries genèriques, sinó fer sang i riure's EXCLUSIVAMENT de la falta de punteria dels jugadors. 
      Fes befa de com de cecs estan, de com necessiten ulleres o una brúixola, i de la brutal quantitat de quilòmetres que han errat.

      DADES REALS DE LA PARTIDA (Utilitza NOMÉS aquests noms i llocs, NO t'inventis ciutats noves):
      ${guesses}

      REGLES ESTRICTES DE FORMAT:
      1. ÉS OBLIGATORI mencionar els noms dels jugadors i els llocs reals que apareixen a les dades.
      2. MAI, SOTA CAP CONCEPTE, facis servir números en dígits (ex: 32, 100). Escriu-los SEMPRE TOT EN LLETRES (ex: trenta-dos).
      3. MAI escriguis l'abreviatura "km". Has d'escriure sempre la paraula sencera: "quilòmetres".
      4. PROHIBIT utilitzar les paraules "Suno", "IA", "Bot", "Llama" o "oceà".
      
      ESTRUCTURA OBLIGATÒRIA (Més curta i directa):
      Has de fer la cançó més breu. Utilitza NOMÉS aquests tags exactes en aquest ordre:
      [Intro]
      [Verse 1]
      [Chorus]
      [Verse 2]
      [Chorus]
      [Outro]
      
      RETORNA ÚNICAMENT LA LLETRA DE LA CANÇÓ. CAP COMENTARI PREVI NI POSTERIOR.
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

