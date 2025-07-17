'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function AdminRootRedirect() {
  const router = useRouter();
  const { status, data: session } = useSession();

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      router.replace('/admin/notificaciones');
    }
  }, [status, session, router]);

  return <div style={{ textAlign: 'center', padding: '2rem' }}>Cargando...</div>;
}