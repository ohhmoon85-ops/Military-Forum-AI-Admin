// ─── 군사 전문 용어 표준화 사전 ──────────────────────────────────────────────
// [원문 패턴, 표준화 표현] 순서
export const MILITARY_TERM_MAP: [RegExp, string][] = [
  // 영문 약어 → 한글(영문) 표준 표기
  [/\bUAV\b/g, '무인항공기(UAV)'],
  [/\bUAS\b/g, '무인항공기체계(UAS)'],
  [/\bC2\b/g, '지휘통제(C2)'],
  [/\bC4ISR\b/g, '지휘통제통신컴퓨터정보감시정찰(C4ISR)'],
  [/\bA2\/AD\b/g, '접근거부·지역거부(A2/AD)'],
  [/\bROE\b/g, '교전규칙(ROE)'],
  [/\bDIME\b/g, '외교·정보·군사·경제(DIME)'],
  [/\bWMD\b/g, '대량살상무기(WMD)'],
  [/\bOPCON\b/g, '작전통제권(OPCON)'],
  [/\bCONPLAN\b/g, '작전계획(CONPLAN)'],
  [/\bMOSS\b/g, '임무수행 필수과업(MOSS)'],
  [/\bNCG\b/g, '핵협의그룹(NCG)'],
  [/\bICBM\b/g, '대륙간탄도미사일(ICBM)'],
  [/\bSLBM\b/g, '잠수함발사탄도미사일(SLBM)'],
  [/\bMRBM\b/g, '중거리탄도미사일(MRBM)'],
  [/\bPGM\b/g, '정밀유도무기(PGM)'],
  [/\bISR\b/g, '감시정찰(ISR)'],
  [/\bPKO\b/g, '평화유지활동(PKO)'],
  [/\bRMA\b/g, '군사혁신(RMA)'],
  [/\bHALE\b/g, '고고도장기체공(HALE)'],
  [/\bSUAS\b/g, '소형무인항공기체계(SUAS)'],
  // 한글 약식 → 표준 표기
  [/국방부(?!\s*[()（）])/g, '국방부(MND)'],
  [/합참(?!\s*[()（）])/g, '합동참모본부(합참)'],
]

// ─── 서식 규칙 옵션 ──────────────────────────────────────────────────────────

export interface FormatOptions {
  normalizeWhitespace: boolean   // 공백 정규화
  fixPunctuation: boolean        // 문장부호 교정
  standardizeTerms: boolean      // 군사 용어 표준화
  refineTone: boolean            // AI 문체 정제 (Claude)
  normalizeHeadings: boolean     // 장·절 번호 정규화
}

export const DEFAULT_OPTIONS: FormatOptions = {
  normalizeWhitespace: true,
  fixPunctuation: true,
  standardizeTerms: true,
  refineTone: false,
  normalizeHeadings: true,
}

// ─── 변경 로그 ───────────────────────────────────────────────────────────────

export interface ChangeLog {
  rule: string
  count: number
  examples: string[]
}

// ─── 규칙 적용 함수들 ────────────────────────────────────────────────────────

function normalizeWhitespace(text: string, logs: ChangeLog[]): string {
  let count = 0

  // 연속 공백 → 단일 공백
  const step1 = text.replace(/[ \t]{2,}/g, () => { count++; return ' ' })
  // 3줄 이상 빈 줄 → 2줄
  const step2 = step1.replace(/\n{3,}/g, () => { count++; return '\n\n' })
  // 줄 끝 공백 제거
  const step3 = step2.replace(/[ \t]+\n/g, () => { count++; return '\n' })

  if (count > 0) {
    logs.push({ rule: '공백 정규화', count, examples: ['연속 공백·빈 줄 정리'] })
  }
  return step3
}

