import { Settings } from 'lucide-react'
import SettingsClient from './SettingsClient'
import { isDatabaseConfigured } from '@/lib/db'

export default function SettingsPage() {
  const dbConnected = isDatabaseConfigured()

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">시스템 설정</h1>
        <p className="text-sm text-gray-500 mt-1">데이터 관리 및 시스템 초기화</p>
      </div>

      {/* DB 연결 상태 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Settings size={15} />
          시스템 상태
        </h2>
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${dbConnected ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-sm text-gray-700">
            데이터베이스 연결:{' '}
            <strong className={dbConnected ? 'text-green-600' : 'text-red-600'}>
              {dbConnected ? '정상 연결됨 (Neon)' : '미연결 (데모 모드)'}
            </strong>
          </span>
        </div>
        {!dbConnected && (
          <p className="text-xs text-gray-400 mt-2 ml-5">
            Vercel 환경변수에 <code className="bg-gray-100 px-1 rounded">DATABASE_URL</code>을 설정하면 실제 DB가 연결됩니다.
          </p>
        )}
      </div>

      {/* 데이터 초기화 */}
      <SettingsClient dbConnected={dbConnected} />
    </div>
  )
}
