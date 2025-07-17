"use client";

import { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import styles from './Banner.module.css';

export default function Banner() {
  const { data: session, status } = useSession();
  const { items } = useCart();
  const router = useRouter();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await signOut({ 
        redirect: false,
        callbackUrl: '/'
      });
      setShowLogoutModal(false);
      router.push('/');
      router.refresh();
    } catch {
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <div className={styles.banner}>
        <div className={styles.content}>
          <Link href="/" className={styles.logo} onClick={closeMobileMenu}>
            <h1>Librería Online</h1>
          </Link>
          
          {/* Navegación desktop */}
          <nav className={styles.navigation}>
            <Link href="/libros" className={styles.navLink}>
              Libros
            </Link>
            <Link href="/sobre-nosotros" className={styles.navLink}>
              Sobre Nosotros
            </Link>
            {session?.user?.role === 'admin' && (
              <Link href="/admin" className={styles.navLink}>
                Admin
              </Link>
            )}
          </nav>

          <div className={styles.authSection}>
            {status === 'authenticated' ? (
              <div className={styles.userSection}>
                <button 
                  onClick={() => setShowLogoutModal(true)} 
                  className={styles.userNameButton}
                >
                  <span className={styles.userName}>Hola, {session.user?.name}</span>
                </button>
              </div>
            ) : (
              <div className={styles.authButtons}>
                <Link href="/login" className={styles.loginButton}>
                  Iniciar Sesión
                </Link>
                <Link href="/register" className={styles.registerButton}>
                  Registrarse
                </Link>
              </div>
            )}
          </div>

          <div className={styles.cartSection}>
            <Link href="/cart" className={styles.cartLink} onClick={closeMobileMenu}>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="currentColor" 
                className={styles.cartIcon}
              >
                <path d="M2.25 2.25a.75.75 0 000 1.5h1.386c.17 0 .318.114.362.278l2.558 9.592a3.752 3.752 0 00-2.806 3.63c0 .414.336.75.75.75h15.75a.75.75 0 000-1.5H5.378A2.25 2.25 0 017.5 15h11.218a.75.75 0 00.674-.421 60.358 60.358 0 002.96-7.228.75.75 0 00-.525-.965A60.864 60.864 0 005.68 4.509l-.232-.867A1.875 1.875 0 003.636 2.25H2.25zM3.75 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM16.5 20.25a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" />
              </svg>
              {itemCount > 0 && (
                <span className={styles.itemCount}>{itemCount}</span>
              )}
            </Link>
          </div>

          {/* Botón hamburguesa*/}
          <button 
            className={styles.mobileMenuButton}
            onClick={toggleMobileMenu}
            aria-label="Abrir menú de navegación"
          >
            <span className={styles.hamburgerLine}></span>
            <span className={styles.hamburgerLine}></span>
            <span className={styles.hamburgerLine}></span>
          </button>
        </div>

        {/* Menú móvil */}
        <div className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles.mobileMenuOpen : ''}`}>
          <nav className={styles.mobileNavigation}>
            <Link href="/libros" className={styles.mobileNavLink} onClick={closeMobileMenu}>
              Libros
            </Link>
            <Link href="/sobre-nosotros" className={styles.mobileNavLink} onClick={closeMobileMenu}>
              Sobre Nosotros
            </Link>
            {session?.user?.role === 'admin' && (
              <Link href="/admin" className={styles.mobileNavLink} onClick={closeMobileMenu}>
                Admin
              </Link>
            )}
            {status === 'authenticated' ? (
              <button 
                onClick={() => {
                  setShowLogoutModal(true);
                  closeMobileMenu();
                }} 
                className={styles.mobileLogoutButton}
              >
                Cerrar Sesión
              </button>
            ) : (
              <>
                <Link href="/login" className={styles.mobileNavLink} onClick={closeMobileMenu}>
                  Iniciar Sesión
                </Link>
                <Link href="/register" className={styles.mobileNavLink} onClick={closeMobileMenu}>
                  Registrarse
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>

      {showLogoutModal && (
        <div className={styles.modalOverlay} onClick={() => setShowLogoutModal(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>Cerrar Sesión</h2>
            <p className={styles.modalMessage}>¿Estás seguro que deseas cerrar sesión?</p>
            <div className={styles.modalButtons}>
              <button className={styles.cancelButton} onClick={() => setShowLogoutModal(false)}>
                Cancelar
              </button>
              <button className={styles.logoutButton} onClick={handleLogout}>
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 