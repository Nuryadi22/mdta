import type { Metadata, Viewport } from 'next';
import './globals.css';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import Script from 'next/script';
import SplashScreen from '@/components/SplashScreen';

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
        {/* PWA Splash: hanya muncul sekali saat pertama buka dari home screen */}
        <SplashScreen mode="pwa" />
        <div className="max-w-md mx-auto min-h-screen bg-white shadow-xl flex flex-col relative pb-20 border-x border-slate-200">
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
      </body>
    </html>
  );
}
