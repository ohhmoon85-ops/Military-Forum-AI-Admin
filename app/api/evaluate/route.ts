import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import type { EvaluationResult } from '@/lib/types/evaluation'
import { getDb, isDatabaseConfigured } from '@/lib/db'
import { papers, evaluations } from '@/lib/schema'
import { eq } from 'drizzle-orm'

export const runtime = 'nodejs'
export const maxDuration = 60

// ─── 프롬프트 ────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `당신은 사단법인 한국군사학회 계간 '군사논단'의 수석 편집위원입니다.
투고된 기고문을 아래 기준에 따라 엄격하고 공정하게 심사하세요.

[평가 기준 및 배점]
1. 주제 적합성 (30점): 군사학 이론·교육체계, 국방정책·군사전략, 북한·주변국 안보, 방위산업·국방경제 관련성
2. 논리성·체계성 (25점): 논증의 타당성, 논리적 흐름, 문장의 명확성, 체계적 구성
3. 학술적 기여도 (20점): 독창성, 새로운 시각 제시, 실용적·정책적 가치
4. 형식 준수도 (15점): A4 20~25매·글자 11pt·줄간격 160%, 한영 Abstract, 핵심어(Key Words) 포함
5. 참고문헌 적절성 (10점): 최신 자료(5년 이내) 인용 비율, 다양성, 인용 형식 정확성

[판정 기준]
- 85점 이상: accept (게재 확정)
- 65~84점: revision (수정 후 재심사)
- 64점 이하: reject (미선정)

반드시 유효한 JSON 형식으로만 응답하세요. JSON 이외의 텍스트(마크다운 코드블록 포함)는 절대 포함하지 마세요.`

function buildUserPrompt(title: string, text: string): string {
  const snippet = text.slice(0, 6000) // 토큰 절약
  return `다음 기고문을 심사해 주세요.

제목: ${title || '(제목 미상)'}

본문 (앞부분):
${snippet}

