import type { StateCreator } from 'zustand'
import { commanderPlayerService } from '@/services'
import type { AppState, CommanderPlayerSlice } from '../types'

export const createCommanderPlayerSlice: StateCreator<AppState, [], [], CommanderPlayerSlice> = (set, get) => ({
  commanderPlayers: [],
  commanderPlayersLoaded: false,
  loadCommanderPlayers: async () => {
    const commanderPlayers = await commanderPlayerService.list()
    set({ commanderPlayers, commanderPlayersLoaded: true })
  },
  addCommanderPlayer: async (input) => {
    const player = await commanderPlayerService.create(input)
    set({ commanderPlayers: [...get().commanderPlayers, player] })
    return player
  },
  editCommanderPlayer: async (id, patch) => {
    const updated = await commanderPlayerService.update(id, patch)
    set({ commanderPlayers: get().commanderPlayers.map((p) => (p.id === id ? updated : p)) })
  },
  removeCommanderPlayer: async (id) => {
    await commanderPlayerService.remove(id)
    set({ commanderPlayers: get().commanderPlayers.filter((p) => p.id !== id) })
  },
  uploadCommanderPlayerAvatar: async (id, file) => {
    const updated = await commanderPlayerService.uploadAvatar(id, file)
    set({ commanderPlayers: get().commanderPlayers.map((p) => (p.id === id ? updated : p)) })
  },
})
