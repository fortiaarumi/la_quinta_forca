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
      Ets un amic molt cabró i sarcàstic que acaba de jugar a "La Quinta Forca" (un joc de localitzar llocs al mapa). 
      Escriu la lletra d'una cançó per riure't sense pietat a la cara dels jugadors per la seva ignorància geogràfica.
      La lletra ha de tenir entre 8 i 12 línies ben rítmiques i que RIMIN de forma clara i directa.
      IMPORTANT: Sigues descriptiu, directe i molt brètol amb els errors concrets. NO siguis filosòfic ni poètic. Has de ser molt col·loquial, insultant la seva pèssima orientació.
      
      ATENCIÓ: Jo et donaré a sota els quilòmetres reals que han fallat i LES ZONES REALS (poden ser països, comarques o ciutats) on era la foto i on han tirat ells.
      Fes sàtira fent servir aquests noms reals per riure-te'n de com algú pot confondre X amb Y.
      Menciona ELS LLOCS EXACTES que et passo en la teva lletra.
      PROHIBIT INVENTAR-SE ALTRES LLOCS: Si jo no esmento un poble, comarca o país concret, NO l'afegeixis a la cançó per farcir. Limita't estrictament a la informació que et dono.
      
      Aquests han estat els errors reals d'aquesta partida:
      ${guesses}
      
      La cançó ha de ser 100% en català molt col·loquial (pots fer servir algun insult lleu com 'tros de soca', 'inútils', 'cecs', 'poca-soltes').
      NO posis títols ni indicacions com [Verse] o [Chorus]. 
      RETORNA ÚNICAMENT I EXCLUSIVAMENT LA LLETRA DE LA CANÇÓ. NO FACIS CAP COMENTARI PREVI NI POSTERIOR, CAP SALUTACIÓ, NOMÉS LA LLETRA.
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

