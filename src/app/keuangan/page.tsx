'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Modal from '@/components/Modal';
import {
  Wallet,
  PlusCircle,
  ArrowUpRight,
  Settings,
  Receipt,
  History,
  CalendarDays,
  Banknote,
  Pencil,
  Trash2
} from 'lucide-react';
import { useSantri } from '@/app/lib/santri';
import {
  getKeuanganOverview,
  addFeeCategory,
  updateFeeCategory,
  deleteFeeCategory,
  addPayment,
  addCashHandout,
  FeeCategory,
  SetorRecord,
  SantriFinancial,
} from '@/app/actions/keuangan';

export default function KeuanganPage() {
  const { santriList } = useSantri();

  // Financial State from MySQL
  const [saldoDiTangan, setSaldoDiTangan] = useState<number>(0);
  const [feeCategories, setFeeCategories] = useState<FeeCategory[]>([]);
  const [santriFinances, setSantriFinances] = useState<SantriFinancial[]>([]);
  const [setorHistory, setSetorHistory] = useState<SetorRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modals state
  const [isTagihanModalOpen, setIsTagihanModalOpen] = useState(false);
  const [isPemasukanModalOpen, setIsPemasukanModalOpen] = useState(false);
  const [isSetorModalOpen, setIsSetorModalOpen] = useState(false);
  const [selectedSantriDetail, setSelectedSantriDetail] = useState<SantriFinancial | null>(null);
  const [editingFee, setEditingFee] = useState<FeeCategory | null>(null);

  // Forms state
  const [newFee, setNewFee] = useState({ nama: '', nominal: '', keterangan: '' });
  const [newPayment, setNewPayment] = useState({
    santriId: '',
    tanggal: new Date().toISOString().split('T')[0],
    nominal: '',
    jenis: '',
  });
  const [setorForm, setSetorForm] = useState({
    tanggal: new Date().toISOString().split('T')[0],
    nominal: '',
    keterangan: '',
  });

  // Load state from DB
  const loadOverview = useCallback(async () => {
    try {
      const data = await getKeuanganOverview();
      setSaldoDiTangan(data.saldoDiTangan);
      setFeeCategories(data.feeCategories);
      setSantriFinances(data.santriFinances);
      setSetorHistory(data.setorHistory);
    } catch (e) {
      console.error('Failed to load financial state from database', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOverview();
  }, [loadOverview, santriList]);

  // Set default santri & payment type when opening modal or when data loads
  useEffect(() => {
    if (santriList.length > 0 && !newPayment.santriId) {
      setNewPayment((prev) => ({
        ...prev,
        santriId: String(santriList[0].id),
        jenis: feeCategories[0]?.nama || 'SPP Bulanan',
      }));
    }
  }, [santriList, feeCategories, newPayment.santriId]);

  // 1. Submit Pengaturan Tagihan Biaya (Tambah)
  const handleAddFeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFee.nama || !newFee.nominal) return;

    setIsSubmitting(true);
    try {
      await addFeeCategory({
        nama: newFee.nama,
        nominal: parseFloat(newFee.nominal),
        keterangan: newFee.keterangan,
      });
      await loadOverview();
      setNewFee({ nama: '', nominal: '', keterangan: '' });
      setIsTagihanModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1b. Submit Edit Tagihan
  const handleEditFeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFee) return;

    setIsSubmitting(true);
    try {
      await updateFeeCategory(editingFee.id, {
        nama: editingFee.nama,
        nominal: editingFee.nominal,
        keterangan: editingFee.keterangan,
      });
      await loadOverview();
      setEditingFee(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1c. Hapus Tagihan
  const handleDeleteFee = async (feeId: number) => {
    setIsSubmitting(true);
    try {
      await deleteFeeCategory(feeId);
      await loadOverview();
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Submit Input Pemasukan Pembayaran
  const handleAddPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(newPayment.nominal);
    if (!amount || amount <= 0) return;

    const targetSantriId = parseInt(newPayment.santriId || String(santriList[0]?.id || 1));
    setIsSubmitting(true);
    try {
      await addPayment({
        santriId: targetSantriId,
        tanggal: newPayment.tanggal,
        nominal: amount,
        jenis: newPayment.jenis || 'SPP Bulanan',
      });
      await loadOverview();
      setNewPayment({
        santriId: String(santriList[0]?.id || ''),
        tanggal: new Date().toISOString().split('T')[0],
        nominal: '',
        jenis: feeCategories[0]?.nama || 'SPP Bulanan',
      });
      setIsPemasukanModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Submit Setor Uang
  const handleSetorUangSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(setorForm.nominal);
    if (!amount || amount <= 0) return;

    setIsSubmitting(true);
    try {
      await addCashHandout({
        tanggal: setorForm.tanggal,
        nominal: amount,
        keterangan: setorForm.keterangan || 'Setor Kas Tunai',
      });
      await loadOverview();
      setSetorForm({
        tanggal: new Date().toISOString().split('T')[0],
        nominal: '',
        keterangan: '',
      });
      setIsSetorModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-4">
      {/* Widget Saldo Uang di Tangan (Kas Aktif) */}
      <div className="bg-sky-500 text-white rounded-xl p-4 shadow-sm border border-sky-600 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="text-xs font-semibold text-sky-100">Saldo Uang di Tangan (Kas Aktif)</span>
          </div>
          <span className="text-[10px] font-bold bg-white text-sky-700 px-2 py-0.5 rounded-full uppercase">
            Kas Tunai
          </span>
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight">
          {formatRupiah(saldoDiTangan)}
        </h2>
        <p className="text-[11px] text-sky-100">
          Uang tunai terkumpul dari pembayaran santri yang belum disetorkan. Real-time sinkron antar perangkat.
        </p>
      </div>

      {/* Primary Action Buttons Grid */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => {
            if (!newPayment.santriId && santriList[0]) {
              setNewPayment((prev) => ({ ...prev, santriId: String(santriList[0].id) }));
            }
            setIsPemasukanModalOpen(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold p-2.5 rounded-xl flex flex-col items-center justify-center text-center space-y-1 shadow-sm transition-colors text-xs"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Input Pemasukan</span>
        </button>

        <button
          onClick={() => setIsSetorModalOpen(true)}
          className="bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold p-2.5 rounded-xl flex flex-col items-center justify-center text-center space-y-1 shadow-sm transition-colors text-xs"
        >
          <ArrowUpRight className="w-5 h-5" />
          <span>Setor Kas Uang</span>
        </button>

        <button
          onClick={() => setIsTagihanModalOpen(true)}
          className="bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold p-2.5 rounded-xl flex flex-col items-center justify-center text-center space-y-1 shadow-sm transition-colors text-xs"
        >
          <Settings className="w-5 h-5" />
          <span>Atur Tagihan</span>
        </button>
      </div>

      {/* Section: Pengaturan Tagihan Biaya Aktif */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-2">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div className="flex items-center space-x-1.5">
            <Receipt className="w-4 h-4 text-sky-600" />
            <h3 className="font-bold text-xs text-slate-800">Jenis Tagihan Wajib</h3>
          </div>
          <span className="text-[10px] text-slate-500 font-semibold">{feeCategories.length} Jenis</span>
        </div>
        {feeCategories.length === 0 ? (
          <div className="py-4 text-center">
            <p className="text-xs text-slate-400 italic">Belum ada tagihan. Klik &ldquo;Atur Tagihan&rdquo; untuk menambahkan.</p>
          </div>
        ) : (
          <div className="space-y-2 pt-1">
            {feeCategories.map((cat) => (
              <div key={cat.id} className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-slate-800 block truncate">{cat.nama}</span>
                  <span className="text-sky-700 font-extrabold">{formatRupiah(cat.nominal)}</span>
                  {cat.keterangan ? (
                    <span className="text-slate-400 block text-[10px] truncate mt-0.5">{cat.keterangan}</span>
                  ) : null}
                </div>
                <div className="flex items-center space-x-1.5 ml-2 flex-shrink-0">
                  <button
                    onClick={() => setEditingFee({ ...cat })}
                    className="w-7 h-7 bg-amber-50 border border-amber-200 text-amber-600 rounded-md flex items-center justify-center hover:bg-amber-100 transition-colors"
                    title="Edit tagihan"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Hapus tagihan "${cat.nama}"? Ini akan menghapus jenis tagihan dari sistem.`)) {
                        handleDeleteFee(cat.id);
                      }
                    }}
                    className="w-7 h-7 bg-rose-50 border border-rose-200 text-rose-600 rounded-md flex items-center justify-center hover:bg-rose-100 transition-colors"
                    title="Hapus tagihan"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Section: Rekapan Status Keuangan Per Santri */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider">
            Rekapan Tagihan &amp; Pembayaran Santri ({santriList.length})
          </h3>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="divide-y divide-slate-100">
            {santriList.length === 0 ? (
              <div className="p-8 text-center space-y-3">
                <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center mx-auto">
                  <Receipt className="w-7 h-7 text-slate-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-600">Belum Ada Data Santri</p>
                  <p className="text-xs text-slate-400 mt-1">Tambahkan data santri terlebih dahulu untuk melihat rekap tagihan dan pembayaran.</p>
                </div>
              </div>
            ) : (
              santriFinances.map((santri) => {
                const sisa = Math.max(0, santri.totalTanggungan - santri.totalDibayar);
                const isLunas = santri.totalTanggungan > 0 && sisa === 0;

                return (
                  <div
                    key={santri.id}
                    onClick={() => setSelectedSantriDetail(santri)}
                    className="p-3.5 flex items-center justify-between hover:bg-sky-50/50 cursor-pointer transition-colors"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-bold text-xs text-slate-800">{santri.nama}</h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            santri.totalTanggungan === 0
                              ? 'bg-slate-100 text-slate-600'
                              : isLunas
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {santri.totalTanggungan === 0
                            ? 'Belum ada tagihan'
                            : isLunas
                            ? 'LUNAS'
                            : `Belum: ${formatRupiah(sisa)}`}
                        </span>
                      </div>

                      <div className="flex items-center space-x-3 text-[11px]">
                        <span className="text-slate-500">
                          Tanggungan: <strong className="text-slate-700">{formatRupiah(santri.totalTanggungan)}</strong>
                        </span>
                        <span className="text-emerald-700">
                          Dibayar: <strong>{formatRupiah(santri.totalDibayar)}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="bg-sky-50 text-sky-600 p-1.5 rounded-lg text-xs font-bold">
                      Detail
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Section: Rekapan Tanggal Setor Kas */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-bold text-xs text-slate-500 uppercase tracking-wider">
            Rekap Setoran Kas
          </h3>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <div className="bg-rose-50 border-b border-rose-100 p-3.5 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-rose-600 text-white rounded-lg flex items-center justify-center">
                <Banknote className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] text-rose-600 font-bold uppercase block">Total Sudah Disetor</span>
                <span className="text-base font-extrabold text-rose-800">
                  {formatRupiah(setorHistory.reduce((sum, r) => sum + r.nominal, 0))}
                </span>
              </div>
            </div>
            <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-2.5 py-1 rounded-full border border-rose-200">
              {setorHistory.length} Transaksi
            </span>
          </div>

          {setorHistory.length === 0 ? (
            <div className="p-6 text-center">
              <CalendarDays className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-400 italic">Belum ada riwayat setoran kas.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {setorHistory.map((record) => (
                <div key={record.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <CalendarDays className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="font-bold text-xs text-slate-800 block">
                        {new Date(record.tanggal + 'T00:00:00').toLocaleDateString('id-ID', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                      <span className="text-[11px] text-slate-500 block truncate max-w-[180px]">
                        {record.keterangan}
                      </span>
                    </div>
                  </div>
                  <span className="font-extrabold text-xs text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg flex-shrink-0">
                    -{formatRupiah(record.nominal)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal 1: Pengaturan Tagihan Biaya */}
      <Modal
        isOpen={isTagihanModalOpen}
        onClose={() => setIsTagihanModalOpen(false)}
        title="Pengaturan Tagihan Biaya Santri"
      >
        <form onSubmit={handleAddFeeSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Nama Jenis Biaya</label>
            <input
              type="text"
              required
              placeholder="Contoh: SPP Bulanan, Biaya Ujian"
              value={newFee.nama}
              onChange={(e) => setNewFee({ ...newFee, nama: e.target.value })}
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-sky-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Nominal (Rp)</label>
            <input
              type="number"
              required
              placeholder="100000"
              value={newFee.nominal}
              onChange={(e) => setNewFee({ ...newFee, nominal: e.target.value })}
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-sky-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">Keterangan</label>
            <input
              type="text"
              placeholder="Keterangan tambahan..."
              value={newFee.keterangan}
              onChange={(e) => setNewFee({ ...newFee, keterangan: e.target.value })}
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsTagihanModalOpen(false)}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-lg"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Tagihan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 1b: Edit Tagihan */}
      <Modal
        isOpen={!!editingFee}
        onClose={() => setEditingFee(null)}
        title="Edit Jenis Tagihan"
      >
        {editingFee && (
          <form onSubmit={handleEditFeeSubmit} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nama Jenis Biaya</label>
              <input
                type="text"
                required
                placeholder="Contoh: SPP Bulanan, Biaya Ujian"
                value={editingFee.nama}
                onChange={(e) => setEditingFee({ ...editingFee, nama: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nominal (Rp)</label>
              <input
                type="number"
                required
                placeholder="100000"
                value={editingFee.nominal}
                onChange={(e) => setEditingFee({ ...editingFee, nominal: parseFloat(e.target.value) || 0 })}
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-sky-500 focus:outline-none"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                * Perubahan nominal akan otomatis tersimpan di database dan sinkron ke seluruh perangkat.
              </p>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Keterangan</label>
              <input
                type="text"
                placeholder="Keterangan tambahan..."
                value={editingFee.keterangan}
                onChange={(e) => setEditingFee({ ...editingFee, keterangan: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-sky-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingFee(null)}
                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-4 py-2 rounded-lg"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-lg"
              >
                {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Modal 2: Input Pemasukan Pembayaran */}
      <Modal
        isOpen={isPemasukanModalOpen}
        onClose={() => setIsPemasukanModalOpen(false)}
        title="Input Pemasukan Pembayaran Santri"
      >
        <form onSubmit={handleAddPaymentSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Pilih Santri</label>
            <select
              value={newPayment.santriId}
              onChange={(e) => setNewPayment({ ...newPayment, santriId: e.target.value })}
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-sky-500 focus:outline-none bg-white text-slate-800 font-semibold"
            >
              {santriList.length === 0 ? (
                <option value="">Belum ada santri terdaftar</option>
              ) : (
                santriList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nama} (ID: #{s.id})
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tanggal Bayar</label>
              <input
                type="date"
                required
                value={newPayment.tanggal}
                onChange={(e) => setNewPayment({ ...newPayment, tanggal: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-sky-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Jenis Pembayaran</label>
              <input
                type="text"
                required
                list="fee-category-list"
                value={newPayment.jenis}
                onChange={(e) => setNewPayment({ ...newPayment, jenis: e.target.value })}
                placeholder="Contoh: SPP Bulanan"
                className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-sky-500 focus:outline-none"
              />
              <datalist id="fee-category-list">
                {feeCategories.map((f) => (
                  <option key={f.id} value={f.nama} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Nominal Pemasukan (Rp)</label>
            <input
              type="number"
              required
              placeholder="100000"
              value={newPayment.nominal}
              onChange={(e) => setNewPayment({ ...newPayment, nominal: e.target.value })}
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-sky-500 focus:outline-none font-bold text-emerald-700"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsPemasukanModalOpen(false)}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || santriList.length === 0}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-lg"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Pemasukan'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 3: Fitur Setor Uang */}
      <Modal
        isOpen={isSetorModalOpen}
        onClose={() => setIsSetorModalOpen(false)}
        title="Setor Kas Uang di Tangan"
      >
        <form onSubmit={handleSetorUangSubmit} className="space-y-3 text-xs">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-amber-800 text-[11px]">
            <p className="font-bold">Info Transaksi Setor Uang:</p>
            <p>
              Transaksi ini akan <strong>mengurangi Saldo Uang di Tangan</strong> (Kas Aktif) di database secara real-time.
            </p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Tanggal Setor</label>
            <input
              type="date"
              required
              value={setorForm.tanggal}
              onChange={(e) => setSetorForm({ ...setorForm, tanggal: e.target.value })}
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Nominal Setoran (Rp)</label>
            <input
              type="number"
              required
              placeholder="100000"
              max={saldoDiTangan}
              value={setorForm.nominal}
              onChange={(e) => setSetorForm({ ...setorForm, nominal: e.target.value })}
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-sky-500 focus:outline-none font-bold text-rose-700"
            />
            <span className="text-[10px] text-slate-500 mt-1 block">
              Maksimal setoran kas aktif: {formatRupiah(saldoDiTangan)}
            </span>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Penerima / Catatan Setoran</label>
            <input
              type="text"
              required
              placeholder="Disetorkan ke Bendahara Utama / Bank MDTA"
              value={setorForm.keterangan}
              onChange={(e) => setSetorForm({ ...setorForm, keterangan: e.target.value })}
              className="w-full border border-slate-300 rounded-lg p-2.5 focus:border-sky-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsSetorModalOpen(false)}
              className="bg-slate-300 hover:bg-slate-400 text-slate-800 font-bold px-4 py-2 rounded-lg"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-lg"
            >
              {isSubmitting ? 'Memproses...' : 'Konfirmasi Setor Uang'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 4: Detail Keuangan Santri */}
      <Modal
        isOpen={!!selectedSantriDetail}
        onClose={() => setSelectedSantriDetail(null)}
        title={`Rincian Keuangan: ${selectedSantriDetail?.nama || ''}`}
      >
        {selectedSantriDetail && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-sky-50 p-3 rounded-lg border border-sky-200">
                <span className="text-[10px] text-sky-700 font-bold uppercase block">Total Tanggungan</span>
                <span className="text-base font-extrabold text-sky-900">
                  {formatRupiah(selectedSantriDetail.totalTanggungan)}
                </span>
              </div>
              <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                <span className="text-[10px] text-emerald-700 font-bold uppercase block">Total Sudah Dibayar</span>
                <span className="text-base font-extrabold text-emerald-900">
                  {formatRupiah(selectedSantriDetail.totalDibayar)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 flex items-center space-x-1">
                <History className="w-4 h-4 text-sky-600" />
                <span>Riwayat Tanggal Pembayaran</span>
              </h4>

              {selectedSantriDetail.riwayat.length === 0 ? (
                <p className="text-slate-400 italic text-[11px]">Belum ada riwayat pembayaran.</p>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-lg divide-y divide-slate-200">
                  {selectedSantriDetail.riwayat.map((r) => (
                    <div key={r.id} className="p-2.5 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-800 block">{r.jenis}</span>
                        <span className="text-[10px] text-slate-500">{r.tanggal}</span>
                      </div>
                      <span className="font-extrabold text-emerald-700">{formatRupiah(r.nominal)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedSantriDetail(null)}
                className="bg-sky-500 hover:bg-sky-600 text-white font-bold px-4 py-2 rounded-lg"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
