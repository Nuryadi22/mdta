import type { Metadata, Viewport } from 'next';
import './globals.css';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Aplikasi MDTA - Sistem Informasi Madrasah Diniyah',
  description: 'Aplikasi Manajemen Santri, Presensi, dan Keuangan MDTA Mobile PWA',
  icons: {
    icon: [
      { url: '/mdta.ico', type: 'image/x-icon' },
      { url: '/favicon.ico', type: 'image/x-icon' },
    ],
    shortcut: '/mdta.ico',
    apple: '/icon-192.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MDTA Mobile',
  },
};

export const viewport: Viewport = {
  themeColor: '#0EA5E9',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="h-full antialiased bg-slate-100">
      <body className="min-h-full font-sans bg-slate-100 text-slate-900 selection:bg-sky-200 selection:text-sky-900">

        {/* PWA Splash Screen */}
        <div id="pwa-splash">
          <img src="/icon-192.png" alt="MDTA Logo" className="splash-logo" />
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

        <div id="app-root" className="max-w-md mx-auto min-h-screen bg-white shadow-xl flex flex-col relative pb-20 border-x border-slate-200">
          <Header />
          <main className="flex-1 px-4 py-5 overflow-y-auto">
            {children}
          </main>
          <BottomNav />
        </div>

        {/* PWA Service Worker Registration Script */}
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(
                  function(registration) {
                    console.log('MDTA ServiceWorker registered with scope: ', registration.scope);
                  },
                  function(err) {
                    console.log('MDTA ServiceWorker registration failed: ', err);
                  }
                );
              });
            }
          `}
        </Script>

        {/* Splash Screen Dismiss Script */}
        <Script id="splash-dismiss" strategy="afterInteractive">
          {`
            (function() {
              var splash = document.getElementById('pwa-splash');
              var appRoot = document.getElementById('app-root');
              if (!splash) return;

              // Only show splash when launched as standalone PWA
              var isStandalone = window.matchMedia('(display-mode: standalone)').matches
                || window.navigator.standalone === true;

              if (!isStandalone) {
                splash.style.display = 'none';
                return;
              }

              // Dismiss after 1.8s with fade-out
              setTimeout(function() {
                splash.classList.add('splash-hidden');
                if (appRoot) appRoot.classList.add('app-content-ready');
                setTimeout(function() {
                  if (splash && splash.parentNode) {
                    splash.parentNode.removeChild(splash);
                  }
                }, 500);
              }, 1800);
            })();
          `}
        </Script>
      </body>
    </html>
  );
}

