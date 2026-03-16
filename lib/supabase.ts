import { createClient } from '@supabase/supabase-js'

// ─── DB Row 타입 ──────────────────────────────────────────────────────────────

export interface PaperRow {
  id: string
  paper_number: string
  title: string
  author: string
  affiliation: string
  category: string
  file_name: string | null
  file_size: number | null
  mime_type: string | null
  page_count: number | null
  extracted_text: string | null
  analysis: Record<string, unknown> | null
  status: 'pending' | 'reviewing' | 'accepted' | 'rejected' | 'revision'
  submitted_at: string
  updated_at: string
}

export interface EvaluationRow {
  id: string
  paper_id: string
  result: Record<string, unknown>
  total_score: number | null
  recommendation: 'accept' | 'revision' | 'reject' | null
  model_used: string | null
  is_demo: boolean
  created_at: string
}

// ─── 브라우저용 클라이언트 (anon key) ────────────────────────────────────────

let browserClient: ReturnType<typeof createClient> | null = null

export function getSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) throw new Error('Supabase 환경변수가 설정되지 않았습니다.')
  if (!browserClient) {
    browserClient = createClient(url, key)
  }
  return browserClient
}

// ─── 서버용 클라이언트 (service role key) ────────────────────────────────────
// Server Component 및 API Route 전용 — 절대 클라이언트 컴포넌트에서 import 금지

export function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL이 설정되지 않았습니다.')
  const key = serviceKey ?? anonKey
  if (!key) throw new Error('Supabase key 환경변수가 설정되지 않았습니다.')

  return createClient(url, key, {
    auth: { persistSession: false },
  })
}

// ─── Supabase 설정 여부 확인 ──────────────────────────────────────────────────

export function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  )
}
