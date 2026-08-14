import { SignJWT, jwtVerify } from 'jose'
import { env } from '../env.js'

// Login simples e desacoplado: uma senha compartilhada libera o mesão. Quem
// acerta a senha recebe um token de sessão assinado (JWT) que o app guarda e
// manda em cada request. Sem serviço externo (Cloudflare, OAuth etc.) — dá pra
// hospedar em qualquer lugar e mandar o link + a senha pros amigos.

const secret = new TextEncoder().encode(env.SESSION_SECRET)
const ISSUER = 'mesao-commander'

/** Sem senha configurada => acesso aberto (só faz sentido em desenvolvimento). */
export function authDisabled(): boolean {
  return env.ACCESS_PASSWORD.trim() === ''
}

export function checkPassword(password: string): boolean {
  if (authDisabled()) return true
  return password === env.ACCESS_PASSWORD
}

export async function createSessionToken(): Promise<string> {
  return new SignJWT({ scope: 'mesao' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuer(ISSUER)
    .setIssuedAt()
    .setExpirationTime(env.SESSION_TTL)
    .sign(secret)
}

export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, secret, { issuer: ISSUER })
    return true
  } catch {
    return false
  }
}

/** Extrai e valida o token do header Authorization: Bearer <token>. */
export async function isAuthenticated(authorization: string | undefined): Promise<boolean> {
  if (authDisabled()) return true
  if (!authorization) return false
  const [scheme, token] = authorization.split(' ')
  if (scheme !== 'Bearer' || !token) return false
  return verifySessionToken(token)
}
