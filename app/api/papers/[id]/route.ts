import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase'

export const runtime = 'nodejs'

// GET /api/papers/[id] — extracted_text 포함 상세 조회
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase가 설정되지 않았습니다.' }, { status: 503 })
  }

  try {
    const supabase = getSupabaseServerClient()
    const { data, error } = await supabase
      .from('papers')
      .select(`
        *,
        evaluations (
          id, total_score, recommendation, result, is_demo, model_used, created_at
        )
      `)
      .eq('id', params.id)
      .order('created_at', { referencedTable: 'evaluations', ascending: false })
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 404 })

    return NextResponse.json({ paper: data })
  } catch (err) {
    const msg = err instanceof Error ? err.message : '알 수 없는 오류'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

// PATCH /api/papers/[id] — 상태 등 부분 업데이트
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase가 설정되지 않았습니다.' }, { status: 503 })
  }

  try {
    const body = await request.json()
    const supabase = getSupabaseServerClient()

    const allowedFields = ['status', 'title', 'author', 'affiliation', 'category']
    const updates: Record<string, unknown> = {}
    for (const key of allowedFields) {
      if (body[key] !== undefined) updates[key] = body[key]
    }

    const { data, error } = await supabase
      .from('papers')
      .update(updates)
      .eq('id', params.id)
      .select('id, paper_number, status')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ paper: data })
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
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase가 설정되지 않았습니다.' }, { status: 503 })
  }

  try {
    const supabase = getSupabaseServerClient()
    const { error } = await supabase
      .from('papers')
      .delete()
      .eq('id', params.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : '알 수 없는 오류'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
