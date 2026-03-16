import { NextRequest, NextResponse } from 'next/server'

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
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 })
    }

    const fileName = (file as File).name ?? 'unknown'
    const fileSize = file.size
    const mimeType = file.type

    // 50 MB 제한
    if (fileSize > 52_428_800) {
      return NextResponse.json(
        { error: '파일 크기는 50MB를 초과할 수 없습니다.' },
        { status: 413 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    let extractedText = ''
    let pageCount = 0

    // ── PDF 처리 ────────────────────────────────────────────────────────────
    if (
      mimeType === 'application/pdf' ||
      fileName.toLowerCase().endsWith('.pdf')
    ) {
      try {
        // pdf-parse의 테스트 파일 로드 버그를 우회하기 위해 lib 경로 직접 import
        const pdfParse = require('pdf-parse/lib/pdf-parse.js') as (buf: Buffer, opts?: object) => Promise<{ text: string; numpages: number }>
        const data = await pdfParse(buffer, { max: 0 })
        extractedText = data.text ?? ''
        pageCount = data.numpages ?? 0
      } catch (err) {
        console.error('PDF 파싱 오류:', err)
        return NextResponse.json(
          { error: 'PDF 텍스트 추출에 실패했습니다. 스캔 PDF는 지원되지 않습니다.' },
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
        {
          error:
            '텍스트를 추출할 수 없습니다. 스캔 이미지 PDF이거나 내용이 없는 파일입니다.',
        },
        { status: 422 }
      )
    }

    // 분석
    const analysis = analyzeText(extractedText)
    if (pageCount === 0) pageCount = analysis.estimatedPages

    // 미리보기 (앞 800자)
    const preview = buildPreview(extractedText)

    return NextResponse.json({
      success: true,
      fileName,
      fileSize,
      mimeType,
      pageCount,
      text: extractedText,
      preview,
      analysis,
    })
  } catch (err) {
    console.error('extract API 오류:', err)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' },
      { status: 500 }
    )
  }
}
