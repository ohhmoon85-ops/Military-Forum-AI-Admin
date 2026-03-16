import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { applyFormatRules, DEFAULT_OPTIONS } from '@/lib/format-rules'
import type { FormatOptions, ChangeLog } from '@/lib/format-rules'

export const runtime = 'nodejs'
export const maxDuration = 60

// ─── AI 문체 정제 프롬프트 ──────────────────────────────────────────────────

const TONE_SYSTEM = `당신은 군사학 학술지 '군사논단'의 교정 전문 편집자입니다.
주어진 논문 단락을 다음 원칙에 따라 학술적 문체로 교정하세요.
- 구어체·일상 표현 → 격식 있는 학술 문어체 (예: "~했습니다" → "~하였다")
- 모호한 표현 → 명확하고 간결한 표현
- 피동 표현 과다 사용 지양
- 군사 전문 용어 통일 유지
- 의미 변경 없이 표현만 교정
- 원문 단락 구조(문단 나눔) 유지
반드시 교정된 본문만 반환하세요. 설명이나 주석을 추가하지 마세요.`

async function refineToneWithClaude(text: string, apiKey: string): Promise<{ refined: string; log: ChangeLog }> {
  const client = new Anthropic({ apiKey })

  // 단락 단위로 분할 (과도한 토큰 소비 방지, 앞 4,000자만)
  const truncated = text.slice(0, 4000)

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    system: TONE_SYSTEM,
    messages: [{ role: 'user', content: truncated }],
  })

  const refined = message.content
    .filter((b) => b.type === 'text')
    .map((b) => (b as { type: 'text'; text: string }).text)
    .join('') + (text.length > 4000 ? '\n\n' + text.slice(4000) : '')

  return {
    refined,
    log: {
      rule: 'AI 문체 정제 (Claude Haiku)',
      count: 1,
      examples: ['학술 문어체 변환', '표현 명확화', '용어 통일'],
    },
  }
}

// ─── 핸들러 ──────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      text,
      title = '',
      options = DEFAULT_OPTIONS,
    }: { text: string; title?: string; options?: FormatOptions } = body

    if (!text || text.trim().length < 10) {
      return NextResponse.json({ error: '서식을 적용할 텍스트가 없습니다.' }, { status: 400 })
    }

    // 1. 규칙 기반 서식 적용
    const { formatted: ruleFormatted, logs, stats } = applyFormatRules(text, options)

    let finalFormatted = ruleFormatted
    const allLogs = [...logs]

    // 2. AI 문체 정제 (API 키 있고 옵션 활성화 시)
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (options.refineTone && apiKey) {
      try {
        const { refined, log } = await refineToneWithClaude(ruleFormatted, apiKey)
        finalFormatted = refined
        allLogs.push(log)
        stats.totalRules += 1
        stats.totalChanges += 1
        stats.formattedChars = refined.replace(/\s/g, '').length
        stats.charDiff = stats.formattedChars - stats.originalChars
      } catch (err) {
        console.error('Claude refineTone 오류:', err)
        allLogs.push({ rule: 'AI 문체 정제 (실패)', count: 0, examples: ['API 오류로 건너뜀'] })
      }
    } else if (options.refineTone && !apiKey) {
      allLogs.push({ rule: 'AI 문체 정제 (건너뜀)', count: 0, examples: ['ANTHROPIC_API_KEY 미설정'] })
    }

    return NextResponse.json({
      title,
      original: text,
      formatted: finalFormatted,
      logs: allLogs,
      stats,
      aiRefined: !!(options.refineTone && apiKey),
    })
  } catch (err) {
    console.error('/api/format 오류:', err)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
