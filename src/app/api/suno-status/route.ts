import { NextResponse } from 'next/server';
import { Api } from 'pql-suno-api';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clipId = searchParams.get('clipId');

    if (!clipId) {
      return NextResponse.json({ error: 'Falta el clipId' }, { status: 400 });
    }

    if (!process.env.SUNO_COOKIES) {
      return NextResponse.json({ error: 'Falta SUNO_COOKIES a .env.local' }, { status: 500 });
    }

    const cookies = process.env.SUNO_COOKIES.split(',').map(c => c.trim());
    let clipInfo = null;
    let lastError = null;

    // Intentar amb totes les cookies fins que alguna ens doni resposta
    for (let i = 0; i < cookies.length; i++) {
      try {
        const sunoApi = new Api(cookies[i]);
        clipInfo = await sunoApi.getClip(clipId);
        if (clipInfo) break;
      } catch (err: any) {
        lastError = err.message;
      }
    }

    if (!clipInfo) {
      return NextResponse.json({ error: 'No s\'ha pogut obtenir l\'estat del clip', details: lastError }, { status: 500 });
    }

    return NextResponse.json({
      status: clipInfo.status,
      audioUrl: clipInfo.audioUrl,
    });

  } catch (error: any) {
    console.error('Error a /api/suno-status:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
