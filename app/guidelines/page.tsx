import { BookOpen, CheckCircle2 } from 'lucide-react'

const guidelines = [
  {
    category: '원고 분야',
    items: [
      '군사관련 연구, 군사학의 학문·교육 체계 발전 및 군사사상에 관한 기고문',
      '국방·군사 관련 정책·제도·군사전략 및 전쟁사·부기체계 등 국가안보문제에 관한 기고문',
      '북한 및 주변국가들의 군사적 전문지식에 관한 기고문',
      '국방경제, 군사비, 방위산업 및 안보문제와 연계되는 경제적 비용에 관한 기고문 또는 논평기사',
    ],
  },
  {
    category: '원고 형식',
    items: [
      '글자 크기: 11pt',
      '줄간격: 160%',
      '분량: A4 20~25매',
      '제목 · 소제목 · 본문 · 참고문헌 포함',
      '한글과 영문 Abstract 필수',
    ],
  },
  {
    category: '제출 방법',
    items: [
      '원고는 E-mail로 학회에 우편 제출',
      '기한: 매 분기 마감일 15일 전까지 도착',
      '기한 이후 도착 원고는 차후 분기 심사위원회에서 회부',
    ],
  },
]

export default function GuidelinesPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">투고 규정</h1>
        <p className="text-sm text-gray-500 mt-1">계간 군사논단 기고문 투고 규정 및 심사 기준</p>
      </div>

      <div className="bg-gradient-to-br from-military-primary to-military-secondary text-white rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3 mb-2">
          <BookOpen size={20} />
          <h2 className="text-lg font-bold">계간 군사논단</h2>
        </div>
        <p className="text-blue-200 text-sm">사단법인 한국군사학회 발행 · 등록번호 부산-00021 · ISSN 1976-0620</p>
        <p className="text-blue-200 text-sm mt-1">대표전화: 02-795-2077 · FAX: 02-795-2078</p>
      </div>

      <div className="space-y-4">
        {guidelines.map((section) => (
          <div key={section.category} className="bg-white rounded-xl border border-gray-200 p-5 shadow-card">
            <h3 className="text-sm font-bold text-military-primary mb-3 flex items-center gap-2">
              <span className="w-5 h-5 bg-military-light rounded flex items-center justify-center">
                <CheckCircle2 size={12} className="text-military-primary" />
              </span>
              {section.category}
            </h3>
            <ul className="space-y-2">
              {section.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-military-gold mt-2 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  )
}
