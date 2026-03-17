'use client'

import { useState, useCallback } from 'react'
import { FileRejection } from 'react-dropzone'
import {
  Upload,
  PlayCircle,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  BrainCircuit,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { v4 as uuidv4 } from 'uuid'
import DropZone from './DropZone'
import FileCard from './FileCard'
import type { UploadedFile } from './types'

const MAX_FILES = 10

function detectFileType(file: File): UploadedFile['fileType'] {
  const name = file.name.toLowerCase()
  if (name.endsWith('.pdf')) return 'pdf'
  if (name.endsWith('.docx')) return 'docx'
  if (name.endsWith('.doc')) return 'doc'
  if (name.endsWith('.hwp') || name.endsWith('.hwpx')) return 'hwp'
  return 'other'
}

export default function UploadClient() {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [rejectMessage, setRejectMessage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // 파일 추가
  const handleDrop = useCallback(
    (dropped: File[]) => {
      setRejectMessage(null)
      const remaining = MAX_FILES - files.length
      const toAdd = dropped.slice(0, remaining)

      const newFiles: UploadedFile[] = toAdd.map((f) => ({
        id: uuidv4(),
        name: f.name,
        size: f.size,
        fileType: detectFileType(f),
        status: 'queued',
        progress: 0,
        _raw: f, // 실제 File 객체 임시 저장
      })) as (UploadedFile & { _raw: File })[]

      setFiles((prev) => [...prev, ...newFiles])

      if (dropped.length > remaining) {
        setRejectMessage(
          `파일 수 초과: ${dropped.length - remaining}개 파일이 무시되었습니다. (최대 ${MAX_FILES}개)`
        )
      }
    },
    [files.length]
  )

  const handleReject = useCallback((rejections: FileRejection[]) => {
    const msgs = rejections.map((r) => {
      const errCode = r.errors[0]?.code
      if (errCode === 'file-too-large') return `"${r.file.name}": 파일 크기 초과 (최대 50MB)`
      if (errCode === 'file-invalid-type') return `"${r.file.name}": 지원하지 않는 형식`
      return `"${r.file.name}": ${r.errors[0]?.message}`
    })
    setRejectMessage(msgs.join(' · '))
  }, [])

  // 개별 파일 제거
  const handleRemove = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }, [])

  // 전체 초기화
  const handleClearAll = () => {
    setFiles([])
    setRejectMessage(null)
  }

  // 텍스트 추출 실행
  const handleExtractAll = async () => {
    const queued = files.filter((f) => f.status === 'queued')
    if (queued.length === 0) return
    setIsProcessing(true)

    for (const item of queued) {
      const rawFile = (item as UploadedFile & { _raw: File })._raw
      if (!rawFile) continue

      // uploading 상태
      setFiles((prev) =>
        prev.map((f) =>
          f.id === item.id ? { ...f, status: 'uploading', progress: 20 } : f
        )
      )

      await sleep(300)

      // extracting 상태
      setFiles((prev) =>
        prev.map((f) =>
          f.id === item.id ? { ...f, status: 'extracting', progress: 55 } : f
        )
      )

      try {
        const formData = new FormData()
        formData.append('file', rawFile)

        const res = await fetch('/api/extract', {
          method: 'POST',
          body: formData,
        })

        const json = await res.json()

        if (!res.ok || json.error) {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === item.id
                ? { ...f, status: 'error', progress: 0, error: json.error ?? '추출 실패' }
                : f
            )
          )
        } else {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === item.id
                ? {
                    ...f,
                    status: 'done',
                    progress: 100,
                    paperId: json.paperId ?? undefined,
                    paperNumber: json.paperNumber ?? undefined,
                    result: {
                      text: json.text,
                      preview: json.preview,
                      pageCount: json.pageCount,
                      analysis: json.analysis,
                    },
                  }
                : f
            )
          )
        }
      } catch {
        setFiles((prev) =>
          prev.map((f) =>
            f.id === item.id
              ? { ...f, status: 'error', progress: 0, error: '네트워크 오류가 발생했습니다.' }
              : f
          )
        )
      }
    }

    setIsProcessing(false)
  }

  // 실패 항목 재시도
  const handleRetryErrors = () => {
    setFiles((prev) =>
      prev.map((f) => (f.status === 'error' ? { ...f, status: 'queued', progress: 0, error: undefined } : f))
    )
  }

  // 집계
  const queuedCount = files.filter((f) => f.status === 'queued').length
  const doneCount = files.filter((f) => f.status === 'done').length
  const errorCount = files.filter((f) => f.status === 'error').length
  const allDone = files.length > 0 && files.every((f) => f.status === 'done' || f.status === 'error')

  return (
    <div className="space-y-6">
      {/* 단계 표시 스테퍼 */}
      <UploadStepper step={doneCount > 0 ? (allDone ? 3 : 2) : 1} />

      {/* 드롭존 */}
      <DropZone
        onDrop={handleDrop}
        onReject={handleReject}
        disabled={isProcessing || files.length >= MAX_FILES}
        currentCount={files.length}
        maxFiles={MAX_FILES}
      />

      {/* 거부/경고 메시지 */}
      {rejectMessage && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
          <AlertTriangle size={15} className="text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-700">{rejectMessage}</p>
          <button
            onClick={() => setRejectMessage(null)}
            className="ml-auto text-amber-400 hover:text-amber-600 text-xs"
          >
            닫기
          </button>
        </div>
      )}

      {/* 파일 목록 + 액션 버튼 */}
      {files.length > 0 && (
        <div className="space-y-4">
          {/* 액션 툴바 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-gray-700">
                업로드된 파일 ({files.length}개)
              </span>
              {doneCount > 0 && (
                <span className="text-xs bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded-full">
                  완료 {doneCount}
                </span>
              )}
              {errorCount > 0 && (
                <span className="text-xs bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded-full">
                  오류 {errorCount}
                </span>
              )}
              {queuedCount > 0 && (
                <span className="text-xs bg-gray-100 text-gray-600 font-bold px-2 py-0.5 rounded-full">
                  대기 {queuedCount}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {errorCount > 0 && !isProcessing && (
                <button
                  onClick={handleRetryErrors}
                  className="flex items-center gap-1.5 text-xs text-amber-600 font-semibold px-3 py-1.5 border border-amber-200 rounded-lg hover:bg-amber-50 transition-colors"
                >
                  <RotateCcw size={13} />
                  오류 재시도
                </button>
              )}
              {!isProcessing && (
                <button
                  onClick={handleClearAll}
                  className="flex items-center gap-1.5 text-xs text-gray-500 font-semibold px-3 py-1.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Trash2 size={13} />
                  전체 삭제
                </button>
              )}
              {queuedCount > 0 && (
                <button
                  onClick={handleExtractAll}
                  disabled={isProcessing}
                  className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 bg-military-primary text-white rounded-lg hover:bg-military-secondary disabled:opacity-60 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  <PlayCircle size={15} />
                  텍스트 추출 시작 ({queuedCount}개)
                </button>
              )}
            </div>
          </div>

          {/* 파일 카드 목록 */}
          <div className="space-y-3">
            {files.map((f) => (
              <FileCard key={f.id} file={f} onRemove={handleRemove} />
            ))}
          </div>

          {/* 전체 완료 배너 */}
          {allDone && doneCount > 0 && (
            <div className="bg-gradient-to-r from-military-primary to-military-secondary rounded-xl p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 size={22} className="text-white" />
                </div>
                <div>
                  <p className="font-bold">텍스트 추출 완료!</p>
                  <p className="text-blue-200 text-sm">
                    {doneCount}개 파일 준비 완료
                    {errorCount > 0 && ` · ${errorCount}개 오류`}
                    · AI 평가 분석을 시작하세요
                  </p>
                </div>
              </div>
              <Link
                href="/evaluation"
                className="flex-shrink-0 flex items-center gap-2 bg-white text-military-primary font-bold text-sm px-5 py-2.5 rounded-lg hover:bg-blue-50 transition-colors shadow-sm"
              >
                <BrainCircuit size={16} />
                AI 평가 시작
                <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* 빈 상태 */}
      {files.length === 0 && (
        <div className="text-center py-8">
          <Upload size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">파일을 드래그하거나 위 영역을 클릭하여 기고문을 추가하세요</p>
        </div>
      )}
    </div>
  )
}

// ─── 업로드 단계 스테퍼 ─────────────────────────────────────────────────────

function UploadStepper({ step }: { step: 1 | 2 | 3 }) {
  const steps = [
    { id: 1, label: '파일 선택', sub: 'PDF / DOCX 업로드' },
    { id: 2, label: '텍스트 추출', sub: 'AI 분석 전처리' },
    { id: 3, label: '분석 준비', sub: 'AI 평가' },
  ]

  return (
    <div className="flex items-center justify-center gap-0">
      {steps.map((s, i) => (
        <div key={s.id} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                s.id < step
                  ? 'bg-green-500 text-white'
                  : s.id === step
                  ? 'bg-military-primary text-white ring-4 ring-blue-100'
                  : 'bg-gray-100 text-gray-400'
              }`}
            >
              {s.id < step ? <CheckCircle2 size={16} /> : s.id}
            </div>
            <p
              className={`text-xs font-semibold mt-1 ${
                s.id === step ? 'text-military-primary' : s.id < step ? 'text-green-600' : 'text-gray-400'
              }`}
            >
              {s.label}
            </p>
            <p className="text-[10px] text-gray-400">{s.sub}</p>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`w-20 h-0.5 mx-2 mb-5 transition-colors ${
                s.id < step ? 'bg-green-400' : 'bg-gray-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
