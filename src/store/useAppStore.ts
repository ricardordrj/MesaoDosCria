import { create } from 'zustand'
import { createUiSlice } from './slices/uiSlice'
import { createCommanderPlayerSlice } from './slices/commanderPlayerSlice'
import type { AppState } from './types'

export const useAppStore = create<AppState>()((set, get, api) => ({
  ...createUiSlice(set, get, api),
  ...createCommanderPlayerSlice(set, get, api),
}))
