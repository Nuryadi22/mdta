'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, UserCheck, Clock, AlertTriangle, XCircle, Fingerprint, Wallet, UserPlus } from 'lucide-react';
import { useProfile } from '@/app/lib/profile';
import { useSantri } from '@/app/lib/santri';
import { getTodayAttendanceStats } from '@/app/actions/presensi';
import { getSaldoDiTangan } from '@/app/actions/keuangan';

export default function BerandaPage() {
  const { profile } = useProfile();
  const { santriList } = useSantri();
  const [todayAttendance, setTodayAttendance] = useState({
    hadir: 0,
    izin: 0,
    sakit: 0,
    alpa: 0,
  });
  const [saldoDiTangan, setSaldoDiTangan] = useState(0);

  useEffect(() => {
    getTodayAttendanceStats().then((data) => {
      setTodayAttendance(data);
    });
    getSaldoDiTangan().then((saldo) => {
      setSaldoDiTangan(saldo);
    });
  }, []);

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);

  // Summary data synced with state
  const stats = {
    totalSantri: santriList.length,
    kehadiranHariIni: todayAttendance,
    tanggal: new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  };


  return (
    <div className="space-y-5">
      {/* Welcome Banner Card (Solid Sky Blue) */}
      <div className="bg-sky-500 text-white rounded-xl p-4 shadow-sm border border-sky-600">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-sky-100 font-medium">{stats.tanggal}</p>
            <h2 className="text-lg font-bold mt-0.5">Assalamu'alaikum, {profile.namaUstadz}!</h2>
            <p className="text-xs text-sky-100 mt-1">Selamat bertugas di {profile.namaMdta}.</p>
          </div>
          <img
            src="/logo.png"
            alt="Logo MDTA"
            className="w-12 h-12 object-cover rounded-full bg-white p-1 shadow-md border-2 border-white/60"
          />
        </div>
      </div>

      {/* Saldo Uang di Tangan */}
      <div className="bg-emerald-600 text-white rounded-xl p-4 shadow-sm border border-emerald-700 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-semibold text-emerald-100">Saldo Uang di Tangan</span>
          </div>
          <Link
            href="/keuangan"
            className="text-[10px] font-bold bg-white text-emerald-700 px-2 py-0.5 rounded-full uppercase hover:bg-emerald-50"
          >
            Kelola Kas
          </Link>
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight">{formatRupiah(saldoDiTangan)}</h2>
        <p className="text-[11px] text-emerald-100">
          Kas tunai yang masih dipegang dari pembayaran santri, belum disetorkan.
        </p>
      </div>

      {/* Main Stat Card: Total Santri */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium">Total Keseluruhan Santri</span>
            <h3 className="text-2xl font-extrabold text-slate-800 leading-tight">
              {stats.totalSantri} <span className="text-xs font-normal text-slate-500">Santri</span>
            </h3>
          </div>
        </div>
        <Link
          href="/santri"
          className="text-xs font-bold text-sky-600 hover:text-sky-700 bg-sky-50 px-3 py-1.5 rounded-lg border border-sky-200"
        >
          Lihat Data
        </Link>
      </div>

      {/* Attendance Summary Widget Card */}
      <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center space-x-2">
            <Fingerprint className="w-5 h-5 text-sky-600" />
            <h3 className="font-bold text-sm text-slate-800">Rekap Kehadiran Hari Ini</h3>
          </div>
          <Link href="/presensi" className="text-xs font-semibold text-sky-600 hover:underline">
            Detail &rarr;
          </Link>
        </div>

        {/* 4 Attendance Status Badges */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Hadir (Green) */}
          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 bg-emerald-600 text-white rounded-md flex items-center justify-center">
                <UserCheck className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-emerald-800">Hadir</span>
            </div>
            <span className="text-base font-extrabold text-emerald-700">
              {stats.kehadiranHariIni.hadir}
            </span>
          </div>

          {/* Izin (Sky Blue) */}
          <div className="bg-sky-50 border border-sky-200 p-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 bg-sky-500 text-white rounded-md flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-sky-800">Izin</span>
            </div>
            <span className="text-base font-extrabold text-sky-700">
              {stats.kehadiranHariIni.izin}
            </span>
          </div>

          {/* Sakit (Yellow/Amber) */}
          <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 bg-amber-500 text-white rounded-md flex items-center justify-center">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-amber-800">Sakit</span>
            </div>
            <span className="text-base font-extrabold text-amber-700">
              {stats.kehadiranHariIni.sakit}
            </span>
          </div>

          {/* Alpa (Red) */}
          <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 bg-rose-600 text-white rounded-md flex items-center justify-center">
                <XCircle className="w-4 h-4" />
              </div>
              <span className="text-xs font-bold text-rose-800">Alpa</span>
            </div>
            <span className="text-base font-extrabold text-rose-700">
              {stats.kehadiranHariIni.alpa}
            </span>
          </div>
        </div>
      </div>

      {/* Quick Action Shortcuts */}
      <div className="space-y-2">
        <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider px-1">Aksi Cepat</h3>
        <div className="grid grid-cols-3 gap-2.5">
          <Link
            href="/presensi"
            className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center text-center space-y-1.5 hover:bg-sky-50 transition-colors"
          >
            <div className="w-10 h-10 bg-sky-500 text-white rounded-lg flex items-center justify-center">
              <Fingerprint className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-700">Input Absen</span>
          </Link>

          <Link
            href="/santri"
            className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center text-center space-y-1.5 hover:bg-emerald-50 transition-colors"
          >
            <div className="w-10 h-10 bg-emerald-600 text-white rounded-lg flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-700">Tambah Santri</span>
          </Link>

          <Link
            href="/keuangan"
            className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center text-center space-y-1.5 hover:bg-amber-50 transition-colors"
          >
            <div className="w-10 h-10 bg-amber-500 text-white rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-slate-700">Keuangan</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
