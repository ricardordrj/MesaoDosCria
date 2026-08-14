import { commanderPlayerSchema } from '@/models'
import type { CommanderPlayer, CreateCommanderPlayerInput, UpdateCommanderPlayerInput } from '@/models'
import { apiClient } from './apiClient'

export const commanderPlayerService = {
  async list(): Promise<CommanderPlayer[]> {
    const raw = await apiClient.get<unknown[]>('/commander-players')
    return raw.map((p) => commanderPlayerSchema.parse(p))
  },

  async create(input: CreateCommanderPlayerInput): Promise<CommanderPlayer> {
    const raw = await apiClient.post<unknown>('/commander-players', input)
    return commanderPlayerSchema.parse(raw)
  },

  async update(id: string, patch: UpdateCommanderPlayerInput): Promise<CommanderPlayer> {
    const raw = await apiClient.patch<unknown>(`/commander-players/${id}`, patch)
    return commanderPlayerSchema.parse(raw)
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/commander-players/${id}`)
  },

  async uploadAvatar(id: string, file: File): Promise<CommanderPlayer> {
    const formData = new FormData()
    formData.append('file', file)
    const raw = await apiClient.upload<unknown>(`/commander-players/${id}/avatar`, formData)
    return commanderPlayerSchema.parse(raw)
  },
}
