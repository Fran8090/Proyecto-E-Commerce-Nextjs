'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import styles from './AddBookModal.module.css';

interface Categoria {
  id: number;
  nombre: string;
}

interface AddBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBookAdded: () => void;
}

interface FormData {
  nombre: string;
  autor: string;
  img: string;
  precio: string;
  categoriaId: string;
  stock: string;
}

export default function AddBookModal({ isOpen, onClose, onBookAdded }: AddBookModalProps) {
  const { data: session } = useSession();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    nombre: '',
    autor: '',
    img: '',
    precio: '',
    categoriaId: '',
    stock: ''
  });
  const [showNewCategoriaInput, setShowNewCategoriaInput] = useState(false);
  const [newCategoria, setNewCategoria] = useState('');
  const [creatingCategoria, setCreatingCategoria] = useState(false);
  const [categoriaError, setCategoriaError] = useState<string | null>(null);

  const fetchCategorias = useCallback(async () => {
    if (!session?.user) return;

    try {
      console.log('AddBookModal - Cargando categorías...');
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      
      if (session?.user?.id) {
        headers['Authorization'] = `Bearer ${session.user.id}`;
      }
      
      const response = await fetch('/api/categorias', {
        credentials: 'include',
        headers
      });
      
      console.log('📡 AddBookModal - Respuesta de categorías:', {
        status: response.status,
        ok: response.ok
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al cargar las categorías');
      }
      
      const data = await response.json();
      console.log('AddBookModal - Categorías cargadas:', data.length);
      setCategorias(data);
    } catch (err: Error | unknown) {
      console.error('AddBookModal - Error al cargar categorías:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar las categorías');
    }
  }, [session?.user]);

  useEffect(() => {
    if (isOpen) {
      fetchCategorias();
    }
  }, [isOpen, fetchCategorias]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('AddBookModal - Creando libro:', formData);
      
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      
      if (session?.user?.id) {
        headers['Authorization'] = `Bearer ${session.user.id}`;
      }
      
      const response = await fetch('/api/admin/books', {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({
          ...formData,
          precio: parseFloat(formData.precio),
          categoriaId: parseInt(formData.categoriaId),
          stock: parseInt(formData.stock)
        })
      });

      console.log('📡 AddBookModal - Respuesta de creación:', {
        status: response.status,
        ok: response.ok
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Error al crear el libro');
      }

      console.log('AddBookModal - Libro creado exitosamente');
      onBookAdded();
      onClose();
      setFormData({
        nombre: '',
        autor: '',
        img: '',
        precio: '',
        categoriaId: '',
        stock: ''
      });
    } catch (err: Error | unknown) {
      console.error('AddBookModal - Error al crear libro:', err);
      setError(err instanceof Error ? err.message : 'Error al crear el libro');
      if (err instanceof Error && err.message.includes('Ya existe un libro con ese nombre')) {
        const nombreInput = document.getElementById('nombre');
        if (nombreInput) {
          nombreInput.focus();
          nombreInput.classList.add(styles.errorInput);
          setTimeout(() => {
            nombreInput.classList.remove(styles.errorInput);
          }, 2000);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateCategoria = async () => {
    if (!newCategoria.trim()) {
      setCategoriaError('El nombre es requerido');
      return;
    }
    setCategoriaError(null);
    setCreatingCategoria(true);
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (session?.user?.id) {
        headers['Authorization'] = `Bearer ${session.user.id}`;
      }
      const response = await fetch('/api/categorias', {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({ nombre: newCategoria.trim() })
      });
      const data = await response.json();
      if (!response.ok) {
        setCategoriaError(data.error || 'Error al crear la categoría');
        setCreatingCategoria(false);
        return;
      }
      setCategorias(prev => [...prev, data]);
      setFormData(prev => ({ ...prev, categoriaId: data.id.toString() }));
      setShowNewCategoriaInput(false);
      setNewCategoria('');
    } catch {
      setCategoriaError('Error al crear la categoría');
    } finally {
      setCreatingCategoria(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2 id="modal-title">Agregar Nuevo Libro</h2>
          <button 
            onClick={onClose} 
            className={styles.closeButton}
            aria-label="Cerrar modal"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error} role="alert">{error}</div>}
          
          <div className={styles.formGroup}>
            <label htmlFor="nombre">Nombre del Libro</label>
            <input
              type="text"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              required
              aria-required="true"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="autor">Autor</label>
            <input
              type="text"
              id="autor"
              name="autor"
              value={formData.autor}
              onChange={handleChange}
              required
              aria-required="true"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="img">URL de la Imagen</label>
            <input
              type="url"
              id="img"
              name="img"
              value={formData.img}
              onChange={handleChange}
              required
              aria-required="true"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="precio">Precio</label>
            <input
              type="number"
              id="precio"
              name="precio"
              value={formData.precio}
              onChange={handleChange}
              min="0"
              step="0.01"
              required
              aria-required="true"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="categoriaId">Categoría</label>
            <select
              id="categoriaId"
              name="categoriaId"
              value={formData.categoriaId}
              onChange={handleChange}
              required
              aria-required="true"
              style={{ marginBottom: '0.5rem' }}
            >
              <option value="">Seleccione una categoría</option>
              {categorias.map(categoria => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nombre}
                </option>
              ))}
            </select>
            {!showNewCategoriaInput && (
              <button
                type="button"
                className={styles.addCategoriaButton}
                onClick={() => setShowNewCategoriaInput(true)}
                style={{ marginTop: '0.3rem' }}
              >
                + Agregar nueva categoría
              </button>
            )}
            {showNewCategoriaInput && (
              <div className={styles.newCategoriaContainer}>
                <input
                  type="text"
                  placeholder="Nombre de la nueva categoría"
                  value={newCategoria}
                  onChange={e => setNewCategoria(e.target.value)}
                  className={styles.newCategoriaInput}
                  disabled={creatingCategoria}
                  autoFocus
                />
                <button
                  type="button"
                  className={styles.saveCategoriaButton}
                  onClick={handleCreateCategoria}
                  disabled={creatingCategoria}
                >
                  {creatingCategoria ? 'Agregando...' : 'Guardar'}
                </button>
                <button
                  type="button"
                  className={styles.cancelCategoriaButton}
                  onClick={() => {
                    setShowNewCategoriaInput(false);
                    setNewCategoria('');
                    setCategoriaError(null);
                  }}
                  disabled={creatingCategoria}
                >
                  Cancelar
                </button>
              </div>
            )}
            {categoriaError && <div className={styles.error} style={{ marginTop: 4 }}>{categoriaError}</div>}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="stock">Stock</label>
            <input
              type="number"
              id="stock"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              min="0"
              required
              aria-required="true"
            />
          </div>

          <div className={styles.formActions}>
            <button 
              type="button" 
              onClick={onClose} 
              className={styles.cancelButton}
              aria-label="Cancelar operación"
            >
              Cancelar
            </button>
            <button 
              type="submit" 
              className={styles.submitButton} 
              disabled={isLoading}
              aria-label={isLoading ? 'Agregando libro...' : 'Agregar libro'}
            >
              {isLoading ? 'Agregando...' : 'Agregar Libro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 