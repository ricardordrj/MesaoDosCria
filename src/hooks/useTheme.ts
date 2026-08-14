import { useAppStore } from '@/store/useAppStore'

export function useTheme() {
  const theme = useAppStore((state) => state.settings.theme)
  const setTheme = useAppStore((state) => state.setTheme)

  return { theme, setTheme }
}
