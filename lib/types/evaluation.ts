// ─── 평가 점수 ────────────────────────────────────────────────────────────────

export interface ScoreItem {
  score: number
  max: number
  comment: string
}

export interface EvaluationScores {
  topic_relevance: ScoreItem      // 주제 적합성  max 30
  logic_structure: ScoreItem      // 논리성·체계성 max 25
  academic_contribution: ScoreItem // 학술적 기여도 max 20
  format_compliance: ScoreItem    // 형식 준수도   max 15
  references: ScoreItem           // 참고문헌      max 10
}

// ─── Executive Summary ───────────────────────────────────────────────────────

export interface ExecutiveSummary {
  background: string        // 연구 배경 및 목적
  main_argument: string     // 핵심 주장 및 논리
  evidence: string          // 데이터 및 근거
  conclusion: string        // 결론
  policy_implication: string // 정책적 시사점
}

// ─── 표절 검사 ────────────────────────────────────────────────────────────────

export interface SuspiciousPassage {
  text: string
  reason: string
  risk: 'high' | 'medium' | 'low'
}

export interface PlagiarismResult {
  similarity_estimate: number   // 0~100
  risk_level: 'low' | 'medium' | 'high'
  suspicious_passages: SuspiciousPassage[]
  ethics_note: string
}

// ─── 재투고 피드백 ────────────────────────────────────────────────────────────

export interface FeedbackItem {
  priority: 'high' | 'medium' | 'low'
  category: string
  issue: string
  suggestion: string
  effort: string
}

// ─── 전체 평가 결과 ──────────────────────────────────────────────────────────

export type Recommendation = 'accept' | 'revision' | 'reject'

export interface EvaluationResult {
  total_score: number
  recommendation: Recommendation
  scores: EvaluationScores
  executive_summary: ExecutiveSummary
  strengths: string[]
  weaknesses: string[]
  plagiarism: PlagiarismResult
  feedback_roadmap: FeedbackItem[]
  generated_at: string
  model_used: string
}

// ─── 논문 메타데이터 ─────────────────────────────────────────────────────────

export interface PaperMeta {
  id: string
  title: string
  author: string
  affiliation: string
  category: string
  submittedAt: string
  status: 'pending' | 'reviewing' | 'accepted' | 'rejected' | 'revision'
  text?: string
  prevScore?: number
  result?: EvaluationResult
}
