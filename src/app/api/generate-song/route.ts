import { NextResponse } from 'next/server';
// @ts-ignore
import Groq from 'groq-sdk';

export const runtime = 'edge';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

const genres = [
  'Tecno', 'Dembow', 'Sardana catalana', 'Reggaeton', 'Death Metal',
  'Jazz upbeat', 'Rumba Catalana', 'Punk rock', 'Ska', 'Pop alegre', 'Dakar Afro-cuban Jazz', 'Lo-fi Roots Reggae',
  'Celtic Cloud Rap', 'Samba',
];

function getModeContext(gameMode: string): { label: string; joke: string } {
  switch (gameMode) {
    case 'pixapins':
      return {
        label: 'Pixapins (barris de Barcelona)',
        joke: `CONTEXT ESPECIAL MODE PIXAPINS:
Totes les fotos són DE BARCELONA. Els jugadors havien d'endevinar en quin BARRI de la ciutat estaven.
Els errors dels jugadors no es mesuren en quilòmetres grans — aquí uns centenars de metres ja és una desfeta còmica.
Les dades de localització inclouen noms de BARRIS (Gràcia, Sagrada Família, Barceloneta, Eixample, Poblenou, Sants, Sarrià, Horta, etc.) i DISTRICTES (Eixample, Gràcia, Nou Barris, etc.) i CODIS POSTALS.
Fes broma de com no saben distingir el Raval de la Barceloneta, o com han confós Sarrià amb Sant Andreu.
Pots fer broma dels estereotips de cada barri: la gentrificació de Poblenou, els turistes de la Barceloneta, els guiris a Gràcia, la gent pija de Sarrià, etc.
IMPORTANT: Els errors de "x quilòmetres" que surten a les dades estan calculats amb la fórmula de joc i estan en una escala reduïda. No cal que els mensionis literalment — el que importa és REF els noms dels barris reals.`
      };
    case 'catalunya':
      return {
        label: 'Catalunya (pobles i comarques)',
        joke: `CONTEXT ESPECIAL MODE CATALUNYA:
Totes les fotos són de MUNICIPIS DE CATALUNYA. Els jugadors havien d'endevinar en quin poble o ciutat de Catalunya es trobaven.
Les dades de localització inclouen NOMS DE POBLES, CIUTATS i COMARQUES catalanes (ex: Sallent (Bages), Tarragona (Tarragonès), Olot (Garrotxa), etc.).
Fes broma de la confusió entre comarques, de si han confós l'Empordà amb el Garraf, o han posat el pin a la costa quan era a la muntanya.
Pots fer bromes sobre les rivalitats entre pobles, els tòpics regionals (l'accent de Lleida, els pagesos del Pallars, la gent de Tarragona vs Barcelona, etc.).`
      };
    case 'estadis':
      return {
        label: 'Estadis de Futbol',
        joke: `CONTEXT ESPECIAL MODE ESTADIS:
Totes les fotos eren d'ESTADIS DE FUTBOL d'arreu del món. Els jugadors havien d'endevinar l'estadi i el país.
Fes broma de com han confós l'Wanda Metropolitano amb el Bernabéu, o el Camp Nou amb el Johan Cruyff Arena.
Les dades de localització indiquen el país on és cada estadi.`
      };
    default:
      return {
        label: 'Món (geografia mundial)',
        joke: `CONTEXT ESPECIAL MODE MÓN:
Totes les fotos eren de llocs ALEATORIS D'ARREU DEL MÓN. Els jugadors havien d'endevinar en quin país estaven.
Fes broma de com han confós continents sencers, de com han posat el pin a l'oceà Atlàntic quan era a l'Àsia, etc.
Els errors es mesuren en QUILÒMETRES, i poden ser de centenars o fins i tot milers de quilòmetres.`
      };
  }
}

export async function POST(request: Request) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return new Response(JSON.stringify({ error: 'Variable GROQ_API_KEY NOT FOUND a Vercel' }), { status: 500 });
    }

    const { guesses, gameMode = 'world' } = await request.json();
    const modeCtx = getModeContext(gameMode);

    // Generar prompt per a l'LLM
    const genre = genres[Math.floor(Math.random() * genres.length)];
    const prompt = `
      Ets un lletrista mordaç i un comediant espectacular. Has d'escriure la lletra d'una CANÇÓ SATÍRICA i molt divertida per riure't d'uns jugadors que han fet una partida pèssima a un joc de geografia.

      MODE DE JOC: ${modeCtx.label}
      ${modeCtx.joke}

      ATENCIÓ - ESTIL MUSICAL: L'estil d'aquesta cançó serà "${genre}". 
      Has d'adaptar el vocabulari, l'actitud i el ritme de la lletra perquè encaixi PERFECTAMENT amb aquest gènere.

      CONTEXT DE LA BROMA (MOLT IMPORTANT):
      La gràcia de la cançó NO és inventar-se històries genèriques, sinó fer sang i riure's EXCLUSIVAMENT dels llocs REALS que apareixen a les dades. 
      ÉS OBLIGATORI mencionar els NOMS DELS LLOCS REALS: barris, pobles, comarques o països que surten a les dades.
      Fes befa de com de cecs estan, de com necessiten ulleres o de lo "tontos" que són.
      Cal que fassis rimes gracioses amb els seus noms i els noms dels llocs. Els pots insultar ja que és una broma i ningú s'ofendrà. Passa't molt amb els teus insults.
      La lletra HA DE SER en CATALÀ.

      DADES REALS DE LA PARTIDA (Utilitza NOMÉS aquests noms i llocs, NO t'inventis llocs nous):
      ${guesses}

      REGLES ESTRICTES DE FORMAT:
      1. ÉS OBLIGATORI mencionar els noms dels jugadors i els NOMS DE LLOC reals que apareixen a les dades.
      2. MAI, SOTA CAP CONCEPTE, facis servir números en dígits (ex: 32, 100). Escriu-los SEMPRE TOT EN LLETRES (ex: trenta-dos).
      3. MAI escriguis l'abreviatura "km". Has d'escriure sempre la paraula sencera: "quilòmetres".
      4. PROHIBIT utilitzar les paraules "Suno", "IA", "Bot", "Llama" o "oceà".
      5. NO facis servir expressions genèriques com "Espanya" o "Europa" si les dades donen llocs més específics.
      
      ESTRUCTURA OBLIGATÒRIA:
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
    console.log(`Mode: ${gameMode}`);
    console.log(guesses);
    console.log("=======================================");

    // 1. Demanar Lletra a Groq (Llama 3)
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.85,
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
