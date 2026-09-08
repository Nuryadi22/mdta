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

export const DEFAULT_SANTRI_LIST: Santri[] = [];

const STORAGE_KEY = 'mdta_santri_list_v1';
const STORAGE_KEY_OLD = 'mdta_santri_list_v1'; // same key, clear old dummy data
const EVENT_NAME = 'mdta_santri_updated';

export function getSantriList(): Santri[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed: Santri[] = JSON.parse(data);
      // Reset if it contains old dummy data (Ahmad Rizky)
      if (parsed.length > 0 && parsed[0].nama === 'Ahmad Rizky') {
        localStorage.removeItem(STORAGE_KEY);
        return [];
      }
      return parsed;
    }
    return [];
  } catch (e) {
    console.error('Failed to read santri list from localStorage', e);
  }
  return [];
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
  const [santriList, setSantriList] = useState<Santri[]>([]);

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
