import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';


webpush.setVapidDetails(
  'mailto:tu-email@ejemplo.com', // aca podria ir al mail si queres que lo mande, por ahora lo voy a dejar asi se lo preguntamos a tuki
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { title, body, subscription } = await request.json();

    if (!subscription || !title) {
      return NextResponse.json(
        { error: 'Subscription and title are required' },
        { status: 400 }
      );
    }

    const payload = JSON.stringify({
      title: title,
      body: body || 'Nueva notificación de la tienda',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: {
        url: '/',
        timestamp: Date.now()
      }
    });

    const result = await webpush.sendNotification(subscription, payload);

    return NextResponse.json({ 
      message: 'Notification sent successfully',
      result: result
    });

  } catch {
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
} 