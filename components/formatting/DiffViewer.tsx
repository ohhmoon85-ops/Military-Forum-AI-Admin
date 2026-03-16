'use client'

import { useRef, useCallback, useState } from 'react'
import { diffWords } from 'diff'
import { Columns2, AlignLeft, Maximize2, Minimize2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DiffViewerProps {
  original: string
  formatted: string
  title: string
}

type ViewMode = 'split' | 'unified'

// ─── 단락 단위로 분리하여 diffWords 적용 ────────────────────────────────────

interface ParagraphDiff {
  origContent: React.ReactNode[]
  fmtContent: React.ReactNode[]
  hasChange: boolean
}

function buildParagraphDiffs(original: string, formatted: string): ParagraphDiff[] {
  const origParas = original.split(/\n{2,}/).filter((p) => p.trim())
  const fmtParas = formatted.split(/\n{2,}/).filter((p) => p.trim())
  const maxLen = Math.max(origParas.length, fmtParas.length)
  const results: ParagraphDiff[] = []

  for (let i = 0; i < maxLen; i++) {
    const op = origParas[i] ?? ''
    const fp = fmtParas[i] ?? ''

    if (op === fp) {
      results.push({
        origContent: [<span key="eq">{op}</span>],
        fmtContent: [<span key="eq">{fp}</span>],
        hasChange: false,
      })
      continue
    }

    const diffs = diffWords(op, fp)
    const origContent: React.ReactNode[] = []
    const fmtContent: React.ReactNode[] = []

    diffs.forEach((part, idx) => {
      if (!part.added && !part.removed) {
        origContent.push(<span key={`o${idx}`}>{part.value}</span>)
        fmtContent.push(<span key={`f${idx}`}>{part.value}</span>)
      } else if (part.removed) {
        origContent.push(
          <mark key={`o${idx}`} className="bg-red-200 text-red-900 rounded px-0.5 line-through decoration-red-400">
            {part.value}
          </mark>
        )
      } else if (part.added) {
        fmtContent.push(
          <mark key={`f${idx}`} className="bg-green-200 text-green-900 rounded px-0.5">
            {part.value}
          </mark>
        )
      }
    })

    results.push({ origContent, fmtContent, hasChange: true })
  }

  return results
}

// ─── 통합(unified) 뷰 ────────────────────────────────────────────────────────

function UnifiedView({ original, formatted }: { original: string; formatted: string }) {
  const diffs = diffWords(original, formatted)

  return (
    <div className="font-sans text-sm leading-relaxed text-gray-800 whitespace-pre-wrap break-words p-5">
      {diffs.map((part, i) => {
        if (part.removed) {
          return (
            <mark key={i} className="bg-red-100 text-red-800 line-through decoration-red-400 rounded px-0.5">
              {part.value}
            </mark>
          )
        }
        if (part.added) {
          return (
            <mark key={i} className="bg-green-100 text-green-800 rounded px-0.5">
              {part.value}
            </mark>
          )
        }
        return <span key={i}>{part.value}</span>
      })}
    </div>
  )
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────────────────────

export default function DiffViewer({ original, formatted, title }: DiffViewerProps) {
  const [mode, setMode] = useState<ViewMode>('split')
  const [expanded, setExpanded] = useState(false)
  const [showAll, setShowAll] = useState(false)

  const leftRef = useRef<HTMLDivElement>(null)
  const rightRef = useRef<HTMLDivElement>(null)
  const syncingRef = useRef(false)

  // 동기 스크롤
  const syncScrollLeft = useCallback(() => {
    if (syncingRef.current || !leftRef.current || !rightRef.current) return
    syncingRef.current = true
    const ratio = leftRef.current.scrollTop / (leftRef.current.scrollHeight - leftRef.current.clientHeight || 1)
    rightRef.current.scrollTop = ratio * (rightRef.current.scrollHeight - rightRef.current.clientHeight)
    requestAnimationFrame(() => { syncingRef.current = false })
  }, [])

  const syncScrollRight = useCallback(() => {
    if (syncingRef.current || !leftRef.current || !rightRef.current) return
    syncingRef.current = true
    const ratio = rightRef.current.scrollTop / (rightRef.current.scrollHeight - rightRef.current.clientHeight || 1)
    leftRef.current.scrollTop = ratio * (leftRef.current.scrollHeight - leftRef.current.clientHeight)
    requestAnimationFrame(() => { syncingRef.current = false })
  }, [])

  // diff 계산
  const allDiffs = diffWords(original, formatted)
  const deletedWords = allDiffs.filter((d) => d.removed).reduce((s, d) => s + d.value.split(/\s+/).filter(Boolean).length, 0)
  const addedWords = allDiffs.filter((d) => d.added).reduce((s, d) => s + d.value.split(/\s+/).filter(Boolean).length, 0)
  const changeCount = allDiffs.filter((d) => d.added || d.removed).length

  const parasDiffs = buildParagraphDiffs(original, formatted)
  const changedParas = parasDiffs.filter((p) => p.hasChange).length
  const PREVIEW_PARAS = 15
  const displayDiffs = showAll ? parasDiffs : parasDiffs.slice(0, PREVIEW_PARAS)
  const hasMore = parasDiffs.length > PREVIEW_PARAS

  const containerH = expanded ? 'max-h-[80vh]' : 'max-h-[460px]'

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden" id="diff-viewer">
      {/* 툴바 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-bold text-gray-800">변경 사항 비교</h3>
          <div className="flex items-center gap-2 text-xs">
            <StatPill label="변경 블록" value={changeCount} color="bg-gray-100 text-gray-700" />
            <StatPill label="단락 변경" value={changedParas} color="bg-blue-100 text-blue-700" />
            <StatPill label="삭제 단어" value={deletedWords} color="bg-red-100 text-red-700" />
            <StatPill label="추가 단어" value={addedWords} color="bg-green-100 text-green-700" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* 뷰 모드 전환 */}
          <div className="flex items-center bg-white border border-gray-200 rounded-lg overflow-hidden">
            <ModeBtn
              active={mode === 'split'}
              onClick={() => setMode('split')}
              icon={<Columns2 size={13} />}
              label="좌우 비교"
            />
            <ModeBtn
              active={mode === 'unified'}
              onClick={() => setMode('unified')}
              icon={<AlignLeft size={13} />}
              label="통합 보기"
            />
          </div>
          {/* 확장 */}
          <button
            onClick={() => setExpanded((p) => !p)}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors"
            title={expanded ? '축소' : '전체 화면'}
          >
            {expanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </div>
      </div>

      {/* 범례 */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-gray-100 bg-white text-xs text-gray-500">
        <LegendItem color="bg-red-200 line-through" label="삭제된 텍스트" />
        <LegendItem color="bg-green-200" label="추가된 텍스트" />
        <span className="ml-auto text-gray-400">동기 스크롤 적용됨</span>
      </div>

      {/* 뷰 본문 */}
      {mode === 'unified' ? (
        <div className={cn('overflow-y-auto scrollbar-thin', containerH)}>
          <UnifiedView original={original} formatted={formatted} />
        </div>
      ) : (
        <div className={cn('grid grid-cols-2 divide-x divide-gray-100', containerH)}>
          {/* 왼쪽: 원본 */}
          <div className="flex flex-col">
            <PanelHeader label="원본" badge="삭제" badgeColor="bg-red-100 text-red-700" />
            <div
              ref={leftRef}
              onScroll={syncScrollLeft}
              className="flex-1 overflow-y-auto scrollbar-thin"
            >
              <div className="p-4 font-sans text-sm leading-7 text-gray-800 space-y-4">
                {displayDiffs.map((para, i) => (
                  <p
                    key={i}
                    className={cn(
                      'pb-3 border-b border-dashed border-gray-100 last:border-0',
                      para.hasChange && 'bg-red-50/40 -mx-1 px-1 rounded'
                    )}
                  >
                    {para.origContent.length > 0 ? para.origContent : (
                      <span className="text-gray-300 italic text-xs">(없음)</span>
                    )}
                  </p>
                ))}
                {hasMore && !showAll && (
                  <button
                    onClick={() => setShowAll(true)}
                    className="w-full text-xs text-military-accent hover:underline py-2"
                  >
                    + {parasDiffs.length - PREVIEW_PARAS}개 단락 더 보기
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 오른쪽: 수정본 */}
          <div className="flex flex-col">
            <PanelHeader label="수정본" badge="추가" badgeColor="bg-green-100 text-green-700" />
            <div
              ref={rightRef}
              onScroll={syncScrollRight}
              className="flex-1 overflow-y-auto scrollbar-thin"
            >
              <div className="p-4 font-sans text-sm leading-7 text-gray-800 space-y-4">
                {displayDiffs.map((para, i) => (
                  <p
                    key={i}
                    className={cn(
                      'pb-3 border-b border-dashed border-gray-100 last:border-0',
                      para.hasChange && 'bg-green-50/40 -mx-1 px-1 rounded'
                    )}
                  >
                    {para.fmtContent.length > 0 ? para.fmtContent : (
                      <span className="text-gray-300 italic text-xs">(없음)</span>
                    )}
                  </p>
                ))}
                {hasMore && !showAll && (
                  <button
                    onClick={() => setShowAll(true)}
                    className="w-full text-xs text-military-accent hover:underline py-2"
                  >
                    + {parasDiffs.length - PREVIEW_PARAS}개 단락 더 보기
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print-only 전체 수정본 (PDF용) */}
      <div id="print-formatted" className="hidden print:block">
        <div className="p-12 font-sans text-sm leading-[1.6] text-black">
          <h1 className="text-xl font-bold text-center mb-8 border-b-2 border-black pb-4">{title}</h1>
          <div className="whitespace-pre-wrap">{formatted}</div>
        </div>
      </div>
    </div>
  )
}

// ─── 보조 컴포넌트 ────────────────────────────────────────────────────────────

function PanelHeader({
  label, badge, badgeColor,
}: { label: string; badge: string; badgeColor: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-100">
      <span className="text-xs font-bold text-gray-700">{label}</span>
      <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full', badgeColor)}>
        {badge}
      </span>
    </div>
  )
}

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <span className={cn('px-2 py-0.5 rounded-full font-medium', color)}>
      {label} <strong>{value}</strong>
    </span>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn('inline-block px-1.5 py-0.5 rounded text-gray-700 text-[10px] font-medium', color)}>
        예시
      </span>
      {label}
    </span>
  )
}

function ModeBtn({
  active, onClick, icon, label,
}: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium transition-colors',
        active
          ? 'bg-military-primary text-white'
          : 'text-gray-500 hover:bg-gray-50'
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  )
}
