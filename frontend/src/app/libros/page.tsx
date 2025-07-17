"use client";
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useCart } from '@/context/CartContext';
import Banner from '../../components/Banner/Banner';
import Pagination from '../../components/Pagination/Pagination';
import styles from './libros.module.css';
import { handleError, throwNotFound } from '@/app/error/error-handler';
import Image from 'next/image';

type Categoria = {
  id: number;
  nombre: string;
};

type Libro = {
  id: number;
  nombre: string;
  autor: string;
  img: string;
  precio: number;
  categoria: Categoria;
};

interface GoogleBookInfo {
  description?: string;
  imageLinks?: {
    thumbnail?: string;
  };
  averageRating?: number;
  ratingsCount?: number;
  error?: string;
}

export default function Libros() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [libros, setLibros] = useState<Libro[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedLibro, setSelectedLibro] = useState<Libro | null>(null);
  const [googleInfo, setGoogleInfo] = useState<GoogleBookInfo | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');
  const [iaComment, setIaComment] = useState<string | null>(null);
  const [isIaLoading, setIsIaLoading] = useState(false);
  const [iaError, setIaError] = useState<string | null>(null);
  const limit = 9;
  const { addToCart } = useCart();

  const currentPage = Number(searchParams.get('page')) || 1;
  const query = searchParams.get('query') || '';

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetch(`/api/libros?page=${currentPage}&limit=${limit}&nombre=${encodeURIComponent(query)}`)
      .then(async res => {
        if (!res.ok) {
          if (res.status === 404) {
            throwNotFound();
          }
          throw new Error('Error al cargar los libros');
        }
        const data = await res.json();
        if (Array.isArray(data.libros)) {
          setLibros(data.libros);
          setTotal(data.total);
        } else {
          throw new Error('Formato de datos inválido');
        }
      })
      .catch((error) => {
        handleError(error);
      })
      .finally(() => setIsLoading(false));
  }, [currentPage, query]);

  const totalPages = Math.ceil(total / limit);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    params.set('page', '1');
    if (search.trim()) {
      params.set('query', search.trim());
    } else {
      params.delete('query');
    }
    window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
  };

  const handleShowDetails = async (libro: Libro) => {
    setSelectedLibro(libro);
    setGoogleInfo(null);
    setGoogleError(null);
    setIsGoogleLoading(true);
    setIaComment(null);
    setIaError(null);
    setIsIaLoading(true);
    try {
      const res = await fetch(`/api/libros/google-info?nombre=${encodeURIComponent(libro.nombre)}`);
      if (!res.ok) {
        if (res.status === 404) {
          throwNotFound();
        }
        throw new Error('Error al obtener información adicional');
      }
      const data = await res.json();
      setGoogleInfo(data);
    } catch (err) {
      handleError(err);
    } finally {
      setIsGoogleLoading(false);
    }
    // Llamada a la IA
    try {
      const resIa = await fetch(`/api/libros/gemini-comment?nombre=${encodeURIComponent(libro.nombre)}&autor=${encodeURIComponent(libro.autor)}`);
      if (!resIa.ok) {
        throw new Error('Error al obtener comentario de la IA');
      }
      const dataIa = await resIa.json();
      setIaComment(dataIa.comentario);
    } catch (err) {
      const message = typeof err === 'object' && err && 'message' in err ? (err as { message: string }).message : 'Error al obtener comentario de la IA';
      setIaError(message);
    } finally {
      setIsIaLoading(false);
    }
  };

  const handleAddToCart = (libro: Libro) => {
    try {
      addToCart(libro);
      setPopupMessage('Libro agregado al carrito');
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 2000);
    } catch (error) {
      handleError(error);
    }
  };

  // Utilidad para renderizar texto con **bold**
  function renderWithBold(text: string) {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (/^\*\*[^*]+\*\*$/.test(part)) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  }

  if (status === 'loading') {
    return <div className={styles.loading}>Cargando...</div>;
  }

  if (!session) {
    return null;
  }

  return (
    <div className={styles.container}>
      <Banner />
      {showPopup && (
        <div className={styles.popup}>
          {popupMessage}
        </div>
      )}
      <div className={styles.header}>
        <h1 className={styles.title}>Libros Disponibles</h1>
        <form className={styles.searchBar} onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={styles.searchInput}
          />
          <button type="submit" className={styles.searchButton}>Buscar</button>
        </form>
      </div>
      {isLoading ? (
        <div className={styles.loading}>Cargando libros...</div>
      ) : error ? (
        <div className={styles.error}>{error}</div>
      ) : (
        <>
          <div className={styles.grid}>
            {Array.isArray(libros) && libros.length > 0 ? (
              libros.map(libro => (
                <div key={libro.id} className={styles.card}>
                  <Image 
                    src={libro.img || '/placeholder.png'} 
                    alt={libro.nombre} 
                    className={styles.cardImage}
                    width={200}
                    height={300}
                    style={{ objectFit: 'cover' }}
                  />
                  <div className={styles.cardContent}>
                    <h2 className={styles.cardTitle}>{libro.nombre}</h2>
                    <p className={styles.cardAuthor}>Autor: {libro.autor}</p>
                    <p className={styles.cardCategory}>Categoría: {libro.categoria.nombre}</p>
                    <p className={styles.cardPrice}>${libro.precio.toFixed(2)}</p>
                    <div className={styles.cardButtonGroup}>
                      <button 
                        className={styles.cardButton}
                        onClick={() => handleAddToCart(libro)}
                      >
                        Comprar
                      </button>
                      <button className={styles.detailsButton} onClick={() => handleShowDetails(libro)}>Detalles</button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={styles.error}>No hay libros para mostrar.</div>
            )}
          </div>
          <Pagination totalPages={totalPages} />
        </>
      )}
      {selectedLibro && (
        <div className={styles.modalOverlay} onClick={() => setSelectedLibro(null)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <button className={styles.closeButton} onClick={() => setSelectedLibro(null)}>×</button>
            <Image 
              src={selectedLibro.img || '/placeholder.png'} 
              alt={selectedLibro.nombre} 
              className={styles.modalImage}
              width={300}
              height={450}
              style={{ objectFit: 'cover' }}
            />
            <h2 className={styles.modalTitle}>{selectedLibro.nombre}</h2>
            <p className={styles.modalAuthor}><b>Autor:</b> {selectedLibro.autor}</p>
            <p className={styles.modalCategory}><b>Categoría:</b> {selectedLibro.categoria.nombre}</p>
            <p className={styles.modalPrice}><b>Precio:</b> ${selectedLibro.precio.toFixed(2)}</p>
            <hr style={{ margin: '1.5rem 0' }} />
            {isGoogleLoading ? (
              <div className={styles.loading}>Buscando información adicional...</div>
            ) : googleError ? (
              <div className={styles.error}>{googleError}</div>
            ) : googleInfo ? (
              <>
                {googleInfo.error ? (
                  <div className={styles.error}>{googleInfo.error}</div>
                ) : (
                  <>
                    <h3 className={styles.modalSubtitle}>Descripción</h3>
                    <p className={styles.modalDescription}>{googleInfo.description}</p>
                  </>
                )}
                <div className={styles.ratingContainer}>
                  <div className={styles.stars}>
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={i < Math.round(googleInfo.averageRating || 0) ? styles.starFilled : styles.starEmpty}>
                        ★
                      </span>
                    ))}
                  </div>
                  <p className={styles.ratingText}>
                    {googleInfo.averageRating ? googleInfo.averageRating.toFixed(1) : '0.0'} ({googleInfo.ratingsCount || 0} reseñas)
                  </p>
                </div>
              </>
            ) : null}
            {/* Mostrar siempre el comentario de la IA debajo de la info de Google Books o del error */}
            <hr style={{ margin: '1.5rem 0' }} />
            <h3 className={styles.modalSubtitle}>Razones para comprar este libro y recomendaciones</h3>
            {isIaLoading ? (
              <div className={styles.loading}>Generando recomendación personalizada...</div>
            ) : iaError ? (
              <div className={styles.error}>{iaError}</div>
            ) : iaComment ? (
              <p className={styles.modalDescription}>{renderWithBold(iaComment)}</p>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}