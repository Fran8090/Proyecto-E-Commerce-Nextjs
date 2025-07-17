'use client';

import { useState, useEffect } from 'react';
import React from 'react';

export default function PushNotificationButton() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState('');

  useEffect(() => {
    // Verificar si las notificaciones están soportadas
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      checkSubscription();
    }
  }, []);

  // Función para convertir clave pública VAPID de base64 a Uint8Array
  const urlBase64ToUint8Array = (base64String: string) => {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  };

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const requestNotificationPermission = async () => {
    try {
      console.log('Solicitando permiso de notificaciones...');
      const permission = await Notification.requestPermission();
      console.log('Permiso obtenido:', permission);
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting permission:', error);
      return false;
    }
  };

  const subscribeToPushNotifications = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Iniciando proceso de suscripción...');
      
      // Solicitar permiso
      const permissionGranted = await requestNotificationPermission();
      if (!permissionGranted) {
        setError('Se requiere permiso para enviar notificaciones');
        return;
      }

      // Obtener la clave pública
      console.log('Obteniendo clave pública...');
      const response = await fetch('/api/push/subscribe');
      
      if (!response.ok) {
        throw new Error(`Error al obtener clave pública: ${response.status} ${response.statusText}`);
      }
      
      const { publicKey } = await response.json();
      
      if (!publicKey) {
        throw new Error('No se pudo obtener la clave pública VAPID');
      }

      console.log('Clave pública obtenida:', publicKey);

      // Convertir la clave pública a Uint8Array
      const applicationServerKey = urlBase64ToUint8Array(publicKey);
      console.log('Clave convertida a Uint8Array:', applicationServerKey);

      // Registrar service worker
      const registration = await navigator.serviceWorker.ready;
      console.log('Service worker listo:', registration);

      // Suscribirse
      console.log('Suscribiendo a push notifications...');
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey
      });

      console.log('Suscripción creada:', subscription);

      // Enviar suscripción al servidor
      console.log('Enviando suscripción al servidor...');
      const subscribeResponse = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscription }),
      });

      if (!subscribeResponse.ok) {
        throw new Error(`Error al registrar suscripción: ${subscribeResponse.status} ${subscribeResponse.statusText}`);
      }

      const result = await subscribeResponse.json();
      console.log('Respuesta del servidor:', result);

      setIsSubscribed(true);
      setPopupMessage('¡Notificaciones activadas!');
      setShowPopup(true);

    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido al activar las notificaciones');
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribeFromPushNotifications = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      if (subscription) {
        await subscription.unsubscribe();
        setIsSubscribed(false);
        setPopupMessage('Notificaciones desactivadas');
        setShowPopup(true);
      }
    } catch (error) {
      console.error('Error unsubscribing:', error);
      setError('Error al desactivar las notificaciones');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="p-4 bg-yellow-100 border border-yellow-400 rounded">
        <p className="text-yellow-800">
          Las notificaciones push no están soportadas en este navegador.
        </p>
      </div>
    );
  }

  return (
    <>
      {showPopup && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.3)',
          backdropFilter: 'blur(4px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '2rem 2.5rem',
            boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
            minWidth: '320px',
            textAlign: 'center',
            position: 'relative',
          }}>
            <button
              onClick={() => setShowPopup(false)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'transparent',
                border: 'none',
                fontSize: '1.5rem',
                cursor: 'pointer',
                color: '#888',
              }}
              aria-label="Cerrar notificación"
            >
              ×
            </button>
            <div style={{ fontSize: '1.1rem', fontWeight: 500 }}>{popupMessage}</div>
          </div>
        </div>
      )}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="text-lg font-semibold mb-2">Notificaciones Push</h3>
        <p className="text-sm text-gray-600 mb-4">
          Recibe notificaciones sobre nuevos libros y ofertas especiales.
        </p>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 rounded text-red-700">
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        {isSubscribed ? (
          <button
            onClick={unsubscribeFromPushNotifications}
            disabled={isLoading}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {isLoading ? 'Desactivando...' : 'Desactivar Notificaciones'}
          </button>
        ) : (
          <button
            onClick={subscribeToPushNotifications}
            disabled={isLoading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {isLoading ? 'Activando...' : 'Activar Notificaciones'}
          </button>
        )}
      </div>
    </>
  );
} 