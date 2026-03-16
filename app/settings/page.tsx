import { Settings } from 'lucide-react'

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">시스템 설정</h1>
        <p className="text-sm text-gray-500 mt-1">AI 모델 설정, 평가 기준, 알림 설정</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <Settings size={28} className="text-gray-500" />
        </div>
        <h2 className="text-lg font-semibold text-gray-700">시스템 설정</h2>
        <p className="text-sm text-gray-400 mt-2">추후 구현 예정입니다</p>
      </div>
    </div>
  )
}
