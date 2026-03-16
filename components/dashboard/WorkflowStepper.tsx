import { Upload, BrainCircuit, GitCompare, MessageSquareText, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Step {
  id: number
  label: string
  sublabel: string
  icon: React.ReactNode
  status: 'completed' | 'active' | 'pending'
}

const steps: Step[] = [
  {
    id: 1,
    label: '논문 접수',
    sublabel: 'PDF/DOCX 업로드',
    icon: <Upload size={18} />,
    status: 'completed',
  },
  {
    id: 2,
    label: 'AI 평가 · 분석',
    sublabel: '적합성 · 요약 · 표절',
    icon: <BrainCircuit size={18} />,
    status: 'active',
  },
  {
    id: 3,
    label: '양식 수정',
    sublabel: '자동 서식 & Diff 뷰',
    icon: <GitCompare size={18} />,
    status: 'pending',
  },
  {
    id: 4,
    label: '피드백 발송',
    sublabel: '수정 로드맵 제공',
    icon: <MessageSquareText size={18} />,
    status: 'pending',
  },
  {
    id: 5,
    label: '최종 확정',
    sublabel: '발간 승인',
    icon: <CheckCircle2 size={18} />,
    status: 'pending',
  },
]

export default function WorkflowStepper() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-card">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">투고 심사 워크플로우</h3>
      <div className="relative flex items-start justify-between">
        {/* 연결선 */}
        <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-200 z-0" />
        <div
          className="absolute top-5 left-5 h-0.5 bg-military-primary z-0 transition-all duration-700"
          style={{ width: '30%' }}
        />

        {steps.map((step) => (
          <div key={step.id} className="relative z-10 flex flex-col items-center flex-1">
            {/* 아이콘 원 */}
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center transition-all',
                step.status === 'completed' &&
                  'bg-military-primary text-white shadow-md',
                step.status === 'active' &&
                  'bg-military-accent text-white shadow-lg ring-4 ring-blue-100',
                step.status === 'pending' && 'bg-gray-100 text-gray-400 border-2 border-gray-200'
              )}
            >
              {step.icon}
            </div>

            {/* 텍스트 */}
            <div className="text-center mt-2">
              <p
                className={cn(
                  'text-xs font-semibold leading-tight',
                  step.status === 'completed' && 'text-military-primary',
                  step.status === 'active' && 'text-military-accent',
                  step.status === 'pending' && 'text-gray-400'
                )}
              >
                {step.label}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{step.sublabel}</p>
            </div>

            {/* 상태 표시 */}
            {step.status === 'active' && (
              <span className="mt-1.5 text-[9px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded-full">
                진행 중
              </span>
            )}
            {step.status === 'completed' && (
              <span className="mt-1.5 text-[9px] bg-green-100 text-green-700 font-bold px-1.5 py-0.5 rounded-full">
                완료
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
