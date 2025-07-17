'use client';

import { useEffect, useState, useCallback } from 'react';

export default function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setupPushNotifications = useCallback(async (registration: ServiceWorkerRegistration) => {
    try {
      // Verificar si el service worker está activo
      if (!registration.active) {
        await new Promise((resolve) => {
          const checkState = () => {
            if (registration.active) {
              resolve(true);
            } else {
              setTimeout(checkState, 100);
            }
          };
          checkState();
        });
      }

      // Enviar configuración de push notifications
      registration.active?.postMessage({
        type: 'SETUP_PUSH_NOTIFICATIONS',
        config: {
          pushHandler: `
            self.addEventListener('push', function(event) {
              let data = {};
              try {
                data = event.data ? event.data.json() : {};
              } catch (e) {
                console.error('Error parsing push data:', e);
              }
              
              const title = data.title || 'Tienda de Libros';
              const options = {
                body: data.body || 'Nueva notificación',
                icon: '/icon-192.png',
                badge: '/icon-192.png',
                data: data,
                tag: data.tag || 'default',
                requireInteraction: false,
                actions: [
                  { action: 'explore', title: 'Ver más' },
                  { action: 'close', title: 'Cerrar' }
                ]
              };
              
              event.waitUntil(
                self.registration.showNotification(title, options)
              );
            });

            self.addEventListener('notificationclick', function(event) {
              event.notification.close();
              
              if (event.action === 'explore') {
                event.waitUntil(
                  clients.matchAll().then(function(clientList) {
                    if (clientList.length > 0) {
                      return clientList[0].focus();
                    }
                    return clients.openWindow('/');
                  })
                );
              } else if (event.action !== 'close') {
                event.waitUntil(
                  clients.matchAll().then(function(clientList) {
                    if (clientList.length > 0) {
                      return clientList[0].focus();
                    }
                    return clients.openWindow('/');
                  })
                );
              }
            });
          `
        }
      });
    } catch (error) {
      console.error('Error setting up push notifications:', error);
    }
  }, []);

  const registerServiceWorker = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Esperar a que el service worker esté listo
      await navigator.serviceWorker.ready;
      
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });
      
      setRegistration(registration);
      
      // Verificar si ya existe una suscripción
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        setSubscription(existingSubscription);
      }
      
      // Configurar el service worker para push notifications
      await setupPushNotifications(registration);
      
    } catch (error) {
      console.error('Error registering service worker:', error);
      setError('Error al registrar el service worker');
    } finally {
      setIsLoading(false);
    }
  }, [setupPushNotifications]);

  const checkSupport = useCallback(async () => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      await registerServiceWorker();
    } else {
      setError('Las notificaciones push no están soportadas en este navegador');
    }
  }, [registerServiceWorker]);

  useEffect(() => {
    checkSupport();
  }, [checkSupport]);

  const subscribeToPush = async () => {
    if (!registration) {
      setError('Service Worker no está registrado');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Solicitar permiso para notificaciones
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setError('Permiso para notificaciones denegado');
        return;
      }

      const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        setError('VAPID public key no configurada');
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey
      });

      setSubscription(subscription);
      
      // Enviar suscripción al backend
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      });

      if (!response.ok) {
        throw new Error('Error al enviar suscripción al servidor');
      }

      setError(null);
    } catch (error) {
      console.error('Error subscribing to push:', error);
      setError('Error al activar notificaciones');
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribeFromPush = async () => {
    if (!subscription) return;

    try {
      setIsLoading(true);
      await subscription.unsubscribe();
      setSubscription(null);
      setError(null);
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
      setError('Error al desactivar notificaciones');
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestNotification = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/push/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Notificación de Prueba',
          body: 'Esta es una notificación de prueba desde el componente',
          url: '/'
        }),
      });

      if (!response.ok) {
        throw new Error('Error al enviar notificación de prueba');
      }

      const result = await response.json();
      console.log('Test notification sent:', result);
      setError(null);
    } catch (error) {
      console.error('Error sending test notification:', error);
      setError('Error al enviar notificación de prueba');
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
    <div className="p-4 bg-blue-50 border border-blue-200 rounded">
      <h3 className="text-lg font-semibold mb-2">Gestor de Notificaciones Push</h3>
      <p className="text-sm text-gray-600 mb-4">
        Gestiona las notificaciones push de la aplicación.
      </p>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 rounded text-red-700">
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      <div className="space-y-3">
        {subscription ? (
          <div className="space-y-2">
            <p className="text-sm text-green-600">✅ Notificaciones activadas</p>
            <button
              onClick={unsubscribeFromPush}
              disabled={isLoading}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {isLoading ? 'Desactivando...' : 'Desactivar Notificaciones'}
            </button>
          </div>
        ) : (
          <button
            onClick={subscribeToPush}
            disabled={isLoading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {isLoading ? 'Activando...' : 'Activar Notificaciones'}
          </button>
        )}
        
        <button
          onClick={sendTestNotification}
          disabled={isLoading || !subscription}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {isLoading ? 'Enviando...' : 'Enviar Notificación de Prueba'}
        </button>
      </div>
    </div>
  );
}