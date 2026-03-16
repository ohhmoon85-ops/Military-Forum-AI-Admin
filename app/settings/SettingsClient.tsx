'use client'

import { useState } from 'react'
import { Trash2, AlertTriangle, CheckCircle2, Loader2, RefreshCw } from 'lucide-react'

interface Props {
  dbConnected: boolean
}

export default function SettingsClient({ dbConnected }: Props) {
  const [step, setStep] = useState<'idle' | 'confirm' | 'loading' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [inputValue, setInputValue] = useState('')

  const CONFIRM_WORD = '초기화'

  const handleReset = async () => {
    setStep('loading')
    setErrorMsg('')

    try {
      const res = await fetch('/api/admin/reset', { method: 'POST' })
      const json = await res.json()

      if (!res.ok || json.error) {
        setErrorMsg(json.error ?? '초기화 실패')
        setStep('error')
      } else {
        setStep('done')
      }
    } catch {
      setErrorMsg('네트워크 오류가 발생했습니다.')
      setStep('error')
    }
  }

  const handleRetry = () => {
    setStep('idle')
    setInputValue('')
    setErrorMsg('')
  }

  return (
    <div className="bg-white rounded-xl border border-red-100 p-5">
      <div className="flex items-center gap-2 mb-1">
        <Trash2 size={15} className="text-red-500" />
        <h2 className="text-sm font-semibold text-red-700">데이터 초기화</h2>
      </div>
      <p className="text-xs text-gray-500 mb-5">
        투고 논문, AI 평가 결과를 모두 삭제합니다. 새 심사 회차를 시작할 때 사용하세요.
        <strong className="text-red-600"> 이 작업은 되돌릴 수 없습니다.</strong>
      </p>

      {/* 완료 상태 */}
      {step === 'done' && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg px-4 py-3">
          <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-green-800">초기화 완료</p>
            <p className="text-xs text-green-600 mt-0.5">모든 논문 및 평가 데이터가 삭제되었습니다.</p>
          </div>
          <button
            onClick={handleRetry}
            className="flex items-center gap-1 text-xs text-green-700 font-medium hover:underline"
          >
            <RefreshCw size={12} /> 닫기
          </button>
        </div>
      )}

      {/* 오류 상태 */}
      {step === 'error' && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
          <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-800">초기화 실패</p>
            <p className="text-xs text-red-600 mt-0.5">{errorMsg}</p>
          </div>
          <button
            onClick={handleRetry}
            className="text-xs text-red-700 font-medium hover:underline"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* 로딩 */}
      {step === 'loading' && (
        <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
          <Loader2 size={16} className="text-gray-500 animate-spin flex-shrink-0" />
          <p className="text-sm text-gray-600">초기화 중입니다...</p>
        </div>
      )}

      {/* 기본 상태 */}
      {step === 'idle' && (
        <button
          onClick={() => setStep('confirm')}
          disabled={!dbConnected}
          className="flex items-center gap-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 text-sm font-semibold px-4 py-2.5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Trash2 size={15} />
          전체 데이터 초기화
        </button>
      )}

      {/* 확인 단계 */}
      {step === 'confirm' && (
        <div className="border border-red-200 rounded-lg p-4 bg-red-50 space-y-3">
          <div className="flex items-start gap-2">
            <AlertTriangle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-800">정말로 초기화하시겠습니까?</p>
              <p className="text-xs text-red-600 mt-1">
                접수된 논문 전체와 AI 평가 결과가 영구 삭제됩니다.
              </p>
            </div>
          </div>
          <div>
            <label className="block text-xs text-red-700 font-medium mb-1">
              확인을 위해 아래에 <strong>&ldquo;{CONFIRM_WORD}&rdquo;</strong> 를 입력하세요
            </label>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={CONFIRM_WORD}
              className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-300 bg-white"
              autoFocus
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              disabled={inputValue !== CONFIRM_WORD}
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Trash2 size={14} />
              초기화 실행
            </button>
            <button
              onClick={handleRetry}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
