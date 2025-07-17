import { NextResponse } from 'next/server';
import { getStats, getSubscriptions } from '@/lib/push-utils';

export async function GET() {
  try {
    const stats = getStats();
    const subscriptions = getSubscriptions();

    return NextResponse.json({
      ...stats,
      subscriptions: subscriptions
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to get push statistics' },
      { status: 500 }
    );
  }
} 