interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  status: number;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiRequest<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const defaultOptions: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const finalOptions = { ...defaultOptions, ...options };

  try {
    const response = await fetch(url, finalOptions);
    
    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.error || data.message || 'Error en la solicitud',
        response.status,
        data
      );
    }

    return {
      data,
      status: response.status,
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError(
      error instanceof Error ? error.message : 'Error desconocido',
      500
    );
  }
}

// Tipos para los datos de admin
interface Book {
  id: number;
  nombre: string;
  autor: string;
  precio: number;
  categoriaId: number;
  stock: number;
  img: string;
  categoria?: {
    id: number;
    nombre: string;
  };
}

interface Categoria {
  id: number;
  nombre: string;
}

interface Pedido {
  id: number;
  userId: number;
  total: number;
  createdAt: string;
  paymentStatus: string;
  user?: {
    id: number;
    nombre: string;
    email: string;
  };
  items: Array<{
    id: number;
    libroId: number;
    cantidad: number;
    precio: number;
    libro?: {
      id: number;
      nombre: string;
    };
  }>;
}

// Helpers específicos para admin
export const adminApi = {
  async getBooks() {
    return apiRequest<Book[]>('/api/admin/books');
  },

  async createBook(bookData: Omit<Book, 'id'>) {
    return apiRequest<Book>('/api/admin/books', {
      method: 'POST',
      body: JSON.stringify(bookData),
    });
  },

  async updateBook(id: number, bookData: Partial<Omit<Book, 'id'>>) {
    return apiRequest<Book>(`/api/admin/books/${id}`, {
      method: 'PUT',
      body: JSON.stringify(bookData),
    });
  },

  async deleteBook(id: number) {
    return apiRequest<{ message: string }>(`/api/admin/books/${id}`, {
      method: 'DELETE',
    });
  },

  async getPedidos() {
    return apiRequest<Pedido[]>('/api/admin/pedidos');
  },

  async getCategorias() {
    return apiRequest<Categoria[]>('/api/categorias');
  },
}; 