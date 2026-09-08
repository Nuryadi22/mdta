'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getSantriList as fetchSantriListServer,
  addSantri as addSantriServer,
  updateSantri as updateSantriServer,
  deleteSantri as deleteSantriServer,
  Santri,
} from '@/app/actions/santri';

export type { Santri };

export function useSantri() {
  const [santriList, setSantriList] = useState<Santri[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadSantri = useCallback(async () => {
    try {
      const data = await fetchSantriListServer();
      setSantriList(data);
    } catch (err) {
      console.error('Failed to load santri from database', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSantri();
  }, [loadSantri]);

  const addSantri = async (data: Omit<Santri, 'id'>) => {
    const res = await addSantriServer(data);
    if (res.success && res.data) {
      setSantriList((prev) => [...prev, res.data!].sort((a, b) => a.nama.localeCompare(b.nama)));
    }
    return res;
  };

  const updateSantri = async (id: number, data: Omit<Santri, 'id'>) => {
    const res = await updateSantriServer(id, data);
    if (res.success) {
      setSantriList((prev) =>
        prev
          .map((s) => (s.id === id ? { ...s, ...data } : s))
          .sort((a, b) => a.nama.localeCompare(b.nama))
      );
    }
    return res;
  };

  const deleteSantri = async (id: number) => {
    const res = await deleteSantriServer(id);
    if (res.success) {
      setSantriList((prev) => prev.filter((s) => s.id !== id));
    }
    return res;
  };

  return {
    santriList,
    isLoading,
    refreshSantri: loadSantri,
    addSantri,
    updateSantri,
    deleteSantri,
  };
}
