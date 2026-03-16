import { NextResponse } from 'next/server'
import { getDb, isDatabaseConfigured } from '@/lib/db'
import { papers, evaluations } from '@/lib/schema'

export const runtime = 'nodejs'

// POST /api/admin/reset — 전체 데이터 초기화
export async function POST() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: 'DATABASE_URL이 설정되지 않았습니다.' }, { status: 503 })
  }

  try {
    const db = getDb()

    // evaluations는 papers 삭제 시 CASCADE로 자동 삭제됨
    await db.delete(evaluations)
    await db.delete(papers)

    return NextResponse.json({ success: true, message: '모든 데이터가 초기화되었습니다.' })
  } catch (err) {
    const msg = err instanceof Error ? err.message : '알 수 없는 오류'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