위 기고문에 대해 아래 JSON 스키마에 정확히 맞춰 응답하세요. JSON 객체만 출력하고 다른 텍스트는 절대 포함하지 마세요:
{
  "total_score": <number 0-100>,
  "recommendation": <"accept"|"revision"|"reject">,
  "scores": {
    "topic_relevance":        { "score": <0-30>, "max": 30, "comment": "<한국어 2문장>" },
    "logic_structure":        { "score": <0-25>, "max": 25, "comment": "<한국어 2문장>" },
    "academic_contribution":  { "score": <0-20>, "max": 20, "comment": "<한국어 2문장>" },
    "format_compliance":      { "score": <0-15>, "max": 15, "comment": "<한국어 2문장>" },
    "references":             { "score": <0-10>, "max": 10, "comment": "<한국어 2문장>" }
  },
  "executive_summary": {
    "background":         "<연구 배경 및 목적 2~3문장>",
    "main_argument":      "<핵심 주장 및 논리 2~3문장>",
    "evidence":           "<주요 데이터·근거 2~3문장>",
    "conclusion":         "<결론 2~3문장>",
    "policy_implication": "<정책적 시사점 2~3문장>"
  },
  "strengths": ["<강점1>", "<강점2>", "<강점3>"],
  "weaknesses": ["<약점1>", "<약점2>", "<약점3>"],
  "plagiarism": {
    "similarity_estimate": <number 0-100>,
    "risk_level": <"low"|"medium"|"high">,
    "suspicious_passages": [
      { "text": "<의심 구절 (30자 이내)>", "reason": "<이유>", "risk": <"high"|"medium"|"low"> }
    ],
    "ethics_note": "<연구 윤리 종합 의견 1~2문장>"
  },
  "feedback_roadmap": [
    {
      "priority": <"high"|"medium"|"low">,
      "category": "<카테고리>",
      "issue": "<문제점>",
      "suggestion": "<구체적 개선 방안>",
      "effort": "<예상 소요 시간>"
    }
  ]
}`
}

// ─── 데모 결과 생성 (API 키 없을 때) ────────────────────────────────────────

function buildDemoResult(title: string, text: string): EvaluationResult {
  const len = text.replace(/\s/g, '').length
  const hasAbstract = /abstract|초록|요약/i.test(text)
  const hasRefs = /참고문헌|references/i.test(text)
  const hasMilitary = /국방|군사|안보|북한|방위|전략/i.test(text)

  const topicScore = hasMilitary ? 26 : 18
  const logicScore = len > 30000 ? 21 : 16
  const contributionScore = hasAbstract ? 17 : 13
  const formatScore = hasAbstract && hasRefs ? 13 : 9
  const refScore = hasRefs ? 8 : 5
  const total = topicScore + logicScore + contributionScore + formatScore + refScore
  const rec = total >= 85 ? 'accept' : total >= 65 ? 'revision' : 'reject'

  return {
    total_score: total,
    recommendation: rec as 'accept' | 'revision' | 'reject',
    scores: {
      topic_relevance: {
        score: topicScore, max: 30,
        comment: hasMilitary
          ? '군사·안보 관련 핵심 주제를 명확히 다루고 있으며 투고 분야 적합성이 높습니다. 군사논단의 목적과 잘 부합합니다.'
          : '기고문 주제가 군사학 관련 분야와의 연관성이 다소 부족합니다. 군사·국방 관점을 더 명확히 제시할 필요가 있습니다.',
      },
      logic_structure: {
        score: logicScore, max: 25,
        comment: len > 30000
          ? '논리적 흐름이 전반적으로 양호하며 각 장의 연결이 자연스럽습니다. 주장을 뒷받침하는 근거 제시가 체계적입니다.'
          : '기고문 구성은 적절하나 일부 주장에 대한 논거가 불충분합니다. 각 절 간의 논리적 연결을 보강하면 완성도가 높아질 것입니다.',
      },
      academic_contribution: {
        score: contributionScore, max: 20,
        comment: hasAbstract
          ? '기존 연구와 차별화된 시각을 제시하고 있으며 학술적 기여도가 인정됩니다. 정책적 시사점이 구체적으로 제시되었습니다.'
          : '연구의 독창성은 인정되나 기존 문헌과의 차별성을 더 명확히 서술할 필요가 있습니다. 연구 기여도를 초록에 명시해 주세요.',
      },
      format_compliance: {
        score: formatScore, max: 15,
        comment: hasRefs && hasAbstract
          ? '한글 및 영문 초록, 핵심어가 포함되어 있고 전반적인 형식 준수 수준이 양호합니다.'
          : '초록 또는 참고문헌 형식이 규정에 맞지 않습니다. 투고 규정(11pt, 줄간격 160%, A4 20~25매)을 재확인해 주세요.',
      },
      references: {
        score: refScore, max: 10,
        comment: hasRefs
          ? '참고문헌 목록이 체계적으로 구성되어 있으며 최신 자료의 인용이 적절합니다.'
          : '참고문헌 형식 및 인용 방식이 학술지 규정에 맞지 않습니다. 인용 형식을 통일하고 최근 5년 이내 자료를 보완해 주세요.',
      },
    },
    executive_summary: {
      background: `본 연구는 ${title || '제시된 주제'}에 관한 학술적 탐구로, 현대 안보환경에서 군사학적 관점의 분석 필요성을 제기합니다. 기존 연구의 한계를 극복하고 보다 체계적인 접근법을 제시하고자 합니다.`,
      main_argument: '저자는 국방정책의 실효성을 높이기 위해 다층적·복합적 접근이 필요하다고 주장합니다. 이론적 토대와 실증 사례 분석을 통해 정책 대안을 도출하고 있습니다.',
      evidence: '국내외 주요 군사 사례 및 정책 문서를 분석하고 관련 통계 자료를 활용하여 주장을 뒷받침합니다. 비교 분석 방법론을 통해 객관성을 확보하고 있습니다.',
      conclusion: '연구 결과, 제시된 정책 방향이 현실적 실행 가능성이 있음을 확인하였습니다. 군 전력 발전 및 국가 안보 강화에 기여할 수 있는 구체적 방안을 제언합니다.',
      policy_implication: '국방부 및 관련 기관은 본 연구의 제언을 참고하여 정책 수립 시 다차원적 요소를 고려해야 합니다. 후속 연구를 통한 실증적 검증이 추가로 필요합니다.',
    },
    strengths: [
      '시의성 있는 군사·안보 이슈를 다루고 있어 학술적 관심도가 높습니다',
      '이론과 실제 사례를 균형 있게 결합한 분석 방법론이 강점입니다',
      '정책적 시사점이 구체적으로 제시되어 실용적 가치가 있습니다',
    ],
    weaknesses: [
      hasAbstract ? '일부 논증 과정에서 근거 자료의 최신성이 부족합니다' : '한글 및 영문 초록이 누락되어 있어 반드시 추가가 필요합니다',
      '선행 연구 검토 부분에서 국내외 최신 문헌의 포괄성이 미흡합니다',
      hasRefs ? '참고문헌 인용 형식이 일부 불일치하여 통일이 필요합니다' : '참고문헌이 규정된 형식으로 정리되어 있지 않습니다',
    ],
    plagiarism: {
      similarity_estimate: Math.max(3, Math.min(18, Math.floor(Math.random() * 15) + 3)),
      risk_level: 'low',
      suspicious_passages: [
        { text: '(데모 모드 - 실제 표절 검사를 위해 API 키 필요)', reason: '데모 결과입니다', risk: 'low' },
      ],
      ethics_note: '전반적으로 연구 윤리를 준수하고 있으나, 인용 표기 방식을 일관되게 유지할 것을 권고합니다. (본 결과는 데모 모드입니다. 정확한 표절 검사를 위해 API 키를 설정해 주세요.)',
    },
    feedback_roadmap: [
      { priority: 'high', category: '형식 수정', issue: hasAbstract ? '참고문헌 형식 불일치' : '초록 누락', suggestion: hasAbstract ? '인용 형식을 APA 또는 학회 규정에 맞게 통일하세요' : '한글 초록(400자)과 영문 Abstract(200단어)를 작성하여 기고문 앞부분에 추가하세요', effort: '2~3시간' },
      { priority: 'medium', category: '내용 보완', issue: '논거 강화 필요', suggestion: '주요 주장에 대해 최근 5년 이내 발간된 국내외 학술 자료를 2~3건 추가 인용하여 논거를 보강하세요', effort: '1~2일' },
      { priority: 'low', category: '문체 교정', issue: '학술적 표현 통일', suggestion: '구어체 표현을 학술적 문어체로 통일하고, 군사 전문 용어는 최초 등장 시 정의를 제시하세요', effort: '3~4시간' },
    ],
    generated_at: new Date().toISOString(),
    model_used: 'demo-heuristic',
  }
}

// ─── 핸들러 ──────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title = '', text = '' } = body as { title?: string; text?: string }

    if (!text || text.trim().length < 100) {
      return NextResponse.json(
        { error: '평가할 기고문 텍스트가 너무 짧습니다. (최소 100자)' },
        { status: 400 }
      )
    }

    const { paperId } = body as { title?: string; text?: string; paperId?: string }
    const apiKey = process.env.ANTHROPIC_API_KEY
    const demoMode = !apiKey || process.env.DEMO_MODE === 'true'

    // ─── DB 저장 헬퍼 (공통) ─────────────────────────────────────────────────
    async function saveEvaluationToDB(result: EvaluationResult, isDemo: boolean) {
      if (!paperId || !isDatabaseConfigured()) return
      const newStatus =
        result.recommendation === 'accept' ? 'accepted' :
        result.recommendation === 'revision' ? 'revision' : 'rejected'
      const db = getDb()
      await Promise.allSettled([
        db.insert(evaluations).values({
          paper_id:       paperId,
          result:         result as unknown as Record<string, unknown>,
          total_score:    result.total_score,
          recommendation: result.recommendation,
          model_used:     result.model_used,
          is_demo:        isDemo,
        }),
        db.update(papers).set({ status: newStatus }).where(eq(papers.id, paperId)),
      ])
    }

    // ── 데모 모드 ────────────────────────────────────────────────────────────
    if (demoMode) {
      await new Promise((r) => setTimeout(r, 1800)) // 실감나는 딜레이
      const result = buildDemoResult(title, text)
      await saveEvaluationToDB(result, true)
      return NextResponse.json({ result, demo: true })
    }

    // ── Claude API 호출 ──────────────────────────────────────────────────────
    const client = new Anthropic({ apiKey })

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: buildUserPrompt(title, text) },
      ],
    })

    const rawText = message.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join('')

    // JSON 파싱 — 코드블록 제거 후 첫 번째 { ... } 블록 추출
    let jsonStr = rawText
      .replace(/^```json\s*/im, '')
      .replace(/^```\s*/im, '')
      .replace(/\s*```$/im, '')
      .trim()

    // { } 사이의 JSON 객체만 추출 (앞뒤 텍스트 무시)
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
    if (jsonMatch) jsonStr = jsonMatch[0]

    let parsed: Omit<EvaluationResult, 'generated_at' | 'model_used'>
    try {
      parsed = JSON.parse(jsonStr)
    } catch {
      console.error('JSON 파싱 실패 원문:', rawText.slice(0, 800))
      return NextResponse.json(
        { error: `AI 응답 파싱 실패. 원문 앞부분: ${rawText.slice(0, 200)}` },
        { status: 422 }
      )
    }

    const result: EvaluationResult = {
      ...parsed,
      generated_at: new Date().toISOString(),
      model_used: 'claude-haiku-4-5-20251001',
    }

    await saveEvaluationToDB(result, false)
    return NextResponse.json({ result, demo: false })
  } catch (err) {
    console.error('/api/evaluate 오류:', err)
    const message = err instanceof Error ? err.message : '알 수 없는 오류'
    return NextResponse.json({ error: `서버 오류: ${message}` }, { status: 500 })
  }
}
