'use client';

import { useCart } from '@/context/CartContext';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Banner from '@/components/Banner/Banner';
import styles from './cart.module.css';
import React, { useEffect } from 'react';
import { handleError, AppError } from '@/app/error/error-handler';
import Image from 'next/image';

interface StockValidationResult {
  id: number;
  nombre: string;
  stock: number;
  requested: number;
  available: number;
  valid: boolean;
  error: string | null;
}

interface StockValidationResponse {
  valid: boolean;
  results: StockValidationResult[];
  message: string;
}

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, canUpdateQuantity, clearCart } = useCart();
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <div>
        <Banner />
        <div className={styles.emptyCart} role="status" aria-live="polite">
          <h2>Cargando...</h2>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  const total = items.reduce((sum, item) => sum + item.precio * item.quantity, 0);

  const handleConfirmOrder = async () => {
    try {
      if (!session?.user) {
        throw new AppError('No hay sesión activa', 'Por favor, inicia sesión para continuar', 'AUTH_ERROR');
      }

      // 0. Validar stock antes de proceder
      const stockValidationResponse = await fetch('/api/pedidos/validate-stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: items.map(item => ({
            id: item.id,
            quantity: item.quantity
          }))
        }),
      });

      if (!stockValidationResponse.ok) {
        await stockValidationResponse.json();
        throw new AppError(
          'Error al validar el stock',
          'No se pudo verificar la disponibilidad de los productos',
          'STOCK_VALIDATION_ERROR'
        );
      }

      const stockValidation = await stockValidationResponse.json() as StockValidationResponse;

      if (!stockValidation.valid) {
        const invalidItems = stockValidation.results.filter((result: StockValidationResult) => !result.valid);
        const errorMessage = invalidItems.map((item: StockValidationResult) => 
          `${item.nombre}: ${item.error}`
        ).join(', ');
        
        throw new AppError(
          'Stock insuficiente',
          `Los siguientes productos no tienen stock suficiente: ${errorMessage}`,
          'INSUFFICIENT_STOCK'
        );
      }

      // 1. Crear la preferencia de pago
      const preferenceResponse = await fetch('/api/mercadopago/create-preference', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: items.map(item => ({
            id: item.id,
            nombre: item.nombre,
            quantity: item.quantity,
            precio: item.precio
          }))
        }),
      });

      if (!preferenceResponse.ok) {
        const errorData = await preferenceResponse.json();
        throw new AppError(
          errorData.error || 'Error al crear la preferencia de pago',
          errorData.details || 'No se pudo procesar el pago',
          'PAYMENT_ERROR'
        );
      }

      const preferenceResult = await preferenceResponse.json();
      
      if (!preferenceResult.init_point) {
        throw new AppError(
          'Error en la configuración del pago',
          'No se recibió el punto de inicio de pago',
          'PAYMENT_CONFIG_ERROR'
        );
      }

      // 2. Crear el pedido con el external_reference como paymentId
      const orderData = {
        items: items.map(item => ({
          id: item.id,
          nombre: item.nombre,
          quantity: Number(item.quantity),
          precio: Number(item.precio)
        })),
        total: total,
        paymentId: preferenceResult.external_reference 
      };

      const orderResponse = await fetch('/api/pedidos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.user.id}`
        },
        credentials: 'include',
        body: JSON.stringify(orderData)
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        throw new AppError(
          errorData.error || 'Error al crear el pedido',
          errorData.details || 'No se pudo procesar tu pedido',
          'ORDER_ERROR'
        );
      }

      const orderResult = await orderResponse.json();

      // Limpiar el carrito después de crear el pedido exitosamente
      clearCart();

      localStorage.setItem('pendingOrderId', orderResult.id);
      window.location.href = preferenceResult.init_point;
    } catch (error) {
      handleError(error);
    }
  };

  const handleUpdateQuantity = (id: number, newQuantity: number) => {
    try {
      if (!canUpdateQuantity(id, newQuantity)) {
        const item = items.find(item => item.id === id);
        const stockInfo = item?.stock !== undefined ? ` (Stock disponible: ${item.stock})` : '';
        throw new AppError(
          'Cantidad inválida',
          `La cantidad debe estar entre 1 y ${item?.stock || 'sin límite'}${stockInfo}`,
          'VALIDATION_ERROR'
        );
      }
      updateQuantity(id, newQuantity);
    } catch (error) {
      handleError(error);
    }
  };

  const handleRemoveFromCart = (id: number) => {
    try {
      removeFromCart(id);
    } catch (error) {
      handleError(error);
    }
  };

  if (items.length === 0) {
    return (
      <div>
        <Banner />
        <div className={styles.emptyCart} role="status" aria-live="polite">
          <h2>Tu carrito está vacío</h2>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Banner />
      <main className={styles.container}>
        <h1>Carrito de Compras</h1>
        <div className={styles.cartItems} role="list" aria-label="Lista de productos en el carrito">
          {items.map((item) => (
            <div key={item.id} className={styles.cartItem} role="listitem">
              <Image 
                src={item.img || '/placeholder.png'} 
                alt={`Imagen de ${item.nombre}`}
                className={styles.itemImage}
                width={100}
                height={100}
                onError={() => {
                  handleError(new AppError(
                    'Error al cargar la imagen',
                    'No se pudo cargar la imagen del producto',
                    'IMAGE_ERROR'
                  ));
                }}
              />
              <div className={styles.itemDetails}>
                <h3>{item.nombre}</h3>
                <p>Precio: ${item.precio}</p>
                {item.stock !== undefined && (
                  <p className={styles.stockInfo}>
                    Stock disponible: {item.stock}
                    {item.quantity > item.stock && (
                      <span className={styles.stockWarning}>
                        ⚠️ Cantidad excede el stock disponible
                      </span>
                    )}
                  </p>
                )}
                <div className={styles.quantityControls} role="group" aria-label={`Cantidad de ${item.nombre}`}>
                  <button
                    onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    aria-label="Disminuir cantidad"
                    aria-controls={`quantity-${item.id}`}
                  >
                    -
                  </button>
                  <span id={`quantity-${item.id}`} aria-live="polite">{item.quantity}</span>
                  <button
                    onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                    disabled={!canUpdateQuantity(item.id, item.quantity + 1)}
                    aria-label="Aumentar cantidad"
                    aria-controls={`quantity-${item.id}`}
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => handleRemoveFromCart(item.id)}
                  className={styles.removeButton}
                  aria-label={`Eliminar ${item.nombre} del carrito`}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className={styles.cartSummary} role="complementary" aria-label="Resumen del carrito">
          <h2>Total: ${total.toFixed(2)}</h2>
          <button
            onClick={handleConfirmOrder}
            className={styles.confirmButton}
            aria-label="Proceder al pago con MercadoPago"
          >
            Pagar con MercadoPago
          </button>
        </div>
      </main>
    </div>
  );
}