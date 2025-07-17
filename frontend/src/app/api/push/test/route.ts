import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { getAllSubscriptions, updateStats } from '@/lib/push-utils';

// Configurar VAPID keys
webpush.setVapidDetails(
  'mailto:tu-email@ejemplo.com', 
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { title, body, url } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const payload = JSON.stringify({
      title: title,
      body: body || 'Nueva notificación de la tienda',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      url: url || '/',
      data: {
        url: url || '/',
        timestamp: Date.now()
      }
    });

    // Obtener todas las suscripciones
    const subscriptions = getAllSubscriptions();

    // Enviar a todas las suscripciones registradas
    const results = await Promise.allSettled(
      subscriptions.map(subscription => 
        webpush.sendNotification(subscription, payload)
      )
    );

    const successful = results.filter(result => result.status === 'fulfilled').length;
    const failed = results.filter(result => result.status === 'rejected').length;

    // Actualizar estadísticas
    updateStats(successful, failed);

    return NextResponse.json({ 
      message: 'Test notification sent',
      successful,
      failed,
      total: subscriptions.length
    });

  } catch {
    return NextResponse.json(
      { error: 'Failed to send test notification' },
      { status: 500 }
    );
  }
} 