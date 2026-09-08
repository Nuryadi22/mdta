import 'server-only';
import { cookies } from 'next/headers';

const SESSION_COOKIE_NAME = 'mdta_session';
const SESSION_TOKEN = 'admin-authenticated';

export async function createSession() {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, SESSION_TOKEN, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSession() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return session === SESSION_TOKEN ? { authenticated: true, role: 'Admin' } : null;
}
