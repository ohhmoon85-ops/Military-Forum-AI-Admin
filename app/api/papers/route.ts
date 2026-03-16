import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase'

export const runtime = 'nodejs'

// GET /api/papers?limit=20&status=pending
export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ papers: [], dbConnected: false })
  }

  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(Number(searchParams.get('limit') ?? 50), 100)
    const status = searchParams.get('status')

    const supabase = getSupabaseServerClient()
    let query = supabase
      .from('papers')
      .select(`
        id, paper_number, title, author, affiliation,
        category, status, submitted_at, page_count,
        evaluations (
          total_score, recommendation, is_demo, created_at
        )
      `)
      .order('submitted_at', { ascending: false })
      .limit(limit)

    if (status) query = query.eq('status', status)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ papers: data ?? [], dbConnected: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : '알 수 없는 오류'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// POST /api/papers — 논문 레코드 생성
export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase가 설정되지 않았습니다.' }, { status: 503 })
  }

  try {
    const body = await request.json()
    const supabase = getSupabaseServerClient()

    const { data, error } = await supabase
      .from('papers')
      .insert({
        title: body.title ?? '(제목 미상)',
        author: body.author ?? '',
        affiliation: body.affiliation ?? '',
        category: (body.categories?.[0] ?? body.category) || '기타',
        file_name: body.file_name ?? null,
        file_size: body.file_size ?? null,
        mime_type: body.mime_type ?? null,
        page_count: body.page_count ?? null,
        extracted_text: body.extracted_text ?? null,
        analysis: body.analysis ?? null,
        status: 'pending',
      })
      .select('id, paper_number')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ paper: data }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : '알 수 없는 오류'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
