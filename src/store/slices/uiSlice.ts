import type { StateCreator } from 'zustand'
import type { Theme } from '@/models'
import type { AppState, UiSlice } from '../types'

const THEME_STORAGE_KEY = 'mesao:theme'
const MY_COMMANDER_PLAYER_STORAGE_KEY = 'commander:my-player-id'

function loadTheme(): Theme {
  if (typeof localStorage === 'undefined') return 'system'
  const stored = localStorage.getItem(THEME_STORAGE_KEY)
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system'
}

function loadMyCommanderPlayerId(): string | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem(MY_COMMANDER_PLAYER_STORAGE_KEY)
}

// Sem backend de configurações: o tema é uma preferência local do aparelho.
export const createUiSlice: StateCreator<AppState, [], [], UiSlice> = (set) => ({
  settings: { theme: loadTheme() },
  myCommanderPlayerId: loadMyCommanderPlayerId(),
  setTheme: (theme) => {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
    set({ settings: { theme } })
  },
  setMyCommanderPlayerId: (id) => {
    if (id) localStorage.setItem(MY_COMMANDER_PLAYER_STORAGE_KEY, id)
    else localStorage.removeItem(MY_COMMANDER_PLAYER_STORAGE_KEY)
    set({ myCommanderPlayerId: id })
  },
})
