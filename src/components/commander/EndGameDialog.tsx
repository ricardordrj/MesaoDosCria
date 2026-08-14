import { useEffect, useState } from 'react'
import { ChevronUpIcon, ChevronDownIcon, TrophyIcon } from 'lucide-react'
import { toast } from 'sonner'
import type { CommanderGamePlayer } from '@/models'
import { ApiError } from '@/services/apiClient'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { PlayerAvatar } from './PlayerAvatar'

interface EndGameDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  players: CommanderGamePlayer[]
  onEnd: (standings: string[]) => Promise<void>
}

const medal = ['🥇', '🥈', '🥉']

export function EndGameDialog({ open, onOpenChange, players, onEnd }: EndGameDialogProps) {
  // Ordem inicial: quem tem mais vida em cima (chute do vencedor); o usuário ajusta.
  const [ordered, setOrdered] = useState<CommanderGamePlayer[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) setOrdered([...players].sort((a, b) => b.life - a.life))
  }, [open, players])

  function move(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= ordered.length) return
    setOrdered((prev) => {
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  async function handleConfirm(withStandings: boolean) {
    setSubmitting(true)
    try {
      await onEnd(withStandings ? ordered.map((p) => p.playerId) : [])
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Erro ao encerrar o mesão')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrophyIcon className="size-5 text-primary" />
            Encerrar mesão
          </DialogTitle>
          <DialogDescription>
            Coloca a galera na ordem de colocação (1º = ganhou). Isso vira pontos no ranking do board.
          </DialogDescription>
        </DialogHeader>

        <ol className="space-y-1.5">
          {ordered.map((player, index) => (
            <li
              key={player.playerId}
              className="flex items-center gap-2.5 rounded-md border p-2 text-sm"
            >
              <span className="w-8 shrink-0 text-center text-base">{medal[index] ?? `${index + 1}º`}</span>
              <PlayerAvatar name={player.name} avatarUrl={player.avatarUrl} colorHex={player.colorHex} size="sm" />
              <span className="min-w-0 flex-1 truncate font-medium">{player.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{player.life} vida</span>
              <div className="flex shrink-0 flex-col">
                <button
                  type="button"
                  aria-label="Subir"
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <ChevronUpIcon className="size-4" />
                </button>
                <button
                  type="button"
                  aria-label="Descer"
                  disabled={index === ordered.length - 1}
                  onClick={() => move(index, 1)}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <ChevronDownIcon className="size-4" />
                </button>
              </div>
            </li>
          ))}
        </ol>

        <DialogFooter className="flex-col-reverse gap-2 sm:flex-row sm:justify-between">
          <Button type="button" variant="ghost" disabled={submitting} onClick={() => handleConfirm(false)}>
            Encerrar sem ranquear
          </Button>
          <Button type="button" disabled={submitting} onClick={() => handleConfirm(true)}>
            Salvar posições e encerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
