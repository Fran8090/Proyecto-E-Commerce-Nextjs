'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';

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

interface EditFormData {
  nombre: string;
  autor: string;
  precio: string;
  categoriaId: string;
  stock: string;
  img: string;
}

export default function AdminTable({ books }: { books: Book[] }) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState<EditFormData>({
    nombre: '',
    autor: '',
    precio: '',
    categoriaId: '',
    stock: '',
    img: ''
  });
  const { data: session } = useSession();

  const handleEdit = (book: Book) => {
    setEditingId(book.id);
    setEditFormData({
      nombre: book.nombre,
      autor: book.autor,
      precio: book.precio.toString(),
      categoriaId: book.categoria.id.toString(),
      stock: book.stock.toString(),
      img: book.img || ''
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (id: number) => {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      
      if (session?.user?.id) {
        headers['Authorization'] = `Bearer ${session.user.id}`;
      }
      
      const response = await fetch(`/api/admin/books/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers,
        body: JSON.stringify({
          ...editFormData,
          precio: parseFloat(editFormData.precio),
          stock: parseInt(editFormData.stock),
          categoriaId: parseInt(editFormData.categoriaId)
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar el libro');
      }

      setEditingId(null);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al actualizar el libro');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este libro?')) {
      return;
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      
      if (session?.user?.id) {
        headers['Authorization'] = `Bearer ${session.user.id}`;
      }
      
      const response = await fetch(`/api/admin/books/${id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar el libro');
      }

      
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Error al eliminar el libro');
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <table style={{ width: '100%' }} className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Autor</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {books.map((book) => (
            <tr key={book.id}>
              <td className="px-4 py-4 whitespace-nowrap">
                {editingId === book.id ? (
                  <input
                    type="text"
                    name="nombre"
                    value={editFormData.nombre}
                    onChange={handleInputChange}
                    className="border rounded px-2 py-1"
                  />
                ) : (
                  book.nombre
                )}
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                {editingId === book.id ? (
                  <input
                    type="text"
                    name="autor"
                    value={editFormData.autor}
                    onChange={handleInputChange}
                    className="border rounded px-2 py-1"
                  />
                ) : (
                  book.autor
                )}
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                {editingId === book.id ? (
                  <input
                    type="text"
                    name="categoriaId"
                    value={editFormData.categoriaId}
                    onChange={handleInputChange}
                    className="border rounded px-2 py-1"
                  />
                ) : (
                  book.categoria.nombre
                )}
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                {editingId === book.id ? (
                  <input
                    type="number"
                    name="precio"
                    value={editFormData.precio}
                    onChange={handleInputChange}
                    className="border rounded px-2 py-1"
                  />
                ) : (
                  `$${book.precio}`
                )}
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                {editingId === book.id ? (
                  <input
                    type="number"
                    name="stock"
                    value={editFormData.stock}
                    onChange={handleInputChange}
                    className="border rounded px-2 py-1"
                  />
                ) : (
                  book.stock
                )}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                {editingId === book.id ? (
                  <div className="space-x-2">
                    <button
                      onClick={() => handleSubmit(book.id)}
                      className="text-green-600 hover:text-green-900"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <div className="space-x-2">
                    <button
                      onClick={() => handleEdit(book)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(book.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Eliminar
                    </button>
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 