import { MessageSquareText, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function FeedbackPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center">
            <MessageSquareText size={15} className="text-green-600" />
          </div>
          <span className="text-xs text-gray-400 font-medium">Phase 3</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">재투고 피드백</h1>
        <p className="text-sm text-gray-500 mt-1">
          미선정·수정요청 논문에 대한 AI 맞춤형 수정 로드맵을 제공합니다
        </p>
      </div>

      {/* 안내 카드 */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-card p-8 text-center">
        <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <MessageSquareText size={30} className="text-green-600" />
        </div>
        <h2 className="text-lg font-bold text-gray-800 mb-2">피드백은 AI 평가 패널에서 확인하세요</h2>
        <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
          재투고 피드백은 AI 평가·분석 페이지의 <strong>&apos;재투고 피드백&apos;</strong> 탭에서
          논문별로 직접 생성하고 확인할 수 있습니다.
        </p>
        <Link
          href="/evaluation"
          className="inline-flex items-center gap-2 bg-military-primary hover:bg-military-secondary text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors shadow-sm"
        >
          AI 평가 페이지로 이동
          <ArrowRight size={15} />
        </Link>
      </div>

      {/* 피드백 기능 소개 */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            title: '맞춤형 수정 가이드',
            desc: '논문 내용을 분석하여 미선정·수정요청 사유에 맞는 구체적인 수정 방법을 안내합니다.',
            icon: '📋',
          },
          {
            title: '우선순위 로드맵',
            desc: '긴급·권고·선택 3단계로 수정 항목을 분류하여 효율적인 수정 순서를 제시합니다.',
            icon: '🗺️',
          },
          {
            title: '재투고 절차 안내',
            desc: '수정 완료 후 다음 분기 재투고 방법과 제출 절차를 상세히 안내합니다.',
            icon: '📬',
          },
        ].map((card) => (
          <div key={card.title} className="bg-white rounded-xl border border-gray-200 p-4 shadow-card">
            <div className="text-2xl mb-3">{card.icon}</div>
            <h3 className="text-sm font-bold text-gray-800 mb-2">{card.title}</h3>
            <p className="text-xs text-gray-500 leading-relaxed">{card.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
