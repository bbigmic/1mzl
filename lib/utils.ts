import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('pl-PL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export const PLANS = {
  free: {
    name: 'Free',
    price: 0,
    limits: {
      generations: 10,
      words: 1000,
    },
  },
  pro: {
    name: 'Pro',
    price: 99, // PLN miesięcznie
    limits: {
      generations: 500,
      words: 50000,
    },
  },
  enterprise: {
    name: 'Enterprise',
    price: 299, // PLN miesięcznie
    limits: {
      generations: -1, // unlimited
      words: -1, // unlimited
    },
  },
} as const

