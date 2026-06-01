import type { Achievement, AchievementId } from '../types/entities'

export const ACHIEVEMENT_DEFS: Record<AchievementId, Omit<Achievement, 'unlockedOnDay'>> = {
  first_customer: {
    id: 'first_customer',
    title: 'Khách đầu tiên',
    description: 'Phục vụ vị khách đầu tiên của bạn.',
    icon: '🥳',
  },
  hundred_customers: {
    id: 'hundred_customers',
    title: 'Trăm khách',
    description: 'Phục vụ 100 khách hàng.',
    icon: '💯',
  },
  thousand_customers: {
    id: 'thousand_customers',
    title: 'Nghìn khách',
    description: 'Phục vụ 1.000 khách hàng — quán đã thành thương hiệu.',
    icon: '🏆',
  },
  first_million: {
    id: 'first_million',
    title: 'Triệu đầu tiên',
    description: 'Đạt 1.000.000 VND tổng doanh thu.',
    icon: '💰',
  },
  ten_million: {
    id: 'ten_million',
    title: 'Mười triệu',
    description: 'Đạt 10.000.000 VND tổng doanh thu.',
    icon: '💎',
  },
  reputation_75: {
    id: 'reputation_75',
    title: 'Quán nổi tiếng',
    description: 'Uy tín đạt 75 điểm.',
    icon: '⭐',
  },
  reputation_100: {
    id: 'reputation_100',
    title: 'Hoàn hảo',
    description: 'Uy tín đạt tuyệt đối 100 điểm.',
    icon: '🌟',
  },
  survive_week: {
    id: 'survive_week',
    title: 'Một tuần',
    description: 'Quán hoạt động 7 ngày liên tiếp.',
    icon: '📅',
  },
  survive_month: {
    id: 'survive_month',
    title: 'Một tháng',
    description: 'Quán hoạt động 30 ngày liên tiếp.',
    icon: '🗓️',
  },
  master_barista: {
    id: 'master_barista',
    title: 'Bậc thầy pha chế',
    description: 'Pha 50 ly với điểm brewing >= 90.',
    icon: '👨‍🍳',
  },
}
