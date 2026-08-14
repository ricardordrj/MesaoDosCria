import { useAppStore } from '@/store/useAppStore'

/**
 * Sem login ainda (decisão de acesso adiada, ver ROADMAP.md): cada celular
 * escolhe uma vez "quem eu sou" e isso fica salvo localmente no aparelho.
 * Vive no store global (não em useState local) pra ficar em sincronia entre
 * o seletor no cabeçalho e a tela do mesão.
 */
export function useMyCommanderPlayerId() {
  const myPlayerId = useAppStore((state) => state.myCommanderPlayerId)
  const setMyPlayerId = useAppStore((state) => state.setMyCommanderPlayerId)
  return { myPlayerId, setMyPlayerId }
}
