import { useState } from 'react'
import type { FormEvent } from 'react'
import { toast } from 'sonner'
import { useCommanderPlayers } from '@/hooks'
import { commanderGameService } from '@/services'
import { ApiError } from '@/services/apiClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { PlayerAvatar } from './PlayerAvatar'

interface StartGameDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onStarted: (gameId: string) => void
}

export function StartGameDialog({ open, onOpenChange, onStarted }: StartGameDialogProps) {
  const { commanderPlayers } = useCommanderPlayers()
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [startingLife, setStartingLife] = useState('40')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function toggle(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (selectedIds.length < 2) {
      setError('Selecione pelo menos 2 jogadores')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const game = await commanderGameService.create({
        playerIds: selectedIds,
        startingLife: Number(startingLife) || 40,
      })
      toast.success('Mesão iniciado!')
      onStarted(game.id)
      onOpenChange(false)
      setSelectedIds([])
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao iniciar o mesão')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Iniciar mesão</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Quem tá jogando?</Label>
            {commanderPlayers.length === 0 ? (
              <p className="text-sm text-muted-foreground">Cadastre os jogadores primeiro.</p>
            ) : (
              <ul className="space-y-1.5">
                {commanderPlayers.map((player) => (
                  <li key={player.id}>
                    <label className="flex cursor-pointer items-center gap-2.5 rounded-md border p-2 text-sm">
                      <Checkbox
                        checked={selectedIds.includes(player.id)}
                        onCheckedChange={() => toggle(player.id)}
                      />
                      <PlayerAvatar name={player.name} avatarUrl={player.avatarUrl} colorHex={player.colorHex} size="sm" />
                      {player.name}
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="starting-life">Vida inicial</Label>
            <Input
              id="starting-life"
              type="number"
              min={1}
              value={startingLife}
              onChange={(e) => setStartingLife(e.target.value)}
            />
          </div>

          <p className="min-h-[1.25rem] text-sm text-destructive">{error}</p>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              Começar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