function fixPunctuation(text: string, logs: ChangeLog[]): string {
  let count = 0
  const ex: string[] = []

  let result = text
  // 마침표 뒤 공백 규정
  result = result.replace(/([.!?])([^\s\n"'\u2019\u201d])/g, (_, p, n) => { count++; return `${p} ${n}` })
  // 열린 괄호 앞 공백
  result = result.replace(/([^\s\n])\(/g, (_, p) => { count++; ex.push('괄호 앞 공백'); return `${p} (` })
  // 닫힌 괄호 뒤 공백 (단, 문장 끝 제외)
  result = result.replace(/\)([^\s\n.,!?;:)）])/g, (_, n) => { count++; return `) ${n}` })
  // 쉼표 뒤 공백
  result = result.replace(/,([^\s\n])/g, (_, n) => { count++; return `, ${n}` })
  // 중복 마침표
  result = result.replace(/\.{2,}/g, () => { count++; ex.push('중복 마침표 제거'); return '.' })

  if (count > 0) {
    logs.push({ rule: '문장부호 교정', count, examples: ex.length ? ex : ['마침표·괄호·쉼표 공백 교정'] })
  }
  return result
}

function standardizeMilitaryTerms(text: string, logs: ChangeLog[]): string {
  let total = 0
  const termExamples: string[] = []
  let result = text

  for (const [pattern, replacement] of MILITARY_TERM_MAP) {
    const matches = result.match(pattern)
    if (matches) {
      total += matches.length
      termExamples.push(`${matches[0]} → ${replacement}`)
      result = result.replace(pattern, replacement)
    }
  }

  if (total > 0) {
    logs.push({ rule: '군사 전문 용어 표준화', count: total, examples: termExamples.slice(0, 4) })
  }
  return result
}

function normalizeHeadings(text: string, logs: ChangeLog[]): string {
  let count = 0
  let result = text

  // 로마자 장 번호 → 한글 로마자 (Ⅰ~Ⅹ 유지, 소문자 i, ii 등을 대문자로)
  const romanMap: Record<string, string> = {
    'ⅰ': 'Ⅰ', 'ⅱ': 'Ⅱ', 'ⅲ': 'Ⅲ', 'ⅳ': 'Ⅳ', 'ⅴ': 'Ⅴ',
    'ⅵ': 'Ⅵ', 'ⅶ': 'Ⅶ', 'ⅷ': 'Ⅷ', 'ⅸ': 'Ⅸ', 'ⅹ': 'Ⅹ',
  }
  for (const [lower, upper] of Object.entries(romanMap)) {
    if (result.includes(lower)) { result = result.replaceAll(lower, upper); count++ }
  }

  // 절 번호 패턴 정규화: "1.1 " → "1.1 " (이미 ok), "1.1." → "1.1 "
  result = result.replace(/^(\d+\.\d+)\.\s/gm, (_, n) => { count++; return `${n} ` })

  if (count > 0) {
    logs.push({ rule: '장·절 번호 정규화', count, examples: ['소문자 로마자 → 대문자 변환'] })
  }
  return result
}

// ─── 메인 서식 적용 함수 ─────────────────────────────────────────────────────

export function applyFormatRules(
  text: string,
  options: FormatOptions
): { formatted: string; logs: ChangeLog[]; stats: FormatStats } {
  const logs: ChangeLog[] = []
  let result = text

  if (options.normalizeWhitespace) result = normalizeWhitespace(result, logs)
  if (options.fixPunctuation)      result = fixPunctuation(result, logs)
  if (options.standardizeTerms)    result = standardizeMilitaryTerms(result, logs)
  if (options.normalizeHeadings)   result = normalizeHeadings(result, logs)

  const stats = computeStats(text, result, logs)
  return { formatted: result, logs, stats }
}

// ─── 통계 ────────────────────────────────────────────────────────────────────

export interface FormatStats {
  totalRules: number
  totalChanges: number
  originalChars: number
  formattedChars: number
  charDiff: number
}

function computeStats(original: string, formatted: string, logs: ChangeLog[]): FormatStats {
  return {
    totalRules: logs.length,
    totalChanges: logs.reduce((s, l) => s + l.count, 0),
    originalChars: original.replace(/\s/g, '').length,
    formattedChars: formatted.replace(/\s/g, '').length,
    charDiff: formatted.replace(/\s/g, '').length - original.replace(/\s/g, '').length,
  }
}
