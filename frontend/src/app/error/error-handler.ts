import { redirect } from 'next/navigation';

export class AppError extends Error {
  constructor(
    message: string,
    public details?: string,
    public code?: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleError(error: unknown) {
  let errorMessage = 'Ha ocurrido un error inesperado';
  let errorDetails = '';
  let errorCode = '';

  if (error instanceof AppError) {
    errorMessage = error.message;
    errorDetails = error.details || '';
    errorCode = error.code || '';
  } else if (error instanceof Error) {
    errorMessage = error.message;
  }

  const searchParams = new URLSearchParams({
    message: errorMessage
  });

  if (errorDetails) {
    searchParams.append('details', errorDetails);
  }

  if (errorCode) {
    searchParams.append('code', errorCode);
  }

  redirect(`/error?${searchParams.toString()}`);
}

export function throwNotFound() {
  redirect('/error/not-found');
} 