import { useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { ImageUpIcon } from 'lucide-react'
import { toast } from 'sonner'
import { useCommanderPlayers } from '@/hooks'
import type { CommanderPlayer } from '@/models'
import { ApiError } from '@/services/apiClient'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { PlayerAvatar } from './PlayerAvatar'

const DEFAULT_COLOR = '#8b5cf6'

interface PlayerEditDialogProps {
  player: CommanderPlayer | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PlayerEditDialog({ player, open, onOpenChange }: PlayerEditDialogProps) {
  const { addCommanderPlayer, editCommanderPlayer, uploadCommanderPlayerAvatar } = useCommanderPlayers()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(player?.name ?? '')
  const [colorHex, setColorHex] = useState(player?.colorHex ?? DEFAULT_COLOR)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  function reset(p: CommanderPlayer | null) {
    setName(p?.name ?? '')
    setColorHex(p?.colorHex ?? DEFAULT_COLOR)
    setError(null)
  }

  function handleOpenChange(next: boolean) {
    if (next) reset(player)
    onOpenChange(next)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!name.trim()) {
      setError('Nome é obrigatório')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      if (player) {
        await editCommanderPlayer(player.id, { name: name.trim(), colorHex })
        toast.success('Perfil atualizado')
      } else {
        await addCommanderPlayer({ name: name.trim(), colorHex })
        toast.success('Jogador criado')
      }
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao salvar')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleAvatarChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || !player) return
    setUploadingAvatar(true)
    try {
      await uploadCommanderPlayerAvatar(player.id, file)
      toast.success('Foto atualizada')
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Erro ao enviar imagem')
    } finally {
      setUploadingAvatar(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{player ? 'Editar perfil' : 'Novo jogador'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {player && (
            <div className="flex items-center gap-3">
              <PlayerAvatar name={player.name} avatarUrl={player.avatarUrl} colorHex={colorHex} size="lg" />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploadingAvatar}
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageUpIcon className="size-4" />
                {uploadingAvatar ? 'Enviando...' : 'Trocar foto'}
              </Button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="player-name">Nome</Label>
            <Input id="player-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="player-color">Cor</Label>
            <div className="flex items-center gap-2">
              <input
                id="player-color"
                type="color"
                value={colorHex}
                onChange={(e) => setColorHex(e.target.value)}
                className="size-9 shrink-0 cursor-pointer rounded-md border bg-transparent p-0.5"
              />
              <span className="text-sm text-muted-foreground">Usada quando não tem foto ainda</span>
            </div>
          </div>

          <p className="min-h-[1.25rem] text-sm text-destructive">{error}</p>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
