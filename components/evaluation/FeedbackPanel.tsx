'use client'

import { useState } from 'react'
import { Loader2, MessageSquareText, ArrowRight, Clock, ChevronDown, ChevronUp, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FeedbackItem, EvaluationResult } from '@/lib/types/evaluation'

interface FeedbackPanelProps {
  result: EvaluationResult
  paperId: string
  paperTitle: string
  paperText: string
}

const priorityConfig = {
  high:   { label: '긴급', cls: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500', order: 1 },
  medium: { label: '권고', cls: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-400', order: 2 },
  low:    { label: '선택', cls: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400', order: 3 },
}

export default function FeedbackPanel({ result, paperId, paperTitle, paperText }: FeedbackPanelProps) {
  const [roadmap, setRoadmap] = useState<FeedbackItem[]>(result.feedback_roadmap ?? [])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [generated, setGenerated] = useState(result.feedback_roadmap?.length > 0)

  const handleGenerate = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: paperTitle,
          text: paperText,
          weaknesses: result.weaknesses,
          total_score: result.total_score,
          recommendation: result.recommendation,
        }),
      })
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error ?? '피드백 생성 실패')
      setRoadmap(json.roadmap)
      setGenerated(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류')
    } finally {
      setLoading(false)
    }
  }

  const sorted = [...roadmap].sort(
    (a, b) => (priorityConfig[a.priority]?.order ?? 9) - (priorityConfig[b.priority]?.order ?? 9)
  )

  const highCount = sorted.filter((r) => r.priority === 'high').length
  const medCount = sorted.filter((r) => r.priority === 'medium').length

  return (
    <div className="space-y-5">
      {/* 헤더 */}
      <div className={cn(
        'rounded-2xl p-5',
        result.recommendation === 'reject' ? 'bg-red-50 border-2 border-red-200' : 'bg-amber-50 border-2 border-amber-200'
      )}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MessageSquareText size={18} className={result.recommendation === 'reject' ? 'text-red-600' : 'text-amber-600'} />
              <h3 className="text-base font-bold text-gray-900">재투고 수정 로드맵</h3>
            </div>
            <p className="text-sm text-gray-600">
              {result.recommendation === 'reject'
                ? '미선정 논문의 다음 분기 채택을 위한 구체적인 수정 보완 계획입니다.'
                : '수정 요청 사항을 단계별로 처리하여 다음 심사에서 최종 선정될 수 있도록 안내합니다.'}
            </p>
            {generated && (
              <div className="flex items-center gap-3 mt-2">
                <StatBadge label="긴급 수정" value={highCount} color="bg-red-100 text-red-700" />
                <StatBadge label="권고 개선" value={medCount} color="bg-amber-100 text-amber-700" />
                <StatBadge label="총 항목" value={sorted.length} color="bg-gray-100 text-gray-700" />
              </div>
            )}
          </div>
          {!generated && (
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex-shrink-0 flex items-center gap-2 bg-military-primary hover:bg-military-secondary text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm disabled:opacity-60"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
              {loading ? 'AI 생성 중...' : '피드백 생성'}
            </button>
          )}
          {generated && (
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex-shrink-0 flex items-center gap-1.5 text-xs text-gray-400 hover:text-military-primary transition-colors"
            >
              {loading ? <Loader2 size={12} className="animate-spin" /> : <ArrowRight size={12} />}
              재생성
            </button>
          )}
        </div>

        {error && (
          <p className="mt-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            ⚠ {error}
          </p>
        )}
      </div>

      {/* 빈 상태 */}
      {!generated && !loading && (
        <div className="text-center py-12 text-gray-400">
          <MessageSquareText size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm font-medium">위 버튼을 눌러 AI 맞춤 피드백을 생성하세요</p>
          <p className="text-xs mt-1">논문 내용을 분석하여 구체적인 수정 가이드를 제공합니다</p>
        </div>
      )}

      {loading && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <Loader2 size={32} className="animate-spin text-military-accent" />
          <p className="text-sm text-gray-500 font-medium">AI가 수정 로드맵을 생성하고 있습니다...</p>
          <p className="text-xs text-gray-400">논문 내용을 분석하여 맞춤 피드백을 준비 중입니다</p>
        </div>
      )}

      {/* 로드맵 카드 */}
      {generated && !loading && sorted.length > 0 && (
        <div className="space-y-3">
          {sorted.map((item, idx) => {
            const pc = priorityConfig[item.priority]
            const isOpen = expanded === idx
            return (
              <div
                key={idx}
                className={cn(
                  'bg-white rounded-xl border overflow-hidden transition-all shadow-card',
                  isOpen ? 'border-gray-300 shadow-card-hover' : 'border-gray-100'
                )}
              >
                <button
                  onClick={() => setExpanded(isOpen ? null : idx)}
                  className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors text-left"
                >
                  {/* 우선순위 도트 */}
                  <div className={cn('w-2 h-2 rounded-full flex-shrink-0', pc.dot)} />

                  {/* 순서 번호 */}
                  <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-gray-500">
                    {idx + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full border', pc.cls)}>
                        {pc.label}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                        {item.category}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-gray-800 truncate">{item.issue}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="hidden sm:flex items-center gap-1 text-xs text-gray-400">
                      <Clock size={11} />
                      {item.effort}
                    </div>
                    {isOpen ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-gray-100 px-4 pb-4 pt-3 bg-gray-50">
                    <div className="flex items-start gap-2 mb-3">
                      <div className="w-5 h-5 rounded-full bg-military-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Sparkles size={11} className="text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-military-primary mb-1">개선 방안</p>
                        <p className="text-sm text-gray-700 leading-relaxed">{item.suggestion}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                      <Clock size={12} className="text-gray-400" />
                      <span className="text-xs text-gray-500">예상 소요: <strong className="text-gray-700">{item.effort}</strong></span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* 재투고 안내 */}
      {generated && (
        <div className="bg-military-light rounded-xl border border-blue-100 p-4">
          <h4 className="text-sm font-semibold text-military-primary mb-2">재투고 절차 안내</h4>
          <ol className="space-y-1.5 text-xs text-gray-600">
            <li className="flex items-start gap-2"><span className="w-4 h-4 rounded-full bg-military-primary text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>위 수정 로드맵을 참고하여 논문을 수정하세요</li>
            <li className="flex items-start gap-2"><span className="w-4 h-4 rounded-full bg-military-primary text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>수정 사항을 정리한 &apos;수정 대조표&apos;를 작성하세요</li>
            <li className="flex items-start gap-2"><span className="w-4 h-4 rounded-full bg-military-primary text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>다음 분기 마감일 15일 전까지 kaoms@naver.com으로 제출하세요</li>
            <li className="flex items-start gap-2"><span className="w-4 h-4 rounded-full bg-military-primary text-white text-[9px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">4</span>제목에 [재투고] 표시 및 이전 접수번호({paperId})를 기재해 주세요</li>
          </ol>
        </div>
      )}
    </div>
  )
}

function StatBadge({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={cn('px-2.5 py-1 rounded-full text-xs font-bold', color)}>
      {label}: {value}
    </div>
  )
}
