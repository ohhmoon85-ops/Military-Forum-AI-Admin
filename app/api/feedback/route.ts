import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { FeedbackItem } from '@/lib/types/evaluation'

export const runtime = 'nodejs'
export const maxDuration = 60

const FEEDBACK_SYSTEM = `당신은 계간 군사논단 편집위원이자 논문 작성 전문 멘토입니다.
미선정 또는 수정요청 논문에 대해 다음 분기에 채택될 수 있도록 구체적이고 실행 가능한 수정 로드맵을 제공합니다.
반드시 유효한 JSON 배열 형식으로만 응답하세요.`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      title = '',
      text = '',
      weaknesses = [] as string[],
      total_score = 0,
      recommendation = 'reject',
    } = body

    const apiKey = process.env.ANTHROPIC_API_KEY
    const demoMode = !apiKey || process.env.DEMO_MODE === 'true'

    if (demoMode) {
      await new Promise((r) => setTimeout(r, 1200))
      return NextResponse.json({ roadmap: buildDemoRoadmap(recommendation, weaknesses), demo: true })
    }

    const client = new Anthropic({ apiKey })

    const prompt = `다음 논문의 수정 로드맵을 생성해 주세요.

제목: ${title}
현재 점수: ${total_score}점 (판정: ${recommendation === 'reject' ? '미선정' : '수정 요청'})
주요 약점:
${weaknesses.map((w: string, i: number) => `${i + 1}. ${w}`).join('\n')}

본문 앞부분:
${text.slice(0, 3000)}

다음 JSON 배열 형식으로만 응답하세요. 반드시 5개 이상의 항목을 제공하세요:
[
  {
    "priority": "high|medium|low",
    "category": "카테고리명",
    "issue": "구체적 문제점",
    "suggestion": "단계적 개선 방안 (구체적으로 무엇을 어떻게 수정할지)",
    "effort": "예상 소요 시간"
  }
]`

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      system: FEEDBACK_SYSTEM,
      messages: [{ role: 'user', content: prompt }],
    })

    const rawText = message.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('')

    const jsonStr = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()

    let roadmap: FeedbackItem[]
    try {
      roadmap = JSON.parse(jsonStr)
    } catch {
      return NextResponse.json({ error: '피드백 파싱 실패' }, { status: 422 })
    }

    return NextResponse.json({ roadmap, demo: false })
  } catch (err) {
    console.error('/api/feedback 오류:', err)
    return NextResponse.json({ error: '서버 오류' }, { status: 500 })
  }
}

function buildDemoRoadmap(recommendation: string, weaknesses: string[]): FeedbackItem[] {
  const base: FeedbackItem[] = [
    {
      priority: 'high',
      category: '핵심 내용 강화',
      issue: '연구 문제 및 가설이 명확히 제시되지 않음',
      suggestion: '서론에서 연구 질문(Research Question)을 1~2개로 명확히 정의하고, 이를 해결하기 위한 접근 방법을 구체적으로 서술하세요. 기존 연구와의 차별점을 2~3문장으로 명시하는 것이 중요합니다.',
      effort: '1~2일',
    },
    {
      priority: 'high',
      category: '형식·규정 준수',
      issue: '투고 규정 미준수 항목 다수',
      suggestion: '① 한글 초록(400자 내외) 및 영문 Abstract(200단어 내외) 추가, ② 핵심어(Key Words) 5개 제시, ③ 각주와 참고문헌을 학회 규정에 맞게 통일. 규정집 최신본을 반드시 재확인하세요.',
      effort: '반나절',
    },
    {
      priority: 'high',
      category: '참고문헌 보완',
      issue: '최신 연구 동향 반영 부족',
      suggestion: '최근 5년(2020~2025) 이내 국내외 학술지 논문 5~10편을 추가 인용하세요. 특히 RISS·KISS·Google Scholar에서 핵심 키워드로 검색하여 최신 논문을 확인하고, 인용 형식은 APA 7판 또는 학회 규정에 통일하세요.',
      effort: '1일',
    },
    {
      priority: 'medium',
      category: '논거 강화',
      issue: weaknesses[1] || '주요 주장에 대한 실증적 근거 부족',
      suggestion: '각 주요 주장에 대해 국내외 통계자료, 공식 문서(국방부·합참 발간물), 학술 사례를 최소 2~3개씩 인용하여 논거를 보강하세요. 데이터 출처를 각주로 명확히 표기하세요.',
      effort: '2~3일',
    },
    {
      priority: 'medium',
      category: '구성 재편',
      issue: '장·절 구성의 균형이 맞지 않음',
      suggestion: '각 장의 분량을 균등하게 조정하세요(권장: 서론 2매, 본론 16~18매, 결론 2~3매). 소제목을 활용하여 독자의 이해를 돕고, 각 절이 논문의 핵심 주장과 어떻게 연결되는지 명시하세요.',
      effort: '1일',
    },
    {
      priority: 'low',
      category: '문체·표현 교정',
      issue: '학술적 문체 미흡, 군사 전문 용어 불통일',
      suggestion: '구어체·비공식 표현을 학술 문어체로 교정하세요. 군사 용어는 최초 등장 시 약어 정의를 제시하고(예: 대량살상무기(WMD)), 이후 일관되게 사용하세요. 국립국어원 군사 표준 용어집을 참고하세요.',
      effort: '반나절',
    },
  ]

  if (recommendation === 'reject') {
    base.unshift({
      priority: 'high',
      category: '연구 방향 재설정',
      issue: '연구 주제 또는 방법론이 학술지 성격과 불일치',
      suggestion: '군사논단의 투고 분야(군사학 이론·국방정책·북한·주변국·방위산업·국방경제)에 맞게 연구 주제 또는 초점을 재설정하세요. 제목과 서론에서 군사·안보적 관점을 전면에 부각시킬 것을 강력히 권고합니다.',
      effort: '3~5일',
    })
  }

  return base
}
