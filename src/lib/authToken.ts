// Token de sessão guardado localmente no aparelho. Fica fora do store/serviços
// pra evitar dependência circular: tanto o apiClient quanto o hook de sessão
// leem daqui.

const TOKEN_KEY = 'mesao:token'
export const UNAUTHORIZED_EVENT = 'mesao:unauthorized'

export function getToken(): string | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

/** Avisa o app que o token não vale mais (ex: 401), pra voltar pro login. */
export function notifyUnauthorized(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
  }
}
