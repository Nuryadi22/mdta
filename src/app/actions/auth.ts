'use server';

import { redirect } from 'next/navigation';
import { createSession, deleteSession } from '@/app/lib/session';

const VALID_USERNAME = 'Admin';
const VALID_PASSWORD = 'admin123';

export async function login(
  _prevState: { error: string } | undefined,
  formData: FormData
): Promise<{ error: string }> {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  if (!username || !password) {
    return { error: 'Username dan password harus diisi.' };
  }

  if (username !== VALID_USERNAME || password !== VALID_PASSWORD) {
    return { error: 'Username atau password salah!' };
  }

  await createSession();
  redirect('/');
}

export async function logout() {
  await deleteSession();
  redirect('/login');
}
