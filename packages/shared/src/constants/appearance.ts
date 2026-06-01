import type { CustomerAppearance, StaffAppearance, CustomerType, StaffRole } from '../types/entities'

const SKIN_TONES = ['#F4D2B0', '#E8C19E', '#D4A574', '#B07E4F', '#8B5A2B']
const HAIR_COLORS = ['#1F140C', '#3E2A14', '#6B4423', '#332419', '#D4A574', '#8B5E34']
const SHIRT_COLORS = [
  '#4A6FA5', '#5FAE6E', '#C78B4C', '#B14A8F', '#5C8AE6',
  '#E97A5F', '#7E57C2', '#26A69A', '#EF5350', '#FFA726',
]

const STAFF_UNIFORM_BY_ROLE: Record<StaffRole, { uniform: string; accent: string }> = {
  barista: { uniform: '#4A3728', accent: '#D4A574' },
  cashier: { uniform: '#1F4E5F', accent: '#F0E5D8' },
  cleaner: { uniform: '#5C5F4D', accent: '#FFFFFF' },
  manager: { uniform: '#2C2C54', accent: '#E8C19E' },
}

const ACCESSORY_BY_TYPE: Record<CustomerType, CustomerAppearance['accessory']> = {
  student: 'backpack',
  office_worker: 'briefcase',
  tourist: 'camera',
  regular: 'none',
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}

export function randomStaffAppearance(role: StaffRole): StaffAppearance {
  const u = STAFF_UNIFORM_BY_ROLE[role]
  return {
    skin: pick(SKIN_TONES),
    hair: pick(HAIR_COLORS),
    uniform: u.uniform,
    accent: u.accent,
  }
}

export function randomCustomerAppearance(type: CustomerType): CustomerAppearance {
  return {
    skin: pick(SKIN_TONES),
    hair: pick(HAIR_COLORS),
    shirt: pick(SHIRT_COLORS),
    accessory: ACCESSORY_BY_TYPE[type],
  }
}
