export const runtime = 'edge';

function extractSessionToken(cookie: string): string {
  const match = cookie.match(/__session=([^;]+)/);
  if (!match) throw new Error('No hi ha cap sessió activa (Cookie caducada)');
  return match[1].trim();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clipId = searchParams.get('clipId');

    if (!clipId) {
      return new Response(JSON.stringify({ error: 'Falta el clipId' }), { status: 400 });
    }

    if (!process.env.SUNO_COOKIES) {
      return new Response(JSON.stringify({ error: 'Falta SUNO_COOKIES a .env.local' }), { status: 500 });
    }

    const cookies = process.env.SUNO_COOKIES.split(',').map(c => c.trim());
    let clipInfo = null;
    let lastError = null;

    for (let i = 0; i < cookies.length; i++) {
      try {
        const token = extractSessionToken(cookies[i]);
        
        // Crida a l'endpoint de feed utilitzant fetch
        const res = await fetch(`https://studio-api.suno.ai/api/feed/v2?ids=${clipId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
          }
        });
        
        if (!res.ok) throw new Error(`Suno API error: ${res.status}`);
        const data = await res.json();
        
        if (data && data.length > 0) {
          clipInfo = data[0];
          break;
        } else if (data.clips && data.clips.length > 0) {
          clipInfo = data.clips[0];
          break;
        }
      } catch (err: any) {
        lastError = err.message;
      }
    }

    if (!clipInfo) {
      return new Response(JSON.stringify({ error: "No s'ha pogut obtenir l'estat del clip", details: lastError }), { status: 500 });
    }

    return new Response(JSON.stringify({
      status: clipInfo.status,
      audioUrl: clipInfo.audio_url || clipInfo.audioUrl,
    }), { status: 200 });

  } catch (error: any) {
    console.error('Error a /api/suno-status:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
