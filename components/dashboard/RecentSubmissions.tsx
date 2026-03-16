import Link from 'next/link'
import { FileText, ChevronRight } from 'lucide-react'
import { cn, getStatusLabel, getStatusColor } from '@/lib/utils'

interface Submission {
  id: string
  title: string
  author: string
  affiliation: string
  submittedAt: string
  status: 'pending' | 'reviewing' | 'accepted' | 'rejected' | 'revision'
  score?: number
  category: string
}

const submissions: Submission[] = [
  {
    id: 'SUB-2025-001',
    title: '한반도 억제전략의 재정립: 복합억제 개념을 중심으로',
    author: '김정훈',
    affiliation: '국방대학교',
    submittedAt: '2025-01-15',
    status: 'reviewing',
    score: 82,
    category: '국방정책',
  },
  {
    id: 'SUB-2025-002',
    title: '드론 비대칭 위협에 대한 다층 방어체계 연구',
    author: '이수진',
    affiliation: '합동군사대학교',
    submittedAt: '2025-01-18',
    status: 'accepted',
    score: 91,
    category: '방위산업',
  },
  {
    id: 'SUB-2025-003',
    title: '북한 핵능력 고도화와 한미동맹 역할 변화',
    author: '박성민',
    affiliation: '한국국방연구원',
    submittedAt: '2025-01-22',
    status: 'pending',
    category: '북한·주변국',
  },
  {
    id: 'SUB-2025-004',
    title: '미래 전장 환경에서의 인공지능 전투체계 통합',
    author: '최영희',
    affiliation: '육군사관학교',
    submittedAt: '2025-01-25',
    status: 'revision',
    score: 67,
    category: '군사학 이론',
  },
  {
    id: 'SUB-2025-005',
    title: '국방 R&D 투자효율성 분석과 방위산업 발전 방향',
    author: '장민준',
    affiliation: '방위사업청',
    submittedAt: '2025-01-28',
    status: 'rejected',
    score: 44,
    category: '방위산업',
  },
]

export default function RecentSubmissions() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden">
      {/* 헤더 */}
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">최근 투고 현황</h3>
          <p className="text-xs text-gray-400 mt-0.5">통권 제121호 접수 논문</p>
        </div>
        <Link
          href="/upload"
          className="text-xs text-military-accent font-medium flex items-center gap-1 hover:underline"
        >
          전체 보기 <ChevronRight size={12} />
        </Link>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                접수번호
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                논문 제목
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                저자 / 소속
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                분야
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                AI 점수
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                심사 상태
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                접수일
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {submissions.map((sub) => (
              <tr key={sub.id} className="hover:bg-gray-50 transition-colors group">
                <td className="px-4 py-3">
                  <span className="text-xs font-mono text-gray-500">{sub.id}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-start gap-2">
                    <div className="w-7 h-7 rounded-lg bg-military-light flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FileText size={13} className="text-military-primary" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-800 line-clamp-2 max-w-[220px] leading-snug">
                        {sub.title}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <p className="text-xs font-semibold text-gray-800">{sub.author}</p>
                  <p className="text-[11px] text-gray-400">{sub.affiliation}</p>
                </td>
                <td className="px-4 py-3">
                  <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    {sub.category}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {sub.score != null ? (
                    <ScoreBar score={sub.score} />
                  ) : (
                    <span className="text-xs text-gray-300">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={cn(
                      'text-[11px] font-semibold px-2 py-0.5 rounded-full',
                      getStatusColor(sub.status)
                    )}
                  >
                    {getStatusLabel(sub.status)}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-xs text-gray-400">{sub.submittedAt}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 80 ? 'text-green-600' : score >= 60 ? 'text-amber-600' : 'text-red-500'
  const barColor =
    score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-amber-400' : 'bg-red-400'

  return (
    <div className="flex flex-col items-center gap-1">
      <span className={cn('text-xs font-bold', color)}>{score}</span>
      <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', barColor)}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}
