import { ShieldCheck, ShieldAlert, Shield, AlertTriangle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PlagiarismResult } from '@/lib/types/evaluation'

interface PlagiarismPanelProps {
  plagiarism: PlagiarismResult
}

export default function PlagiarismPanel({ plagiarism }: PlagiarismPanelProps) {
  const riskConfig = {
    low:    { label: '낮음 (양호)', icon: <ShieldCheck size={20} />, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', bar: 'bg-green-500' },
    medium: { label: '중간 (주의)', icon: <ShieldAlert size={20} />, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', bar: 'bg-amber-400' },
    high:   { label: '높음 (위험)', icon: <Shield size={20} />,      color: 'text-red-600',   bg: 'bg-red-50',   border: 'border-red-200',   bar: 'bg-red-500'   },
  }

  const rc = riskConfig[plagiarism.risk_level]
  const sim = plagiarism.similarity_estimate

  return (
    <div className="space-y-5">
      {/* 상단 배너 */}
      <div className={cn('rounded-2xl border-2 p-5', rc.border, rc.bg)}>
        <div className="flex items-center gap-4">
          {/* 원형 유사도 게이지 */}
          <div className="relative w-24 h-24 flex-shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="10" />
              <circle
                cx="50" cy="50" r="40" fill="none"
                stroke={sim >= 30 ? '#dc2626' : sim >= 15 ? '#f59e0b' : '#16a34a'}
                strokeWidth="10"
                strokeDasharray={`${(sim / 100) * 251} 251`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-black text-gray-900">{sim}%</span>
              <span className="text-[9px] text-gray-400">유사도</span>
            </div>
          </div>

          <div>
            <div className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold mb-2', rc.color, rc.bg)}>
              {rc.icon}
              표절 위험도: {rc.label}
            </div>
            <p className="text-xs text-gray-600 max-w-sm leading-relaxed">
              {plagiarism.ethics_note}
            </p>
          </div>
        </div>

        {/* 유사도 바 */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-500">유사도 분포</span>
            <div className="flex items-center gap-3 text-xs">
              <LegendDot color="bg-green-500" label="낮음 (0~15%)" />
              <LegendDot color="bg-amber-400" label="주의 (15~30%)" />
              <LegendDot color="bg-red-500" label="위험 (30%↑)" />
            </div>
          </div>
          <div className="h-3 rounded-full bg-gradient-to-r from-green-400 via-amber-400 to-red-500 relative overflow-hidden">
            <div
              className="absolute top-0 right-0 bottom-0 bg-gray-200/70"
              style={{ left: `${sim}%` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white border-2 border-gray-600 rounded-full shadow"
              style={{ left: `calc(${sim}% - 6px)` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
            <span>0%</span><span>15%</span><span>30%</span><span>50%</span><span>100%</span>
          </div>
        </div>
      </div>

      {/* 의심 구절 목록 */}
      {plagiarism.suspicious_passages.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-500" />
            표절 의심 구절
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">
              {plagiarism.suspicious_passages.length}건
            </span>
          </h3>
          <div className="space-y-2">
            {plagiarism.suspicious_passages.map((p, i) => {
              const riskColor = p.risk === 'high' ? 'border-red-300 bg-red-50' : p.risk === 'medium' ? 'border-amber-200 bg-amber-50' : 'border-gray-200 bg-gray-50'
              const badge = p.risk === 'high' ? 'bg-red-100 text-red-700' : p.risk === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
              return (
                <div key={i} className={cn('rounded-xl border p-4', riskColor)}>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', badge)}>
                      {p.risk === 'high' ? '위험' : p.risk === 'medium' ? '주의' : '확인'} #{i + 1}
                    </span>
                  </div>
                  <blockquote className="text-sm text-gray-700 italic border-l-3 border-gray-300 pl-3 mb-2">
                    &ldquo;{p.text}&rdquo;
                  </blockquote>
                  <p className="text-xs text-gray-500 flex items-start gap-1">
                    <Info size={11} className="flex-shrink-0 mt-0.5" />
                    {p.reason}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 연구 윤리 가이드 */}
      <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
        <h4 className="text-sm font-semibold text-military-primary mb-3 flex items-center gap-2">
          <Info size={14} />
          연구 윤리 가이드
        </h4>
        <div className="space-y-2 text-xs text-gray-600">
          <EthicsItem
            title="직접 인용 (10자 이상)"
            desc='원문을 ""(큰따옴표)로 묶고 (저자, 연도: 쪽수) 형식으로 출처를 반드시 표기하세요.'
          />
          <EthicsItem
            title="간접 인용·요약"
            desc="타인의 아이디어를 자신의 말로 풀어 쓸 때도 반드시 (저자, 연도) 형식으로 출처를 명시하세요."
          />
          <EthicsItem
            title="자기 표절"
            desc="이전에 발표한 자신의 논문 내용을 재활용할 경우에도 출처를 표기하고 편집위원회에 사전 고지해야 합니다."
          />
          <EthicsItem
            title="표절 기준"
            desc="5개 이상 연속된 단어의 무단 인용, 또는 아이디어·데이터의 출처 미표기는 표절로 간주됩니다."
          />
        </div>
        <div className="mt-3 pt-3 border-t border-blue-200 text-[11px] text-blue-600">
          ※ 본 표절 검사는 AI 기반 추정값이며, 정확한 검사는 iThenticate 등 전문 도구를 활용하시기 바랍니다.
        </div>
      </div>
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={cn('w-2 h-2 rounded-full', color)} />
      {label}
    </span>
  )
}

function EthicsItem({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="w-1.5 h-1.5 rounded-full bg-military-accent flex-shrink-0 mt-1.5" />
      <div>
        <span className="font-semibold text-gray-700">{title}: </span>
        {desc}
      </div>
    </div>
  )
}
