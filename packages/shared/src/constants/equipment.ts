import type { Equipment, EquipmentKind } from '../types/entities'

export interface EquipmentTier {
  tier: 1 | 2 | 3
  name: string
  speedBonus: number
  qualityBonus: number
  cost: number
  description: string
}

export const EQUIPMENT_TIERS: Record<EquipmentKind, EquipmentTier[]> = {
  espresso_machine: [
    {
      tier: 1,
      name: 'Máy Espresso cơ bản',
      speedBonus: 1.0,
      qualityBonus: 1.0,
      cost: 0,
      description: 'Máy 1 nhóm, đủ dùng cho khởi nghiệp.',
    },
    {
      tier: 2,
      name: 'Máy Espresso Pro',
      speedBonus: 1.25,
      qualityBonus: 1.15,
      cost: 8_000_000,
      description: 'Máy 2 nhóm bán tự động, pha nhanh hơn 25%.',
    },
    {
      tier: 3,
      name: 'La Marzocco Linea',
      speedBonus: 1.5,
      qualityBonus: 1.35,
      cost: 25_000_000,
      description: 'Đỉnh cao espresso. Khách yêu, tip nhiều hơn.',
    },
  ],
  blender: [
    { tier: 1, name: 'Máy xay cũ', speedBonus: 1.0, qualityBonus: 1.0, cost: 0, description: 'Xay được nhưng ồn.' },
    { tier: 2, name: 'Vitamix mini', speedBonus: 1.3, qualityBonus: 1.1, cost: 3_500_000, description: 'Xay smoothie/đá mịn hơn.' },
    { tier: 3, name: 'Vitamix Pro', speedBonus: 1.6, qualityBonus: 1.25, cost: 10_000_000, description: 'Xay đá thành tuyết, tiếng êm.' },
  ],
  oven: [
    { tier: 1, name: 'Lò nướng cơ bản', speedBonus: 1.0, qualityBonus: 1.0, cost: 0, description: 'Nướng được, không nhanh.' },
    { tier: 2, name: 'Lò đối lưu', speedBonus: 1.3, qualityBonus: 1.15, cost: 5_000_000, description: 'Bánh chín đều, vỏ giòn.' },
    { tier: 3, name: 'Rational SelfCooking', speedBonus: 1.5, qualityBonus: 1.3, cost: 15_000_000, description: 'Đa năng, tự động hoàn toàn.' },
  ],
  pos_system: [
    { tier: 1, name: 'Máy tính tay', speedBonus: 1.0, qualityBonus: 1.0, cost: 0, description: 'Ghi tay, dễ sai sót.' },
    { tier: 2, name: 'POS tablet', speedBonus: 1.2, qualityBonus: 1.05, cost: 2_000_000, description: 'Tính tiền nhanh, in bill.' },
    { tier: 3, name: 'POS đám mây + loyalty', speedBonus: 1.4, qualityBonus: 1.1, cost: 6_000_000, description: 'Khách quen tăng nhanh hơn.' },
  ],
}

export const EQUIPMENT_LABELS: Record<EquipmentKind, { label: string; icon: string }> = {
  espresso_machine: { label: 'Máy espresso', icon: '☕' },
  blender: { label: 'Máy xay', icon: '🌀' },
  oven: { label: 'Lò nướng', icon: '🔥' },
  pos_system: { label: 'Hệ thống POS', icon: '💳' },
}

export function buildInitialEquipment(): Equipment[] {
  return (Object.keys(EQUIPMENT_TIERS) as EquipmentKind[]).map((kind) => {
    const tiers = EQUIPMENT_TIERS[kind]
    const t = tiers[0]!
    return {
      id: kind,
      name: t.name,
      tier: t.tier,
      speedBonus: t.speedBonus,
      qualityBonus: t.qualityBonus,
      upgradeCostNext: tiers[1]?.cost ?? null,
      icon: EQUIPMENT_LABELS[kind].icon,
    }
  })
}
