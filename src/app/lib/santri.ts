'use client';

import { useState, useEffect } from 'react';

export interface Santri {
  id: number;
  nama: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: 'LAKIKLAKI' | 'PEREMPUAN';
  noHp: string;
}

export const DEFAULT_SANTRI_LIST: Santri[] = [
  { id: 1, nama: 'Ahmad Rizky', tempatLahir: 'Padang', tanggalLahir: '2012-05-14', jenisKelamin: 'LAKIKLAKI', noHp: '081234567890' },
  { id: 2, nama: 'Siti Nurhaliza', tempatLahir: 'Bukittinggi', tanggalLahir: '2013-08-22', jenisKelamin: 'PEREMPUAN', noHp: '082198765432' },
  { id: 3, nama: 'Muhammad Bima', tempatLahir: 'Solok', tanggalLahir: '2012-11-03', jenisKelamin: 'LAKIKLAKI', noHp: '085211223344' },
  { id: 4, nama: 'Aisyah Putri', tempatLahir: 'Payakumbuh', tanggalLahir: '2013-02-17', jenisKelamin: 'PEREMPUAN', noHp: '081377889900' },
  { id: 5, nama: 'Zahra Amelia', tempatLahir: 'Padang Panjang', tanggalLahir: '2012-09-09', jenisKelamin: 'PEREMPUAN', noHp: '085366778899' },
];

const STORAGE_KEY = 'mdta_santri_list_v1';
const EVENT_NAME = 'mdta_santri_updated';

export function getSantriList(): Santri[] {
  if (typeof window === 'undefined') return DEFAULT_SANTRI_LIST;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SANTRI_LIST));
      return DEFAULT_SANTRI_LIST;
    }
  } catch (e) {
    console.error('Failed to read santri list from localStorage', e);
  }
  return DEFAULT_SANTRI_LIST;
}

export function saveSantriList(list: Santri[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event(EVENT_NAME));
  } catch (e) {
    console.error('Failed to save santri list to localStorage', e);
  }
}

export function useSantri() {
  const [santriList, setSantriList] = useState<Santri[]>(DEFAULT_SANTRI_LIST);

  useEffect(() => {
    setSantriList(getSantriList());

    const handleUpdate = () => {
      setSantriList(getSantriList());
    };

    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  return { santriList, updateSantriList: saveSantriList };
}
