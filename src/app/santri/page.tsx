'use client';

import React, { useState } from 'react';
import Modal from '@/components/Modal';
import { UserPlus, Pencil, Trash2, Search, Phone, Calendar, MapPin } from 'lucide-react';
import { useSantri, Santri } from '@/app/lib/santri';

export default function SantriPage() {
  const { santriList, isLoading, addSantri, updateSantri, deleteSantri } = useSantri();

  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedSantri, setSelectedSantri] = useState<Santri | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    nama: string;
    tempatLahir: string;
    tanggalLahir: string;
    jenisKelamin: 'LAKIKLAKI' | 'PEREMPUAN';
    noHp: string;
  }>({
    nama: '',
    tempatLahir: '',
    tanggalLahir: '',
    jenisKelamin: 'LAKIKLAKI',
    noHp: '',
  });

  const handleOpenAddModal = () => {
    setFormData({
      nama: '',
      tempatLahir: '',
      tanggalLahir: '',
      jenisKelamin: 'LAKIKLAKI',
      noHp: '',
    });
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (santri: Santri) => {
    setSelectedSantri(santri);
    setFormData({
      nama: santri.nama,
      tempatLahir: santri.tempatLahir,
      tanggalLahir: santri.tanggalLahir,
      jenisKelamin: santri.jenisKelamin,
      noHp: santri.noHp,
    });
    setIsEditModalOpen(true);
  };

  const handleOpenDeleteModal = (santri: Santri) => {
    setSelectedSantri(santri);
    setIsDeleteModalOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nama) return;

    setIsSubmitting(true);
    try {
      await addSantri(formData);
      setIsAddModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSantri) return;

    setIsSubmitting(true);
    try {
      await updateSantri(selectedSantri.id, formData);
      setIsEditModalOpen(false);
      setSelectedSantri(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedSantri) return;
    setIsSubmitting(true);
    try {
      await deleteSantri(selectedSantri.id);
      setIsDeleteModalOpen(false);
      setSelectedSantri(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredSantri = santriList.filter((s) =>
    s.nama.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Header Actions & Search Bar */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Daftar Santri ({santriList.length})</h2>
          {/* Tombol Tambah Santri (Warna Hijau Solid) */}
          <button
            onClick={handleOpenAddModal}
            className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold px-3.5 py-2 rounded-lg flex items-center space-x-1.5 shadow-sm text-xs transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Santri</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Cari nama santri..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-sky-500 shadow-2xs"
          />
        </div>
      </div>

      {/* Santri Data Table / Card List */}
      <div className="space-y-2.5">
        {filteredSantri.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400 text-xs">
            Tidak ada data santri ditemukan.
          </div>
        ) : (
          filteredSantri.map((santri) => (
            <div
              key={santri.id}
              className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs flex items-center justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-bold text-sm text-slate-800">{santri.nama}</h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      santri.jenisKelamin === 'LAKIKLAKI'
                        ? 'bg-sky-100 text-sky-700'
                        : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {santri.jenisKelamin === 'LAKIKLAKI' ? 'L' : 'P'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{santri.tempatLahir}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>{santri.tanggalLahir}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>{santri.noHp}</span>
                  </span>
                </div>
              </div>

              {/* Action Buttons: Edit (Yellow), Hapus (Red) */}
              <div className="flex items-center space-x-1.5 pl-2">
                <button
                  onClick={() => handleOpenEditModal(santri)}
                  className="bg-amber-500 hover:bg-amber-600 text-white p-2 rounded-lg transition-colors shadow-2xs"
                  title="Edit Santri"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleOpenDeleteModal(santri)}
                  className="bg-rose-600 hover:bg-rose-700 text-white p-2 rounded-lg transition-colors shadow-2xs"
                  title="Hapus Santri"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Input / Tambah Santri (Green Submit Button) */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Tambah Data Santri"
      >
        <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Nama Lengkap</label>
            <input
              type="text"
              required
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              placeholder="Masukkan nama santri"
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tempat Lahir</label>
              <input
                type="text"
                required
                value={formData.tempatLahir}
                onChange={(e) => setFormData({ ...formData, tempatLahir: e.target.value })}
                placeholder="Kota lahir"
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tanggal Lahir</label>
              <input
                type="date"
                required
                value={formData.tanggalLahir}
                onChange={(e) => setFormData({ ...formData, tanggalLahir: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Jenis Kelamin</label>
            <select
              value={formData.jenisKelamin}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  jenisKelamin: e.target.value as 'LAKIKLAKI' | 'PEREMPUAN',
                })
              }
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-sky-500 focus:outline-none bg-white"
            >
              <option value="LAKIKLAKI">Laki-Laki</option>
              <option value="PEREMPUAN">Perempuan</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">No. HP / WhatsApp Wali</label>
            <input
              type="text"
              required
              value={formData.noHp}
              onChange={(e) => setFormData({ ...formData, noHp: e.target.value })}
              placeholder="08xxxxxxxxxx"
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-lg transition-colors"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Data'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Edit Santri (Yellow Header / Action) */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Data Santri"
      >
        <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Nama Lengkap</label>
            <input
              type="text"
              required
              value={formData.nama}
              onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tempat Lahir</label>
              <input
                type="text"
                required
                value={formData.tempatLahir}
                onChange={(e) => setFormData({ ...formData, tempatLahir: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tanggal Lahir</label>
              <input
                type="date"
                required
                value={formData.tanggalLahir}
                onChange={(e) => setFormData({ ...formData, tanggalLahir: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-sky-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Jenis Kelamin</label>
            <select
              value={formData.jenisKelamin}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  jenisKelamin: e.target.value as 'LAKIKLAKI' | 'PEREMPUAN',
                })
              }
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-sky-500 focus:outline-none bg-white"
            >
              <option value="LAKIKLAKI">Laki-Laki</option>
              <option value="PEREMPUAN">Perempuan</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">No. HP / WhatsApp Wali</label>
            <input
              type="text"
              required
              value={formData.noHp}
              onChange={(e) => setFormData({ ...formData, noHp: e.target.value })}
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-lg transition-colors"
            >
              {isSubmitting ? 'Memperbarui...' : 'Update Data'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Hapus Confirm (Red Action) */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Konfirmasi Hapus Santri"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-700">
            Apakah Anda yakin ingin menghapus santri{' '}
            <strong className="text-slate-900">{selectedSantri?.nama}</strong>? Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsDeleteModalOpen(false)}
              className="bg-slate-300 hover:bg-slate-400 text-slate-800 font-bold px-4 py-2 rounded-lg transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleDeleteConfirm}
              className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-lg transition-colors"
            >
              {isSubmitting ? 'Menghapus...' : 'Hapus Permanen'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
