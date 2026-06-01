import type { MarketingCampaign, MarketingCampaignKind } from '@cafe-tycoon/shared'

export interface MarketingTier {
  kind: MarketingCampaignKind
  label: string
  description: string
  cost: number
  durationMinutes: number
  spawnMultiplier: number
  reputationBoostPerDay: number
  icon: string
}

export const MARKETING_TIERS: MarketingTier[] = [
  {
    kind: 'flyer',
    label: 'In tờ rơi',
    description: 'Phát tờ rơi quanh khu phố — hiệu quả nhẹ, rẻ.',
    cost: 300_000,
    durationMinutes: 480,
    spawnMultiplier: 1.2,
    reputationBoostPerDay: 0.5,
    icon: '🪧',
  },
  {
    kind: 'social_media',
    label: 'Quảng cáo Facebook',
    description: 'Chạy quảng cáo Facebook — tăng khách trẻ.',
    cost: 1_200_000,
    durationMinutes: 720,
    spawnMultiplier: 1.4,
    reputationBoostPerDay: 1,
    icon: '📱',
  },
  {
    kind: 'influencer',
    label: 'Influencer review',
    description: 'Mời TikToker review — bùng nổ ngắn hạn.',
    cost: 4_000_000,
    durationMinutes: 480,
    spawnMultiplier: 2.0,
    reputationBoostPerDay: 2,
    icon: '🎤',
  },
  {
    kind: 'grand_opening',
    label: 'Sự kiện khai trương lại',
    description: 'Tổ chức tiệc khai trương lại với khuyến mãi.',
    cost: 6_000_000,
    durationMinutes: 960,
    spawnMultiplier: 2.5,
    reputationBoostPerDay: 3,
    icon: '🎉',
  },
]

export function startCampaign(tier: MarketingTier): MarketingCampaign {
  return {
    kind: tier.kind,
    durationMinutesRemaining: tier.durationMinutes,
    spawnMultiplier: tier.spawnMultiplier,
    reputationBoostPerDay: tier.reputationBoostPerDay,
  }
}

export function tickCampaign(
  campaign: MarketingCampaign,
  elapsedMinutes: number,
): MarketingCampaign | null {
  const next = campaign.durationMinutesRemaining - elapsedMinutes
  if (next <= 0) return null
  return { ...campaign, durationMinutesRemaining: next }
}
