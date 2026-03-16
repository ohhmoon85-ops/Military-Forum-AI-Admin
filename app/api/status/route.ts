import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET() {
  const hasApiKey = !!process.env.ANTHROPIC_API_KEY
  const demoMode = !hasApiKey || process.env.DEMO_MODE === 'true'
  return NextResponse.json({ demoMode })
}
