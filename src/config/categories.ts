import {
  Laugh,
  Mic2,
  Palette,
  Sparkles,
  Trophy,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { EventCategory } from '@/types'

interface CategoryMeta {
  label: string
  icon: LucideIcon
  /** Tailwind gradient used when an event has no poster yet. */
  gradient: string
}

export const categoryMeta: Record<EventCategory, CategoryMeta> = {
  festival: { label: 'Festival', icon: Sparkles, gradient: 'from-orange-400 via-rose-500 to-purple-600' },
  music: { label: 'Music', icon: Mic2, gradient: 'from-indigo-500 via-purple-500 to-pink-500' },
  comedy: { label: 'Comedy', icon: Laugh, gradient: 'from-amber-400 via-orange-500 to-rose-600' },
  meetup: { label: 'Meetup', icon: Users, gradient: 'from-emerald-400 via-teal-500 to-cyan-600' },
  sports: { label: 'Sports', icon: Trophy, gradient: 'from-sky-400 via-blue-500 to-indigo-600' },
  arts: { label: 'Arts', icon: Palette, gradient: 'from-fuchsia-500 via-rose-500 to-orange-400' },
}

export const eventCategories = Object.keys(categoryMeta) as EventCategory[]

export function categoryLabel(category: EventCategory): string {
  return categoryMeta[category].label
}
