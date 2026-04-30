import { NextResponse } from 'next/server';
import { Api } from 'pql-suno-api';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

const genres = [
  'Tecno', 'Dembow', 'Sardana trap', 'Reggaeton', 'Death Metal', 
  'Jazz upbeat', 'Rumba Catalana', 'Punk rock', 'Ska', 'Pop alegre'
];

export async function POST(request: Request) {
  try {
    if (!process.env.GROQ_API_KEY || !process.env.SUNO_COOKIES) {
      return NextResponse.json({ error: 'Falten les claus de l\'API o cookies a .env.local' }, { status: 500 });
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
      model: 'llama3-8b-8192',
      temperature: 0.8,
    });

    const lyrics = chatCompletion.choices[0]?.message?.content || 'Quin desastre de geògrafs, no trobeu ni casa vostra.';

    // 2. Provar Cookies de Suno
    const cookies = process.env.SUNO_COOKIES.split(',').map(c => c.trim());
    let clipId = null;
    let errorSuno = null;

    for (let i = 0; i < cookies.length; i++) {
      try {
        const sunoApi = new Api(cookies[i]);
        
        const payload = {
          prompt: lyrics,
          title: 'Sátira Geogràfica',
          tags: genre,
        };

        const options = {
          wait: false // No esperem, sinó Vercel donarà timeout
        };

        // Pot retornar un array de clips (normalment 2)
        const clips = await sunoApi.generateClips(payload, options);
        
        if (clips && clips.length > 0) {
          clipId = clips[0].id;
          break; // Sortim del bucle, ja tenim el clip!
        }
      } catch (err: any) {
        console.error(`Suno Cookie ${i + 1} va fallar:`, err.message);
        errorSuno = err.message;
        // Continuem amb la següent cookie
      }
    }

    if (!clipId) {
      return NextResponse.json({ 
        error: 'Totes les cookies de Suno han fallat o no tenen crèdits.', 
        details: errorSuno 
      }, { status: 500 });
    }

    return NextResponse.json({
      clipId,
      lyrics,
      genre
    });

  } catch (error: any) {
    console.error('Error a /api/generate-song:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
