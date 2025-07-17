'use client';

import { useState } from 'react';

export default function NotificationTester() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    message: string;
    successful: number;
    failed: number;
    total: number;
    stats: {
      totalSent: number;
      lastSent: string | null;
      successful: number;
      failed: number;
    };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sendTestNotification = async () => {
    if (!title.trim()) {
      setError('El título es requerido');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/push/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim() || undefined,
          url: url.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar notificación');
      }

      setResult(data);
      setTitle('');
      setBody('');
      setUrl('');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Enviar Notificación de Prueba</h3>
      
      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Título *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Nuevo libro disponible"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-1">
            Mensaje
          </label>
          <textarea
            id="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Ej: ¡Revisa nuestro nuevo catálogo de libros!"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
            URL (opcional)
          </label>
          <input
            type="url"
            id="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://tu-sitio.com/libros"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-100 border border-red-400 rounded text-red-700">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {result && (
          <div className="p-3 bg-green-100 border border-green-400 rounded text-green-700">
            <p className="text-sm font-medium">Notificación enviada exitosamente</p>
            <p className="text-xs mt-1">
              Exitosas: {result.successful} | Fallidas: {result.failed} | Total: {result.total}
            </p>
          </div>
        )}

        <button
          onClick={sendTestNotification}
          disabled={isLoading || !title.trim()}
          className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-md transition-colors"
        >
          {isLoading ? 'Enviando...' : 'Enviar Notificación de Prueba'}
        </button>
      </div>
    </div>
  );
} 