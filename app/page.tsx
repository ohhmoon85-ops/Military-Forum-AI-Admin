import {
  AlertTriangle,
  ArrowRight,
  Upload,
} from 'lucide-react'
import Link from 'next/link'
import DashboardStats from '@/components/dashboard/DashboardStats'
import WorkflowStepper from '@/components/dashboard/WorkflowStepper'
import RecentSubmissions from '@/components/dashboard/RecentSubmissions'

export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* 페이지 헤더 */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
          <p className="text-sm text-gray-500 mt-1">
            사단법인 한국군사학회 투고 기고문 심사 현황
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/upload"
            className="flex items-center gap-2 bg-military-primary hover:bg-military-secondary text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm"
          >
            <Upload size={15} />
            기고문 업로드
          </Link>
        </div>
      </div>

      {/* 통계 카드 + 빠른 실행 (실시간 클라이언트 fetch) */}
      <DashboardStats />

      {/* 워크플로우 스테퍼 */}
      <WorkflowStepper />

      {/* 메인 콘텐츠 영역 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* 최근 투고 현황 */}
        <div className="xl:col-span-2">
          <RecentSubmissions />
        </div>

        {/* 우측 사이드 패널 */}
        <div className="space-y-4">
          {/* 주의 필요 항목 */}
          <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={16} className="text-amber-600" />
              <h3 className="text-sm font-semibold text-amber-800">안내</h3>
            </div>
            <div className="space-y-2">
              <AlertItem
                title="AI 평가 후 직접 선정"
                desc="게재확정·수정재심사·미선정은 AI 평가 후 관리자가 결정합니다"
                urgency="medium"
              />
              <AlertItem
                title="개별 논문 파일 업로드"
                desc="전체 학술지 PDF가 아닌 개별 논문 파일을 업로드해 주세요"
                urgency="low"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 발간 규정 요약 배너 */}
      <div className="bg-gradient-to-r from-military-primary to-military-secondary rounded-xl p-5 text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-base">계간 군사논단 투고 규정 안내</h3>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
              <RuleChip text="글자 크기: 11pt" />
              <RuleChip text="줄간격: 160%" />
              <RuleChip text="분량: A4 20~25매" />
              <RuleChip text="파일: 한글(HWP) 또는 MS Word" />
              <RuleChip text="분야: 군사학·국방정책·북한·방위산업" />
            </div>
          </div>
          <Link
            href="/guidelines"
            className="flex-shrink-0 flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            규정 전문 보기 <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  )
}

function AlertItem({
  title, desc, urgency,
}: {
  title: string; desc: string; urgency: 'high' | 'medium' | 'low'
}) {
  const colors = {
    high:   'bg-red-100 text-red-700',
    medium: 'bg-amber-100 text-amber-700',
    low:    'bg-yellow-50 text-yellow-700',
  }
  return (
    <div className="flex items-start gap-2">
      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${colors[urgency]}`}>
        {urgency === 'high' ? '긴급' : urgency === 'medium' ? '주의' : '안내'}
      </span>
      <div>
        <p className="text-xs font-semibold text-amber-900">{title}</p>
        <p className="text-[11px] text-amber-700">{desc}</p>
      </div>
    </div>
  )
}

function RuleChip({ text }: { text: string }) {
  return (
    <span className="flex items-center gap-1 text-xs text-blue-200">
      <span className="w-1 h-1 rounded-full bg-military-gold inline-block" />
      {text}
    </span>
  )
}
