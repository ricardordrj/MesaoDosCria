import { useState } from 'react'
import type { FormEvent } from 'react'
import { SwordsIcon, CrownIcon, SparkleIcon } from 'lucide-react'
import { toast } from 'sonner'
import type { CommanderDamageType } from '@/models'
import { ApiError } from '@/services/apiClient'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'

const QUICK_AMOUNTS = [1, 2, 3, 4, 5, 6, 7, 8, 10]

const typeOptions: { value: CommanderDamageType; label: string; icon: typeof SwordsIcon }[] = [
  { value: 'combat', label: 'Combate', icon: SwordsIcon },
  { value: 'commander', label: 'Comandante', icon: CrownIcon },
  { value: 'other', label: 'Outro', icon: SparkleIcon },
]

interface SendDamageDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fromPlayerName: string
  toPlayerName: string
  onSend: (input: { amount: number; type: CommanderDamageType; commanderName?: string }) => Promise<void>
}

export function SendDamageDialog({ open, onOpenChange, fromPlayerName, toPlayerName, onSend }: SendDamageDialogProps) {
  const [amount, setAmount] = useState('3')
  const [type, setType] = useState<CommanderDamageType>('combat')
  const [commanderName, setCommanderName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function handleOpenChange(next: boolean) {
    if (next) {
      setAmount('3')
      setType('combat')
      setCommanderName('')
      setError(null)
    }
    onOpenChange(next)
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const value = Number(amount)
    if (!value || value <= 0) {
      setError('Informe um valor de dano maior que zero')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await onSend({
        amount: -value,
        type,
        commanderName: type === 'commander' && commanderName.trim() ? commanderName.trim() : undefined,
      })
      toast.success(`Solicitação enviada pra ${toPlayerName}`)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao enviar solicitação')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SwordsIcon className="size-4 text-destructive" />
            {fromPlayerName} ataca {toPlayerName}
          </DialogTitle>
          <DialogDescription>
            Fica pendente até {toPlayerName} confirmar na tela dele.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="damage-amount">Dano</Label>
            <Input
              id="damage-amount"
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
            <div className="flex flex-wrap gap-1.5">
              {QUICK_AMOUNTS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setAmount(String(n))}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-xs font-medium transition-colors',
                    amount === String(n)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:text-foreground',
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <div className="flex gap-1.5">
              {typeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setType(opt.value)}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-1.5 rounded-md border p-2 text-xs font-medium transition-colors',
                    type === opt.value
                      ? 'border-primary bg-primary/10 text-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <opt.icon className="size-3.5" />
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {type === 'commander' && (
            <div className="space-y-1.5">
              <Label htmlFor="commander-name">Comandante (opcional)</Label>
              <Input
                id="commander-name"
                value={commanderName}
                onChange={(e) => setCommanderName(e.target.value)}
                placeholder="Ex: Atraxa"
              />
            </div>
          )}

          <p className="min-h-[1.25rem] text-sm text-destructive">{error}</p>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="destructive" disabled={submitting}>
              <SwordsIcon className="size-4" />
              Enviar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
