'use client'

import { useState } from 'react'
import {
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  Trash2,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  BookOpen,
  BarChart2,
  Tag,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { UploadedFile } from './types'

interface FileCardProps {
  file: UploadedFile
  onRemove: (id: string) => void
}

export default function FileCard({ file, onRemove }: FileCardProps) {
  const [expanded, setExpanded] = useState(false)

  const statusConfig = {
    queued: { label: '대기 중', color: 'text-gray-500', bg: 'bg-gray-100', icon: null },
    uploading: {
      label: '업로드 중...',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      icon: <Loader2 size={13} className="animate-spin" />,
    },
    extracting: {
      label: '텍스트 추출 중...',
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      icon: <Loader2 size={13} className="animate-spin" />,
    },
    done: {
      label: '추출 완료',
      color: 'text-green-600',
      bg: 'bg-green-50',
      icon: <CheckCircle2 size={13} />,
    },
    error: {
      label: '오류 발생',
      color: 'text-red-600',
      bg: 'bg-red-50',
      icon: <XCircle size={13} />,
    },
  }

  const s = statusConfig[file.status]
  const isLoading = file.status === 'uploading' || file.status === 'extracting'
  const isDone = file.status === 'done'
  const isError = file.status === 'error'

  return (
    <div
      className={cn(
        'bg-white rounded-xl border transition-all duration-200',
        isDone && 'border-green-200',
        isError && 'border-red-200',
        !isDone && !isError && 'border-gray-200',
        'shadow-card hover:shadow-card-hover'
      )}
    >
      {/* 카드 헤더 */}
      <div className="flex items-center gap-3 p-4">
        {/* 파일 아이콘 */}
        <div
          className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
            file.fileType === 'pdf' ? 'bg-red-50' : 'bg-blue-50'
          )}
        >
          <FileText
            size={20}
            className={file.fileType === 'pdf' ? 'text-red-500' : 'text-blue-500'}
          />
        </div>

        {/* 파일 정보 */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">{file.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-400">{formatBytes(file.size)}</span>
            <span className="text-gray-200">·</span>
            <span
              className={cn(
                'text-[11px] font-semibold uppercase px-1.5 py-0.5 rounded-full',
                file.fileType === 'pdf' ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
              )}
            >
              {file.fileType}
            </span>
          </div>
        </div>

        {/* 상태 배지 */}
        <div
          className={cn(
            'flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold',
            s.bg,
            s.color
          )}
        >
          {s.icon}
          <span>{s.label}</span>
        </div>

        {/* 삭제 버튼 */}
        {!isLoading && (
          <button
            onClick={() => onRemove(file.id)}
            className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
            title="제거"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>

      {/* 진행 바 */}
      {isLoading && (
        <div className="mx-4 mb-3">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all duration-500',
                file.status === 'uploading' ? 'bg-blue-400' : 'bg-purple-500',
                file.progress < 100 ? 'animate-pulse' : ''
              )}
              style={{ width: `${file.progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1 text-right">{file.progress}%</p>
        </div>
      )}

      {/* 오류 메시지 */}
      {isError && file.error && (
        <div className="mx-4 mb-3 flex items-start gap-2 bg-red-50 rounded-lg p-3">
          <AlertTriangle size={14} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-600">{file.error}</p>
        </div>
      )}

      {/* 추출 완료 결과 */}
      {isDone && file.result && (
        <>
          {/* 요약 통계 바 */}
          <div className="mx-4 mb-3 grid grid-cols-3 gap-2">
            <MiniStat
              label="추정 분량"
              value={`${file.result.analysis.estimatedPages}매`}
              good={
                file.result.analysis.compliance.pageRange
              }
              warn={!file.result.analysis.compliance.pageRange}
              hint={
                !file.result.analysis.compliance.pageRange
                  ? `기준: 20~25매`
                  : undefined
              }
            />
            <MiniStat
              label="글자 수"
              value={`${(file.result.analysis.charCount / 1000).toFixed(1)}K`}
              good={file.result.analysis.charCount >= 34000}
            />
            <MiniStat
              label="단어 수"
              value={`${file.result.analysis.wordCount.toLocaleString()}`}
              good={true}
            />
          </div>

          {/* 준수 사항 체크 */}
          <div className="mx-4 mb-3 grid grid-cols-3 gap-1.5">
            <ComplianceChip
              label="분량 기준"
              ok={file.result.analysis.compliance.pageRange}
            />
            <ComplianceChip
              label="초록 포함"
              ok={file.result.analysis.compliance.hasAbstract}
            />
            <ComplianceChip
              label="참고문헌"
              ok={file.result.analysis.compliance.hasReferences}
            />
          </div>

          {/* 감지된 분야 태그 */}
          {file.result.analysis.categories.length > 0 && (
            <div className="mx-4 mb-3 flex items-center gap-1.5 flex-wrap">
              <Tag size={11} className="text-gray-400" />
              {file.result.analysis.categories.map((cat) => (
                <span
                  key={cat}
                  className="text-[11px] bg-military-light text-military-primary font-medium px-2 py-0.5 rounded-full"
                >
                  {cat}
                </span>
              ))}
            </div>
          )}

          {/* 접기/펼치기 */}
          <button
            onClick={() => setExpanded((p) => !p)}
            className="w-full flex items-center justify-center gap-1.5 py-2 border-t border-gray-100 text-xs text-gray-400 hover:text-military-primary hover:bg-gray-50 transition-colors rounded-b-xl"
          >
            {expanded ? (
              <>
                <ChevronUp size={13} /> 텍스트 미리보기 닫기
              </>
            ) : (
              <>
                <ChevronDown size={13} /> 추출된 텍스트 미리보기
              </>
            )}
          </button>

          {/* 텍스트 미리보기 패널 */}
          {expanded && (
            <div className="border-t border-gray-100 rounded-b-xl overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <BookOpen size={12} />
                  <span>추출 텍스트 미리보기 (앞 800자)</span>
                </div>
                <span className="text-xs text-gray-400">
                  총 {file.result.analysis.charCount.toLocaleString()}자
                </span>
              </div>
              <pre className="px-4 py-3 text-xs text-gray-600 leading-relaxed whitespace-pre-wrap overflow-auto max-h-48 font-sans scrollbar-thin">
                {file.result.preview}
                {file.result.analysis.charCount > 800 && (
                  <span className="text-gray-400">
                    {'\n\n'}... (이하 {(file.result.analysis.charCount - 800).toLocaleString()}자 생략)
                  </span>
                )}
              </pre>

              {/* AI 평가로 이동 */}
              <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between bg-military-light/50">
                <div className="flex items-center gap-1.5">
                  <BarChart2 size={13} className="text-military-primary" />
                  <span className="text-xs text-military-primary font-semibold">
                    AI 평가 분석 준비 완료
                  </span>
                </div>
                <Link
                  href="/evaluation"
                  className="flex items-center gap-1 text-xs text-military-accent font-semibold hover:underline"
                >
                  평가 시작 <ArrowRight size={12} />
                </Link>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── 보조 컴포넌트 ─────────────────────────────────────────────────────────

function MiniStat({
  label,
  value,
  good,
  warn,
  hint,
}: {
  label: string
  value: string
  good?: boolean
  warn?: boolean
  hint?: string
}) {
  return (
    <div
      className={cn(
        'rounded-lg px-3 py-2 text-center',
        warn ? 'bg-amber-50' : good ? 'bg-green-50' : 'bg-gray-50'
      )}
      title={hint}
    >
      <p
        className={cn(
          'text-sm font-bold',
          warn ? 'text-amber-700' : good ? 'text-green-700' : 'text-gray-700'
        )}
      >
        {value}
      </p>
      <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
      {hint && <p className="text-[9px] text-amber-500 mt-0.5">{hint}</p>}
    </div>
  )
}

function ComplianceChip({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div
      className={cn(
        'flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium',
        ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'
      )}
    >
      {ok ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
      {label}
    </div>
  )
}

// ─── 유틸 ─────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
