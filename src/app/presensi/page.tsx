'use client';

import React, { useState, useEffect } from 'react';
import Modal from '@/components/Modal';
import {
  Fingerprint,
  Save,
  CheckCircle2,
  Calendar,
  FileText,
  ChevronRight,
  Eye,
  CalendarDays,
  UserCheck,
  AlertTriangle,
  Clock,
  XCircle,
  Filter,
  BarChart3,
  ListFilter
} from 'lucide-react';
import { useSantri } from '@/app/lib/santri';

type AttendanceStatus = 'HADIR' | 'SAKIT' | 'IZIN' | 'ALPA';

interface DailyAttendanceRecord {
  id: string; // date + _ + santriId
  date: string; // YYYY-MM-DD
  santriId: number;
  santriNama: string;
  status: AttendanceStatus;
  keterangan?: string;
}

interface SantriAttendanceItem {
  id: number;
  nama: string;
  status: AttendanceStatus;
  keterangan?: string;
}

const INITIAL_RECORDS: DailyAttendanceRecord[] = [
  // 2026-09-07
  { id: '2026-09-07_1', date: '2026-09-07', santriId: 1, santriNama: 'Ahmad Rizky', status: 'HADIR' },
  { id: '2026-09-07_2', date: '2026-09-07', santriId: 2, santriNama: 'Siti Nurhaliza', status: 'HADIR' },
  { id: '2026-09-07_3', date: '2026-09-07', santriId: 3, santriNama: 'Muhammad Bima', status: 'SAKIT', keterangan: 'Demam tinggi' },
  { id: '2026-09-07_4', date: '2026-09-07', santriId: 4, santriNama: 'Aisyah Putri', status: 'IZIN', keterangan: 'Acara keluarga' },
  { id: '2026-09-07_5', date: '2026-09-07', santriId: 5, santriNama: 'Zahra Amelia', status: 'HADIR' },
  // 2026-09-06
  { id: '2026-09-06_1', date: '2026-09-06', santriId: 1, santriNama: 'Ahmad Rizky', status: 'HADIR' },
  { id: '2026-09-06_2', date: '2026-09-06', santriId: 2, santriNama: 'Siti Nurhaliza', status: 'HADIR' },
  { id: '2026-09-06_3', date: '2026-09-06', santriId: 3, santriNama: 'Muhammad Bima', status: 'HADIR' },
  { id: '2026-09-06_4', date: '2026-09-06', santriId: 4, santriNama: 'Aisyah Putri', status: 'HADIR' },
  { id: '2026-09-06_5', date: '2026-09-06', santriId: 5, santriNama: 'Zahra Amelia', status: 'ALPA', keterangan: 'Tanpa keterangan' },
  // 2026-09-05
  { id: '2026-09-05_1', date: '2026-09-05', santriId: 1, santriNama: 'Ahmad Rizky', status: 'HADIR' },
  { id: '2026-09-05_2', date: '2026-09-05', santriId: 2, santriNama: 'Siti Nurhaliza', status: 'IZIN', keterangan: 'Izin berobat' },
  { id: '2026-09-05_3', date: '2026-09-05', santriId: 3, santriNama: 'Muhammad Bima', status: 'HADIR' },
  { id: '2026-09-05_4', date: '2026-09-05', santriId: 4, santriNama: 'Aisyah Putri', status: 'HADIR' },
  { id: '2026-09-05_5', date: '2026-09-05', santriId: 5, santriNama: 'Zahra Amelia', status: 'HADIR' },
  // 2026-09-04
  { id: '2026-09-04_1', date: '2026-09-04', santriId: 1, santriNama: 'Ahmad Rizky', status: 'HADIR' },
  { id: '2026-09-04_2', date: '2026-09-04', santriId: 2, santriNama: 'Siti Nurhaliza', status: 'HADIR' },
  { id: '2026-09-04_3', date: '2026-09-04', santriId: 3, santriNama: 'Muhammad Bima', status: 'HADIR' },
  { id: '2026-09-04_4', date: '2026-09-04', santriId: 4, santriNama: 'Aisyah Putri', status: 'HADIR' },
  { id: '2026-09-04_5', date: '2026-09-04', santriId: 5, santriNama: 'Zahra Amelia', status: 'HADIR' },
  // 2026-09-03
  { id: '2026-09-03_1', date: '2026-09-03', santriId: 1, santriNama: 'Ahmad Rizky', status: 'SAKIT', keterangan: 'Flu dan batuk' },
  { id: '2026-09-03_2', date: '2026-09-03', santriId: 2, santriNama: 'Siti Nurhaliza', status: 'HADIR' },
  { id: '2026-09-03_3', date: '2026-09-03', santriId: 3, santriNama: 'Muhammad Bima', status: 'HADIR' },
  { id: '2026-09-03_4', date: '2026-09-03', santriId: 4, santriNama: 'Aisyah Putri', status: 'HADIR' },
  { id: '2026-09-03_5', date: '2026-09-03', santriId: 5, santriNama: 'Zahra Amelia', status: 'HADIR' },
];

