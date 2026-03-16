'use client'

import { useState, useEffect } from 'react'
import {
  BrainCircuit, FileText, ChevronRight, Loader2,
  BarChart2, BookOpen, Shield, MessageSquareText,
  CheckCircle2, AlertTriangle, XCircle, User, Building2,
  Info, Sparkles,
} from 'lucide-react'
import { cn, getStatusLabel, getStatusColor } from '@/lib/utils'
import ScorePanel from './ScorePanel'
import SummaryPanel from './SummaryPanel'
import PlagiarismPanel from './PlagiarismPanel'
import FeedbackPanel from './FeedbackPanel'
import type { PaperMeta, EvaluationResult } from '@/lib/types/evaluation'
import { DEMO_PAPERS } from '@/lib/demo-papers'

interface Props {
  initialPapers?: PaperMeta[]
}

type TabKey = 'score' | 'summary' | 'plagiarism' | 'feedback'

const TABS: { key: TabKey; label: string; icon: React.ReactNode; badge?: string }[] = [
  { key: 'score',      label: 'AI 평가 점수',  icon: <BarChart2 size={15} /> },
  { key: 'summary',    label: '상세 요약',      icon: <BookOpen size={15} /> },
  { key: 'plagiarism', label: '표절 검사',      icon: <Shield size={15} /> },
  { key: 'feedback',   label: '재투고 피드백',  icon: <MessageSquareText size={15} /> },
]

