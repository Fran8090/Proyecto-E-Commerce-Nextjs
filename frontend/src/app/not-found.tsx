import Link from 'next/link';
import styles from './not-found.module.css';

export default function NotFound() {
  return (
    <main className={styles.notFoundContainer}>
      <h2 className={styles.notFoundTitle}>404 - Página no encontrada</h2>
      <p className={styles.notFoundMessage}>
        Lo sentimos, la página que estás buscando no existe.
      </p>
      <Link href="/" className={styles.homeLink}>
        Volver al inicio
      </Link>
    </main>
  );
} 