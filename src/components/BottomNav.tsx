'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, Fingerprint, Wallet, User } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

  // Hide bottom nav on login page
  if (pathname === '/login') return null;

  const navItems = [
    { label: 'Beranda', href: '/', icon: Home },
    { label: 'Santri', href: '/santri', icon: Users },
    { label: 'Presensi', href: '/presensi', icon: Fingerprint },
    { label: 'Keuangan', href: '/keuangan', icon: Wallet },
    { label: 'Profil', href: '/profil', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-sky-100 shadow-lg">
      <div className="max-w-md mx-auto flex items-center justify-around h-16 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full py-1 transition-all duration-150 ${
                isActive
                  ? 'text-sky-600 font-bold scale-105'
                  : 'text-slate-500 hover:text-sky-500 font-normal'
              }`}
            >
              <div
                className={`p-1.5 rounded-full flex items-center justify-center ${
                  isActive ? 'bg-sky-100 text-sky-600' : 'bg-transparent'
                }`}
              >
                <Icon className="w-5 h-5 stroke-[2.2]" />
              </div>
              <span className="text-[10px] tracking-wide mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
