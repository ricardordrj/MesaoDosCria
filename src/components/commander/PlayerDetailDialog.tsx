import { CrownIcon, SwordsIcon, SparkleIcon } from 'lucide-react'
import type { CommanderGamePlayer, CommanderDamageMatrixEntry, CommanderDamageHistoryEntry } from '@/models'
import { cn } from '@/lib/utils'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PlayerAvatar } from './PlayerAvatar'

const COMMANDER_LETHAL = 21

interface PlayerDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  player: CommanderGamePlayer | null
  otherPlayers: CommanderGamePlayer[]
  commanderDamage: CommanderDamageMatrixEntry[]
  history: CommanderDamageHistoryEntry[]
}

export function PlayerDetailDialog({
  open,
  onOpenChange,
  player,
  otherPlayers,
  commanderDamage,
  history,
}: PlayerDetailDialogProps) {
  if (!player) return null

  const damageFromEach = otherPlayers.map((opponent) => {
    const entry = commanderDamage.find((d) => d.toPlayerId === player.playerId && d.fromPlayerId === opponent.playerId)
    return { opponent, total: entry?.total ?? 0 }
  })

  const relevantHistory = history
    .filter((h) => h.fromPlayerId === player.playerId || h.toPlayerId === player.playerId)
    .slice(0, 10)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5">
            <PlayerAvatar name={player.name} avatarUrl={player.avatarUrl} colorHex={player.colorHex} size="sm" />
            {player.name} — {player.life} de vida
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-sm font-medium">
              <CrownIcon className="size-3.5" />
              Dano de comandante recebido
            </p>
            {damageFromEach.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ninguém mais na mesa.</p>
            ) : (
              <ul className="space-y-2">
                {damageFromEach.map(({ opponent, total }) => (
                  <li key={opponent.playerId} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5">
                        <PlayerAvatar
                          name={opponent.name}
                          avatarUrl={opponent.avatarUrl}
                          colorHex={opponent.colorHex}
                          size="sm"
                        />
                        {opponent.name}
                      </span>
                      <span className={cn('font-medium tabular-nums', total >= COMMANDER_LETHAL && 'text-destructive')}>
                        {total}/{COMMANDER_LETHAL}
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          total >= COMMANDER_LETHAL ? 'bg-destructive' : 'bg-primary',
                        )}
                        style={{ width: `${Math.min(100, (total / COMMANDER_LETHAL) * 100)}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <p className="mb-2 text-sm font-medium">Histórico recente</p>
            {relevantHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nada ainda.</p>
            ) : (
              <ul className="space-y-1.5 text-xs">
                {relevantHistory.map((h) => (
                  <li key={h.id} className="flex items-center gap-1.5 text-muted-foreground">
                    {h.type === 'commander' ? (
                      <CrownIcon className="size-3 shrink-0" />
                    ) : h.type === 'life_adjust' ? (
                      <SparkleIcon className="size-3 shrink-0" />
                    ) : (
                      <SwordsIcon className="size-3 shrink-0" />
                    )}
                    <span className="truncate">
                      {h.fromPlayerId === h.toPlayerId ? (
                        <>
                          <strong>{h.fromPlayerName}</strong> ajustou {h.amount > 0 ? '+' : ''}
                          {h.amount}
                        </>
                      ) : (
                        <>
                          <strong>{h.fromPlayerName}</strong> {h.amount < 0 ? 'causou' : 'deu'} {Math.abs(h.amount)} em{' '}
                          <strong>{h.toPlayerName}</strong>
                        </>
                      )}
                      {h.commanderName ? ` (${h.commanderName})` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
