'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import styles from './admin.module.css';

const adminMenu = [
  { label: 'Notificaciones Push', href: '/admin/notificaciones' },
  { label: 'Pedidos Realizados', href: '/admin/pedidos' },
  { label: 'Productos', href: '/admin/productos' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    const verifyAdmin = async () => {
      if (status === 'loading') return;
      if (!session?.user?.id) {
        setAuthError('No autorizado');
        setCheckingAdmin(false);
        router.replace('/');
        return;
      }
      try {
        const res = await fetch('/api/admin/books', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.user.id}`
          }
        });
        if (!res.ok) {
          setAuthError('No autorizado');
          setCheckingAdmin(false);
          router.replace('/');
          return;
        }
        setCheckingAdmin(false);
      } catch {
        setAuthError('No autorizado');
        setCheckingAdmin(false);
        router.replace('/');
      }
    };
    verifyAdmin();
  }, [session, status, router]);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };

  if (status === 'loading' || checkingAdmin) {
    return <div style={{ textAlign: 'center', padding: '2rem' }}>Cargando...</div>;
  }
  if (authError) {
    return <div style={{ textAlign: 'center', padding: '2rem', color: 'red' }}>{authError}</div>;
  }

  return (
    <div className={styles.adminLayoutContainer}>
      {/* Banner superior */}
      <header className={styles.adminHeader}>
        <div className={styles.adminLogo}>Panel Admin</div>
        <nav className={styles.adminNavDesktop}>
          {adminMenu.map((item) => (
            <Link key={item.href} href={item.href} className={styles.adminNavLink}>
              {item.label}
            </Link>
          ))}
        </nav>
        <button className={styles.menuButton} onClick={() => setMenuOpen(!menuOpen)} aria-label="Abrir menú">
          ☰
        </button>
        <button className={styles.logoutButton} onClick={() => setShowLogoutModal(true)} aria-label="Cerrar sesión">
          Cerrar sesión
        </button>
      </header>
      {/* Menú lateral para mobile */}
      {menuOpen && (
        <aside className={styles.adminSidebar}>
          <button className={styles.closeSidebar} onClick={() => setMenuOpen(false)} aria-label="Cerrar menú">×</button>
          <nav>
            {adminMenu.map((item) => (
              <Link key={item.href} href={item.href} className={styles.adminNavLink} onClick={() => setMenuOpen(false)}>
                {item.label}
              </Link>
            ))}
            <button className={styles.logoutButtonSidebar} onClick={() => setShowLogoutModal(true)} aria-label="Cerrar sesión">
              Cerrar sesión
            </button>
          </nav>
        </aside>
      )}
      <main className={styles.adminMain}>{children}</main>
      {showLogoutModal && (
        <div className={styles.adminModalOverlay} onClick={() => setShowLogoutModal(false)}>
          <div className={styles.adminModal} onClick={e => e.stopPropagation()}>
            <h2 className={styles.adminModalTitle}>Cerrar sesión</h2>
            <p className={styles.adminModalMessage}>¿Estás seguro que deseas cerrar sesión?</p>
            <div className={styles.adminModalButtons}>
              <button className={styles.adminCancelButton} onClick={() => setShowLogoutModal(false)}>
                Cancelar
              </button>
              <button className={styles.adminLogoutButton} onClick={handleSignOut}>
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 