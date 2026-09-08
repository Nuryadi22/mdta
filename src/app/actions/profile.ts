'use server';

import { db } from '@/app/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { revalidatePath } from 'next/cache';

export interface ProfileData {
  namaUstadz: string;
  namaMdta: string;
}

interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  username: string;
  password: string;
  mdtaName: string;
}

export async function getProfile(): Promise<ProfileData> {
  try {
    const [rows] = await db.query<UserRow[]>(
      'SELECT id, name, username, mdtaName FROM users ORDER BY id ASC LIMIT 1'
    );

    if (rows && rows.length > 0) {
      return {
        namaUstadz: rows[0].name || 'Nuryadi',
        namaMdta: rows[0].mdtaName || 'MDTA Al-Istikmal',
      };
    }
  } catch (error) {
    console.error('Error fetching profile from database:', error);
  }

  return {
    namaUstadz: 'Nuryadi',
    namaMdta: 'MDTA Al-Istikmal',
  };
}

export async function updateProfile(data: ProfileData): Promise<{ success: boolean; error?: string }> {
  try {
    if (!data.namaUstadz || !data.namaMdta) {
      return { success: false, error: 'Nama Ustadz dan Nama MDTA harus diisi' };
    }

    const [result] = await db.query<ResultSetHeader>(
      'UPDATE users SET name = ?, mdtaName = ? WHERE id = 1',
      [data.namaUstadz.trim(), data.namaMdta.trim()]
    );

    if (result.affectedRows === 0) {
      // If no row with id = 1, insert one
      await db.query(
        'INSERT INTO users (id, name, username, password, role, mdtaName) VALUES (1, ?, "Admin", "admin123", "USTADZ", ?)',
        [data.namaUstadz.trim(), data.namaMdta.trim()]
      );
    }

    revalidatePath('/');
    revalidatePath('/profil');
    return { success: true };
  } catch (error) {
    console.error('Error updating profile in database:', error);
    return { success: false, error: 'Gagal memperbarui profil di database' };
  }
}

export async function changePassword(
  oldPassword: string,
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!oldPassword || !newPassword) {
      return { success: false, error: 'Password lama dan baru harus diisi' };
    }

    const [rows] = await db.query<UserRow[]>(
      'SELECT id, password FROM users WHERE id = 1 LIMIT 1'
    );

    if (!rows || rows.length === 0) {
      return { success: false, error: 'User tidak ditemukan di database' };
    }

    const currentUser = rows[0];
    if (currentUser.password !== oldPassword) {
      return { success: false, error: 'Password lama salah!' };
    }

    await db.query('UPDATE users SET password = ? WHERE id = 1', [newPassword]);

    return { success: true };
  } catch (error) {
    console.error('Error changing password in database:', error);
    return { success: false, error: 'Gagal mengubah password di database' };
  }
}
