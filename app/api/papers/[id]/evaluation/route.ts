import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient, isSupabaseConfigured } from '@/lib/supabase'
import type { EvaluationResult } from '@/lib/types/evaluation'

export const runtime = 'nodejs'

// POST /api/papers/[id]/evaluation — 평가 결과 저장
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: 'Supabase가 설정되지 않았습니다.' }, { status: 503 })
  }

  try {
    const body = await request.json()
    const result = body.result as EvaluationResult
    const isDemo = body.is_demo ?? false

    const supabase = getSupabaseServerClient()

    const newStatus =
      result.recommendation === 'accept' ? 'accepted' :
      result.recommendation === 'revision' ? 'revision' : 'rejected'

    const [evalRes, _paperRes] = await Promise.allSettled([
      supabase
        .from('evaluations')
        .insert({
          paper_id: params.id,
          result: result as unknown as Record<string, unknown>,
          total_score: result.total_score,
          recommendation: result.recommendation,
          model_used: result.model_used,
          is_demo: isDemo,
        })
        .select('id, created_at')
        .single(),
      supabase
        .from('papers')
        .update({ status: newStatus })
        .eq('id', params.id),
    ])

    if (evalRes.status === 'rejected') {
      return NextResponse.json({ error: '평가 결과 저장 실패' }, { status: 500 })
    }

    const evalData = evalRes.value.data
    return NextResponse.json({ evaluation: evalData }, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : '알 수 없는 오류'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
