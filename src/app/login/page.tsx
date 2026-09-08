'use client';

import React from 'react';
import { useActionState } from 'react';
import { login } from '@/app/actions/auth';
import { BookOpen, Lock, User, LogIn, AlertCircle } from 'lucide-react';
import SplashScreen from '@/components/SplashScreen';

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <>
      <SplashScreen mode="login" />
      <div className="min-h-[85vh] flex flex-col justify-center py-6 px-2">
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden max-w-sm mx-auto w-full">
        {/* Header Branding (Sky Blue Solid) */}
        <div className="bg-sky-500 text-white p-6 text-center space-y-2">
          <img
            src="/logo.png"
            alt="Logo MDTA"
            className="w-16 h-16 object-cover rounded-full bg-white p-1 shadow-md border-2 border-white/60 mx-auto"
          />
          <h1 className="text-xl font-extrabold tracking-wide">Aplikasi MDTA</h1>
          <p className="text-xs text-sky-100 font-medium">Sistem Informasi Santri & Kas Takmiliyah</p>
        </div>

        {/* Login Form */}
        <form action={action} className="p-6 space-y-4 text-xs">
          {/* Error Message */}
          {state?.error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3 rounded-xl flex items-center space-x-2 text-xs font-semibold animate-[shake_0.3s_ease-in-out]">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <span>{state.error}</span>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center space-x-1">
              <User className="w-3.5 h-3.5 text-sky-600" />
              <span>Username</span>
            </label>
            <input
              type="text"
              name="username"
              required
              placeholder="Masukkan username"
              className="w-full border border-slate-300 rounded-xl p-3 focus:border-sky-500 focus:outline-none text-slate-800"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center space-x-1">
              <Lock className="w-3.5 h-3.5 text-sky-600" />
              <span>Password</span>
            </label>
            <input
              type="password"
              name="password"
              required
              placeholder="Masukkan password"
              className="w-full border border-slate-300 rounded-xl p-3 focus:border-sky-500 focus:outline-none text-slate-800"
            />
          </div>

          {/* Submit Button (Warna Hijau Solid) */}
          <button
            type="submit"
            disabled={pending}
            className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold py-3.5 rounded-xl flex items-center justify-center space-x-2 shadow-md text-sm transition-colors mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {pending ? (
              <>
                <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                <span>Memproses...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Masuk ke Sistem</span>
              </>
            )}
          </button>
        </form>

        <div className="bg-slate-50 border-t border-slate-100 p-3 text-center text-[10px] text-slate-400">
          MDTA Mobile App &bull; 2026 by NYD
        </div>
        </div>
    </div>
    </>
  );
}
