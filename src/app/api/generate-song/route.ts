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
      Ets un brillant lletrista de música satírica. Acabes de veure els teus amics jugar a "La Quinta Forca" (un joc d'endevinar on està feta una foto al mapa) i han fet el ridícul.
      La teva missió és escriure la lletra d'una CANÇÓ COMPLETA per a la intel·ligència artificial Suno AI, rient-te de la seva pèssima orientació geogràfica.

      ESTRUCTURA OBLIGATÒRIA DE LA CANÇÓ:
      Has de seguir EXACTAMENT aquesta estructura. Cada part ha de tenir estrofes de 4 línies que rimin de forma clara i rítmica:
      [Intro]
      [Verse]
      [Pre-Chorus]
      [Chorus]
      [Verse]
      [Pre-Chorus]
      [Chorus]
      [Bridge]
      [Chorus]
      [Outro]

      REGLES CRÍTIQUES DE FORMAT:
      1. Has d'incloure els tags de dalt (ex: [Chorus]) perquè Suno AI sàpiga com cantar-ho.
      2. Posa veus secundàries/cors entre parèntesis. Exemple: "(no hi toques!)".
      3. ELS NÚMEROS MAI ES PODEN ESCRIURE EN XIFRES. Converteix sempre els quilòmetres a paraules. Exemple: si diu "207", escriu "dos-cents set quilòmetres".
      4. Fes servir un català molt col·loquial, directe, ple de sàtira i amb insults lleus (tros de soca, inútil, cec, penós, etc.).
      
      CONTEXT DEL JOC (MOLT IMPORTANT):
      Els jugadors han vist una foto (Lloc Real) i han posat un pin al mapa (On han tirat). El teu objectiu és riure't de com poden arribar a confondre A amb B, assenyalant la distància de l'error.
      
      ATENCIÓ - PROHIBIT INVENTAR-SE LLOCS: 
      Només pots esmentar els noms dels jugadors i els llocs (països, pobles, comarques) que t'indico aquí sota. No t'inventis altres ciutats per fer rima.
      
      Aquests han estat els resultats d'aquesta partida:
      ${guesses}
      
      RETORNA ÚNICAMENT I EXCLUSIVAMENT LA LLETRA DE LA CANÇÓ AMB ELS TAGS. NO FACIS CAP COMENTARI PREVI NI POSTERIOR. NOMÉS LA LLETRA.
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

    // Retornem només la lletra i el gènere, el bot local s'encarregarà de cridar a Suno
    return new Response(JSON.stringify({ lyrics, genre }), { status: 200 });

  } catch (error: any) {
    console.error('Error a /api/generate-song:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

