import type {
  Theme,
  CommanderPlayer,
  CreateCommanderPlayerInput,
  UpdateCommanderPlayerInput,
} from '@/models'

export interface AppSettings {
  theme: Theme
}

export interface UiSlice {
  settings: AppSettings
  myCommanderPlayerId: string | null
  setTheme: (theme: Theme) => void
  setMyCommanderPlayerId: (id: string | null) => void
}

export interface CommanderPlayerSlice {
  commanderPlayers: CommanderPlayer[]
  commanderPlayersLoaded: boolean
  loadCommanderPlayers: () => Promise<void>
  addCommanderPlayer: (input: CreateCommanderPlayerInput) => Promise<CommanderPlayer>
  editCommanderPlayer: (id: string, patch: UpdateCommanderPlayerInput) => Promise<void>
  removeCommanderPlayer: (id: string) => Promise<void>
  uploadCommanderPlayerAvatar: (id: string, file: File) => Promise<void>
}

export interface AppState extends UiSlice, CommanderPlayerSlice {}
