import { create } from 'zustand'

export type ScreenName = 'main_menu' | 'game' | 'leaderboard'
export type PanelKey =
  | 'none'
  | 'menu'
  | 'staff'
  | 'finance'
  | 'upgrade'
  | 'challenges'
  | 'settings'

export interface Notification {
  id: string
  level: 'info' | 'success' | 'warning' | 'error'
  message: string
  createdAt: number
  ttlMs: number
}

interface UIState {
  screen: ScreenName
  activePanel: PanelKey
  notifications: Notification[]
  modal: null | { type: 'confirm'; title: string; message: string; onConfirm: () => void }

  setScreen: (s: ScreenName) => void
  openPanel: (p: PanelKey) => void
  closePanel: () => void
  notify: (n: Omit<Notification, 'id' | 'createdAt'>) => void
  dismissNotification: (id: string) => void
  openModal: (m: NonNullable<UIState['modal']>) => void
  closeModal: () => void
}

export const useUIStore = create<UIState>((set) => ({
  screen: 'main_menu',
  activePanel: 'none',
  notifications: [],
  modal: null,

  setScreen: (s) => set({ screen: s }),
  openPanel: (p) => set({ activePanel: p }),
  closePanel: () => set({ activePanel: 'none' }),
  notify: (n) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        {
          ...n,
          id: `n_${Math.random().toString(36).slice(2, 9)}`,
          createdAt: Date.now(),
          ttlMs: n.ttlMs ?? 4000,
        },
      ].slice(-5),
    })),
  dismissNotification: (id) =>
    set((state) => ({ notifications: state.notifications.filter((n) => n.id !== id) })),
  openModal: (m) => set({ modal: m }),
  closeModal: () => set({ modal: null }),
}))
