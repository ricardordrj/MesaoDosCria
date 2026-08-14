import { useEffect, useState } from 'react'
import { Toaster } from 'sonner'
import { Loader2Icon } from 'lucide-react'
import { useSession, useTheme } from '@/hooks'
import { sessionService } from '@/services'
import { CommanderLayout } from '@/components/layout/CommanderLayout'
import { CommanderPage } from '@/pages/CommanderPage'
import { LoginScreen } from '@/components/LoginScreen'

function AppToaster() {
  const { theme } = useTheme()
  return <Toaster theme={theme} richColors closeButton position="top-right" />
}

function AppLoader() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-3 bg-background">
      <Loader2Icon className="size-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Carregando...</p>
    </div>
  )
}

function App() {
  const { theme } = useTheme()
  const { isAuthed, login, logout } = useSession()
  // null = ainda checando com o servidor se há senha configurada.
  const [authRequired, setAuthRequired] = useState<boolean | null>(null)

  // Aplica o tema (claro/escuro) na raiz do documento.
  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const resolved = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme
    document.documentElement.classList.toggle('dark', resolved === 'dark')
  }, [theme])

  // Descobre se o servidor exige login. Se não der pra checar, assume que sim.
  useEffect(() => {
    sessionService
      .config()
      .then((config) => setAuthRequired(config.authRequired))
      .catch(() => setAuthRequired(true))
  }, [])

  const checking = authRequired === null
  const needsLogin = authRequired === true && !isAuthed

  return (
    <>
      {checking ? (
        <AppLoader />
      ) : needsLogin ? (
        <LoginScreen onLogin={login} />
      ) : (
        <CommanderLayout onLogout={authRequired ? logout : undefined}>
          <CommanderPage />
        </CommanderLayout>
      )}
      <AppToaster />
    </>
  )
}

export default App
