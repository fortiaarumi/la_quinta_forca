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
      Ets el lletrista més mala bava, irreverent i mordaç de la història. Has d'escriure la lletra d'una CANÇÓ SATÍRICA brutal per riure't sense pietat d'uns amics que han jugat pèssim a un joc de geografia.

      MODE DE JOC: ${modeCtx.label}
      ${modeCtx.joke}

      ATENCIÓ - ESTIL MUSICAL: L'estil d'aquesta cançó serà "${genre}". 
      Adapta el vocabulari, les rimes, l'actitud i el ritme perquè encaixi PERFECTAMENT amb aquest gènere musical.

      CONTEXT DE LA BROMA — MOU-TE AMB TOTAL LLIBERTAT:
      Són un grup d'AMICS que juguen junts. Ningú s'ofendrà. Podem insultar amb tota la mala llet del món.
      La gràcia és fer una CANÇÓ CRUEL, DIVERTIDA i BRILLANT que faci morir de riure als jugadors quan la escoltin.

      REGLES D'OR PER FER-LA DIVERTIDA:
      1. Insults creatius i exagerats: "cec", "inútil", "gat amb ulleres rotes", "no trobes ni casa teva", "quin desastre de persona", "tens la geografia d'un pollastre", "sembla que has jugat amb els ulls tancats i amb les mans lligades"... Posa-te a fondo!
      2. Rimes obligatòries: CADA PARELL DE VERSOS HA DE RIMAR. Busca rimes bones, no forçades. La cançó ha de sonar bé cantada.
      3. Menciona els noms dels jugadors i els llocs REALS de les dades. Fes broma específica del lloc i de la confusió del jugador.
      4. Afegeix hipèrboles exagerades: "has fallat tant que Google Maps s'ha avergonyit de tu", "tens la culpa que Waze hagi dimitit", "amb tu de guia, Colom hauria acabat a Sibèria".
      5. Ritme i cadència: La cançó ha de tenir un ritme enganxós i fluir bé en el gènere "${genre}".

      DADES REALS DE LA PARTIDA (Utilitza EXCLUSIVAMENT aquests noms i llocs):
      ${guesses}

      REGLES ESTRICTES DE FORMAT:
      1. OBLIGATORI mencionar noms de jugadors i noms de lloc REALS de les dades.
      2. PROHIBIT números en dígits → sempre en lletres (trenta-dos, no 32).
      3. PROHIBIT l'abreviatura "km" → sempre "quilòmetres".
      4. PROHIBIT paraules: "Suno", "IA", "Bot", "Llama", "oceà".
      5. NO useu expressions genèriques com "Espanya" si les dades donen llocs més específics.
      6. Cada parell de versos HA DE RIMAR.
      
      ESTRUCTURA OBLIGATÒRIA (usa EXACTAMENT aquests tags):
      [Intro]
      [Verse 1]
      [Chorus]
      [Verse 2]
      [Chorus]
      [Outro]
      
      RETORNA ÚNICAMENT LA LLETRA. ZERO COMENTARIS PREVIS O POSTERIORS.
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
