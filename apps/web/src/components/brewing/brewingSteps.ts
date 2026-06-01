import type { BrewingStepKind } from '@cafe-tycoon/shared'

export type StepKind = 'timing_bar' | 'tap_count' | 'hold' | 'drag_drop'

export interface StepDefinition {
  kind: BrewingStepKind
  label: string
  instruction: string
  icon: string
  /** Visual / interaction kind */
  ui: StepKind
  /** Sub-config */
  config: TimingBarConfig | TapCountConfig | HoldConfig | DragDropConfig
}

export interface TimingBarConfig {
  /** Duration of the pass in ms */
  cycleMs: number
  /** Center "perfect" zone (0..1) */
  perfectCenter: number
  perfectWidth: number
  goodWidth: number
}

export interface TapCountConfig {
  targetTaps: number
  windowMs: number
}

export interface HoldConfig {
  targetMs: number
  toleranceMs: number
}

export interface DragDropConfig {
  /** Emoji of the thing to drag */
  item: string
  /** Where to drop it (emoji of the target) */
  target: string
  /** Color tint of the drop zone */
  targetColor: string
}

export const STEP_DEFS: Record<BrewingStepKind, StepDefinition> = {
  grind: {
    kind: 'grind',
    label: 'Xay đậu',
    instruction: 'Bấm liên tục cho đến khi xay đủ độ mịn',
    icon: '🫘',
    ui: 'tap_count',
    config: { targetTaps: 12, windowMs: 3000 } satisfies TapCountConfig,
  },
  tamp: {
    kind: 'tamp',
    label: 'Nén bột',
    instruction: 'Giữ vừa đủ — không quá nhẹ, không quá lâu',
    icon: '🧱',
    ui: 'hold',
    config: { targetMs: 1500, toleranceMs: 400 } satisfies HoldConfig,
  },
  extract: {
    kind: 'extract',
    label: 'Chiết espresso',
    instruction: 'Bấm dừng khi vạch ở vùng xanh — không để quá lâu',
    icon: '☕',
    ui: 'timing_bar',
    config: {
      cycleMs: 4000,
      perfectCenter: 0.55,
      perfectWidth: 0.1,
      goodWidth: 0.25,
    } satisfies TimingBarConfig,
  },
  steam_milk: {
    kind: 'steam_milk',
    label: 'Đánh sữa',
    instruction: 'Bấm dừng khi sữa vừa béo, đừng để cháy',
    icon: '🥛',
    ui: 'timing_bar',
    config: {
      cycleMs: 3000,
      perfectCenter: 0.6,
      perfectWidth: 0.12,
      goodWidth: 0.3,
    } satisfies TimingBarConfig,
  },
  pour_milk: {
    kind: 'pour_milk',
    label: 'Rót sữa',
    instruction: 'Kéo bình sữa vào ly cà phê',
    icon: '🥛',
    ui: 'drag_drop',
    config: { item: '🥛', target: '☕', targetColor: '#D4A574' } satisfies DragDropConfig,
  },
  add_chocolate: {
    kind: 'add_chocolate',
    label: 'Thêm sôcôla',
    instruction: 'Kéo sôcôla vào ly',
    icon: '🍫',
    ui: 'drag_drop',
    config: { item: '🍫', target: '☕', targetColor: '#6B4423' } satisfies DragDropConfig,
  },
  add_ice: {
    kind: 'add_ice',
    label: 'Thêm đá',
    instruction: 'Kéo đá vào ly',
    icon: '🧊',
    ui: 'drag_drop',
    config: { item: '🧊', target: '🥤', targetColor: '#88CCEE' } satisfies DragDropConfig,
  },
  add_tea_bag: {
    kind: 'add_tea_bag',
    label: 'Túi trà',
    instruction: 'Kéo túi trà vào ấm',
    icon: '🍃',
    ui: 'drag_drop',
    config: { item: '🍃', target: '🍵', targetColor: '#5FAE6E' } satisfies DragDropConfig,
  },
  add_sugar: {
    kind: 'add_sugar',
    label: 'Thêm đường',
    instruction: 'Kéo đường — không quá nhiều',
    icon: '🍯',
    ui: 'drag_drop',
    config: { item: '🍯', target: '🍵', targetColor: '#F2C87A' } satisfies DragDropConfig,
  },
  whisk: {
    kind: 'whisk',
    label: 'Đánh bông',
    instruction: 'Bấm liên tục theo nhịp',
    icon: '🥄',
    ui: 'tap_count',
    config: { targetTaps: 10, windowMs: 2800 } satisfies TapCountConfig,
  },
  sprinkle: {
    kind: 'sprinkle',
    label: 'Rắc topping',
    instruction: 'Bấm dừng khi rắc vừa đủ',
    icon: '✨',
    ui: 'timing_bar',
    config: {
      cycleMs: 2400,
      perfectCenter: 0.5,
      perfectWidth: 0.15,
      goodWidth: 0.35,
    } satisfies TimingBarConfig,
  },
}

export function scoreFor(kind: 'perfect' | 'good' | 'bad'): number {
  if (kind === 'perfect') return 100
  if (kind === 'good') return 70
  return 35
}
