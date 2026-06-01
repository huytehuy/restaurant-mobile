import type { CustomerType } from '../types/entities'

export interface CustomerTypeProfile {
  id: CustomerType
  label: string
  budgetMultiplier: [number, number]
  basePatience: number
  preferredCategories: ('coffee' | 'tea' | 'food' | 'dessert')[]
  spawnWeightByHour: number[] // length 24
  /** Tip range as fraction of bill (0.0–0.15) */
  tipRange: [number, number]
}

const HOUR_ZEROS = Array.from({ length: 24 }, () => 0)

function hourWeights(spec: Partial<Record<number, number>>): number[] {
  const out = [...HOUR_ZEROS]
  for (const [h, w] of Object.entries(spec)) {
    out[Number(h)] = w as number
  }
  return out
}

export const CUSTOMER_TYPES: Record<CustomerType, CustomerTypeProfile> = {
  student: {
    id: 'student',
    label: 'Sinh viên',
    budgetMultiplier: [0.5, 0.9],
    basePatience: 70,
    preferredCategories: ['coffee', 'tea'],
    spawnWeightByHour: hourWeights({
      8: 2, 9: 3, 10: 4, 11: 3, 14: 5, 15: 5, 16: 4, 17: 3, 18: 2, 19: 2,
    }),
    tipRange: [0, 0.05],
  },
  office_worker: {
    id: 'office_worker',
    label: 'Nhân viên văn phòng',
    budgetMultiplier: [1.0, 1.4],
    basePatience: 50,
    preferredCategories: ['coffee', 'food'],
    spawnWeightByHour: hourWeights({
      7: 5, 8: 6, 9: 3, 12: 6, 13: 4, 17: 3, 18: 2,
    }),
    tipRange: [0.05, 0.12],
  },
  tourist: {
    id: 'tourist',
    label: 'Khách du lịch',
    budgetMultiplier: [1.2, 2.0],
    basePatience: 90,
    preferredCategories: ['coffee', 'dessert', 'food'],
    spawnWeightByHour: hourWeights({
      9: 2, 10: 3, 11: 4, 14: 4, 15: 4, 16: 3, 19: 2, 20: 2,
    }),
    tipRange: [0.08, 0.15],
  },
  regular: {
    id: 'regular',
    label: 'Khách quen',
    budgetMultiplier: [0.9, 1.3],
    basePatience: 100,
    preferredCategories: ['coffee', 'tea', 'food', 'dessert'],
    spawnWeightByHour: hourWeights({
      7: 3, 8: 3, 9: 2, 10: 2, 11: 2, 12: 2, 13: 1, 14: 2, 15: 2, 16: 2,
      17: 3, 18: 3, 19: 3, 20: 2, 21: 1,
    }),
    tipRange: [0.1, 0.15],
  },
}

export const VIETNAMESE_NAMES = [
  'An', 'Bình', 'Cường', 'Dũng', 'Đức', 'Giang', 'Hà', 'Huyền', 'Khánh', 'Lan',
  'Linh', 'Mai', 'Minh', 'Nam', 'Ngọc', 'Phong', 'Phúc', 'Quân', 'Quỳnh', 'Sơn',
  'Thảo', 'Thắng', 'Thu', 'Trang', 'Trung', 'Tú', 'Vy', 'Yến', 'Bảo', 'Châu',
]

export function randomCustomerName(): string {
  return VIETNAMESE_NAMES[Math.floor(Math.random() * VIETNAMESE_NAMES.length)]!
}
