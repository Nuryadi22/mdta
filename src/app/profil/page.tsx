'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import { logout } from '@/app/actions/auth';
import {
  User,
  KeyRound,
  LogOut,
  CheckCircle2,
  Smartphone,
  Pencil,
  Download,
  Info
} from 'lucide-react';
import { useProfile } from '@/app/lib/profile';
import { changePassword } from '@/app/actions/profile';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function ProfilPage() {
  const { profile, updateProfile } = useProfile();

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    namaUstadz: profile.namaUstadz,
    namaMdta: profile.namaMdta,
  });

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);

  useEffect(() => {
    setProfileForm({
      namaUstadz: profile.namaUstadz,
      namaMdta: profile.namaMdta,
    });
  }, [profile]);

  useEffect(() => {
    // Check if app is already running in standalone mode
    if (typeof window !== 'undefined') {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as unknown as { standalone?: boolean }).standalone === true;
      setIsInstalled(isStandalone);

      const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setDeferredPrompt(e as BeforeInstallPromptEvent);
      };

      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

      window.addEventListener('appinstalled', () => {
        setIsInstalled(true);
        setDeferredPrompt(null);
      });

      return () => {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      setIsGuideModalOpen(true);
    }
  };

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [profileSuccessMessage, setProfileSuccessMessage] = useState('');
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  const handleEditProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile(profileForm);
    setProfileSuccessMessage('Identitas berhasil diperbarui!');
    setTimeout(() => {
      setIsEditProfileOpen(false);
      setProfileSuccessMessage('');
    }, 1000);
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Konfirmasi password baru tidak cocok!');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordError('Password baru minimal 6 karakter!');
      return;
    }

    setIsSubmittingPassword(true);
    try {
      const res = await changePassword(passwordForm.oldPassword, passwordForm.newPassword);
      if (!res.success) {
        setPasswordError(res.error || 'Gagal mengubah password');
        setIsSubmittingPassword(false);
        return;
      }

      setSuccessMessage('Password berhasil diperbarui di database!');
      setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setSuccessMessage('');
        setPasswordError('');
      }, 1200);
    } catch {
      setPasswordError('Terjadi kesalahan saat menghubungi server');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  // Extract initials
  const initials =
    profile.namaUstadz
      .split(' ')
      .filter((w) => !w.toLowerCase().includes('ustadz') && !w.includes('.'))
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase() || 'US';

  return (
    <div className="space-y-4">
      {/* Profile Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs text-center space-y-3 relative">
        <button
          onClick={() => setIsEditProfileOpen(true)}
          className="absolute top-3 right-3 bg-sky-50 text-sky-600 hover:bg-sky-100 p-2 rounded-lg transition-colors text-xs font-bold flex items-center space-x-1 border border-sky-200"
          title="Edit Identitas"
        >
          <Pencil className="w-3.5 h-3.5" />
          <span>Edit</span>
        </button>

        <div className="relative inline-block">
          <div className="w-20 h-20 bg-sky-500 text-white rounded-full flex items-center justify-center font-extrabold text-2xl mx-auto shadow-md border-4 border-white ring-2 ring-sky-200">
            {initials}
          </div>
          <span className="absolute bottom-0 right-0 w-5 h-5 bg-emerald-500 border-2 border-white rounded-full"></span>
        </div>

        <div>
          <h2 className="text-base font-extrabold text-slate-800">{profile.namaUstadz}</h2>
          <p className="text-xs text-sky-600 font-bold mt-0.5">{profile.namaMdta}</p>
          <span className="inline-block mt-2 text-[10px] font-bold bg-slate-100 text-slate-600 px-3 py-1 rounded-full border border-slate-200">
            Pengajar &amp; Pengelola Kas
          </span>
        </div>
      </div>

      {/* PWA Install Button Card */}
      <div className="bg-emerald-600 text-white rounded-xl p-4 shadow-sm space-y-2 border border-emerald-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-xs">Aplikasi Mobile PWA</h3>
              <p className="text-[11px] text-emerald-100">
                {isInstalled
                  ? 'Aplikasi telah terpasang di perangkat Anda'
                  : 'Pasang aplikasi di layar utama HP / Laptop'}
              </p>
            </div>
          </div>
        </div>

        {isInstalled ? (
          <div className="bg-white/20 text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center justify-center space-x-1.5 mt-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>PWA Sudah Terinstall &amp; Aktif</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleInstallClick}
            className="w-full bg-white hover:bg-emerald-50 active:bg-emerald-100 text-emerald-800 font-extrabold py-2.5 px-3 rounded-lg flex items-center justify-center space-x-2 shadow-xs transition-colors text-xs mt-1"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>Install Aplikasi MDTA PWA</span>
          </button>
        )}
      </div>

      {/* Account Settings List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
        <div className="p-3 border-b border-slate-100">
          <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider">
            Pengaturan Akun &amp; Keamanan
          </h3>
        </div>

        <div className="divide-y divide-slate-100 text-xs font-semibold">
          {/* Tombol Ganti Password */}
          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className="w-full p-3.5 flex items-center justify-between hover:bg-sky-50 transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-800 block">Ganti Password</span>
                <span className="text-[11px] text-slate-500 font-normal">Perbarui kata sandi akun</span>
              </div>
            </div>
            <span className="text-amber-600 font-bold">Ubah &rarr;</span>
          </button>

          {/* Tombol Panduan / Install PWA */}
          <button
            onClick={handleInstallClick}
            className="w-full p-3.5 flex items-center justify-between hover:bg-emerald-50 transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-800 block">Install PWA ke Layar Utama</span>
                <span className="text-[11px] text-slate-500 font-normal">
                  {isInstalled ? 'Aplikasi sudah terpasang' : 'Klik untuk menginstall PWA'}
                </span>
              </div>
            </div>
            <span className="text-emerald-600 font-bold">
              {isInstalled ? 'Terpasang' : 'Install &rarr;'}
            </span>
          </button>
        </div>
      </div>

      {/* Logout Action (Warna Merah Solid) */}
      <div>
        <form action={logout}>
          <button
            type="submit"
            className="w-full bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold py-3 rounded-xl flex items-center justify-center space-x-2 shadow-sm text-xs transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Akun (Logout)</span>
          </button>
        </form>
      </div>

      {/* Modal Form Ganti Password */}
      <Modal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        title="Ganti Password Ustadz"
      >
        <form onSubmit={handleChangePasswordSubmit} className="space-y-3 text-xs">
          {passwordError && (
            <div className="bg-rose-100 border border-rose-300 text-rose-800 p-2.5 rounded-lg flex items-center space-x-2 font-bold">
              <span>{passwordError}</span>
            </div>
          )}

          {successMessage && (
            <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 p-2.5 rounded-lg flex items-center space-x-2 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">Password Lama</label>
            <input
              type="password"
              required
              placeholder="Masukkan password saat ini"
              value={passwordForm.oldPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Password Baru</label>
            <input
              type="password"
              required
              placeholder="Masukkan password baru"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Konfirmasi Password Baru</label>
            <input
              type="password"
              required
              placeholder="Ulangi password baru"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(false)}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmittingPassword}
              className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-lg"
            >
              {isSubmittingPassword ? 'Menyimpan...' : 'Simpan Password Baru'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Form Edit Identitas Nama Ustadz & DTA */}
      <Modal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        title="Edit Nama Ustadz & DTA"
      >
        <form onSubmit={handleEditProfileSubmit} className="space-y-3.5 text-xs">
          {profileSuccessMessage && (
            <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 p-2.5 rounded-lg flex items-center space-x-2 font-bold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{profileSuccessMessage}</span>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">Nama Ustadz / Pengajar</label>
            <input
              type="text"
              required
              placeholder="Masukkan nama Ustadz"
              value={profileForm.namaUstadz}
              onChange={(e) => setProfileForm({ ...profileForm, namaUstadz: e.target.value })}
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Nama DTA / Sekolah</label>
            <input
              type="text"
              required
              placeholder="Masukkan nama MDTA / Sekolah"
              value={profileForm.namaMdta}
              onChange={(e) => setProfileForm({ ...profileForm, namaMdta: e.target.value })}
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditProfileOpen(false)}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-4 py-2 rounded-lg"
            >
              Simpan Identitas
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Petunjuk Install PWA */}
      <Modal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
        title="Cara Install Aplikasi MDTA PWA"
      >
        <div className="space-y-3 text-xs text-slate-700">
          <div className="bg-sky-50 border border-sky-200 p-3 rounded-lg flex items-start space-x-2 text-sky-900">
            <Info className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
            <p>
              Aplikasi ini mendukung <strong>Progressive Web App (PWA)</strong> sehingga dapat di-install langsung di HP Android/iOS maupun PC/Laptop tanpa melalui Play Store.
            </p>
          </div>

          <div className="space-y-2 pt-1">
            <h4 className="font-bold text-slate-800 text-xs">Langkah Install di HP / Browser:</h4>
            <ol className="list-decimal list-inside space-y-1.5 text-[11px] leading-relaxed text-slate-600">
              <li>Buka menu opsi browser (titik tiga <strong>⋮</strong> di kanan atas atau tombol bagikan).</li>
              <li>Pilih opsi <strong>"Tambahkan ke Layar Utama"</strong> atau <strong>"Install Aplikasi"</strong>.</li>
              <li>Konfirmasi install. Aplikasi MDTA akan muncul sebagai ikon aplikasi terpisah di HP Anda!</li>
            </ol>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsGuideModalOpen(false)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-lg"
            >
              Mengerti
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
