'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';

export default function PaymentFailure() {
  const router = useRouter();
  const { clearCart } = useCart();
  const hasClearedCart = useRef(false);

  useEffect(() => {
    if (!hasClearedCart.current) {
      clearCart();
      hasClearedCart.current = true;
    }
  }, [clearCart]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md text-center">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Pago Fallido</h1>
        <p className="text-gray-600 mb-6">Hubo un problema al procesar tu pago. Por favor, intenta nuevamente.</p>
        <button
          onClick={() => router.push('/cart')}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          Volver al carrito
        </button>
      </div>
    </div>
  );
} 