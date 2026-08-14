import type { ReactNode } from 'react'
import { SunIcon, MoonIcon, LogOutIcon } from 'lucide-react'
import { useTheme } from '@/hooks'
import { Button } from '@/components/ui/button'

interface CommanderLayoutProps {
  children: ReactNode
  onLogout?: () => void
}

export function CommanderLayout({ children, onLogout }: CommanderLayoutProps) {
  const { theme, setTheme } = useTheme()

  const prefersDark =
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
  const isDark = theme === 'dark' || (theme === 'system' && prefersDark)

  return (
    <div className="flex min-h-svh flex-col">
      <header className="relative z-10 border-b border-primary/20 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-2 px-4 py-4 sm:px-8">
          <h1 className="font-heading bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-lg font-bold tracking-widest text-transparent uppercase">
            Mesão de Commander
          </h1>
          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Alternar tema"
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
            >
              {isDark ? <SunIcon className="size-4" /> : <MoonIcon className="size-4" />}
            </Button>
            {onLogout && (
              <Button variant="ghost" size="icon" aria-label="Sair" onClick={onLogout}>
                <LogOutIcon className="size-4" />
              </Button>
            )}
          </div>
        </div>
      </header>
      <main className="relative z-10 flex-1 pb-10">
        <div className="mx-auto max-w-[1200px] px-4 py-6 sm:px-8">{children}</div>
      </main>
    </div>
  )
}
