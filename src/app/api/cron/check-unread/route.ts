import { NextResponse } from 'next/server';
import { ref, get, set } from 'firebase/database';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '@/lib/firebase';
import nodemailer from 'nodemailer';

export async function GET(request: Request) {
  try {
    // 1. SEGURETAT: Comprovem el secret de Vercel
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Accés denegat' }, { status: 401 });
    }

    // 2. PERMISOS: Iniciem sessió com Admin a Firebase
    await signInWithEmailAndPassword(auth, process.env.ADMIN_EMAIL!, process.env.ADMIN_PASSWORD!);

    // 3. LLEGIR TOTS ELS XATS
    const chatsRef = ref(db, 'chats');
    const chatsSnap = await get(chatsRef);

    if (!chatsSnap.exists()) {
      return NextResponse.json({ message: 'Cap xat actiu' });
    }

    const chats = chatsSnap.val();
    const unreadCounts: Record<string, number> = {};

    // 4. COMPTAR MISSATGES NO LLEGITS
    for (const chatId of Object.keys(chats)) {
      const messages = chats[chatId].messages;
      if (!messages) continue;

      for (const msgId of Object.keys(messages)) {
        const msg = messages[msgId];
        if (!msg.read) {
          // Si no està llegit, el destinatari és l'ALTRE usuari del xat.
          const uids = chatId.split('_');
          const targetUid = uids[0] === msg.from ? uids[1] : uids[0];
          
          if (targetUid) {
            unreadCounts[targetUid] = (unreadCounts[targetUid] || 0) + 1;
          }
        }
      }
    }

    // 5. ENVIAR CORREUS ALS USUARIS AMB >3 MISSATGES
    const usersEmailed = [];
    const ara = Date.now();
    const UN_DIA_EN_MS = 24 * 60 * 60 * 1000;

    // Configuració de Gmail amb Nodemailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASS,
      },
    });

    for (const uid of Object.keys(unreadCounts)) {
      if (unreadCounts[uid] > 3) {
        // Comprovar usuari a Firebase
        const userSnap = await get(ref(db, `users/${uid}`));
        if (!userSnap.exists()) continue;
        const userData = userSnap.val();

        const lastNotified = userData.lastUnreadNotificationSent || 0;
        
        // Si ha passat menys d'un dia, no fem spam
        if (ara - lastNotified < UN_DIA_EN_MS) {
          continue;
        }

        const email = userData.email;
        if (!email) continue;

        // Enviar correu
        try {
          await transporter.sendMail({
            from: '"La Quinta Forca" <laquintaforca.joc@gmail.com>',
            to: email,
            subject: '💬 Tens nous missatges a La Quinta Forca!',
            html: `
              <div style="font-family: sans-serif; padding: 30px; background-color: #06080f; color: white; border-radius: 20px; text-align: center; border: 1px solid #6366f1;">
                <h1 style="color: #818cf8; margin-bottom: 20px;">Ei explorador/a! 👋</h1>
                <p style="font-size: 18px; line-height: 1.6;">Tens <strong>${unreadCounts[uid]} missatges nous de xat sense llegir</strong> a La Quinta Forca.</p>
                <p style="color: #cbd5e1; margin-top: 25px;">Els teus amics t'estan esperant per parlar de l'última partida!</p>
                <a href="https://la-quinta-forca.vercel.app/" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; font-weight: bold; border-radius: 10px; margin-top: 25px;">Obrir el joc</a>
                <div style="margin-top: 30px; border-top: 1px solid #1f2937; padding-top: 20px;">
                  <p style="font-size: 10px; color: #4b5563;">Si ja els has llegit recentment, pots ignorar aquest correu.</p>
                </div>
              </div>
            `,
          });

          // Actualitzar la data d'última notificació
          await set(ref(db, `users/${uid}/lastUnreadNotificationSent`), ara);
          usersEmailed.push(email);
        } catch (err: any) {
          console.error(`Error enviant correu a ${email}:`, err);
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Correus processats', emailsSent: usersEmailed });

  } catch (error: any) {
    console.error('Error al cron check-unread:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
