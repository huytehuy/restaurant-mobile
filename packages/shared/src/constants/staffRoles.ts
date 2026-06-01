import type { StaffRole } from '../types/entities'

export interface StaffRoleProfile {
  id: StaffRole
  label: string
  baseSalary: number
  primaryTasks: string[]
  description: string
}

export const STAFF_ROLES: Record<StaffRole, StaffRoleProfile> = {
  barista: {
    id: 'barista',
    label: 'Pha chế',
    baseSalary: 250_000,
    primaryTasks: ['make_order'],
    description: 'Pha cà phê, trà, đồ uống.',
  },
  cashier: {
    id: 'cashier',
    label: 'Thu ngân',
    baseSalary: 200_000,
    primaryTasks: ['serve_customer'],
    description: 'Nhận order, tính tiền, phục vụ khách.',
  },
  cleaner: {
    id: 'cleaner',
    label: 'Lao công',
    baseSalary: 180_000,
    primaryTasks: ['clean_table'],
    description: 'Dọn bàn, lau dọn quán.',
  },
  manager: {
    id: 'manager',
    label: 'Quản lý',
    baseSalary: 500_000,
    primaryTasks: ['restock', 'serve_customer', 'make_order'],
    description: 'Tăng buff tinh thần toàn nhân viên, làm tất cả việc.',
  },
}

export const STAFF_FIRST_NAMES = [
  'An', 'Bảo', 'Châu', 'Dung', 'Đạt', 'Giang', 'Hân', 'Hoa', 'Khang', 'Linh',
  'Long', 'Minh', 'Ngân', 'Phương', 'Quang', 'Tâm', 'Thi', 'Trí', 'Vy', 'Yến',
]

export const STAFF_LAST_NAMES = [
  'Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đặng', 'Bùi', 'Đỗ', 'Hồ',
]

export function randomStaffName(): string {
  const last = STAFF_LAST_NAMES[Math.floor(Math.random() * STAFF_LAST_NAMES.length)]!
  const first = STAFF_FIRST_NAMES[Math.floor(Math.random() * STAFF_FIRST_NAMES.length)]!
  return `${last} ${first}`
}
