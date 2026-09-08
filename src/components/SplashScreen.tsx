'use client';

import { useEffect, useState } from 'react';

interface SplashScreenProps {
  /** 
   * 'login'  → selalu tampil setiap kali halaman login dibuka (tiap session baru)
   * 'pwa'    → hanya tampil sekali saat PWA pertama dibuka (pakai sessionStorage)
   */
  mode?: 'login' | 'pwa';
}

export default function SplashScreen({ mode = 'pwa' }: SplashScreenProps) {
  const [visible, setVisible] = useState(false);
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    if (mode === 'pwa') {
      // Hanya muncul sekali per session saat membuka PWA (mode standalone)
      const alreadyShown = sessionStorage.getItem('mdta_pwa_splash_shown');
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone === true;

      if (alreadyShown || !isStandalone) return;
      sessionStorage.setItem('mdta_pwa_splash_shown', '1');
    }

    // Tampilkan splash
    setVisible(true);

    const hideTimer = setTimeout(() => {
      setHiding(true);
      const removeTimer = setTimeout(() => setVisible(false), 500);
      return () => clearTimeout(removeTimer);
    }, 2000);

    return () => clearTimeout(hideTimer);
  }, [mode]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(145deg, #0EA5E9 0%, #0369A1 60%, #075985 100%)',
        transition: 'opacity 0.5s ease, visibility 0.5s ease',
        opacity: hiding ? 0 : 1,
        visibility: hiding ? 'hidden' : 'visible',
        pointerEvents: hiding ? 'none' : 'auto',
      }}
    >
      <img
        src="/icon-192.png"
        alt="MDTA Logo"
        className="splash-logo"
      />
      <p className="splash-title">MDTA</p>
      <p className="splash-subtitle">Madrasah Diniyah Takmiliyah Awaliyah</p>
      <div className="splash-loader">
        <div className="splash-loader-bar"></div>
      </div>
      <div className="splash-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>
    </div>
  );
}
