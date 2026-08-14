import { apiClient } from './apiClient'
import { clearToken, getToken, setToken } from '@/lib/authToken'

interface AuthConfig {
  authRequired: boolean
}

interface SessionResponse {
  token: string
}

export const sessionService = {
  /** O servidor exige senha? (permite pular o login em ambientes abertos). */
  async config(): Promise<AuthConfig> {
    return apiClient.get<AuthConfig>('/auth-config')
  },

  /** Faz login com a senha compartilhada e guarda o token da sessão. */
  async login(password: string): Promise<void> {
    const { token } = await apiClient.post<SessionResponse>('/session', { password })
    setToken(token)
  },

  logout(): void {
    clearToken()
  },

  hasToken(): boolean {
    return getToken() !== null
  },
}
