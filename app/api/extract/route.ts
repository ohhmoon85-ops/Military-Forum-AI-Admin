import { NextRequest, NextResponse } from 'next/server'
import { del } from '@vercel/blob'
import Anthropic from '@anthropic-ai/sdk'
import { getDb, isDatabaseConfigured } from '@/lib/db'
import { papers } from '@/lib/schema'

export const runtime = 'nodejs'
export const maxDuration = 60

// ─── 텍스트 분석 헬퍼 ───────────────────────────────────────────────────────

function analyzeText(text: string) {
  const cleaned = text.replace(/\s+/g, ' ').trim()
  const charCount = cleaned.replace(/\s/g, '').length
  const wordCount = cleaned.split(/\s+/).filter(Boolean).length

  // A4 1페이지 ≈ 한글 기준 약 1,600~1,800자 (11pt, 160%)
  const estimatedPages = Math.round(charCount / 1700)

  // 초록 포함 여부 (Abstract, 초록, 요약 키워드)
  const hasAbstract =
    /abstract|초록|요약|핵심어|key\s*words/i.test(text)

  // 참고문헌 포함 여부
  const hasReferences =
    /참고문헌|references|bibliography|출처/i.test(text)

  // 제목 추출 시도 (첫 줄 또는 가장 짧고 명확한 줄)
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 5 && l.length < 120)
  const title = lines[0] ?? ''

  // 투고 규정 준수 검사
  const compliance = {
    pageRange: estimatedPages >= 20 && estimatedPages <= 25,
    hasAbstract,
    hasReferences,
    estimatedPages,
    charCount,
    wordCount,
  }

  // 분야 키워드 감지
  const categories = detectCategories(text)

  return { title, compliance, categories, charCount, wordCount, estimatedPages }
}

function detectCategories(text: string): string[] {
  const cats: string[] = []
  const lower = text.toLowerCase()
  if (/국방|방위|군사전략|작전/.test(lower)) cats.push('국방·군사전략')
  if (/북한|핵|김정은|조선인민군/.test(lower)) cats.push('북한·주변국')
  if (/방위산업|무기체계|방산|연구개발/.test(lower)) cats.push('방위산업')
  if (/한미동맹|동맹|연합/.test(lower)) cats.push('동맹·안보')
  if (/군사학|교육|인재|양성/.test(lower)) cats.push('군사학 이론')
  if (/경제|예산|비용|재정/.test(lower)) cats.push('국방경제')
  return cats.length > 0 ? cats : ['기타']
}

// ─── 텍스트 미리보기 생성 ─────────────────────────────────────────────────

function buildPreview(text: string, maxLen = 800): string {
  return text.replace(/\s+/g, ' ').trim().slice(0, maxLen)
}

