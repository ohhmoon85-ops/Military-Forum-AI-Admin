import {
  BookOpen,
  Lightbulb,
  BarChart2,
  Flag,
  Compass,
} from 'lucide-react'
import type { ExecutiveSummary } from '@/lib/types/evaluation'

interface SummaryPanelProps {
  summary: ExecutiveSummary
  title: string
}

const SECTIONS = [
  {
    key: 'background' as const,
    icon: <BookOpen size={16} />,
    label: '연구 배경 및 목적',
    color: 'border-blue-300 bg-blue-50',
    iconColor: 'text-blue-600 bg-blue-100',
    num: '01',
  },
  {
    key: 'main_argument' as const,
    icon: <Lightbulb size={16} />,
    label: '핵심 주장 및 논리',
    color: 'border-purple-300 bg-purple-50',
    iconColor: 'text-purple-600 bg-purple-100',
    num: '02',
  },
  {
    key: 'evidence' as const,
    icon: <BarChart2 size={16} />,
    label: '데이터 및 근거',
    color: 'border-green-300 bg-green-50',
    iconColor: 'text-green-600 bg-green-100',
    num: '03',
  },
  {
    key: 'conclusion' as const,
    icon: <Flag size={16} />,
    label: '결론',
    color: 'border-orange-300 bg-orange-50',
    iconColor: 'text-orange-600 bg-orange-100',
    num: '04',
  },
  {
    key: 'policy_implication' as const,
    icon: <Compass size={16} />,
    label: '정책적 시사점',
    color: 'border-teal-300 bg-teal-50',
    iconColor: 'text-teal-600 bg-teal-100',
    num: '05',
  },
]

export default function SummaryPanel({ summary, title }: SummaryPanelProps) {
  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-military-primary to-military-secondary rounded-xl p-4 text-white">
        <p className="text-xs text-blue-300 font-semibold uppercase tracking-widest mb-1">
          Executive Summary
        </p>
        <h3 className="text-base font-bold leading-snug line-clamp-2">{title}</h3>
        <p className="text-xs text-blue-200 mt-1">
          AI가 생성한 A4 반 페이지 분량의 기고문 핵심 요약본입니다
        </p>
      </div>

      {/* 요약 섹션 카드들 */}
      <div className="space-y-3">
        {SECTIONS.map(({ key, icon, label, color, iconColor, num }) => (
          <div
            key={key}
            className={`rounded-xl border-l-4 p-4 ${color}`}
          >
            <div className="flex items-start gap-3">
              {/* 아이콘 + 번호 */}
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconColor}`}>
                {icon}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold text-gray-400">{num}</span>
                  <h4 className="text-sm font-bold text-gray-800">{label}</h4>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {summary[key]}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 저작권 안내 */}
      <p className="text-[11px] text-gray-400 text-center">
        본 요약은 AI가 자동 생성한 것으로 편집위원의 최종 검토가 필요합니다
      </p>
    </div>
  )
}
