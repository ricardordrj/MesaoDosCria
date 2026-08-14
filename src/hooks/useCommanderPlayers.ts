import { useAppStore } from '@/store/useAppStore'

export function useCommanderPlayers() {
  const commanderPlayers = useAppStore((state) => state.commanderPlayers)
  const commanderPlayersLoaded = useAppStore((state) => state.commanderPlayersLoaded)
  const loadCommanderPlayers = useAppStore((state) => state.loadCommanderPlayers)
  const addCommanderPlayer = useAppStore((state) => state.addCommanderPlayer)
  const editCommanderPlayer = useAppStore((state) => state.editCommanderPlayer)
  const removeCommanderPlayer = useAppStore((state) => state.removeCommanderPlayer)
  const uploadCommanderPlayerAvatar = useAppStore((state) => state.uploadCommanderPlayerAvatar)

  return {
    commanderPlayers,
    commanderPlayersLoaded,
    loadCommanderPlayers,
    addCommanderPlayer,
    editCommanderPlayer,
    removeCommanderPlayer,
    uploadCommanderPlayerAvatar,
  }
}
