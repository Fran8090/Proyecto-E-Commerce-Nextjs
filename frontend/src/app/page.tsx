"use client";
import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Banner from '../components/Banner/Banner';
import styles from './page.module.css';
import { handleError } from '@/app/error/error-handler';
import Image from 'next/image';
import PushNotificationButton from '../components/PushNotificationButton';

export default function Home() {
  const { status, data: session } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'admin') {
      router.replace('/admin/notificaciones');
    }
  }, [status, session, router]);

  if (status === 'authenticated' && session?.user?.role === 'admin') {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Cargando...</div>;
  }

  try {
    return (
      <>
        <Banner />
        <Image
          className={styles.homeBg}
          src="https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1500&q=80"
          alt="Fondo libros"
          width={1500}
          height={1000}
          style={{ objectFit: 'cover' }}
          onError={() => {
            handleError(new Error('Error al cargar la imagen de fondo'));
          }}
        />
        <div className={styles.main}>
          <section className={styles.welcome}>
            <h2 className={styles.sectionTitle}>¡Bienvenido a Librería Online!</h2>
            <p className={styles.welcomeText}>
              Somos una tienda apasionada por los libros y la lectura. Aquí encontrarás una cuidada selección de títulos de todos los géneros, desde los clásicos de la literatura hasta las últimas novedades.
            </p>
            <p className={styles.welcomeText}>
              Nuestro objetivo es acercarte a historias que te inspiren, te enseñen y te acompañen en cada etapa de tu vida. Disfruta de una experiencia de compra sencilla, segura y con atención personalizada.
            </p>
            <p className={styles.welcomeText}>
              ¡Explora, descubre y déjate sorprender por el maravilloso mundo de los libros!
            </p>
            
            {/* Componente de Push Notifications */}
            <div style={{ marginTop: '2rem' }}>
              <PushNotificationButton />
            </div>
          </section>
        </div>
      </>
    );
  } catch (error) {
    handleError(error);
    return null;
  }
}
