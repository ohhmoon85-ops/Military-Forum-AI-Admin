import { NextRequest, NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { getDb, isDatabaseConfigured } from '@/lib/db'
import { papers, evaluations } from '@/lib/schema'
import type { EvaluationResult } from '@/lib/types/evaluation'

export const runtime = 'nodejs'

// POST /api/papers/[id]/evaluation
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'DATABASE_URL이 설정되지 않았습니다.' }, { status: 503 })
  }

  try {
    const body = await request.json()
    const result = body.result as EvaluationResult
    const isDemo = body.is_demo ?? false

    const newStatus =
      result.recommendation === 'accept' ? 'accepted' :
      result.recommendation === 'revision' ? 'revision' : 'rejected'

    const db = getDb()

    const [[evalRow]] = await Promise.all([
      db.insert(evaluations)
        .values({
          paper_id:       params.id,
          result:         result as unknown as Record<string, unknown>,
          total_score:    result.total_score,
          recommendation: result.recommendation,
          model_used:     result.model_used,
          is_demo:        isDemo,
        })
        .returning({ id: evaluations.id, created_at: evaluations.created_at }),
      db.update(papers)
        .set({ status: newStatus })
        .where(eq(papers.id, params.id)),
    ])

    return NextResponse.json({ evaluation: evalRow }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : '알 수 없는 오류'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
