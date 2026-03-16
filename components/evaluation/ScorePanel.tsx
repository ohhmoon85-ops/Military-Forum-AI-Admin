'use client'

import { useState } from 'react'
import { CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EvaluationResult } from '@/lib/types/evaluation'

interface ScorePanelProps {
  result: EvaluationResult
}

const SCORE_META = [
  { key: 'topic_relevance',       label: '주제 적합성',    max: 30, color: 'blue',   desc: '군사학·국방정책·북한·방위산업 관련성' },
  { key: 'logic_structure',       label: '논리성·체계성',  max: 25, color: 'purple', desc: '논증 타당성, 체계적 구성' },
  { key: 'academic_contribution', label: '학술적 기여도',  max: 20, color: 'green',  desc: '독창성, 새로운 시각 제시' },
  { key: 'format_compliance',     label: '형식 준수도',    max: 15, color: 'orange', desc: 'A4 20~25매, 초록·참고문헌' },
  { key: 'references',            label: '참고문헌 적절성', max: 10, color: 'teal',  desc: '최신성, 다양성, 인용 형식' },
] as const

const colorMap = {
  blue:   { bar: 'bg-blue-500',   bg: 'bg-blue-50',   text: 'text-blue-700',   ring: 'ring-blue-200'   },
  purple: { bar: 'bg-purple-500', bg: 'bg-purple-50', text: 'text-purple-700', ring: 'ring-purple-200' },
  green:  { bar: 'bg-green-500',  bg: 'bg-green-50',  text: 'text-green-700',  ring: 'ring-green-200'  },
  orange: { bar: 'bg-orange-400', bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-200' },
  teal:   { bar: 'bg-teal-500',   bg: 'bg-teal-50',   text: 'text-teal-700',   ring: 'ring-teal-200'   },
}

const recConfig = {
  accept:   { label: '게재 확정', icon: <CheckCircle2 size={18} />, cls: 'bg-green-600 text-white', border: 'border-green-200' },
  revision: { label: '수정 후 재심사', icon: <AlertTriangle size={18} />, cls: 'bg-amber-500 text-white', border: 'border-amber-200' },
  reject:   { label: '미선정', icon: <XCircle size={18} />, cls: 'bg-red-600 text-white', border: 'border-red-200' },
}

export default function ScorePanel({ result }: ScorePanelProps) {
  const [expandedKey, setExpandedKey] = useState<string | null>(null)
  const rec = recConfig[result.recommendation]

  // 레이더 차트용 데이터
  const radarPoints = SCORE_META.map(({ key, max }) => {
    const s = result.scores[key]
    return (s.score / max) * 100
  })

  return (
    <div className="space-y-5">
      {/* 종합 점수 헤더 */}
      <div className={cn('rounded-2xl border-2 p-5 flex items-center gap-5', rec.border)}>
        {/* 원형 점수 */}
        <div className="relative w-24 h-24 flex-shrink-0">
          <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#e5e7eb" strokeWidth="10" />
            <circle
              cx="50" cy="50" r="42" fill="none"
              stroke={result.total_score >= 85 ? '#16a34a' : result.total_score >= 65 ? '#f59e0b' : '#dc2626'}
              strokeWidth="10"
              strokeDasharray={`${(result.total_score / 100) * 264} 264`}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-gray-900">{result.total_score}</span>
            <span className="text-[10px] text-gray-400 font-medium">/ 100</span>
          </div>
        </div>

        <div className="flex-1">
          <div className={cn('inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold mb-2', rec.cls)}>
            {rec.icon}
            {rec.label}
          </div>
          <div className="grid grid-cols-5 gap-1">
            {SCORE_META.map(({ key, label, max, color }) => {
              const s = result.scores[key]
              const pct = Math.round((s.score / max) * 100)
              const c = colorMap[color]
              return (
                <div key={key} className={cn('rounded-lg p-1.5 text-center', c.bg)}>
                  <p className={cn('text-sm font-bold', c.text)}>{s.score}<span className="text-[10px]">/{max}</span></p>
                  <p className="text-[9px] text-gray-500 leading-tight mt-0.5">{label.replace('·', '·\n')}</p>
                  <div className="w-full h-1 bg-gray-200 rounded-full mt-1 overflow-hidden">
                    <div className={cn('h-full rounded-full', c.bar)} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* 레이더 차트 */}
        <div className="hidden lg:block flex-shrink-0">
          <RadarChart points={radarPoints} />
        </div>
      </div>

      {/* 항목별 상세 */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">항목별 심사 의견</h3>
        {SCORE_META.map(({ key, label, max, color, desc }) => {
          const s = result.scores[key]
          const pct = Math.round((s.score / max) * 100)
          const c = colorMap[color]
          const isOpen = expandedKey === key

          return (
            <div key={key} className={cn('border rounded-xl overflow-hidden transition-all', isOpen ? 'border-gray-300 shadow-sm' : 'border-gray-100')}>
              <button
                onClick={() => setExpandedKey(isOpen ? null : key)}
                className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left"
              >
                <div className={cn('w-9 h-9 rounded-xl flex flex-col items-center justify-center flex-shrink-0', c.bg)}>
                  <span className={cn('text-sm font-black leading-none', c.text)}>{s.score}</span>
                  <span className="text-[8px] text-gray-400">/{max}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-gray-800">{label}</span>
                    <span className="text-xs text-gray-400">{desc}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all duration-700', c.bar)}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className={cn('text-xs font-bold', c.text)}>{pct}%</span>
                  </div>
                </div>
                {isOpen ? <ChevronUp size={14} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={14} className="text-gray-400 flex-shrink-0" />}
              </button>

              {isOpen && (
                <div className={cn('px-4 pb-4 pt-1 text-sm text-gray-700 leading-relaxed border-t border-gray-100', c.bg)}>
                  <p>{s.comment}</p>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* 강점 / 약점 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StrengthWeakness title="강점" items={result.strengths} type="strength" />
        <StrengthWeakness title="약점" items={result.weaknesses} type="weakness" />
      </div>
    </div>
  )
}

function StrengthWeakness({ title, items, type }: { title: string; items: string[]; type: 'strength' | 'weakness' }) {
  const isStrength = type === 'strength'
  return (
    <div className={cn('rounded-xl border p-4', isStrength ? 'border-green-100 bg-green-50' : 'border-red-100 bg-red-50')}>
      <h4 className={cn('text-sm font-bold mb-3 flex items-center gap-2', isStrength ? 'text-green-700' : 'text-red-700')}>
        {isStrength ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
        {title}
      </h4>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
            <span className={cn('w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0 mt-0.5', isStrength ? 'bg-green-500' : 'bg-red-400')}>
              {i + 1}
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

// ─── 레이더 차트 (SVG 직접 구현) ───────────────────────────────────────────

function RadarChart({ points }: { points: number[] }) {
  const size = 100
  const center = size / 2
  const radius = 38
  const n = points.length

  const angleStep = (Math.PI * 2) / n

  function toXY(index: number, r: number) {
    const angle = angleStep * index - Math.PI / 2
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    }
  }

  const gridLevels = [0.25, 0.5, 0.75, 1.0]

  const dataPath = points
    .map((p, i) => {
      const { x, y } = toXY(i, (p / 100) * radius)
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
    })
    .join(' ') + ' Z'

  return (
    <svg width={100} height={100} viewBox={`0 0 ${size} ${size}`} className="opacity-90">
      {/* 격자 */}
      {gridLevels.map((level) => {
        const gridPath = Array.from({ length: n }, (_, i) => {
          const { x, y } = toXY(i, level * radius)
          return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
        }).join(' ') + ' Z'
        return <path key={level} d={gridPath} fill="none" stroke="#e5e7eb" strokeWidth="0.5" />
      })}

      {/* 축선 */}
      {Array.from({ length: n }, (_, i) => {
        const { x, y } = toXY(i, radius)
        return <line key={i} x1={center} y1={center} x2={x.toFixed(1)} y2={y.toFixed(1)} stroke="#e5e7eb" strokeWidth="0.5" />
      })}

      {/* 데이터 영역 */}
      <path d={dataPath} fill="#3182ce" fillOpacity="0.3" stroke="#3182ce" strokeWidth="1.5" />

      {/* 데이터 포인트 */}
      {points.map((p, i) => {
        const { x, y } = toXY(i, (p / 100) * radius)
        return <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r="2.5" fill="#1e3a5f" />
      })}
    </svg>
  )
}