// ─── API 핸들러 ──────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    let fileName: string
    let fileSize: number
    let mimeType: string
    let buffer: Buffer
    let blobUrl: string | null = null

    const contentType = request.headers.get('content-type') ?? ''

    if (contentType.includes('application/json')) {
      // ── Vercel Blob 업로드 후 URL로 요청 ──────────────────────────────────
      const body = await request.json() as { blobUrl: string; fileName: string; fileSize: number; mimeType: string }
      blobUrl = body.blobUrl
      fileName = body.fileName
      fileSize = body.fileSize
      mimeType = body.mimeType

      const blobRes = await fetch(blobUrl)
      if (!blobRes.ok) {
        return NextResponse.json({ error: 'Blob 파일을 가져오지 못했습니다.' }, { status: 502 })
      }
      buffer = Buffer.from(await blobRes.arrayBuffer())
    } else {
      // ── FormData (로컬 개발용 폴백) ────────────────────────────────────────
      const formData = await request.formData()
      const file = formData.get('file')

      if (!file || !(file instanceof Blob)) {
        return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 })
      }

      fileName = (file as File).name ?? 'unknown'
      fileSize = file.size
      mimeType = file.type
      buffer = Buffer.from(await file.arrayBuffer())
    }

    // 50 MB 제한
    if (fileSize > 52_428_800) {
      return NextResponse.json(
        { error: '파일 크기는 50MB를 초과할 수 없습니다.' },
        { status: 413 }
      )
    }
    let extractedText = ''
    let pageCount = 0

    // ── PDF 처리 ────────────────────────────────────────────────────────────
    if (
      mimeType === 'application/pdf' ||
      fileName.toLowerCase().endsWith('.pdf')
    ) {
      // 1차: pdf-parse로 텍스트 추출 시도
      try {
        const pdfParse = require('pdf-parse/lib/pdf-parse.js') as (buf: Buffer, opts?: object) => Promise<{ text: string; numpages: number }>
        const data = await pdfParse(buffer, { max: 0 })
        extractedText = data.text ?? ''
        pageCount = data.numpages ?? 0
      } catch (err) {
        console.error('pdf-parse 오류 (Claude 폴백 시도):', err)
      }

      // 2차: 텍스트가 없거나 부족하면 Claude PDF 처리로 폴백
      if (extractedText.trim().length < 50 && process.env.ANTHROPIC_API_KEY) {
        try {
          const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

          // URL 방식 우선 (대용량 PDF, base64 32MB 제한 우회)
          // base64 방식 폴백 (로컬 개발 등 URL 없는 경우)
          const docSource = blobUrl
            ? { type: 'url' as const, url: blobUrl }
            : { type: 'base64' as const, media_type: 'application/pdf' as const, data: buffer.toString('base64') }

          const response = await (anthropic.messages.create as (p: object) => Promise<{ content: Array<{ type: string; text?: string }> }>)({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 8192,
            messages: [{
              role: 'user',
              content: [
                { type: 'document', source: docSource },
                {
                  type: 'text',
                  text: '이 PDF 문서의 전체 텍스트를 원문 그대로 추출해주세요. 제목, 저자, 초록, 본문, 참고문헌을 모두 포함하세요. 형식 설명 없이 텍스트만 출력하세요.',
                },
              ],
            }],
          })

          const content = response.content[0]
          if (content.type === 'text' && content.text) {
            extractedText = content.text
          }
        } catch (claudeErr) {
          console.error('Claude PDF 폴백 오류:', claudeErr)
        }
      }

      if (extractedText.trim().length < 50) {
        return NextResponse.json(
          { error: '텍스트를 추출할 수 없습니다. 스캔 이미지 PDF이거나 암호화된 파일입니다. DOCX 형식으로 변환 후 업로드해 주세요.' },
          { status: 422 }
        )
      }
    }

    // ── DOCX 처리 ───────────────────────────────────────────────────────────
    else if (
      mimeType ===
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.toLowerCase().endsWith('.docx')
    ) {
      try {
        const mammoth = require('mammoth') as { extractRawText: (opts: { buffer: Buffer }) => Promise<{ value: string }> }
        const result = await mammoth.extractRawText({ buffer })
        extractedText = result.value ?? ''
        // DOCX는 페이지 수 직접 파싱 불가 → 추정값 사용
        pageCount = 0
      } catch (err) {
        console.error('DOCX 파싱 오류:', err)
        return NextResponse.json(
          { error: 'DOCX 텍스트 추출에 실패했습니다.' },
          { status: 422 }
        )
      }
    }

    // ── HWP / 기타 ──────────────────────────────────────────────────────────
    else if (
      fileName.toLowerCase().endsWith('.hwp') ||
      fileName.toLowerCase().endsWith('.hwpx')
    ) {
      return NextResponse.json(
        {
          error:
            'HWP 파일은 현재 직접 파싱이 지원되지 않습니다. DOCX 또는 PDF로 변환 후 업로드해 주세요.',
        },
        { status: 415 }
      )
    } else {
      return NextResponse.json(
        { error: '지원하지 않는 파일 형식입니다. PDF 또는 DOCX 파일을 업로드해 주세요.' },
        { status: 415 }
      )
    }

    if (!extractedText || extractedText.trim().length < 50) {
      return NextResponse.json(
        { error: '텍스트를 추출할 수 없습니다. 지원하지 않는 파일 형식이거나 내용이 없는 파일입니다.' },
        { status: 422 }
      )
    }

    // 분석
    const analysis = analyzeText(extractedText)
    if (pageCount === 0) pageCount = analysis.estimatedPages

    // 미리보기 (앞 800자)
    const preview = buildPreview(extractedText)

    // ─── DB에 기고문 레코드 저장 (Supabase 설정 시) ────────────────────────────
    let paperId: string | null = null
    let paperNumber: string | null = null

    if (isDatabaseConfigured()) {
      try {
        const db = getDb()
        const [paperData] = await db
          .insert(papers)
          .values({
            title:          analysis.title || fileName.replace(/\.[^.]+$/, ''),
            file_name:      fileName,
            file_size:      fileSize,
            mime_type:      mimeType,
            page_count:     pageCount,
            extracted_text: extractedText,
            analysis:       analysis as unknown as Record<string, unknown>,
            status:         'pending',
          })
          .returning({ id: papers.id, paper_number: papers.paper_number })

        if (paperData) {
          paperId = paperData.id
          paperNumber = paperData.paper_number
        }
      } catch (dbErr) {
        // DB 저장 실패는 비치명적 — 추출 결과는 정상 반환
        console.error('기고문 DB 저장 실패 (비치명적):', dbErr)
      }
    }

    // Blob 임시 파일 삭제 (텍스트 추출 완료 후)
    if (blobUrl) {
      try { await del(blobUrl) } catch { /* 비치명적 */ }
    }

    return NextResponse.json({
      success: true,
      fileName,
      fileSize,
      mimeType,
      pageCount,
      text: extractedText,
      preview,
      analysis,
      paperId,
      paperNumber,
    })
  } catch (err) {
    console.error('extract API 오류:', err)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 500 }
    )
  }
}
