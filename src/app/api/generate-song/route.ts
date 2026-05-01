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

async function getSunoToken(cookie: string) {
  const clerkVersion = '5.26.1';
  const headers = { 'Cookie': cookie, 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' };
  
  const clientRes = await fetch(`https://clerk.suno.com/v1/client?_clerk_js_version=${clerkVersion}`, { headers });
  if (!clientRes.ok) throw new Error('Clerk client error');
  const clientData = await clientRes.json();
  const sessionId = clientData.response?.lastActiveSessionId;
  if (!sessionId) throw new Error('No hi ha cap sessió activa (Cookie caducada)');

  const tokenRes = await fetch(`https://clerk.suno.com/v1/sessions/${sessionId}/tokens?_clerk_js_version=${clerkVersion}`, { method: 'POST', headers });
  if (!tokenRes.ok) throw new Error('Clerk token error');
  const tokenData = await tokenRes.json();
  return tokenData.jwt;
}

export async function POST(request: Request) {
  try {
    if (!process.env.GROQ_API_KEY || !process.env.SUNO_COOKIES) {
      return new Response(JSON.stringify({ error: "Falten les claus de l'API o cookies a .env.local" }), { status: 500 });
    }

    const { guesses } = await request.json();
    
    // Generar prompt per a l'LLM
    const genre = genres[Math.floor(Math.random() * genres.length)];
    const prompt = `
      Ets un expert compositor de cançons satíriques. Escriu una lletra de 4 o 6 línies (sense ponts ni dobles tornades, només lletra directa) molt directa, extremadament satírica, humorística i una mica agressiva (com si fossis un amic rient-te d'ells) sobre la seva pèssima habilitat geogràfica. 
      Els errors més greus d'aquesta partida han estat:
      ${guesses}
      
      La cançó ha de ser en català col·loquial.
      NO posis títols ni indicacions com [Verse] o [Chorus]. Només la lletra de la cançó.
    `;

    // 1. Demanar Lletra a Groq (Llama 3)
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.8,
    });

    const lyrics = chatCompletion.choices[0]?.message?.content || 'Quin desastre de geògrafs, no trobeu ni casa vostra.';

    // 2. Provar Cookies de Suno amb Fetch (Edge Runtime)
    const cookies = process.env.SUNO_COOKIES.split(',').map(c => c.trim());
    let clipId = null;
    let errorSuno = null;

    for (let i = 0; i < cookies.length; i++) {
      try {
        const token = await getSunoToken(cookies[i]);
        
        const payload = {
          prompt: lyrics,
          title: 'Sátira Geogràfica',
          tags: genre,
          makeInstrumental: false,
          mv: 'chirp-v3-5'
        };

        const generateRes = await fetch('https://studio-api.suno.ai/api/generate/v2/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
          },
          body: JSON.stringify(payload)
        });

        if (!generateRes.ok) throw new Error(`Suno API error: ${generateRes.status}`);
        const generateData = await generateRes.json();
        
        if (generateData.clips && generateData.clips.length > 0) {
          clipId = generateData.clips[0].id;
          break; // Sortim del bucle, ja tenim el clip!
        }
      } catch (err: any) {
        console.error(`Suno Cookie ${i + 1} va fallar:`, err.message);
        errorSuno = err.message;
      }
    }

    if (!clipId) {
      return new Response(JSON.stringify({ 
        error: 'Totes les cookies de Suno han fallat o no tenen crèdits.', 
        details: errorSuno 
      }), { status: 500 });
    }

    return new Response(JSON.stringify({ clipId, lyrics, genre }), { status: 200 });

  } catch (error: any) {
    console.error('Error a /api/generate-song:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
