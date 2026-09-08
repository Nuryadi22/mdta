'use client';

import { usePathname } from 'next/navigation';
import { Bell } from 'lucide-react';
import { useProfile } from '@/app/lib/profile';

export default function Header() {
  const pathname = usePathname();
  const { profile } = useProfile();

  if (pathname === '/login') return null;

  const titleMap: Record<string, string> = {
    '/': 'Beranda MDTA',
    '/santri': 'Data Santri',
    '/presensi': 'Presensi Santri',
    '/keuangan': 'Keuangan MDTA',
    '/profil': 'Profil Pengguna',
  };

  const title = titleMap[pathname] || 'Aplikasi MDTA';

  return (
    <header className="sticky top-0 z-40 bg-sky-500 text-white shadow-md">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <img
            src="/logo.png"
            alt="Logo MDTA"
            className="w-9 h-9 object-cover rounded-full bg-white p-0.5 shadow-xs border border-white/40"
          />
          <div>
            <h1 className="text-base font-bold leading-tight tracking-wide">{title}</h1>
            <p className="text-[11px] text-sky-100 font-medium">{profile.namaMdta}</p>
          </div>
        </div>
        <button className="p-2 bg-sky-600 hover:bg-sky-700 text-white rounded-full transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-yellow-400 rounded-full"></span>
        </button>
      </div>
    </header>
  );
}
