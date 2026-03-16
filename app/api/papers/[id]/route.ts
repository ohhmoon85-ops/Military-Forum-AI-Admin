import { NextRequest, NextResponse } from 'next/server'
import { eq, desc } from 'drizzle-orm'
import { getDb, isDatabaseConfigured } from '@/lib/db'
import { papers, evaluations } from '@/lib/schema'

export const runtime = 'nodejs'

// GET /api/papers/[id]
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'DATABASE_URL이 설정되지 않았습니다.' }, { status: 503 })
  }

  try {
    const db = getDb()
    const [paper] = await db
      .select()
      .from(papers)
      .where(eq(papers.id, params.id))
      .limit(1)

    if (!paper) return NextResponse.json({ error: '논문을 찾을 수 없습니다.' }, { status: 404 })

    const evals = await db
      .select()
      .from(evaluations)
      .where(eq(evaluations.paper_id, params.id))
      .orderBy(desc(evaluations.created_at))

    return NextResponse.json({ paper: { ...paper, evaluations: evals } })
  } catch (err) {
    const msg = err instanceof Error ? err.message : '알 수 없는 오류'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// PATCH /api/papers/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'DATABASE_URL이 설정되지 않았습니다.' }, { status: 503 })
  }

  try {
    const body = await request.json()
    const db = getDb()

    const updates: Partial<typeof papers.$inferInsert> = {}
    if (body.status)      updates.status = body.status
    if (body.title)       updates.title = body.title
    if (body.author)      updates.author = body.author
    if (body.affiliation) updates.affiliation = body.affiliation
    if (body.category)    updates.category = body.category

    const [updated] = await db
      .update(papers)
      .set(updates)
      .where(eq(papers.id, params.id))
      .returning({ id: papers.id, paper_number: papers.paper_number, status: papers.status })

    return NextResponse.json({ paper: updated })
  } catch (err) {
    const msg = err instanceof Error ? err.message : '알 수 없는 오류'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// DELETE /api/papers/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'DATABASE_URL이 설정되지 않았습니다.' }, { status: 503 })
  }

  try {
    const db = getDb()
    await db.delete(papers).where(eq(papers.id, params.id))
    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : '알 수 없는 오류'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
