import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { addSubscription, removeSubscription } from '@/lib/push-utils';


webpush.setVapidDetails(
  'mailto:tu-email@ejemplo.com', // Aca iria el mail si queres que lo mande, por ahora lo voy a dejar asi se lo preguntamos a tuki
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { subscription } = await request.json();

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription is required' },
        { status: 400 }
      );
    }

    // Guardar la suscripción
    addSubscription(subscription);

    return NextResponse.json({ 
      message: 'Subscription successful',
      subscription 
    });

  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { subscription } = await request.json();

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription is required' },
        { status: 400 }
      );
    }

    // Remover la suscripción
    removeSubscription(subscription);

    return NextResponse.json({ 
      message: 'Subscription removed successfully'
    });

  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ 
    publicKey: process.env.VAPID_PUBLIC_KEY 
  });
} 