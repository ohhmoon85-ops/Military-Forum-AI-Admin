'use client'

import { useCallback } from 'react'
import { useDropzone, FileRejection } from 'react-dropzone'
import { Upload, FileText, File as FileIcon, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DropZoneProps {
  onDrop: (files: File[]) => void
  onReject?: (rejections: FileRejection[]) => void
  disabled?: boolean
  currentCount?: number
  maxFiles?: number
}

const ACCEPTED_MIME = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/msword': ['.doc'],
  // HWP는 MIME 표준이 없어 확장자만 안내
}

export default function DropZone({
  onDrop,
  onReject,
  disabled = false,
  currentCount = 0,
  maxFiles = 10,
}: DropZoneProps) {
  const handleDrop = useCallback(
    (accepted: File[], rejected: FileRejection[]) => {
      if (accepted.length > 0) onDrop(accepted)
      if (rejected.length > 0 && onReject) onReject(rejected)
    },
    [onDrop, onReject]
  )

  const { getRootProps, getInputProps, isDragActive, isDragReject, isDragAccept } =
    useDropzone({
      onDrop: handleDrop,
      accept: ACCEPTED_MIME,
      disabled,
      maxSize: 52_428_800, // 50 MB
      multiple: true,
    })

  const remaining = maxFiles - currentCount

  return (
    <div
      {...getRootProps()}
      className={cn(
        'relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer',
        'transition-all duration-200 select-none group',
        // 기본
        !isDragActive && !disabled && 'border-gray-200 hover:border-military-accent hover:bg-military-light/30',
        // 수락 가능
        isDragAccept && 'border-military-accent bg-military-light scale-[1.015] shadow-lg',
        // 거부
        isDragReject && 'border-red-400 bg-red-50',
        // 비활성
        disabled && 'opacity-50 cursor-not-allowed border-gray-100 bg-gray-50'
      )}
    >
      <input {...getInputProps()} />

      {/* 배경 애니메이션 링 */}
      {isDragAccept && (
        <div className="absolute inset-0 rounded-2xl border-2 border-military-accent animate-ping opacity-20 pointer-events-none" />
      )}

      {/* 아이콘 영역 */}
      <div className="flex justify-center mb-4">
        <div
          className={cn(
            'w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-200',
            isDragAccept && 'bg-military-accent scale-110',
            isDragReject && 'bg-red-100',
            !isDragActive && 'bg-military-light group-hover:bg-military-accent group-hover:scale-105'
          )}
        >
          {isDragReject ? (
            <AlertCircle size={30} className="text-red-500" />
          ) : (
            <Upload
              size={30}
              className={cn(
                'transition-colors',
                isDragAccept ? 'text-white' : 'text-military-primary group-hover:text-white'
              )}
            />
          )}
        </div>
      </div>

      {/* 텍스트 */}
      {isDragReject ? (
        <>
          <p className="text-base font-bold text-red-600">지원하지 않는 파일 형식입니다</p>
          <p className="text-sm text-red-400 mt-1">PDF 또는 DOCX 파일만 업로드 가능합니다</p>
        </>
      ) : isDragAccept ? (
        <>
          <p className="text-base font-bold text-military-primary">파일을 놓으세요!</p>
          <p className="text-sm text-military-accent mt-1">업로드를 시작합니다</p>
        </>
      ) : (
        <>
          <p className="text-base font-bold text-gray-700">
            논문 파일을 이곳에 드래그하거나{' '}
            <span className="text-military-accent underline underline-offset-2 cursor-pointer">
              파일을 선택
            </span>
            하세요
          </p>
          <p className="text-sm text-gray-400 mt-1.5">
            PDF, DOCX 지원 · 최대 50MB · HWP는 DOCX/PDF 변환 후 업로드
          </p>
        </>
      )}

      {/* 지원 형식 아이콘 */}
      {!isDragActive && (
        <div className="flex items-center justify-center gap-4 mt-5">
          <FormatBadge icon={<FileText size={14} />} label="PDF" color="text-red-500 bg-red-50" />
          <FormatBadge icon={<FileIcon size={14} />} label="DOCX" color="text-blue-500 bg-blue-50" />
          <FormatBadge icon={<FileIcon size={14} />} label="DOC" color="text-blue-400 bg-blue-50" />
        </div>
      )}

      {/* 남은 슬롯 */}
      {!isDragActive && remaining > 0 && (
        <p className="text-xs text-gray-400 mt-3">
          최대 {maxFiles}개 파일 · 현재 {currentCount}개 추가됨 (남은 슬롯: {remaining}개)
        </p>
      )}
      {!isDragActive && remaining <= 0 && (
        <p className="text-xs text-amber-500 mt-3 font-medium">
          최대 파일 수({maxFiles}개)에 도달했습니다
        </p>
      )}
    </div>
  )
}

function FormatBadge({
  icon,
  label,
  color,
}: {
  icon: React.ReactNode
  label: string
  color: string
}) {
  return (
    <div className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold', color)}>
      {icon}
      {label}
    </div>
  )
}
