import { useEffect, useRef, useState } from 'react'
import { MinusIcon, PlusIcon, SwordsIcon, CrownIcon, CheckIcon, XIcon, SkullIcon } from 'lucide-react'
import type { CommanderGamePlayer, CommanderDamageRequest } from '@/models'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PlayerAvatar } from './PlayerAvatar'

/** Pisca a cor da vida por um instante quando o número muda, pra dar aquele feedback de "aconteceu". */
function useLifeFlash(life: number) {
  const [flash, setFlash] = useState<'up' | 'down' | null>(null)
  const prevRef = useRef(life)

  useEffect(() => {
    if (life !== prevRef.current) {
      setFlash(life > prevRef.current ? 'up' : 'down')
      prevRef.current = life
      const timeout = setTimeout(() => setFlash(null), 700)
      return () => clearTimeout(timeout)
    }
  }, [life])

  return flash
}

const QUICK_DELTAS = [-5, -1, 1, 5]

interface PlayerCardProps {
  player: CommanderGamePlayer
  isYou: boolean
  pendingRequests: CommanderDamageRequest[]
  onSelfAdjust: (delta: number) => void
  onResolveRequest: (requestId: string, action: 'apply' | 'dismiss', amount?: number) => void
  onOpenDetail: () => void
  onSendDamage: () => void
  canSendDamage: boolean
}

export function PlayerCard({
  player,
  isYou,
  pendingRequests,
  onSelfAdjust,
  onResolveRequest,
  onOpenDetail,
  onSendDamage,
  canSendDamage,
}: PlayerCardProps) {
  const flash = useLifeFlash(player.life)

  return (
    <Card
      className={cn(
        'relative gap-3 ring-1',
        isYou ? 'ring-primary/60' : 'ring-foreground/10',
        player.life <= 0 && 'opacity-70',
      )}
    >
      <div className="flex items-center gap-3 px-4">
        <button type="button" onClick={onOpenDetail} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <PlayerAvatar name={player.name} avatarUrl={player.avatarUrl} colorHex={player.colorHex} size="md" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">
              {player.name} {isYou && <span className="text-xs text-muted-foreground">(você)</span>}
            </p>
            <p className="text-xs text-muted-foreground">Toque pra ver dano de comandante</p>
          </div>
        </button>
        {player.life <= 0 && <SkullIcon className="size-5 shrink-0 text-destructive" />}
        <span
          className={cn(
            'font-heading text-3xl font-bold tabular-nums transition-colors duration-300',
            flash === 'down' && 'text-destructive',
            flash === 'up' && 'text-emerald-500',
          )}
        >
          {player.life}
        </span>
      </div>

      {isYou ? (
        <div className="flex items-center justify-center gap-1.5 px-4">
          {QUICK_DELTAS.map((delta) => (
            <Button
              key={delta}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onSelfAdjust(delta)}
              className="flex-1"
            >
              {delta > 0 ? <PlusIcon className="size-3.5" /> : <MinusIcon className="size-3.5" />}
              {Math.abs(delta)}
            </Button>
          ))}
        </div>
      ) : (
        canSendDamage && (
          <div className="px-4">
            <Button type="button" variant="outline" size="sm" className="w-full" onClick={onSendDamage}>
              <SwordsIcon className="size-3.5" />
              Causar dano
            </Button>
          </div>
        )
      )}

      {isYou && pendingRequests.length > 0 && (
        <div className="space-y-1.5 border-t px-4 pt-3">
          {pendingRequests.map((req) => (
            <div key={req.id} className="flex items-center gap-2 rounded-md bg-destructive/10 px-2.5 py-2 text-xs">
              {req.type === 'commander' ? (
                <CrownIcon className="size-3.5 shrink-0 text-destructive" />
              ) : (
                <SwordsIcon className="size-3.5 shrink-0 text-destructive" />
              )}
              <span className="min-w-0 flex-1 truncate">
                <strong>{req.fromPlayerName}</strong> {req.amount < 0 ? 'causou' : 'deu'} {Math.abs(req.amount)}
                {req.commanderName ? ` (${req.commanderName})` : ''}
              </span>
              <button
                type="button"
                title="Aplicar"
                onClick={() => onResolveRequest(req.id, 'apply')}
                className="rounded-full p-1 text-emerald-600 hover:bg-emerald-500/20"
              >
                <CheckIcon className="size-3.5" />
              </button>
              <button
                type="button"
                title="Descartar"
                onClick={() => onResolveRequest(req.id, 'dismiss')}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted"
              >
                <XIcon className="size-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
