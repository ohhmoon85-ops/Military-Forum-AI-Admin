import { NextResponse } from 'next/server'
import { isDatabaseConfigured } from '@/lib/db'

export const runtime = 'nodejs'

export async function GET() {
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY
  const demoMode = !hasApiKey || process.env.DEMO_MODE === 'true'
  const dbConnected = isDatabaseConfigured()
  return NextResponse.json({ demoMode, dbConnected })
}