const LOCAL_STORAGE_KEY = 'mdta_attendance_records_v1';

export default function PresensiPage() {
  const { santriList } = useSantri();
  const [activeTab, setActiveTab] = useState<'INPUT' | 'REKAP'>('INPUT');
  const [selectedDate, setSelectedDate] = useState('2026-09-07');
  const [selectedMonth, setSelectedMonth] = useState('2026-09'); // YYYY-MM
  const [isSavedDraft, setIsSavedDraft] = useState(false);
  const [isFinalCommitted, setIsFinalCommitted] = useState(false);

  // All stored daily attendance records
  const [allRecords, setAllRecords] = useState<DailyAttendanceRecord[]>(INITIAL_RECORDS);

  // Current date input list
  const [attendanceList, setAttendanceList] = useState<SantriAttendanceItem[]>([]);

  // Santri detail modal state
  const [selectedSantriId, setSelectedSantriId] = useState<number | null>(null);
  const [modalViewMode, setModalViewMode] = useState<'PER_BULAN' | 'PER_HARI'>('PER_BULAN');

  // Load from localStorage on client side
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        setAllRecords(JSON.parse(saved));
      }
    } catch (err) {
      console.error('Failed to load attendance records from localStorage', err);
    }
  }, []);

  // Save to localStorage when records update
  const saveRecordsToStorage = (records: DailyAttendanceRecord[]) => {
    setAllRecords(records);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));
    } catch (err) {
      console.error('Failed to save attendance records to localStorage', err);
    }
  };

  // Populate attendance list whenever selectedDate, santriList, or allRecords change
  useEffect(() => {
    const existingDateRecords = allRecords.filter((r) => r.date === selectedDate);
    
    const items: SantriAttendanceItem[] = santriList.map((santri) => {
      const found = existingDateRecords.find((r) => r.santriId === santri.id);
      return {
        id: santri.id,
        nama: santri.nama,
        status: found ? found.status : 'HADIR',
        keterangan: found?.keterangan || '',
      };
    });

    setAttendanceList(items);
    setIsSavedDraft(false);
    setIsFinalCommitted(existingDateRecords.length > 0);
  }, [selectedDate, allRecords, santriList]);

  const handleStatusChange = (id: number, status: AttendanceStatus) => {
    setAttendanceList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
    setIsSavedDraft(true);
    setIsFinalCommitted(false);
  };

  const handleKeteranganChange = (id: number, keterangan: string) => {
    setAttendanceList((prev) =>
      prev.map((item) => (item.id === id ? { ...item, keterangan } : item))
    );
    setIsSavedDraft(true);
    setIsFinalCommitted(false);
  };

  const handleSaveDraft = () => {
    setIsSavedDraft(true);
  };

  const handleFinalCommit = () => {
    const updatedRecords = [...allRecords.filter((r) => r.date !== selectedDate)];
    
    attendanceList.forEach((item) => {
      updatedRecords.push({
        id: `${selectedDate}_${item.id}`,
        date: selectedDate,
        santriId: item.id,
        santriNama: item.nama,
        status: item.status,
        keterangan: item.keterangan || '',
      });
    });

    saveRecordsToStorage(updatedRecords);
    setIsFinalCommitted(true);
    setIsSavedDraft(false);
  };

  // Helper for Status Buttons in Input Form
  const renderStatusButton = (
    santriId: number,
    currentStatus: AttendanceStatus,
    targetStatus: AttendanceStatus,
    label: string,
    activeColorClass: string
  ) => {
    const isSelected = currentStatus === targetStatus;
    return (
      <button
        type="button"
        onClick={() => handleStatusChange(santriId, targetStatus)}
        className={`px-2.5 py-1 text-[11px] font-bold rounded-md transition-all ${
          isSelected
            ? `${activeColorClass} text-white shadow-xs`
            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
        }`}
      >
        {label}
      </button>
    );
  };

  // Helper for status badge styling
  const renderStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case 'HADIR':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-200">Hadir</span>;
      case 'IZIN':
        return <span className="bg-sky-100 text-sky-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-sky-200">Izin</span>;
      case 'SAKIT':
        return <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-amber-200">Sakit</span>;
      case 'ALPA':
        return <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-md border border-rose-200">Alpa</span>;
    }
  };

  // Format Date Helper
  const formatDateIndo = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T00:00:00');
      return d.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Calculate Monthly Rekap for all santri in selectedMonth
  const getMonthlyRekapList = () => {
    const monthRecords = allRecords.filter((r) => r.date.startsWith(selectedMonth));
    
    return santriList.map((santri) => {
      const santriRecords = monthRecords.filter((r) => r.santriId === santri.id);
      const hadir = santriRecords.filter((r) => r.status === 'HADIR').length;
      const sakit = santriRecords.filter((r) => r.status === 'SAKIT').length;
      const izin = santriRecords.filter((r) => r.status === 'IZIN').length;
      const alpa = santriRecords.filter((r) => r.status === 'ALPA').length;
      const totalRecordedDays = santriRecords.length;
      const percentage = totalRecordedDays > 0 ? Math.round((hadir / totalRecordedDays) * 100) : 0;

      return {
        ...santri,
        hadir,
        sakit,
        izin,
        alpa,
        totalRecordedDays,
        percentage,
      };
    });
  };

  const selectedSantriInfo = santriList.find((s) => s.id === selectedSantriId);

  // Selected Santri's records for selected month
  const selectedSantriMonthRecords = selectedSantriId
    ? allRecords
        .filter((r) => r.santriId === selectedSantriId && r.date.startsWith(selectedMonth))
        .sort((a, b) => b.date.localeCompare(a.date))
    : [];

  const selectedSantriAllRecords = selectedSantriId
    ? allRecords
        .filter((r) => r.santriId === selectedSantriId)
        .sort((a, b) => b.date.localeCompare(a.date))
    : [];

  const selectedSantriMonthlyStats = () => {
    const recs = selectedSantriMonthRecords;
    const hadir = recs.filter((r) => r.status === 'HADIR').length;
    const sakit = recs.filter((r) => r.status === 'SAKIT').length;
    const izin = recs.filter((r) => r.status === 'IZIN').length;
    const alpa = recs.filter((r) => r.status === 'ALPA').length;
    const total = recs.length;
    const percentage = total > 0 ? Math.round((hadir / total) * 100) : 0;
    return { hadir, sakit, izin, alpa, total, percentage };
  };

  const statsModal = selectedSantriMonthlyStats();

  return (
    <div className="space-y-4">
      {/* Top Tab Switcher */}
      <div className="bg-slate-200 p-1 rounded-xl flex items-center text-xs font-bold">
        <button
          onClick={() => setActiveTab('INPUT')}
          className={`w-1/2 py-2 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
            activeTab === 'INPUT'
              ? 'bg-sky-500 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Fingerprint className="w-4 h-4" />
          <span>Input Presensi</span>
        </button>
        <button
          onClick={() => setActiveTab('REKAP')}
          className={`w-1/2 py-2 rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
            activeTab === 'REKAP'
              ? 'bg-sky-500 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Rekapan Kehadiran</span>
        </button>
      </div>

      {/* TAB 1: INPUT PRESENSI MANUAL */}
      {activeTab === 'INPUT' && (
        <div className="space-y-4">
          {/* Date Picker Header */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                <Calendar className="w-4 h-4 text-sky-600" />
                <span>Tanggal Presensi</span>
              </label>
              {isSavedDraft && (
                <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                  Draft Tersimpan
                </span>
              )}
              {isFinalCommitted && (
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center space-x-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Tersimpan di Database</span>
                </span>
              )}
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-sky-500 bg-slate-50"
            />
          </div>

          {/* Student List with Attendance Pills */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Daftar Santri ({attendanceList.length})
              </span>
              <button
                onClick={handleSaveDraft}
                className="text-xs font-semibold text-sky-600 hover:underline flex items-center space-x-1"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Sementara</span>
              </button>
            </div>

            {attendanceList.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-400 text-xs">
                Belum ada data santri. Tambahkan data santri di menu Data Santri terlebih dahulu.
              </div>
            ) : (
              attendanceList.map((santri) => (
                <div
                  key={santri.id}
                  className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex flex-col space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800">{santri.nama}</span>
                    <span className="text-[10px] font-bold text-slate-400">ID: #{santri.id}</span>
                  </div>

                  {/* 4 Attendance Pills */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {renderStatusButton(
                      santri.id,
                      santri.status,
                      'HADIR',
                      'Hadir',
                      'bg-emerald-600'
                    )}
                    {renderStatusButton(
                      santri.id,
                      santri.status,
                      'IZIN',
                      'Izin',
                      'bg-sky-500'
                    )}
                    {renderStatusButton(
                      santri.id,
                      santri.status,
                      'SAKIT',
                      'Sakit',
                      'bg-amber-500'
                    )}
                    {renderStatusButton(
                      santri.id,
                      santri.status,
                      'ALPA',
                      'Alpa',
                      'bg-rose-600'
                    )}
                  </div>

                  {/* Optional Notes Input if not HADIR */}
                  {santri.status !== 'HADIR' && (
                    <input
                      type="text"
                      placeholder={`Catatan/keterangan ${santri.status.toLowerCase()}...`}
                      value={santri.keterangan || ''}
                      onChange={(e) => handleKeteranganChange(santri.id, e.target.value)}
                      className="w-full text-[11px] border border-slate-200 rounded-md px-2 py-1 bg-slate-50 focus:outline-none focus:border-sky-400"
                    />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Final Commit Button */}
          <div className="pt-2">
            <button
              onClick={handleFinalCommit}
              disabled={attendanceList.length === 0}
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold py-3 rounded-xl flex items-center justify-center space-x-2 shadow-md text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Simpan Final Presensi ke Database</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: REKAPAN KEHADIRAN */}
      {activeTab === 'REKAP' && (
        <div className="space-y-3">
          {/* Header Info & Month Filter */}
          <div className="bg-sky-50 border border-sky-200 rounded-xl p-3.5 text-xs text-sky-900 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-sky-900">Rekapitulasi Kehadiran Santri</p>
                <p className="text-[11px] text-sky-700 mt-0.5">
                  Klik nama santri untuk melihat rincian <strong>Per Hari</strong> dan <strong>Per Bulan</strong>.
                </p>
              </div>
            </div>

            {/* Filter Month Input */}
            <div className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-sky-200">
              <Filter className="w-4 h-4 text-sky-600 flex-shrink-0" />
              <label className="text-[11px] font-bold text-slate-700 whitespace-nowrap">Pilih Bulan:</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* Rekapitulasi Table / Cards List */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
            <div className="divide-y divide-slate-100">
              {getMonthlyRekapList().map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setSelectedSantriId(item.id);
                    setModalViewMode('PER_BULAN');
                  }}
                  className="p-3.5 flex items-center justify-between hover:bg-sky-50/50 cursor-pointer transition-colors"
                >
                  <div className="space-y-1.5 flex-1 pr-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-slate-800">{item.nama}</h4>
                      <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {item.percentage}% Hadir
                      </span>
                    </div>

                    <div className="flex items-center space-x-1.5 text-[10px] font-semibold flex-wrap gap-y-1">
                      <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        Hadir: {item.hadir}
                      </span>
                      <span className="text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded">
                        Izin: {item.izin}
                      </span>
                      <span className="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">
                        Sakit: {item.sakit}
                      </span>
                      <span className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
                        Alpa: {item.alpa}
                      </span>
                      <span className="text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                        Total: {item.totalRecordedDays} Hari
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1 text-slate-400 flex-shrink-0">
                    <Eye className="w-4 h-4 text-sky-600" />
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Rincian Kehadiran Santri (Per Hari & Per Bulan) */}
      <Modal
        isOpen={selectedSantriId !== null}
        onClose={() => setSelectedSantriId(null)}
        title={`Rincian Kehadiran: ${selectedSantriInfo?.nama || ''}`}
      >
        {selectedSantriInfo && (
          <div className="space-y-4 text-xs">
            {/* View Switcher: Per Bulan vs Per Hari */}
            <div className="bg-slate-100 p-1 rounded-lg flex items-center text-xs font-bold">
              <button
                type="button"
                onClick={() => setModalViewMode('PER_BULAN')}
                className={`w-1/2 py-1.5 rounded-md flex items-center justify-center space-x-1 transition-all ${
                  modalViewMode === 'PER_BULAN'
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Rekap Per Bulan</span>
              </button>
              <button
                type="button"
                onClick={() => setModalViewMode('PER_HARI')}
                className={`w-1/2 py-1.5 rounded-md flex items-center justify-center space-x-1 transition-all ${
                  modalViewMode === 'PER_HARI'
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>Rincian Per Hari</span>
              </button>
            </div>

            {/* MODE 1: REKAP PER BULAN */}
            {modalViewMode === 'PER_BULAN' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-slate-600 text-[11px] font-semibold bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <span>Periode Bulan:</span>
                  <strong className="text-slate-800">{selectedMonth}</strong>
                </div>

                {/* 4 Stat Cards */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200 text-center">
                    <span className="block text-[10px] text-emerald-700 font-bold uppercase">Hadir</span>
                    <span className="text-lg font-extrabold text-emerald-800">{statsModal.hadir} Hari</span>
                  </div>
                  <div className="bg-sky-50 p-2.5 rounded-lg border border-sky-200 text-center">
                    <span className="block text-[10px] text-sky-700 font-bold uppercase">Izin</span>
                    <span className="text-lg font-extrabold text-sky-800">{statsModal.izin} Hari</span>
                  </div>
                  <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-center">
                    <span className="block text-[10px] text-amber-700 font-bold uppercase">Sakit</span>
                    <span className="text-lg font-extrabold text-amber-800">{statsModal.sakit} Hari</span>
                  </div>
                  <div className="bg-rose-50 p-2.5 rounded-lg border border-rose-200 text-center">
                    <span className="block text-[10px] text-rose-700 font-bold uppercase">Alpa</span>
                    <span className="text-lg font-extrabold text-rose-800">{statsModal.alpa} Hari</span>
                  </div>
                </div>

                {/* Progress Bar & Percentage */}
                <div className="border-t border-slate-100 pt-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                    <span>Persentase Kehadiran</span>
                    <span className="text-emerald-700">{statsModal.percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3.5 overflow-hidden p-0.5">
                    <div
                      className="bg-emerald-600 h-full rounded-full text-[9px] text-white flex items-center justify-center font-bold transition-all duration-300"
                      style={{
                        width: `${statsModal.percentage}%`,
                      }}
                    >
                      {statsModal.percentage > 10 ? `${statsModal.percentage}%` : ''}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 italic">
                    Total hari tercatat pada bulan ini: {statsModal.total} hari efektif.
                  </p>
                </div>
              </div>
            )}

            {/* MODE 2: RINCIAN PER HARI */}
            {modalViewMode === 'PER_HARI' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-800 flex items-center space-x-1">
                    <CalendarDays className="w-4 h-4 text-sky-600" />
                    <span>Log Kehadiran Harian ({selectedSantriAllRecords.length} Hari)</span>
                  </h4>
                </div>

                {selectedSantriAllRecords.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs italic bg-slate-50 rounded-lg">
                    Belum ada riwayat kehadiran harian untuk santri ini.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {selectedSantriAllRecords.map((record) => (
                      <div
                        key={record.id}
                        className="bg-white border border-slate-200 rounded-lg p-2.5 flex items-center justify-between shadow-2xs"
                      >
                        <div className="space-y-0.5">
                          <span className="font-bold text-xs text-slate-800 block">
                            {formatDateIndo(record.date)}
                          </span>
                          {record.keterangan ? (
                            <span className="text-[10px] text-slate-500 block italic">
                              Ket: {record.keterangan}
                            </span>
                          ) : null}
                        </div>
                        <div>{renderStatusBadge(record.status)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedSantriId(null)}
                className="bg-sky-500 hover:bg-sky-600 text-white font-bold px-4 py-2 rounded-lg transition-colors"
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
