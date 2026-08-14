import { useState } from 'react'
import { PencilIcon, PlusIcon, Trash2Icon } from 'lucide-react'
import { toast } from 'sonner'
import { useCommanderPlayers } from '@/hooks'
import type { CommanderPlayer } from '@/models'
import { ApiError } from '@/services/apiClient'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { PlayerAvatar } from './PlayerAvatar'
import { PlayerEditDialog } from './PlayerEditDialog'

export function PlayerRoster() {
  const { commanderPlayers, removeCommanderPlayer } = useCommanderPlayers()
  const [editing, setEditing] = useState<CommanderPlayer | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [removeTarget, setRemoveTarget] = useState<CommanderPlayer | null>(null)

  function openCreate() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(player: CommanderPlayer) {
    setEditing(player)
    setDialogOpen(true)
  }

  async function handleRemove() {
    if (!removeTarget) return
    try {
      await removeCommanderPlayer(removeTarget.id)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Erro ao remover jogador')
    } finally {
      setRemoveTarget(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground">Jogadores fixos</h3>
        <Button size="sm" variant="outline" onClick={openCreate}>
          <PlusIcon className="size-4" />
          Novo jogador
        </Button>
      </div>

      {commanderPlayers.length === 0 ? (
        <p className="text-sm text-muted-foreground">Cadastre a galera pra começar.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {commanderPlayers.map((player) => (
            <li key={player.id} className="flex items-center gap-2 rounded-md border p-2">
              <PlayerAvatar name={player.name} avatarUrl={player.avatarUrl} colorHex={player.colorHex} size="sm" />
              <span className="min-w-0 flex-1 truncate text-sm">{player.name}</span>
              <button
                type="button"
                onClick={() => openEdit(player)}
                className="text-muted-foreground hover:text-foreground"
                title="Editar"
              >
                <PencilIcon className="size-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setRemoveTarget(player)}
                className="text-muted-foreground hover:text-destructive"
                title="Remover"
              >
                <Trash2Icon className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <PlayerEditDialog player={editing} open={dialogOpen} onOpenChange={setDialogOpen} />
      <ConfirmDialog
        open={removeTarget != null}
        onOpenChange={(open) => {
          if (!open) setRemoveTarget(null)
        }}
        title="Remover jogador"
        description={`Tem certeza que deseja remover "${removeTarget?.name}"?`}
        confirmLabel="Remover"
        onConfirm={handleRemove}
      />
    </div>
  )
}
