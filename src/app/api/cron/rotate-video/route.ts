import { NextResponse } from 'next/server';
import { ref, get, update, remove } from 'firebase/database';
import { ref as storageRef, deleteObject } from 'firebase/storage';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { db, auth, storage } from '@/lib/firebase';
import nodemailer from 'nodemailer';

export async function GET(request: Request) {
  try {
    // 1. SEGURETAT: Comprovem el secret de Vercel
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Accés denegat' }, { status: 401 });
    }

    // 2. PERMISOS: Iniciem sessió com Admin a Firebase
    await signInWithEmailAndPassword(auth, process.env.ADMIN_EMAIL!, process.env.ADMIN_PASSWORD!);

    // 3. LLEGIR EL VÍDEO ACTIU ANTERIOR (per esborrar-lo d'Storage)
    const currentConfigSnap = await get(ref(db, 'appConfig/home'));
    const oldStorageRef: string | null = currentConfigSnap.exists()
      ? currentConfigSnap.val().storageRef || null
      : null;

    // 4. LLEGIR LA CUA
    const queueRef = ref(db, 'videoQueue');
    const snap = await get(queueRef);

    if (!snap.exists()) {
      return NextResponse.json({ message: 'Cua buida' });
    }

    // 5. TRIAR VÍDEO: El més antic (FIFO — ordrem per timestamp ascendent)
    const videos = snap.val();
    const sortedIds = Object.keys(videos).sort((a, b) => videos[a].timestamp - videos[b].timestamp);
    const selectedId = sortedIds[0];
    const selectedVideo = videos[selectedId];

    // 6. PUBLICAR A L'APP (incloem storageRef per al proper cicle + resetem el comptador)
    await update(ref(db, 'appConfig/home'), {
      videoUrl: selectedVideo.url,
      videoCaption: selectedVideo.title,
      suggestedBy: selectedVideo.suggestedBy,
      storageRef: selectedVideo.storageRef || null,
      videoViews: 0,
      updatedAt: Date.now()
    });

    // 7. NETEJA CUA — Eliminem el vídeo escollit de la llista pending
    await remove(ref(db, `videoQueue/${selectedId}`));

    // 8. ESBORRAR EL VÍDEO ANTERIOR DE FIREBASE STORAGE
    //    Això evita arribar al límit de 5 GB d'Storage
    if (oldStorageRef) {
      try {
        const oldFileRef = storageRef(storage, oldStorageRef);
        await deleteObject(oldFileRef);
        console.log(`[rotate-video] Arxiu anterior esborrat: ${oldStorageRef}`);
      } catch (deleteError: any) {
        // No és fatal si no existia el fitxer (p.ex. primer cicle o URL manual)
        console.warn(`[rotate-video] No s'ha pogut esborrar ${oldStorageRef}:`, deleteError.code);
      }
    }

    // 9. ENVIAR CORREU AMB GMAIL (Nodemailer) — Lògica intacta
    if (selectedVideo.userEmail) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_APP_PASS, // Les 16 lletres de Google
        },
      });

      await transporter.sendMail({
        from: '"La Quinta Forca" <laquintaforca.joc@gmail.com>',
        to: selectedVideo.userEmail,
        subject: '🎬 Avui el teu vídeo és el protagonista!',
        html: `
          <div style="font-family: sans-serif; padding: 30px; background-color: #06080f; color: white; border-radius: 20px; text-align: center; border: 1px solid #10b981;">
            <h1 style="color: #10b981; margin-bottom: 20px;">Enhorabona, ${selectedVideo.suggestedBy}! 🎉</h1>
            <p style="font-size: 18px; line-height: 1.6;">El vídeo que vas suggerir, "<strong>${selectedVideo.title}</strong>", ha estat triat com el <strong>Vídeo del Dia</strong>.</p>
            <p style="color: #6ee7b7; margin-top: 25px;">Corre a veure'l a l'App abans que caduqui!</p>
            <div style="margin-top: 30px; border-top: 1px solid #1f2937; pt: 20px;">
              <p style="font-size: 10px; color: #4b5563;">Has rebut aquest correu perquè ets un usuari registrat de La Quinta Forca.</p>
            </div>
          </div>
        `,
      });
    }

    return NextResponse.json({ message: 'Rotació i correu enviat!', video: selectedVideo.title });

  } catch (error: any) {
    console.error("Error al bot:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}