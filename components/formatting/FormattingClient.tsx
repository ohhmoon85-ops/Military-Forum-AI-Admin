'use client'

import { useState, useEffect } from 'react'
import {
  Wand2, FileText, ChevronRight, Loader2, Download, CheckCircle2,
  Settings2, RefreshCw, Printer, User, Building2, BarChart2,
  AlertTriangle, Sparkles, Info,
} from 'lucide-react'
import { cn, getStatusColor, getStatusLabel } from '@/lib/utils'
import DiffViewer from './DiffViewer'
import { DEMO_PAPERS } from '@/lib/demo-papers'
import type { PaperMeta } from '@/lib/types/evaluation'
import type { ChangeLog, FormatStats } from '@/lib/format-rules'
import { DEFAULT_OPTIONS } from '@/lib/format-rules'
import type { FormatOptions } from '@/lib/format-rules'

interface FormatResult {
  original: string
  formatted: string
  logs: ChangeLog[]
  stats: FormatStats
  aiRefined: boolean
}

// 게재 확정 기고문만 서식 수정 대상
const ELIGIBLE_STATUSES = ['pending', 'accepted', 'reviewing', 'revision', 'rejected']

export default function FormattingClient({ initialPapers }: { initialPapers?: PaperMeta[] }) {
  const [papers, setPapers] = useState<PaperMeta[]>(initialPapers ?? DEMO_PAPERS)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/papers?limit=50', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (d.papers && d.papers.length > 0) {
          const mapped: PaperMeta[] = d.papers.map((p: {
            id: string; paper_number?: string; title: string; author: string
            affiliation: string; category: string; status: string
            submitted_at: string; extracted_text?: string
          }) => ({
            id:          p.paper_number ?? p.id,
            _dbId:       p.id,
            title:       p.title,
            author:      p.author,
            affiliation: p.affiliation,
            category:    p.category,
            status:      p.status as PaperMeta['status'],
            submittedAt: String(p.submitted_at).split('T')[0],
            text:        p.extracted_text ?? '',
          }))
          setPapers(mapped)
        }
      })
      .catch(() => {})
  }, [])
  const [options, setOptions] = useState<FormatOptions>(DEFAULT_OPTIONS)
  const [result, setResult] = useState<FormatResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selected = papers.find((p) => p.id === selectedId) ?? null

  const handleFormat = async () => {
    if (!selected) return
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // 텍스트가 없으면 DB에서 lazy-load
      let textToFormat = selected.text
      if ((!textToFormat || textToFormat.trim().length < 10) && selected._dbId) {
        const detailRes = await fetch(`/api/papers/${selected._dbId}`)
        const detailJson = await detailRes.json()
        textToFormat = detailJson.paper?.extracted_text ?? ''
      }

      if (!textToFormat || textToFormat.trim().length < 10) {
        setError('기고문 텍스트가 없습니다. 업로드 페이지에서 먼저 파일을 추출해 주세요.')
        setLoading(false)
        return
      }

      const res = await fetch('/api/format', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToFormat, title: selected.title, options }),
      })
      const json = await res.json()
      if (!res.ok || json.error) throw new Error(json.error ?? '서식 변환 실패')
      setResult(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownloadTxt = () => {
    if (!result) return
    const blob = new Blob([result.formatted], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selected?.title ?? '수정본'}_formatted.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="flex gap-6">
      {/* ── 왼쪽: 기고문 목록 ──────────────────────────────────────────────── */}
      <div className="w-72 flex-shrink-0 space-y-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-700">기고문 목록</h2>
          <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
            서식 수정 대상 선택
          </span>
        </div>

        {papers.map((paper) => {
          const isSelected = paper.id === selectedId
          const eligible = ELIGIBLE_STATUSES.includes(paper.status)

          return (
            <button
              key={paper.id}
              onClick={() => {
                if (eligible) { setSelectedId(paper.id); setResult(null); setError(null) }
              }}
              disabled={!eligible}
              className={cn(
                'w-full text-left rounded-xl border p-3 transition-all',
                isSelected
                  ? 'border-orange-300 bg-orange-50 shadow-card-hover'
                  : eligible
                    ? 'border-gray-100 bg-white hover:border-gray-200 hover:shadow-card'
                    : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
              )}
            >
              <div className="flex items-start gap-2">
                <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', isSelected ? 'bg-orange-100' : 'bg-gray-100')}>
                  <FileText size={13} className={isSelected ? 'text-orange-600' : 'text-gray-400'} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-800 line-clamp-2 leading-snug">{paper.title}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{paper.author}</p>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', getStatusColor(paper.status))}>
                      {getStatusLabel(paper.status)}
                    </span>
                    {!eligible && (
                      <span className="text-[9px] text-gray-400">(서식 수정 불가)</span>
                    )}
                  </div>
                </div>
                {isSelected && <ChevronRight size={12} className="text-orange-400 flex-shrink-0 mt-1" />}
              </div>
            </button>
          )
        })}

        <p className="text-[10px] text-gray-400 text-center pt-1">
          미선정 기고문은 서식 수정 대상에서 제외됩니다
        </p>
      </div>

      {/* ── 오른쪽: 서식 수정 패널 ────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 space-y-4">
        {!selected ? (
          <EmptyState />
        ) : (
          <>
            {/* 기고문 메타 + 서식 옵션 */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-card p-4">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-base font-bold text-gray-900 leading-snug mb-1.5">{selected.title}</h2>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                    <span className="flex items-center gap-1"><User size={11} />{selected.author}</span>
                    <span className="flex items-center gap-1"><Building2 size={11} />{selected.affiliation}</span>
                    <span className="bg-gray-100 px-2 py-0.5 rounded-full">{selected.category}</span>
                  </div>
                </div>
                <div className="flex-shrink-0 flex items-center gap-2">
                  {result && (
                    <>
                      <button
                        onClick={handleDownloadTxt}
                        className="flex items-center gap-1.5 text-xs text-gray-600 font-semibold px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <Download size={13} />
                        TXT 저장
                      </button>
                      <button
                        onClick={handlePrint}
                        className="flex items-center gap-1.5 text-xs text-white font-semibold px-3 py-1.5 bg-military-primary hover:bg-military-secondary rounded-lg transition-colors shadow-sm"
                      >
                        <Printer size={13} />
                        PDF 인쇄
                      </button>
                    </>
                  )}
                  <button
                    onClick={handleFormat}
                    disabled={loading}
                    className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors shadow-sm disabled:opacity-60"
                  >
                    {loading
                      ? <><Loader2 size={14} className="animate-spin" />변환 중...</>
                      : result
                        ? <><RefreshCw size={14} />재변환</>
                        : <><Wand2 size={14} />서식 자동 적용</>
                    }
                  </button>
                </div>
              </div>

              {/* 서식 옵션 */}
              <div className="border-t border-gray-100 pt-3">
                <div className="flex items-center gap-2 mb-2">
                  <Settings2 size={13} className="text-gray-400" />
                  <span className="text-xs font-semibold text-gray-600">적용할 서식 규칙 선택</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <OptionToggle
                    id="ws" label="공백 정규화"
                    checked={options.normalizeWhitespace}
                    onChange={(v) => setOptions((p) => ({ ...p, normalizeWhitespace: v }))}
                    desc="연속 공백·빈 줄 정리"
                  />
                  <OptionToggle
                    id="punc" label="문장부호 교정"
                    checked={options.fixPunctuation}
                    onChange={(v) => setOptions((p) => ({ ...p, fixPunctuation: v }))}
                    desc="마침표·괄호·쉼표 공백"
                  />
                  <OptionToggle
                    id="terms" label="군사 용어 표준화"
                    checked={options.standardizeTerms}
                    onChange={(v) => setOptions((p) => ({ ...p, standardizeTerms: v }))}
                    desc="UAV·WMD·OPCON 등"
                  />
                  <OptionToggle
                    id="head" label="장절 번호 정규화"
                    checked={options.normalizeHeadings}
                    onChange={(v) => setOptions((p) => ({ ...p, normalizeHeadings: v }))}
                    desc="로마자 대소문자 통일"
                  />
                  <OptionToggle
                    id="ai" label="AI 문체 정제"
                    checked={options.refineTone}
                    onChange={(v) => setOptions((p) => ({ ...p, refineTone: v }))}
                    desc="Claude Haiku (API 키 필요)"
                    highlight
                  />
                </div>
              </div>

              {error && (
                <div className="mt-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertTriangle size={13} className="text-red-500 flex-shrink-0" />
                  <p className="text-xs text-red-600">{error}</p>
                </div>
              )}
            </div>

            {/* 로딩 */}
            {loading && (
              <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center py-16 gap-3">
                <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center">
                  <Loader2 size={28} className="animate-spin text-orange-500" />
                </div>
                <p className="text-sm font-semibold text-gray-700">서식 규칙 적용 중...</p>
                <div className="flex flex-wrap justify-center gap-1.5 max-w-sm">
                  {['공백 정규화', '문장부호 교정', '군사 용어 표준화', '장절 번호 정리'].map((s, i) => (
                    <span key={i} className="text-[11px] bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.25}s` }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 변환 결과 */}
            {result && !loading && (
              <>
                {/* 변환 요약 바 */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center">
                        <CheckCircle2 size={15} className="text-green-600" />
                      </div>
                      <span className="text-sm font-bold text-gray-800">서식 변환 완료</span>
                      {result.aiRefined && (
                        <span className="flex items-center gap-1 text-[11px] bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full">
                          <Sparkles size={10} />AI 문체 정제 적용됨
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <StatItem label="적용 규칙" value={result.stats.totalRules} color="text-blue-600" />
                      <StatItem label="총 변경" value={result.stats.totalChanges} color="text-orange-600" />
                      <StatItem
                        label="글자 수 변화"
                        value={`${result.stats.charDiff > 0 ? '+' : ''}${result.stats.charDiff}`}
                        color={result.stats.charDiff >= 0 ? 'text-green-600' : 'text-red-600'}
                      />
                    </div>
                  </div>

                  {/* 변경 로그 */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {result.logs.map((log, i) => (
                      <div key={i} className="bg-gray-50 rounded-lg px-3 py-2">
                        <p className="text-xs font-semibold text-gray-700 leading-tight">{log.rule}</p>
                        <p className="text-sm font-black text-military-primary mt-0.5">{log.count}건</p>
                        {log.examples.slice(0, 1).map((ex, j) => (
                          <p key={j} className="text-[10px] text-gray-400 mt-0.5 truncate">{ex}</p>
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* 인쇄 안내 */}
                  <div className="mt-3 flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                    <Info size={12} className="text-blue-500 flex-shrink-0" />
                    <p className="text-[11px] text-blue-700">
                      <strong>PDF 저장:</strong> 상단 &apos;PDF 인쇄&apos; 버튼 → 브라우저 인쇄 대화상자에서 &apos;PDF로 저장&apos; 선택
                    </p>
                  </div>
                </div>

                {/* Diff 뷰어 */}
                <DiffViewer
                  original={result.original}
                  formatted={result.formatted}
                  title={selected.title}
                />

                {/* 수정본 전체 텍스트 */}
                <FormattedTextPanel formatted={result.formatted} title={selected.title} onDownload={handleDownloadTxt} />
              </>
            )}

            {/* 미변환 상태 */}
            {!result && !loading && (
              <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center py-14 text-center">
                <div className="w-13 h-13 bg-orange-50 rounded-2xl flex items-center justify-center mb-3 p-3">
                  <Wand2 size={24} className="text-orange-500" />
                </div>
                <p className="text-sm font-semibold text-gray-600">서식 자동 적용 대기 중</p>
                <p className="text-xs text-gray-400 mt-1 max-w-xs">
                  위 옵션을 선택하고 &apos;서식 자동 적용&apos; 버튼을 클릭하면 학술지 규격으로 즉시 변환됩니다
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ─── 수정본 전체 패널 (인쇄 포함) ─────────────────────────────────────────────

function FormattedTextPanel({ formatted, title, onDownload }: { formatted: string; title: string; onDownload: () => void }) {
  const [collapsed, setCollapsed] = useState(true)

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden" id="formatted-paper">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
        <h3 className="text-sm font-bold text-gray-800">수정본 전체 텍스트</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={onDownload}
            className="flex items-center gap-1 text-xs text-military-accent hover:text-military-primary font-medium border border-military-accent/30 rounded px-2 py-1 hover:bg-military-light transition-colors"
          >
            <Download size={12} />
            TXT 다운로드
          </button>
          <button
            onClick={() => setCollapsed((p) => !p)}
            className="text-xs text-gray-500 hover:underline font-medium"
          >
            {collapsed ? '전체 보기' : '접기'}
          </button>
        </div>
      </div>

      {/* 학술지 규격 안내 헤더 */}
      <div className="px-4 py-2 bg-military-light/60 border-b border-blue-100 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-military-primary font-medium">
        <span>📐 글자 크기: 11pt</span>
        <span>📏 줄간격: 160%</span>
        <span>📄 분량 기준: A4 20~25매</span>
        <span>🔤 서체: 맑은 고딕 (인쇄 시 적용)</span>
      </div>

      <div className={cn('transition-all duration-300 overflow-hidden', collapsed ? 'max-h-48' : 'max-h-none')}>
        {/* 인쇄 시 이 영역이 PDF로 출력됨 */}
        <div
          id="print-content"
          className="p-6 font-sans text-sm leading-relaxed text-gray-800 whitespace-pre-wrap print:p-12 print:text-base print:leading-[1.6] print:text-black"
        >
          <div className="print:block hidden">
            <h1 className="text-xl font-bold text-center mb-6 pb-4 border-b-2 border-black">{title}</h1>
            <p className="text-xs text-center text-gray-500 mb-8">
              계간 군사논단 · 사단법인 한국군사학회 · 자동 서식 적용본
            </p>
          </div>
          {formatted}
        </div>
      </div>

      {collapsed && (
        <div className="h-8 bg-gradient-to-t from-white to-transparent -mt-8 relative pointer-events-none" />
      )}
    </div>
  )
}

// ─── 보조 컴포넌트 ─────────────────────────────────────────────────────────

function OptionToggle({
  id, label, checked, onChange, desc, highlight = false,
}: {
  id: string; label: string; checked: boolean
  onChange: (v: boolean) => void; desc: string; highlight?: boolean
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer border transition-all text-xs',
        checked
          ? highlight
            ? 'bg-purple-50 border-purple-200 text-purple-700'
            : 'bg-orange-50 border-orange-200 text-orange-700'
          : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
      )}
    >
      <input
        id={id} type="checkbox" className="hidden"
        checked={checked} onChange={(e) => onChange(e.target.checked)}
      />
      <span className={cn('w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors',
        checked
          ? highlight ? 'bg-purple-600 border-purple-600' : 'bg-orange-500 border-orange-500'
          : 'border-gray-300'
      )}>
        {checked && <CheckCircle2 size={10} className="text-white" />}
      </span>
      <div>
        <p className="font-semibold leading-tight">{label}</p>
        <p className={cn('text-[10px] leading-tight', checked ? 'opacity-80' : 'text-gray-400')}>{desc}</p>
      </div>
    </label>
  )
}

function StatItem({ label, value, color }: { label: string; value: string | number; color: string }) {
  return (
    <div className="text-center">
      <p className={cn('font-black text-base leading-tight', color)}>{value}</p>
      <p className="text-gray-400 text-[10px]">{label}</p>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-[50vh] text-center">
      <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center mb-4">
        <Wand2 size={30} className="text-orange-500" />
      </div>
      <h3 className="text-base font-bold text-gray-700">기고문을 선택하세요</h3>
      <p className="text-sm text-gray-400 mt-2 max-w-sm">
        왼쪽에서 서식 수정할 기고문을 선택하세요. 심사 중·수정 요청 기고문이 대상입니다.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-gray-500">
        <FeatureChip icon={<Wand2 size={11} />} text="공백·문장부호 자동 교정" />
        <FeatureChip icon={<BarChart2 size={11} />} text="군사 용어 표준화" />
        <FeatureChip icon={<Sparkles size={11} />} text="AI 문체 정제 (선택)" />
        <FeatureChip icon={<Printer size={11} />} text="PDF 인쇄 저장" />
      </div>
    </div>
  )
}

function FeatureChip({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full">
      <span className="text-orange-500">{icon}</span>
      {text}
    </div>
  )
}
