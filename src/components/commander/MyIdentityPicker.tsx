import { UserCircleIcon } from 'lucide-react'
import { useCommanderPlayers, useMyCommanderPlayerId } from '@/hooks'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function MyIdentityPicker() {
  const { commanderPlayers } = useCommanderPlayers()
  const { myPlayerId, setMyPlayerId } = useMyCommanderPlayerId()

  const names = Object.fromEntries(commanderPlayers.map((p) => [p.id, p.name]))

  return (
    <div className="flex items-center gap-2">
      <UserCircleIcon className="size-4 shrink-0 text-muted-foreground" />
      <Select value={myPlayerId ?? undefined} onValueChange={(value) => setMyPlayerId(value)}>
        <SelectTrigger className="w-36">
          <SelectValue placeholder="Eu sou...">{(value: string) => names[value] ?? value}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {commanderPlayers.map((player) => (
            <SelectItem key={player.id} value={player.id}>
              {player.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
