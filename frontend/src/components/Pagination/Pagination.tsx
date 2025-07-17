'use client';

import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import styles from './Pagination.module.css';

export default function Pagination({ totalPages }: { totalPages: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { replace } = useRouter();
  const currentPage = Number(searchParams.get('page')) || 1;

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  return (
    <div className={styles.pagination}>
      <button
        className={styles.paginationButton}
        onClick={() => replace(createPageURL(currentPage - 1))}
        disabled={currentPage === 1}
      >
        Anterior
      </button>
      <span className={styles.paginationInfo}>
        Página {currentPage} de {totalPages}
      </span>
      <button
        className={styles.paginationButton}
        onClick={() => replace(createPageURL(currentPage + 1))}
        disabled={currentPage === totalPages || totalPages === 0}
      >
        Siguiente
      </button>
    </div>
  );
} 