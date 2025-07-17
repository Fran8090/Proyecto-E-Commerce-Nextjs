'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';

export default function PaymentSuccess() {
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
        <h1 className="text-3xl font-bold text-green-600 mb-4">¡Pago Exitoso!</h1>
        <p className="text-gray-600 mb-6">Tu pago ha sido procesado correctamente.</p>
        <button
          onClick={() => router.push('/')}
          className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 transition-colors"
        >
          Volver al inicio
        </button>
      </div>
    </div>
  );
} 