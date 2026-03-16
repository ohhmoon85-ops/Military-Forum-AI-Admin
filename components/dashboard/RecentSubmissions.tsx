import Link from 'next/link'
import { FileText, ChevronRight } from 'lucide-react'
import { cn, getStatusLabel, getStatusColor } from '@/lib/utils'
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase'

interface SubmissionRow {
  id: string
  paper_number: string
  title: string
  author: string
  affiliation: string
  submitted_at: string
  status: 'pending' | 'reviewing' | 'accepted' | 'rejected' | 'revision'
  category: string
  evaluations: { total_score: number | null }[]
}

export default async function RecentSubmissions() {
  let submissions: SubmissionRow[] = []

  if (isSupabaseConfigured()) {
    try {
      const supabase = getSupabaseServerClient()
      const { data } = await supabase
        .from('papers')
        .select(`
          id, paper_number, title, author, affiliation,
          category, status, submitted_at,
          evaluations ( total_score )
        `)
        .order('submitted_at', { ascending: false })
        .limit(10)

      submissions = (data ?? []) as SubmissionRow[]
    } catch {
      // DB 오류 시 빈 목록 유지
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden">
      {/* 헤더 */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">최근 투고 현황</h3>
          <p className="text-xs text-gray-400 mt-0.5">최근 접수 논문 10건</p>
        </div>
        <Link
          href="/upload"
          className="text-xs text-military-accent font-medium flex items-center gap-1 hover:underline"
        >
          전체 보기 <ChevronRight size={12} />
        </Link>
      </div>

      {/* 빈 상태 */}
      {submissions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FileText size={32} className="text-gray-200 mb-3" />
          <p className="text-sm font-semibold text-gray-500">접수된 논문이 없습니다</p>
          <p className="text-xs text-gray-400 mt-1">논문 업로드 페이지에서 파일을 등록하면 여기에 표시됩니다.</p>
          <Link
            href="/upload"
            className="mt-4 text-xs text-military-accent font-semibold hover:underline"
          >
            논문 업로드하기 →
          </Link>
        </div>
      )}

      {/* 테이블 */}
      {submissions.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">접수번호</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">논문 제목</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">저자 / 소속</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">분야</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">AI 점수</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">심사 상태</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">접수일</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {submissions.map((sub) => {
                const score = sub.evaluations?.[0]?.total_score ?? null
                const dateStr = sub.submitted_at?.split('T')[0] ?? ''
                return (
                  <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-gray-500">{sub.paper_number}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-start gap-2">
                        <div className="w-7 h-7 rounded-lg bg-military-light flex items-center justify-center flex-shrink-0 mt-0.5">
                          <FileText size={13} className="text-military-primary" />
                        </div>
                        <p className="text-xs font-medium text-gray-800 line-clamp-2 max-w-[220px] leading-snug">
                          {sub.title}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs font-semibold text-gray-800">{sub.author}</p>
                      <p className="text-[11px] text-gray-400">{sub.affiliation}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {sub.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {score != null ? <ScoreBar score={score} /> : <span className="text-xs text-gray-300">-</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full', getStatusColor(sub.status))}>
                        {getStatusLabel(sub.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs text-gray-400">{dateStr}</span>
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
  const color = score >= 80 ? 'text-green-600' : score >= 60 ? 'text-amber-600' : 'text-red-500'
  const barColor = score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-amber-400' : 'bg-red-400'
  return (
    <div className="flex flex-col items-center gap-1">
      <span className={cn('text-xs font-bold', color)}>{score}</span>
      <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full', barColor)} style={{ width: `${score}%` }} />
      </div>
    </div>
  )
}
