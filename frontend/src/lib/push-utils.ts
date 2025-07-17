// Simular base de datos de suscripciones (en producción usarías una DB real)
let subscriptions: PushSubscription[] = [];
const notificationStats = {
  totalSent: 0,
  lastSent: null as Date | null,
  successful: 0,
  failed: 0
};

// Función para agregar suscripción
export function addSubscription(subscription: PushSubscription) {
  // Verificar si ya existe
  const exists = subscriptions.some(sub => 
    sub.endpoint === subscription.endpoint
  );
  
  if (!exists) {
    subscriptions.push(subscription);
  }
}

// Función para remover suscripción
export function removeSubscription(subscription: PushSubscription) {
  subscriptions = subscriptions.filter(sub => 
    sub.endpoint !== subscription.endpoint
  );
}

// Función para obtener estadísticas
export function getStats() {
  return {
    totalSubscriptions: subscriptions.length,
    activeSubscriptions: subscriptions.length,
    notificationsSent: notificationStats.totalSent,
    lastNotificationSent: notificationStats.lastSent,
    systemStatus: 'active',
    stats: notificationStats
  };
}

// Función para obtener suscripciones (para debugging)
export function getSubscriptions() {
  return subscriptions.map(sub => ({
    endpoint: sub.endpoint,
    keys: sub.toJSON().keys
  }));
}

// Función para actualizar estadísticas
export function updateStats(successful: number, failed: number) {
  notificationStats.totalSent += successful + failed;
  notificationStats.lastSent = new Date();
  notificationStats.successful += successful;
  notificationStats.failed += failed;
}

// Función para obtener todas las suscripciones
export function getAllSubscriptions() {
  return subscriptions;
} 