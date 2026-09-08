'use server';

import { db } from '@/app/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { revalidatePath } from 'next/cache';

export interface Santri {
  id: number;
  nama: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: 'LAKIKLAKI' | 'PEREMPUAN';
  noHp: string;
}

interface SantriRow extends RowDataPacket {
  id: number;
  nama: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: 'LAKIKLAKI' | 'PEREMPUAN';
  noHp: string;
}

export async function getSantriList(): Promise<Santri[]> {
  try {
    const [rows] = await db.query<SantriRow[]>(
      `SELECT 
        id, 
        name AS nama, 
        birthPlace AS tempatLahir, 
        DATE_FORMAT(birthDate, '%Y-%m-%d') AS tanggalLahir, 
        gender AS jenisKelamin, 
        phone AS noHp 
      FROM santri 
      WHERE isActive = 1 
      ORDER BY name ASC`
    );

    return rows || [];
  } catch (error) {
    console.error('Error fetching santri list from database:', error);
    return [];
  }
}

export async function addSantri(
  data: Omit<Santri, 'id'>
): Promise<{ success: boolean; data?: Santri; error?: string }> {
  try {
    if (!data.nama) {
      return { success: false, error: 'Nama santri harus diisi' };
    }

    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO santri (name, birthPlace, birthDate, gender, phone, isActive) 
       VALUES (?, ?, ?, ?, ?, 1)`,
      [
        data.nama.trim(),
        data.tempatLahir || '',
        data.tanggalLahir || '2015-01-01',
        data.jenisKelamin || 'LAKIKLAKI',
        data.noHp || '',
      ]
    );

    const newSantri: Santri = {
      id: result.insertId,
      nama: data.nama.trim(),
      tempatLahir: data.tempatLahir || '',
      tanggalLahir: data.tanggalLahir || '2015-01-01',
      jenisKelamin: data.jenisKelamin || 'LAKIKLAKI',
      noHp: data.noHp || '',
    };

    revalidatePath('/santri');
    revalidatePath('/presensi');
    revalidatePath('/keuangan');
    revalidatePath('/');

    return { success: true, data: newSantri };
  } catch (error) {
    console.error('Error adding santri to database:', error);
    return { success: false, error: 'Gagal menambahkan data santri ke database' };
  }
}

export async function updateSantri(
  id: number,
  data: Omit<Santri, 'id'>
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!id || !data.nama) {
      return { success: false, error: 'ID dan nama santri harus diisi' };
    }

    await db.query(
      `UPDATE santri 
       SET name = ?, birthPlace = ?, birthDate = ?, gender = ?, phone = ? 
       WHERE id = ?`,
      [
        data.nama.trim(),
        data.tempatLahir || '',
        data.tanggalLahir || '2015-01-01',
        data.jenisKelamin || 'LAKIKLAKI',
        data.noHp || '',
        id,
      ]
    );

    revalidatePath('/santri');
    revalidatePath('/presensi');
    revalidatePath('/keuangan');
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('Error updating santri in database:', error);
    return { success: false, error: 'Gagal memperbarui data santri di database' };
  }
}

export async function deleteSantri(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    if (!id) {
      return { success: false, error: 'ID santri tidak valid' };
    }

    await db.query('DELETE FROM santri WHERE id = ?', [id]);

    revalidatePath('/santri');
    revalidatePath('/presensi');
    revalidatePath('/keuangan');
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('Error deleting santri from database:', error);
    return { success: false, error: 'Gagal menghapus data santri di database' };
  }
}