export default function EvaluationClient({ initialPapers }: Props) {
  const [papers, setPapers] = useState<PaperMeta[]>(initialPapers ?? DEMO_PAPERS)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [tab, setTab] = useState<TabKey>('score')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDemo, setIsDemo] = useState(false)

  useEffect(() => {
    fetch('/api/status')
      .then((r) => r.json())
      .then((d) => setIsDemo(d.demoMode ?? false))
      .catch(() => {})
  }, [])

  const selected = papers.find((p) => p.id === selectedId) ?? null

  const handleEvaluate = async (paper: PaperMeta) => {
    setError(null)
    setLoading(true)
    setTab('score')

    try {
      // 텍스트가 없고 DB ID가 있으면 DB에서 lazy-load
      let textToEvaluate = paper.text
      if (!textToEvaluate && paper._dbId) {
        const detailRes = await fetch(`/api/papers/${paper._dbId}`)
        const detailJson = await detailRes.json()
        textToEvaluate = detailJson.paper?.extracted_text ?? ''
      }

      if (!textToEvaluate || textToEvaluate.trim().length < 100) {
        setError('논문 텍스트가 없습니다. 업로드 페이지에서 먼저 파일을 추출해 주세요.')
        setLoading(false)
        return
      }

      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: paper.title,
          text: textToEvaluate,
          paperId: paper._dbId,   // DB 저장용
        }),
      })
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error ?? '평가 실패')

      const result: EvaluationResult = json.result
      setIsDemo(json.demo ?? false)
      setPapers((prev) =>
        prev.map((p) =>
          p.id === paper.id
            ? {
                ...p,
                result,
                status: result.recommendation === 'accept' ? 'accepted'
                       : result.recommendation === 'revision' ? 'revision'
                       : 'rejected',
                prevScore: result.total_score,
              }
            : p
        )
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-6 h-full">
      {/* ── 왼쪽: 논문 목록 ──────────────────────────────────────────────── */}
      <div className="w-72 flex-shrink-0 space-y-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">투고 논문 목록</h2>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold">
            {papers.length}건
          </span>
        </div>

        {papers.map((paper) => {
          const isSelected = paper.id === selectedId
          const hasResult = !!paper.result

          return (
            <button
              key={paper.id}
              onClick={() => { setSelectedId(paper.id); setError(null) }}
              className={cn(
                'w-full text-left rounded-xl border p-3 transition-all',
                isSelected
                  ? 'border-military-accent bg-military-light shadow-card-hover'
                  : 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-card'
              )}
            >
              <div className="flex items-start gap-2">
                <div className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
                  hasResult ? 'bg-military-light' : 'bg-gray-100'
                )}>
                  <FileText size={14} className={hasResult ? 'text-military-primary' : 'text-gray-400'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-snug">
                    {paper.title}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{paper.author} · {paper.affiliation}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', getStatusColor(paper.status))}>
                      {getStatusLabel(paper.status)}
                    </span>
                    {hasResult && (
                      <span className={cn(
                        'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                        paper.result!.recommendation === 'accept' ? 'bg-green-100 text-green-700'
                        : paper.result!.recommendation === 'revision' ? 'bg-amber-100 text-amber-700'
                        : 'bg-red-100 text-red-700'
                      )}>
                        {paper.result!.total_score}점
                      </span>
                    )}
                  </div>
                </div>
                {isSelected && <ChevronRight size={14} className="text-military-accent flex-shrink-0 mt-1" />}
              </div>
            </button>
          )
        })}
      </div>

      {/* ── 오른쪽: 평가 패널 ──────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0">
        {/* 데모 모드 상단 배너 */}
        {isDemo && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 mb-4">
            <Info size={14} className="text-amber-500 flex-shrink-0" />
            <p className="text-xs text-amber-700">
              현재 <strong>데모 모드</strong>로 동작 중입니다. 실제 Claude AI 분석을 사용하려면{' '}
              <code className="bg-amber-100 px-1 py-0.5 rounded text-[11px]">ANTHROPIC_API_KEY</code>를 설정하고{' '}
              <code className="bg-amber-100 px-1 py-0.5 rounded text-[11px]">DEMO_MODE=false</code>로 변경하세요.
            </p>
          </div>
        )}

        {!selected ? (
          <EmptyState />
        ) : (
          <div className="space-y-4">
            {/* 논문 메타 헤더 */}
            <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-card">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-bold text-gray-900 leading-snug mb-2">
                    {selected.title}
                  </h2>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><User size={11} />{selected.author}</span>
                    <span className="flex items-center gap-1"><Building2 size={11} />{selected.affiliation}</span>
                    <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{selected.category}</span>
                    <span>{selected.submittedAt} 접수</span>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {selected.result ? (
                    <div className="text-right">
                      <RecBadge rec={selected.result.recommendation} />
                      <p className="text-xs text-gray-400 mt-1">
                        {selected.result.model_used === 'demo-heuristic' ? '데모 결과' : `Claude 분석`}
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEvaluate(selected)}
                      disabled={loading}
                      className="flex items-center gap-2 bg-military-primary hover:bg-military-secondary text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm disabled:opacity-60"
                    >
                      {loading
                        ? <><Loader2 size={15} className="animate-spin" />평가 중...</>
                        : <><Sparkles size={15} />AI 평가 시작</>
                      }
                    </button>
                  )}
                </div>
              </div>

              {/* 에러 */}
              {error && (
                <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertTriangle size={13} className="text-red-500 flex-shrink-0" />
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}

            </div>

            {/* 로딩 상태 */}
            {loading && (
              <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-14 h-14 bg-military-light rounded-full flex items-center justify-center">
                  <Loader2 size={28} className="animate-spin text-military-primary" />
                </div>
                <p className="text-sm font-semibold text-gray-700">AI 평가 분석 중...</p>
                <p className="text-xs text-gray-400">논문 내용을 분석하여 종합 평가를 생성하고 있습니다</p>
                <div className="flex items-center gap-1.5 mt-1">
                  {['주제 적합성 검토', '논리 구조 분석', '표절 위험 탐지', '요약 생성'].map((s, i) => (
                    <span key={i} className="text-[11px] bg-military-light text-military-primary px-2 py-0.5 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.3}s` }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 결과 탭 */}
            {selected.result && !loading && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden">
                {/* 탭 헤더 */}
                <div className="flex border-b border-gray-100 bg-gray-50">
                  {TABS.map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setTab(t.key)}
                      className={cn(
                        'flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                        tab === t.key
                          ? 'border-military-primary text-military-primary bg-white'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-white/70'
                      )}
                    >
                      {t.icon}
                      <span className="hidden sm:inline">{t.label}</span>
                    </button>
                  ))}
                </div>

                {/* 탭 콘텐츠 */}
                <div className="p-5">
                  {tab === 'score' && (
                    <ScorePanel result={selected.result} />
                  )}
                  {tab === 'summary' && (
                    <SummaryPanel
                      summary={selected.result.executive_summary}
                      title={selected.title}
                    />
                  )}
                  {tab === 'plagiarism' && (
                    <PlagiarismPanel plagiarism={selected.result.plagiarism} />
                  )}
                  {tab === 'feedback' && (
                    <FeedbackPanel
                      result={selected.result}
                      paperId={selected.id}
                      paperTitle={selected.title}
                      paperText={selected.text ?? ''}
                    />
                  )}
                </div>
              </div>
            )}

            {/* 미평가 상태 */}
            {!selected.result && !loading && (
              <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center py-16 text-center">
                <div className="w-14 h-14 bg-military-light rounded-full flex items-center justify-center mb-3">
                  <BrainCircuit size={26} className="text-military-primary" />
                </div>
                <p className="text-sm font-semibold text-gray-600">AI 평가 대기 중</p>
                <p className="text-xs text-gray-400 mt-1 max-w-xs">
                  위 &apos;AI 평가 시작&apos; 버튼을 클릭하면 주제 적합성, 논리성, 표절 검사 등을 자동으로 분석합니다
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-[50vh] text-center">
      <div className="w-16 h-16 bg-military-light rounded-2xl flex items-center justify-center mb-4">
        <BrainCircuit size={30} className="text-military-primary" />
      </div>
      <h3 className="text-base font-bold text-gray-700">논문을 선택하세요</h3>
      <p className="text-sm text-gray-400 mt-2 max-w-sm">
        왼쪽 목록에서 심사할 논문을 선택하고 AI 평가를 시작하세요
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-500">
        <FeatureChip icon={<BarChart2 size={11} />} text="5개 항목 종합 점수" />
        <FeatureChip icon={<BookOpen size={11} />} text="Executive Summary" />
        <FeatureChip icon={<Shield size={11} />} text="표절 위험도 검사" />
        <FeatureChip icon={<MessageSquareText size={11} />} text="재투고 로드맵" />
      </div>
    </div>
  )
}

function RecBadge({ rec }: { rec: 'accept' | 'revision' | 'reject' }) {
  const config = {
    accept:   { label: '게재 확정', icon: <CheckCircle2 size={13} />, cls: 'bg-green-100 text-green-700 border border-green-200' },
    revision: { label: '수정 재심사', icon: <AlertTriangle size={13} />, cls: 'bg-amber-100 text-amber-700 border border-amber-200' },
    reject:   { label: '미선정', icon: <XCircle size={13} />, cls: 'bg-red-100 text-red-700 border border-red-200' },
  }
  const c = config[rec]
  return (
    <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold', c.cls)}>
      {c.icon}{c.label}
    </div>
  )
}

function FeatureChip({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full">
      <span className="text-military-accent">{icon}</span>
      {text}
    </div>
  )
}
