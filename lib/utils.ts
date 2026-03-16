import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: '검토 대기',
    reviewing: '심사 중',
    accepted: '선정',
    rejected: '미선정',
    revision: '수정 요청',
  }
  return labels[status] ?? status
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    reviewing: 'bg-blue-100 text-blue-800',
    accepted: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    revision: 'bg-orange-100 text-orange-800',
  }
  return colors[status] ?? 'bg-gray-100 text-gray-800'
}
