'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import AdminPedidosTable from '@/app/admin/AdminPedidosTable';

interface Libro {
  id: number;
  nombre: string;
}

interface PedidoItem {
  id: number;
  libroId: number;
  libro?: Libro;
  quantity: number;
}

interface Usuario {
  id: number;
  nombre?: string;
  email?: string;
}

interface Pedido {
  id: number;
  userId: number;
  user?: Usuario;
  createdAt: string;
  total: number;
  paymentStatus: string;
  items: PedidoItem[];
}

export default function PedidosPage() {
  const { data: session } = useSession();
  const [search, setSearch] = useState('');
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchPedidos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (session?.user?.id) {
        headers['Authorization'] = `Bearer ${session.user.id}`;
      }
      const response = await fetch('/api/admin/pedidos', {
        credentials: 'include',
        headers
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al obtener los pedidos');
      }
      const data = await response.json();
      setPedidos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar los pedidos');
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id]);

  useEffect(() => {
    fetchPedidos();
  }, [fetchPedidos]);

  // Filtrado por texto libre
  const filteredPedidos = pedidos.filter((pedido) => {
    const searchText = search.toLowerCase();
    return (
      pedido.id.toString().includes(searchText) ||
      pedido.user?.nombre?.toLowerCase().includes(searchText) ||
      pedido.user?.email?.toLowerCase().includes(searchText) ||
      pedido.paymentStatus?.toLowerCase().includes(searchText) ||
      (pedido.createdAt && new Date(pedido.createdAt).toLocaleString().toLowerCase().includes(searchText)) ||
      pedido.items.some(item => item.libro?.nombre?.toLowerCase().includes(searchText))
    );
  });

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filteredPedidos.length / itemsPerPage));
  const paginatedPedidos = filteredPedidos.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <section>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Pedidos Realizados</h1>
      <div className="adminSearchBarContainer">
        <input
          type="text"
          placeholder="Buscar pedido..."
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
          <AdminPedidosTable pedidos={paginatedPedidos} />
        )}
      </div>
      {/* Controles de paginación fuera de la tabla */}
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
    </section>
  );
} 