import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const secretKey = process.env.JWT_SECRET || 'super-secret-local-dev-key';
const encodedKey = new TextEncoder().encode(secretKey);

export type SessionPayload = {
  userId: string;
  role: string;
  email: string;
  name: string;
  expiresAt: Date;
};

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('2h')
    .sign(encodedKey);
}

export async function decrypt(session: string | undefined = '') {
  if (!session) return null;
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ['HS256'],
    });
    return payload as SessionPayload;
  } catch (error) {
    return null;
  }
}

export async function createSession(payload: Omit<SessionPayload, 'expiresAt'>) {
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours
  const session = await encrypt({ ...payload, expiresAt });

  (await cookies()).set('session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
    sameSite: 'lax',
    path: '/',
  });
}

export async function getSession() {
  const sessionCookie = (await cookies()).get('session')?.value;
  if (!sessionCookie) return null;
  const payload = await decrypt(sessionCookie);
  if (!payload || new Date(payload.expiresAt) < new Date()) {
    return null;
  }
  return payload;
}

export async function deleteSession() {
  (await cookies()).delete('session');
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}
