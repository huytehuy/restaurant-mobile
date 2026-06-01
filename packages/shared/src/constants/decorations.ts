import type { DecorationKind } from '../types/entities'

export interface DecorationCatalogItem {
  kind: DecorationKind
  name: string
  variant: number
  cost: number
  vibeBonus: number
  icon: string
  description: string
}

export const DECORATION_CATALOG: DecorationCatalogItem[] = [
  { kind: 'plant', variant: 0, name: 'Cây trầu bà', cost: 250_000, vibeBonus: 3, icon: '🪴', description: 'Lá xanh dịu mắt.' },
  { kind: 'plant', variant: 1, name: 'Cây xương rồng', cost: 180_000, vibeBonus: 2, icon: '🌵', description: 'Khô khô nhưng đẹp.' },
  { kind: 'plant', variant: 2, name: 'Hoa hướng dương', cost: 400_000, vibeBonus: 5, icon: '🌻', description: 'Tươi sáng cả góc quán.' },
  { kind: 'lamp', variant: 0, name: 'Đèn bàn vintage', cost: 500_000, vibeBonus: 5, icon: '💡', description: 'Ánh vàng ấm áp.' },
  { kind: 'lamp', variant: 1, name: 'Đèn chùm pha lê', cost: 2_500_000, vibeBonus: 12, icon: '✨', description: 'Sang trọng, hút khách cao cấp.' },
  { kind: 'painting', variant: 0, name: 'Tranh phong cảnh', cost: 800_000, vibeBonus: 6, icon: '🖼️', description: 'Tranh sơn dầu đồi núi.' },
  { kind: 'painting', variant: 1, name: 'Tranh trừu tượng', cost: 1_200_000, vibeBonus: 8, icon: '🎨', description: 'Đậm chất nghệ sĩ.' },
  { kind: 'painting', variant: 2, name: 'Poster phim cũ', cost: 350_000, vibeBonus: 4, icon: '🎬', description: 'Hoài niệm thập niên 90.' },
  { kind: 'rug', variant: 0, name: 'Thảm Ba Tư', cost: 1_800_000, vibeBonus: 10, icon: '🪄', description: 'Họa tiết tinh xảo, ấm cúng.' },
  { kind: 'window', variant: 0, name: 'Cửa sổ kính lớn', cost: 4_500_000, vibeBonus: 15, icon: '🪟', description: 'View đẹp, ánh sáng tự nhiên.' },
]

export function decorationBySignature(kind: DecorationKind, variant: number): DecorationCatalogItem | undefined {
  return DECORATION_CATALOG.find((d) => d.kind === kind && d.variant === variant)
}
