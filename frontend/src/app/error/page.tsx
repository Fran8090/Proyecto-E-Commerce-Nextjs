'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from './error.module.css';

export default function ErrorPage() {
  const searchParams = useSearchParams();
  const errorMessage = searchParams.get('message') || 'Ha ocurrido un error inesperado';
  const errorDetails = searchParams.get('details') || '';
  const errorCode = searchParams.get('code') || '';

  return (
    <main className={styles.container} role="alert" aria-live="assertive">
      <h1 className={styles.title}>Error</h1>
      <div className={styles.errorContent}>
        <p className={styles.message} id="error-message">{errorMessage}</p>
        {errorDetails && (
          <div className={styles.details} aria-labelledby="error-message">
            <p className={styles.detailsTitle}>Detalles del error:</p>
            <p className={styles.detailsText}>{errorDetails}</p>
          </div>
        )}
        {errorCode && (
          <p className={styles.errorCode} aria-label={`Código de error: ${errorCode}`}>
            Código de error: {errorCode}
          </p>
        )}
      </div>
      <Link href="/" className={styles.button} role="button" aria-label="Volver a la página de inicio">
        Volver al inicio
      </Link>
    </main>
  );
} 