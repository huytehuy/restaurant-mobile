import { useEffect } from 'react'
import { saveManager } from '../db/saveManager'
import { useGameStore } from '../store/useGameStore'

export function useAutoSave(): void {
  useEffect(() => {
    const beforeUnload = () => {
      const s = useGameStore.getState()
      if (s.isInitialized && s.saveId != null) {
        void saveManager.save(s.snapshot())
      }
    }
    window.addEventListener('beforeunload', beforeUnload)
    return () => {
      window.removeEventListener('beforeunload', beforeUnload)
    }
  }, [])
}
