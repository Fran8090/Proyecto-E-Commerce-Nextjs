'use client';
import styles from './admin.module.css';

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

export default function AdminPedidosTable({ pedidos }: { pedidos: Pedido[] }) {
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return styles.statusApproved;
      case 'pending':
        return styles.statusPending;
      case 'rejected':
        return styles.statusRejected;
      case 'cancelled':
        return styles.statusCancelled;
      case 'refunded':
        return styles.statusRefunded;
      default:
        return styles.statusUnknown;
    }
  };

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return 'Aprobado';
      case 'pending':
        return 'Pendiente';
      case 'rejected':
        return 'Rechazado';
      case 'cancelled':
        return 'Cancelado';
      case 'refunded':
        return 'Reembolsado';
      default:
        return status || 'Desconocido';
    }
  };

  if (!pedidos.length) return <div className="text-center py-4">No hay pedidos para mostrar</div>;

  return (
    <div className="mb-8">
      <div className={styles.adminSearchBarContainer} style={{ display: 'none' }} />
      <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: 8 }}>
        <table className="min-w-full bg-white border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="px-6 py-3 border-b text-left">ID</th>
              <th className="px-6 py-3 border-b text-left">Usuario</th>
              <th className="px-6 py-3 border-b text-left">Fecha</th>
              <th className="px-6 py-3 border-b text-left">Total</th>
              <th className="px-6 py-3 border-b text-left">Estado</th>
              <th className="px-6 py-3 border-b text-left">Items</th>
            </tr>
          </thead>
          <tbody>
            {pedidos.map((pedido) => (
              <tr key={pedido.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 border-b">{pedido.id}</td>
                <td className="px-6 py-4 border-b">
                  {pedido.user?.nombre || pedido.user?.email || pedido.userId}
                </td>
                <td className="px-6 py-4 border-b">
                  {pedido.createdAt ? new Date(pedido.createdAt).toLocaleString() : '-'}
                </td>
                <td className="px-6 py-4 border-b">${pedido.total}</td>
                <td className="px-6 py-4 border-b">
                  <span className={`${styles.statusBadge} ${getStatusColor(pedido.paymentStatus)}`}>
                    {getStatusText(pedido.paymentStatus)}
                  </span>
                </td>
                <td className="px-6 py-4 border-b">
                  {pedido.items?.map((item: PedidoItem) => (
                    <div key={item.id}>
                      {item.libro?.nombre || item.libroId} x{item.quantity}
                    </div>
                  ))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}