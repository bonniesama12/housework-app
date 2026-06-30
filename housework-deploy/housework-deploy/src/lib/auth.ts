import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'housework-app-secret-key-change-in-production')
const COOKIE_NAME = 'housework_session'

export interface SessionPayload {
  id: string
  name: string
  role: 'husband' | 'wife'
  houseId: string
  houseName: string
}

export async function createSession(payload: SessionPayload): Promise<string> {
  const token = await new SignJWT(payload as any)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(SECRET)
  return token
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET)
    return payload as any
  } catch {
    return null
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value
  if (!token) return null
  return verifySession(token)
}

export function setSessionCookie(token: string) {
  return {
    'Set-Cookie': `${COOKIE_NAME}=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=2592000`
  }
}

export function clearSessionCookie() {
  return {
    'Set-Cookie': `${COOKIE_NAME}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`
  }
}
