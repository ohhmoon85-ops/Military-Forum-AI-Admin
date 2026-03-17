import Link from 'next/link'
import { FileText, ChevronRight } from 'lucide-react'
import { desc, eq } from 'drizzle-orm'
import { cn, getStatusLabel, getStatusColor } from '@/lib/utils'
import { getDb, isDatabaseConfigured } from '@/lib/db'
import { papers, evaluations } from '@/lib/schema'

export default async function RecentSubmissions() {
  type Row = {
    id: string
    paper_number: string | null
    title: string
    author: string
    affiliation: string
    category: string
    status: string
    submitted_at: Date
    score: number | null
  }

  let rows: Row[] = []

  if (isDatabaseConfigured()) {
    try {
      const db = getDb()
      const paperRows = await db
        .select({
          id:           papers.id,
          paper_number: papers.paper_number,
          title:        papers.title,
          author:       papers.author,
          affiliation:  papers.affiliation,
          category:     papers.category,
          status:       papers.status,
          submitted_at: papers.submitted_at,
        })
        .from(papers)
        .orderBy(desc(papers.submitted_at))
        .limit(10)

      rows = await Promise.all(
        paperRows.map(async (p) => {
          const [latestEval] = await db
            .select({ total_score: evaluations.total_score })
            .from(evaluations)
            .where(eq(evaluations.paper_id, p.id))
            .orderBy(desc(evaluations.created_at))
            .limit(1)
          return { ...p, score: latestEval?.total_score ?? null }
        })
      )
    } catch {
      // DB 오류 시 빈 목록
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">최근 투고 현황</h3>
          <p className="text-xs text-gray-400 mt-0.5">최근 접수 기고문 10건</p>
        </div>
        <Link href="/upload" className="text-xs text-military-accent font-medium flex items-center gap-1 hover:underline">
          전체 보기 <ChevronRight size={12} />
        </Link>
      </div>

      {rows.length === 0 ? (
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
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-gray-500">{row.paper_number ?? '-'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-start gap-2">
                      <div className="w-7 h-7 rounded-lg bg-military-light flex items-center justify-center flex-shrink-0 mt-0.5">
                        <FileText size={13} className="text-military-primary" />
                      </div>
                      <p className="text-xs font-medium text-gray-800 line-clamp-2 max-w-[220px] leading-snug">{row.title}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-xs font-semibold text-gray-800">{row.author}</p>
                    <p className="text-[11px] text-gray-400">{row.affiliation}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{row.category}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {row.score != null ? <ScoreBar score={row.score} /> : <span className="text-xs text-gray-300">-</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full', getStatusColor(row.status as never))}>
                      {getStatusLabel(row.status as never)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-xs text-gray-400">
                      {row.submitted_at instanceof Date
                        ? row.submitted_at.toISOString().split('T')[0]
                        : String(row.submitted_at).split('T')[0]}
                    </span>
                  </td>
                </tr>
              ))}
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
