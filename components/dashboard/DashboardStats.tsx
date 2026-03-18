'use client'

import { useEffect, useState } from 'react'
import { FileText, BrainCircuit, CheckCircle2, XCircle, Upload, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import StatCard from './StatCard'

interface Stats {
  total: number
  evaluated: number
  accepted: number
  rejected: number
  revision: number
  awaitingEval: number
  dbConnected: boolean
}

export default function DashboardStats() {
  const [stats, setStats] = useState<Stats | null>(null)

  useEffect(() => {
    fetch('/api/stats', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(() => {})
  }, [])

  const total       = stats?.total       ?? 0
  const evaluated   = stats?.evaluated   ?? 0
  const accepted    = stats?.accepted    ?? 0
  const rejected    = (stats?.rejected   ?? 0) + (stats?.revision ?? 0)
  const awaitingEval = stats?.awaitingEval ?? 0
  const acceptRate  = total > 0 ? ((accepted / total) * 100).toFixed(1) : '0.0'
  const evalPct     = total > 0 ? Math.round((evaluated / total) * 100) : 0

  return (
    <>
      {/* 통계 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="총 투고 건수"
          value={total}
          subtitle="이번 심사 회차 누계"
          icon={<FileText size={20} />}
          color="blue"
        />
        <StatCard
          title="AI 평가 완료"
          value={evaluated}
          subtitle={total > 0 ? `${evalPct}% 처리 완료` : '대기 중'}
          icon={<BrainCircuit size={20} />}
          color="purple"
        />
        <StatCard
          title="선정 확정"
          value={accepted}
          subtitle={`채택률 ${acceptRate}%`}
          icon={<CheckCircle2 size={20} />}
          color="green"
        />
        <StatCard
          title="미선정 / 수정요청"
          value={rejected}
          subtitle="재투고 피드백 발송 완료"
          icon={<XCircle size={20} />}
          color="red"
        />
      </div>

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
            desc={awaitingEval > 0 ? `평가 대기 중 ${awaitingEval}건` : '모든 기고문 평가 완료'}
            color="bg-purple-50 text-purple-700"
            badge={awaitingEval > 0 ? `${awaitingEval}건` : undefined}
          />
          <QuickAction
            href="/formatting"
            icon={<BrainCircuit size={16} />}
            label="양식 자동 수정"
            desc="선정 기고문 서식 변환"
            color="bg-orange-50 text-orange-700"
          />
        </div>
      </div>
    </>
  )
}

function QuickAction({
  href, icon, label, desc, color, badge,
}: {
  href: string; icon: React.ReactNode; label: string
  desc: string; color: string; badge?: string
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
      <ArrowRight size={14} className="text-gray-300 group-hover:text-military-accent group-hover:translate-x-0.5 transition-all flex-shrink-0" />
    </Link>
  )
}
