import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  trend?: { value: number; label: string }
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
}

const colorMap = {
  blue: {
    bg: 'bg-blue-50',
    iconBg: 'bg-military-primary',
    text: 'text-military-primary',
    border: 'border-blue-100',
    trend: 'text-blue-600',
  },
  green: {
    bg: 'bg-green-50',
    iconBg: 'bg-green-600',
    text: 'text-green-700',
    border: 'border-green-100',
    trend: 'text-green-600',
  },
  yellow: {
    bg: 'bg-amber-50',
    iconBg: 'bg-amber-500',
    text: 'text-amber-700',
    border: 'border-amber-100',
    trend: 'text-amber-600',
  },
  red: {
    bg: 'bg-red-50',
    iconBg: 'bg-red-600',
    text: 'text-red-700',
    border: 'border-red-100',
    trend: 'text-red-600',
  },
  purple: {
    bg: 'bg-purple-50',
    iconBg: 'bg-purple-600',
    text: 'text-purple-700',
    border: 'border-purple-100',
    trend: 'text-purple-600',
  },
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  color = 'blue',
}: StatCardProps) {
  const colors = colorMap[color]

  return (
    <div
      className={cn(
        'bg-white rounded-xl border p-5 shadow-card hover:shadow-card-hover transition-shadow',
        colors.border
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{title}</p>
          <p className={cn('text-3xl font-bold mt-1.5', colors.text)}>{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
          {trend && (
            <div className={cn('flex items-center gap-1 mt-2 text-xs font-medium', colors.trend)}>
              <span>{trend.value > 0 ? '▲' : '▼'}</span>
              <span>
                {Math.abs(trend.value)}% {trend.label}
              </span>
            </div>
          )}
        </div>
        <div
          className={cn(
            'w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0',
            colors.iconBg
          )}
        >
          <span className="text-white">{icon}</span>
        </div>
      </div>
    </div>
  )
}
