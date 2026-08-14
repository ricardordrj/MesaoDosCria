import { useCallback, useEffect, useState } from 'react'
import { sessionService } from '@/services'
import { UNAUTHORIZED_EVENT, getToken } from '@/lib/authToken'

/**
 * Estado de login do mesão. Guarda só um booleano (tem token válido?) e
 * reage ao evento de "não autenticado" disparado pelo apiClient quando uma
 * chamada volta 401 — assim a sessão expirada leva de volta ao login sozinha.
 */
export function useSession() {
  const [isAuthed, setIsAuthed] = useState<boolean>(() => getToken() !== null)

  useEffect(() => {
    const onUnauthorized = () => setIsAuthed(false)
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
  }, [])

  const login = useCallback(async (password: string) => {
    await sessionService.login(password)
    setIsAuthed(true)
  }, [])

  const logout = useCallback(() => {
    sessionService.logout()
    setIsAuthed(false)
  }, [])

  return { isAuthed, login, logout }
}
