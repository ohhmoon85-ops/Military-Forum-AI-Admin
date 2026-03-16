import { BrainCircuit, Sparkles } from 'lucide-react'
import EvaluationClient from '@/components/evaluation/EvaluationClient'
import { getDb, isDatabaseConfigured } from '@/lib/db'
import { papers, evaluations } from '@/lib/schema'
import { desc, eq } from 'drizzle-orm'
import { DEMO_PAPERS } from '@/lib/demo-papers'
import type { PaperMeta, EvaluationResult } from '@/lib/types/evaluation'

export const dynamic = 'force-dynamic'

export default async function EvaluationPage() {
  let initialPapers: PaperMeta[] = DEMO_PAPERS

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
        .limit(50)

      if (paperRows.length > 0) {
        initialPapers = await Promise.all(
          paperRows.map(async (row) => {
            const [latestEval] = await db
              .select({
                total_score:    evaluations.total_score,
                recommendation: evaluations.recommendation,
                result:         evaluations.result,
              })
              .from(evaluations)
              .where(eq(evaluations.paper_id, row.id))
              .orderBy(desc(evaluations.created_at))
              .limit(1)

            return {
              id:          row.paper_number ?? row.id,
              _dbId:       row.id,
              title:       row.title,
              author:      row.author,
              affiliation: row.affiliation,
              category:    row.category,
              submittedAt: row.submitted_at instanceof Date
                ? row.submitted_at.toISOString().split('T')[0]
                : String(row.submitted_at).split('T')[0],
              status:      row.status as PaperMeta['status'],
              prevScore:   latestEval?.total_score ?? undefined,
              result:      latestEval?.result
                ? (latestEval.result as unknown as EvaluationResult)
                : undefined,
            } satisfies PaperMeta
          })
        )
      }
    } catch {
      // DB 오류 시 DEMO_PAPERS 폴백
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* 페이지 헤더 */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 bg-purple-50 rounded-lg flex items-center justify-center">
              <BrainCircuit size={15} className="text-purple-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">AI 평가 · 분석</h1>
          <p className="text-sm text-gray-500 mt-1">
            Claude AI가 주제 적합성, 논리성, 학술 기여도, 표절 위험을 종합 분석합니다
          </p>
        </div>

        {/* 기능 요약 뱃지 */}
        <div className="hidden md:flex items-center gap-2">
          {['주제 적합성 (30점)', '논리성 (25점)', '기여도 (20점)', '표절 검사'].map((b) => (
            <span
              key={b}
              className="flex items-center gap-1 text-[11px] bg-purple-50 text-purple-700 font-medium px-2.5 py-1 rounded-full border border-purple-100"
            >
              <Sparkles size={10} />
              {b}
            </span>
          ))}
        </div>
      </div>

      <EvaluationClient initialPapers={initialPapers} />
    </div>
  )
}
