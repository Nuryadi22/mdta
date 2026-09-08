'use server';

import { redirect } from 'next/navigation';
import { createSession, deleteSession } from '@/app/lib/session';
import { db } from '@/app/lib/db';
import { RowDataPacket } from 'mysql2';

interface UserRow extends RowDataPacket {
  id: number;
  name: string;
  username: string;
  password: string;
}

export async function login(
  _prevState: { error: string } | undefined,
  formData: FormData
): Promise<{ error: string }> {
  const username = (formData.get('username') as string)?.trim();
  const password = formData.get('password') as string;

  if (!username || !password) {
    return { error: 'Username dan password harus diisi.' };
  }

  try {
    const [rows] = await db.query<UserRow[]>(
      'SELECT id, username, password FROM users WHERE username = ? LIMIT 1',
      [username]
    );

    if (!rows || rows.length === 0) {
      return { error: 'Username atau password salah!' };
    }

    const user = rows[0];
    if (user.password !== password) {
      return { error: 'Username atau password salah!' };
    }
  } catch (error) {
    console.error('Login database error:', error);
    return { error: 'Gagal terhubung ke database. Silakan coba beberapa saat lagi.' };
  }

  await createSession();
  redirect('/');
}

export async function logout() {
  await deleteSession();
  redirect('/login');
}
