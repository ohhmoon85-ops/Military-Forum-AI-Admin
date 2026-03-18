'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { FileText, ChevronRight, Loader2 } from 'lucide-react'
import { cn, getStatusLabel, getStatusColor } from '@/lib/utils'

interface PaperRow {
  id: string
  paper_number: string | null
  title: string
  author: string
  affiliation: string
  category: string
  status: string
  submitted_at: string
  evaluations?: { total_score?: number }[]
}

export default function RecentSubmissions() {
  const [rows, setRows] = useState<PaperRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/papers?limit=10', { cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => {
        if (d.papers) setRows(d.papers)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">최근 투고 현황</h3>
          <p className="text-xs text-gray-400 mt-0.5">최근 접수 기고문 10건</p>
        </div>
        <Link href="/evaluation" className="text-xs text-military-accent font-medium flex items-center gap-1 hover:underline">
          전체 보기 <ChevronRight size={12} />
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 gap-2 text-gray-400">
          <Loader2 size={18} className="animate-spin" />
          <span className="text-sm">불러오는 중...</span>
        </div>
      ) : rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText size={32} className="text-gray-200 mb-3" />
          <p className="text-sm font-semibold text-gray-500">접수된 기고문이 없습니다</p>
          <p className="text-xs text-gray-400 mt-1">기고문 업로드 페이지에서 파일을 등록하면 여기에 표시됩니다.</p>
          <Link href="/upload" className="mt-4 text-xs text-military-accent font-semibold hover:underline">
            기고문 업로드하기 →
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">접수번호</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">기고문 제목</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">저자 / 소속</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">분야</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">AI 점수</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">심사 상태</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">접수일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {rows.map((row) => {
                const score = row.evaluations?.[0]?.total_score ?? null
                const displayTitle =
                  !row.title || row.title.trim().toLowerCase() === 'contents' || row.title.trim() === '-'
                    ? `기고문 (${row.paper_number ?? row.id})`
                    : row.title

                return (
                  <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-gray-500">{row.paper_number ?? '-'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-2">
                        <div className="w-7 h-7 rounded-lg bg-military-light flex items-center justify-center flex-shrink-0 mt-0.5">
                          <FileText size={13} className="text-military-primary" />
                        </div>
                        <p className="text-xs font-medium text-gray-800 line-clamp-2 max-w-[220px] leading-snug">
                          {displayTitle}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-semibold text-gray-800">{row.author || '-'}</p>
                      <p className="text-[11px] text-gray-400">{row.affiliation || '-'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{row.category || '기타'}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {score != null ? <ScoreBar score={score} /> : <span className="text-xs text-gray-300">-</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full', getStatusColor(row.status as never))}>
                        {getStatusLabel(row.status as never)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs text-gray-400">
                        {String(row.submitted_at).split('T')[0]}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function ScoreBar({ score }: { score: number }) {
  const color    = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-amber-600' : 'text-red-500'
  const barColor = score >= 80 ? 'bg-green-500'  : score >= 60 ? 'bg-amber-400'   : 'bg-red-400'
  return (
    <div className="flex flex-col items-center gap-1">
      <span className={cn('text-xs font-bold', color)}>{score}</span>
      <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full', barColor)} style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}
