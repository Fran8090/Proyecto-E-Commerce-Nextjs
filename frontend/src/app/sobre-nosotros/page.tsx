import Banner from '../../components/Banner/Banner';
import styles from './sobre-nosotros.module.css';

export default function SobreNosotros() {
  return (
    <div className={styles.container}>
      <Banner />
      <div className={styles.content}>
        <h1 className={styles.title}>Sobre Nosotros</h1>
        <p className={styles.description}>
          Somos una tienda de libros dedicada a ofrecerte las mejores historias y autores. Nuestra misión es fomentar la lectura y acercarte a mundos increíbles a través de los libros.
        </p>
      </div>
    </div>
  );
} 