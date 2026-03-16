import { BarChart3 } from 'lucide-react'

export default function ReportsPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">통계 리포트</h1>
        <p className="text-sm text-gray-500 mt-1">투고 현황, 채택률, 분야별 통계 시각화</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
          <BarChart3 size={28} className="text-blue-600" />
        </div>
        <h2 className="text-lg font-semibold text-gray-700">통계 리포트</h2>
        <p className="text-sm text-gray-400 mt-2">추후 구현 예정입니다</p>
      </div>
    </div>
  )
}
