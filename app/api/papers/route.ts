import { NextRequest, NextResponse } from 'next/server'
import { eq, desc } from 'drizzle-orm'
import { getDb, isDatabaseConfigured } from '@/lib/db'
import { papers, evaluations } from '@/lib/schema'

export const runtime = 'nodejs'

// GET /api/papers?limit=50&status=pending
export async function GET(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ papers: [], dbConnected: false })
  }

  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number(searchParams.get('limit') ?? 50), 100)
    const status = searchParams.get('status')

    const db = getDb()

    const rows = await db
      .select({
        id:           papers.id,
        paper_number: papers.paper_number,
        title:        papers.title,
        author:       papers.author,
        affiliation:  papers.affiliation,
        category:     papers.category,
        status:       papers.status,
        submitted_at: papers.submitted_at,
        page_count:   papers.page_count,
      })
      .from(papers)
      .where(status ? eq(papers.status, status) : undefined)
      .orderBy(desc(papers.submitted_at))
      .limit(limit)

    // 각 기고문의 최신 평가 점수 조회
    const result = await Promise.all(
      rows.map(async (paper) => {
        const evals = await db
          .select({ total_score: evaluations.total_score, recommendation: evaluations.recommendation, is_demo: evaluations.is_demo })
          .from(evaluations)
          .where(eq(evaluations.paper_id, paper.id))
          .orderBy(desc(evaluations.created_at))
          .limit(1)
        return { ...paper, evaluations: evals }
      })
    )

    return NextResponse.json({ papers: result, dbConnected: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : '알 수 없는 오류'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// POST /api/papers
export async function POST(request: NextRequest) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'DATABASE_URL이 설정되지 않았습니다.' }, { status: 503 })
  }

  try {
    const body = await request.json()
    const db = getDb()

    const [paper] = await db
      .insert(papers)
      .values({
        title:          body.title ?? '(제목 미상)',
        author:         body.author ?? '',
        affiliation:    body.affiliation ?? '',
        category:       body.categories?.[0] ?? body.category ?? '기타',
        file_name:      body.file_name ?? null,
        file_size:      body.file_size ?? null,
        mime_type:      body.mime_type ?? null,
        page_count:     body.page_count ?? null,
        extracted_text: body.extracted_text ?? null,
        analysis:       body.analysis ?? null,
        status:         'pending',
      })
      .returning({ id: papers.id, paper_number: papers.paper_number })

    return NextResponse.json({ paper }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : '알 수 없는 오류'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
