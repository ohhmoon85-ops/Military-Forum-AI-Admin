import {
  FileText,
  BrainCircuit,
  CheckCircle2,
  XCircle,
  Upload,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react'
import Link from 'next/link'
import StatCard from '@/components/dashboard/StatCard'
import WorkflowStepper from '@/components/dashboard/WorkflowStepper'
import RecentSubmissions from '@/components/dashboard/RecentSubmissions'
import { getDb, isDatabaseConfigured } from '@/lib/db'
import { papers } from '@/lib/schema'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  // ─── DB에서 통계 집계 ────────────────────────────────────────────────────
  let statusCounts = { total: 0, pending: 0, reviewing: 0, accepted: 0, rejected: 0, revision: 0 }
  let evaluatedCount = 0
  let acceptRate = '0.0'

  if (isDatabaseConfigured()) {
    try {
      const db = getDb()
      const stats = await db.select({ status: papers.status }).from(papers)
      for (const row of stats) {
        statusCounts.total++
        const s = row.status as keyof typeof statusCounts
        if (s in statusCounts) statusCounts[s]++
      }
      evaluatedCount = statusCounts.accepted + statusCounts.rejected + statusCounts.revision
      acceptRate = statusCounts.total > 0
        ? ((statusCounts.accepted / statusCounts.total) * 100).toFixed(1)
        : '0.0'
    } catch {
      // DB 오류 시 기본값 유지
    }
  }

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

      {/* 통계 카드 그리드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="총 투고 건수"
          value={statusCounts.total}
          subtitle="이번 심사 회차 누계"
          icon={<FileText size={20} />}
          color="blue"
        />
        <StatCard
          title="AI 평가 완료"
          value={evaluatedCount}
          subtitle={statusCounts.total > 0 ? `${Math.round((evaluatedCount / statusCounts.total) * 100)}% 처리 완료` : '대기 중'}
          icon={<BrainCircuit size={20} />}
          color="purple"
        />
        <StatCard
          title="선정 확정"
          value={statusCounts.accepted}
          subtitle={`채택률 ${acceptRate}%`}
          icon={<CheckCircle2 size={20} />}
          color="green"
        />
        <StatCard
          title="미선정 / 수정요청"
          value={statusCounts.rejected + statusCounts.revision}
          subtitle="재투고 피드백 발송 완료"
          icon={<XCircle size={20} />}
          color="red"
        />
      </div>

      {/* 워크플로우 스테퍼 */}
      <WorkflowStepper />

      {/* 메인 콘텐츠 영역 */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* 최근 투고 현황 - 큰 영역 */}
        <div className="xl:col-span-2">
          <RecentSubmissions />
        </div>

        {/* 우측 사이드 패널 */}
        <div className="space-y-4">
          {/* 빠른 실행 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-card">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">빠른 실행</h3>
            <div className="space-y-2">
              <QuickAction
                href="/upload"
                icon={<Upload size={16} />}
                label="기고문 업로드"
                desc="PDF / DOCX 드래그 업로드"
                color="bg-military-light text-military-primary"
              />
              <QuickAction
                href="/evaluation"
                icon={<BrainCircuit size={16} />}
                label="AI 평가 시작"
                desc="대기 중인 5건 분석"
                color="bg-purple-50 text-purple-700"
                badge="5건"
              />
              <QuickAction
                href="/formatting"
                icon={<TrendingUp size={16} />}
                label="양식 자동 수정"
                desc="선정 기고문 서식 변환"
                color="bg-orange-50 text-orange-700"
              />
            </div>
          </div>

          {/* AI 분석 현황 */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-card">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">AI 분석 현황</h3>
            <div className="space-y-3">
              <ProgressItem label="주제 적합성 검토" percent={85} color="bg-blue-500" />
              <ProgressItem label="형식 준수도 검사" percent={72} color="bg-purple-500" />
              <ProgressItem label="표절 검사 완료" percent={68} color="bg-green-500" />
              <ProgressItem label="요약문 생성" percent={90} color="bg-amber-500" />
            </div>
          </div>

          {/* 주의 필요 항목 */}
          <div className="bg-amber-50 rounded-xl border border-amber-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={16} className="text-amber-600" />
              <h3 className="text-sm font-semibold text-amber-800">검토 필요</h3>
            </div>
            <div className="space-y-2">
              <AlertItem
                title="표절 의심 기고문"
                desc="유사도 38% 초과 - 1건"
                urgency="high"
              />
              <AlertItem
                title="분량 미달"
                desc="A4 19매 미만 - 2건"
                urgency="medium"
              />
              <AlertItem
                title="형식 미준수"
                desc="11pt/160% 위반 - 3건"
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

function QuickAction({
  href,
  icon,
  label,
  desc,
  color,
  badge,
}: {
  href: string
  icon: React.ReactNode
  label: string
  desc: string
  color: string
  badge?: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group border border-transparent hover:border-gray-100"
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${color}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-gray-800 group-hover:text-military-primary transition-colors">
            {label}
          </p>
          {badge && (
            <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 truncate">{desc}</p>
      </div>
      <ArrowRight
        size={14}
        className="text-gray-300 group-hover:text-military-accent group-hover:translate-x-0.5 transition-all flex-shrink-0"
      />
    </Link>
  )
}

function ProgressItem({
  label,
  percent,
  color,
}: {
  label: string
  percent: number
  color: string
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-600">{label}</span>
        <span className="text-xs font-semibold text-gray-800">{percent}%</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

function AlertItem({
  title,
  desc,
  urgency,
}: {
  title: string
  desc: string
  urgency: 'high' | 'medium' | 'low'
}) {
  const colors = {
    high: 'bg-red-100 text-red-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-yellow-50 text-yellow-700',
  }
  return (
    <div className="flex items-start gap-2">
      <span
        className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${colors[urgency]}`}
      >
        {urgency === 'high' ? '긴급' : urgency === 'medium' ? '주의' : '확인'}
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
