import { GitCompare, Wand2, Printer, Columns2 } from 'lucide-react'
import FormattingClient from '@/components/formatting/FormattingClient'
import { getDb, isDatabaseConfigured } from '@/lib/db'
import { papers } from '@/lib/schema'
import { desc, inArray } from 'drizzle-orm'
import { DEMO_PAPERS } from '@/lib/demo-papers'
import type { PaperMeta } from '@/lib/types/evaluation'

export const dynamic = 'force-dynamic'

export default async function FormattingPage() {
  let initialPapers: PaperMeta[] = DEMO_PAPERS

  if (isDatabaseConfigured()) {
    try {
      const db = getDb()
      const rows = await db
        .select({
          id:            papers.id,
          paper_number:  papers.paper_number,
          title:         papers.title,
          author:        papers.author,
          affiliation:   papers.affiliation,
          category:      papers.category,
          status:        papers.status,
          submitted_at:  papers.submitted_at,
          extracted_text: papers.extracted_text,
        })
        .from(papers)
        .where(inArray(papers.status, ['pending', 'reviewing', 'accepted', 'revision']))
        .orderBy(desc(papers.submitted_at))
        .limit(50)

      if (rows.length > 0) {
        initialPapers = rows.map((row) => ({
          id:          row.paper_number ?? row.id,
          _dbId:       row.id,
          title:       row.title,
          author:      row.author,
          affiliation: row.affiliation,
          category:    row.category,
          status:      row.status as PaperMeta['status'],
          submittedAt: row.submitted_at instanceof Date
            ? row.submitted_at.toISOString().split('T')[0]
            : String(row.submitted_at).split('T')[0],
          text:        row.extracted_text ?? '',
        }))
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
            <div className="w-7 h-7 bg-orange-50 rounded-lg flex items-center justify-center">
              <GitCompare size={15} className="text-orange-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">양식 수정 · Diff 비교</h1>
          <p className="text-sm text-gray-500 mt-1">
            학술지 규격 서식을 자동 적용하고 원문과 수정본을 좌우로 비교합니다
          </p>
        </div>

        {/* 기능 요약 */}
        <div className="hidden md:flex items-center gap-2">
          {[
            { icon: <Wand2 size={10} />, text: '공백·문장부호 자동 교정' },
            { icon: <GitCompare size={10} />, text: '군사 용어 표준화' },
            { icon: <Columns2 size={10} />, text: 'Side-by-Side Diff' },
            { icon: <Printer size={10} />, text: 'PDF 인쇄 저장' },
          ].map((b) => (
            <span
              key={b.text}
              className="flex items-center gap-1 text-[11px] bg-orange-50 text-orange-700 font-medium px-2.5 py-1 rounded-full border border-orange-100"
            >
              {b.icon}
              {b.text}
            </span>
          ))}
        </div>
      </div>

      <FormattingClient initialPapers={initialPapers} />

      {/* 학술지 규격 안내 */}
      <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-card p-5">
        <h3 className="text-sm font-bold text-gray-700 mb-3">군사논단 학술지 서식 규격</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: '글자 크기', value: '11pt', icon: '🔤' },
            { label: '줄간격', value: '160%', icon: '📏' },
            { label: '용지', value: 'A4', icon: '📄' },
            { label: '분량', value: '20~25매', icon: '📋' },
            { label: '여백 (위/아래)', value: '30mm', icon: '↕' },
            { label: '여백 (좌/우)', value: '25mm', icon: '↔' },
            { label: '초록', value: '한글+영문', icon: '📝' },
            { label: '서체', value: '맑은 고딕', icon: '🖋' },
          ].map((spec) => (
            <div key={spec.label} className="bg-gray-50 rounded-lg p-3">
              <span className="text-lg">{spec.icon}</span>
              <p className="text-xs text-gray-500 mt-1">{spec.label}</p>
              <p className="text-sm font-bold text-gray-800">{spec.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
