'use client';

import { useEffect, useState } from 'react';

export default function SplashScreen() {
  const [visible, setVisible] = useState(false);
  const [hiding, setHiding] = useState(false);

  useEffect(() => {
    // Hanya tampilkan jika belum pernah muncul di session ini
    const alreadyShown = sessionStorage.getItem('mdta_splash_shown');
    if (alreadyShown) return;

    setVisible(true);
    sessionStorage.setItem('mdta_splash_shown', '1');

    // Mulai fade-out setelah 1.8 detik
    const hideTimer = setTimeout(() => {
      setHiding(true);
      // Hilangkan dari DOM setelah transisi selesai
      const removeTimer = setTimeout(() => setVisible(false), 500);
      return () => clearTimeout(removeTimer);
    }, 1800);

    return () => clearTimeout(hideTimer);
  }, []);

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
