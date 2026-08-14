import { useState } from 'react'
import { TrophyIcon, RotateCcwIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useCommanderLeaderboard } from '@/hooks'
import { ApiError } from '@/services/apiClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { PlayerAvatar } from './PlayerAvatar'

interface LeaderboardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const rankBadge = ['🥇', '🥈', '🥉']

export function LeaderboardDialog({ open, onOpenChange }: LeaderboardDialogProps) {
  const { seasons, selectedSeasonId, leaderboard, loading, error, selectSeason, reset } =
    useCommanderLeaderboard(open)
  const [resetOpen, setResetOpen] = useState(false)

  const standings = leaderboard?.standings ?? []
  const activeSeason = seasons.find((s) => s.status === 'active')
  const viewingActive = leaderboard?.season.status === 'active'

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrophyIcon className="size-5 text-primary" />
              Ranking do mesão
            </DialogTitle>
            <DialogDescription>
              Pontos por colocação em cada mesa: 1º = 3 pts, 2º = 2 pts, 3º = 1 pt.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-1">
              <Label htmlFor="season-select" className="text-xs text-muted-foreground">
                Temporada
              </Label>
              <select
                id="season-select"
                value={selectedSeasonId ?? ''}
                onChange={(e) => selectSeason(e.target.value)}
                className="h-9 rounded-md border bg-background px-2 text-sm"
              >
                {seasons.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                    {s.status === 'active' ? ' (atual)' : ''} · {s.gamesCount} {s.gamesCount === 1 ? 'jogo' : 'jogos'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Carregando...</p>
          ) : error ? (
            <p className="py-6 text-center text-sm text-destructive">{error}</p>
          ) : standings.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma partida ranqueada nessa temporada ainda. Encerre um mesão definindo as posições pra pontuar.
            </p>
          ) : (
            <ul className="divide-y rounded-md border">
              {standings.map((entry) => (
                <li key={entry.playerId} className="flex items-center gap-3 px-3 py-2">
                  <span className="w-7 shrink-0 text-center text-base font-semibold tabular-nums">
                    {rankBadge[entry.rank - 1] ?? entry.rank}
                  </span>
                  <PlayerAvatar name={entry.name} avatarUrl={entry.avatarUrl} colorHex={entry.colorHex} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{entry.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {entry.wins} {entry.wins === 1 ? 'vitória' : 'vitórias'} · {entry.games}{' '}
                      {entry.games === 1 ? 'jogo' : 'jogos'}
                    </p>
                  </div>
                  <span className="shrink-0 text-right">
                    <span className="text-lg font-bold tabular-nums">{entry.points}</span>
                    <span className="ml-1 text-xs text-muted-foreground">pts</span>
                  </span>
                </li>
              ))}
            </ul>
          )}

          <DialogFooter className="sm:justify-between">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading || !viewingActive}
              onClick={() => setResetOpen(true)}
              title={viewingActive ? undefined : 'Só dá pra reiniciar a temporada atual'}
            >
              <RotateCcwIcon className="size-4" />
              Reiniciar board
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ResetSeasonDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        currentSeasonName={activeSeason?.name}
        onReset={async (name) => {
          try {
            const fresh = await reset(name)
            toast.success(`Board reiniciado — nova temporada "${fresh.name}"`)
            setResetOpen(false)
          } catch (err) {
            toast.error(err instanceof ApiError ? err.message : 'Erro ao reiniciar o board')
          }
        }}
      />
    </>
  )
}

interface ResetSeasonDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentSeasonName?: string
  onReset: (name?: string) => Promise<void>
}

function ResetSeasonDialog({ open, onOpenChange, currentSeasonName, onReset }: ResetSeasonDialogProps) {
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleConfirm() {
    setSubmitting(true)
    await onReset(name.trim() || undefined)
    setSubmitting(false)
    setName('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Reiniciar board</DialogTitle>
          <DialogDescription>
            {currentSeasonName ? `A temporada "${currentSeasonName}" ` : 'A temporada atual '}
            vira histórico (continua visível no seletor) e um board zerado começa. Costuma-se fazer a cada ano.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="new-season-name">Nome da nova temporada</Label>
          <Input
            id="new-season-name"
            placeholder={String(new Date().getFullYear())}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Vazio usa o ano atual.</p>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" disabled={submitting} onClick={handleConfirm}>
            Reiniciar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
