'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import AdminTable from '@/app/admin/AdminTable';
import AddBookModal from '@/app/admin/AddBookModal';

interface Book {
  id: number;
  nombre: string;
  autor: string;
  precio: number;
  stock: number;
  img: string;
  categoria: {
    id: number;
    nombre: string;
  };
}

export default function ProductosPage() {
  const { data: session } = useSession();
  const [isAddBookModalOpen, setIsAddBookModalOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [search, setSearch] = useState('');
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (session?.user?.id) {
        headers['Authorization'] = `Bearer ${session.user.id}`;
      }
      const response = await fetch('/api/admin/books', {
        credentials: 'include',
        headers
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al obtener los libros');
      }
      const data = await response.json();
      setBooks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los libros');
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks, refreshTrigger]);

  const handleBookAdded = () => {
    setRefreshTrigger(prev => prev + 1);
    setIsAddBookModalOpen(false);
  };

  // Filtrado por texto libre
  const filteredBooks = books.filter((book) => {
    const searchText = search.toLowerCase();
    return (
      book.nombre.toLowerCase().includes(searchText) ||
      book.autor.toLowerCase().includes(searchText) ||
      book.categoria.nombre.toLowerCase().includes(searchText) ||
      book.id.toString().includes(searchText) ||
      book.precio.toString().includes(searchText) ||
      book.stock.toString().includes(searchText)
    );
  });

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filteredBooks.length / itemsPerPage));
  const paginatedBooks = filteredBooks.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Productos</h1>
        <button
          onClick={() => setIsAddBookModalOpen(true)}
          style={{ background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, padding: '0.5rem 1.2rem', fontWeight: 'bold', cursor: 'pointer' }}
        >
          Agregar Libro
        </button>
      </div>
      <div className="adminSearchBarContainer">
        <input
          type="text"
          placeholder="Buscar producto..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="adminSearchInput"
        />
      </div>
      <div style={{ border: '1px solid #e5e7eb', borderRadius: 8, overflow: 'hidden', maxHeight: 350, overflowX: 'auto', overflowY: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Cargando...</div>
        ) : error ? (
          <div style={{ color: 'red', textAlign: 'center', padding: '2rem' }}>{error}</div>
        ) : (
          <AdminTable books={paginatedBooks} />
        )}
      </div>
      {/* Controles de paginación*/}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 24 }}>
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          style={{ padding: '0.4rem 1rem', borderRadius: 6, border: 'none', background: '#e5e7eb', color: '#1e40af', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontWeight: 500 }}
        >
          Anterior
        </button>
        <span style={{ fontWeight: 500, color: '#2563eb' }}>
          Página {currentPage} de {totalPages}
        </span>
        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
          disabled={currentPage === totalPages}
          style={{ padding: '0.4rem 1rem', borderRadius: 6, border: 'none', background: '#e5e7eb', color: '#1e40af', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontWeight: 500 }}
        >
          Siguiente
        </button>
      </div>
      <AddBookModal
        isOpen={isAddBookModalOpen}
        onClose={() => setIsAddBookModalOpen(false)}
        onBookAdded={handleBookAdded}
      />
    </section>
  );
} 