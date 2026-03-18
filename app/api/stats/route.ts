import { NextResponse } from 'next/server'
import { getDb, isDatabaseConfigured } from '@/lib/db'
import { papers, evaluations } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export const runtime = 'nodejs'

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({
      total: 0, pending: 0, evaluated: 0,
      accepted: 0, rejected: 0, revision: 0,
      dbConnected: false,
    })
  }

  try {
    const db = getDb()

    // 전체 기고문 status 조회
    const rows = await db.select({ id: papers.id, status: papers.status }).from(papers)

    let total = 0, pending = 0, accepted = 0, rejected = 0, revision = 0, reviewing = 0

    for (const row of rows) {
      total++
      const s = row.status
      if (s === 'pending')   pending++
      if (s === 'reviewing') reviewing++
      if (s === 'accepted')  accepted++
      if (s === 'rejected')  rejected++
      if (s === 'revision')  revision++
    }

    // AI 평가 완료 = evaluations 테이블에 레코드가 있는 paper 수
    const evalRows = await db
      .select({ paper_id: evaluations.paper_id })
      .from(evaluations)

    const evaluatedPaperIds = new Set(evalRows.map((r) => r.paper_id))
    const evaluated = rows.filter((r) => evaluatedPaperIds.has(r.id)).length

    // 평가 대기 = pending 상태이면서 아직 evaluation 없는 것
    const awaitingEval = rows.filter(
      (r) => (r.status === 'pending' || r.status === 'reviewing') && !evaluatedPaperIds.has(r.id)
    ).length

    return NextResponse.json({
      total,
      pending,
      reviewing,
      accepted,
      rejected,
      revision,
      evaluated,
      awaitingEval,
      dbConnected: true,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : '알 수 없는 오류'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
