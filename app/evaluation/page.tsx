import { BrainCircuit, Sparkles } from 'lucide-react'
import EvaluationClient from '@/components/evaluation/EvaluationClient'

export default function EvaluationPage() {
  return (
    <div className="max-w-7xl mx-auto">
      {/* 페이지 헤더 */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 bg-purple-50 rounded-lg flex items-center justify-center">
              <BrainCircuit size={15} className="text-purple-600" />
            </div>
            <span className="text-xs text-gray-400 font-medium">Phase 3</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">AI 평가 · 분석</h1>
          <p className="text-sm text-gray-500 mt-1">
            Claude AI가 주제 적합성, 논리성, 학술 기여도, 표절 위험을 종합 분석합니다
          </p>
        </div>

        {/* 기능 요약 뱃지 */}
        <div className="hidden md:flex items-center gap-2">
          {['주제 적합성 (30점)', '논리성 (25점)', '기여도 (20점)', '표절 검사'].map((b) => (
            <span
              key={b}
              className="flex items-center gap-1 text-[11px] bg-purple-50 text-purple-700 font-medium px-2.5 py-1 rounded-full border border-purple-100"
            >
              <Sparkles size={10} />
              {b}
            </span>
          ))}
        </div>
      </div>

      <EvaluationClient />
    </div>
  )
}
