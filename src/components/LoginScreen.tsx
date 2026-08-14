import { useState } from 'react'
import { SwordsIcon, Loader2Icon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ApiError } from '@/services'

interface LoginScreenProps {
  onLogin: (password: string) => Promise<void>
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!password.trim() || submitting) return
    setSubmitting(true)
    setError(null)
    try {
      await onLogin(password)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível entrar. Tente de novo.')
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 bg-background px-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 ring-1 ring-primary/40">
          <SwordsIcon className="size-8 text-primary" />
        </div>
        <h1 className="font-heading bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-2xl font-bold tracking-widest text-transparent uppercase">
          Mesão de Commander
        </h1>
        <p className="max-w-xs text-sm text-muted-foreground">
          Digite a senha compartilhada da sala para acompanhar a vida e o ranking do mesão.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex w-full max-w-xs flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            autoFocus
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={submitting || !password.trim()} className="w-full">
          {submitting ? <Loader2Icon className="size-4 animate-spin" /> : 'Entrar'}
        </Button>
      </form>
    </div>
  )
}
