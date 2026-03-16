import {
  Upload,
  BookOpen,
  FileText,
  CheckCircle2,
  AlertCircle,
  Info,
} from 'lucide-react'
import UploadClient from '@/components/upload/UploadClient'

export default function UploadPage() {
  return (
    <div className="max-w-7xl mx-auto">
      {/* 페이지 헤더 */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 bg-military-light rounded-lg flex items-center justify-center">
              <Upload size={15} className="text-military-primary" />
            </div>
            <span className="text-xs text-gray-400 font-medium">Phase 2</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">논문 업로드</h1>
          <p className="text-sm text-gray-500 mt-1">
            드래그 앤 드롭으로 논문 파일을 업로드하고 텍스트를 추출합니다
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* 메인: 업로드 영역 */}
        <div className="xl:col-span-2 space-y-0">
          <UploadClient />
        </div>

        {/* 사이드: 투고 규정 요약 */}
        <div className="space-y-4">
          {/* 투고 규정 카드 */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-card overflow-hidden">
            <div className="px-4 py-3 bg-military-primary flex items-center gap-2">
              <BookOpen size={15} className="text-blue-200" />
              <span className="text-sm font-bold text-white">투고 규정 요약</span>
            </div>
            <div className="p-4 space-y-3">
              <RuleSection title="분량 기준">
                <RuleItem icon="ok" text="A4 20~25매 (11pt, 160%)" />
                <RuleItem icon="ok" text="글자 수 기준: 약 34,000~42,500자" />
              </RuleSection>

              <RuleSection title="필수 포함 항목">
                <RuleItem icon="ok" text="한글 및 영문 Abstract" />
                <RuleItem icon="ok" text="핵심어 (Key Words)" />
                <RuleItem icon="ok" text="참고문헌 목록" />
              </RuleSection>

              <RuleSection title="투고 분야">
                <RuleItem icon="field" text="군사학 이론 · 교육체계" />
                <RuleItem icon="field" text="국방정책 · 군사전략" />
                <RuleItem icon="field" text="북한 · 주변국 안보" />
                <RuleItem icon="field" text="방위산업 · 국방경제" />
              </RuleSection>

              <RuleSection title="파일 형식">
                <RuleItem icon="file" text="PDF (권장)" />
                <RuleItem icon="file" text="MS Word (.docx)" />
                <RuleItem icon="warn" text="HWP → DOCX/PDF 변환 필요" />
              </RuleSection>
            </div>
          </div>

          {/* AI 추출 안내 */}
          <div className="bg-blue-50 rounded-xl border border-blue-100 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Info size={14} className="text-military-accent" />
              <span className="text-sm font-semibold text-military-primary">텍스트 추출 안내</span>
            </div>
            <ul className="space-y-1.5 text-xs text-gray-600">
              <li className="flex items-start gap-1.5">
                <span className="text-military-accent mt-0.5">•</span>
                스캔 이미지 PDF는 텍스트 추출이 불가합니다
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-military-accent mt-0.5">•</span>
                추출된 텍스트는 AI 평가 (Phase 3)에 자동으로 전달됩니다
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-military-accent mt-0.5">•</span>
                분량, 초록, 참고문헌 포함 여부를 자동 검사합니다
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-military-accent mt-0.5">•</span>
                최대 파일 크기: 50MB / 최대 10개 파일
              </li>
            </ul>
          </div>

          {/* 처리 단계 안내 */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-card p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">처리 단계</h3>
            <div className="space-y-3">
              <ProcessStep
                num={1}
                label="파일 업로드"
                desc="PDF / DOCX 파일 선택"
                color="bg-military-primary"
              />
              <ProcessStep
                num={2}
                label="텍스트 추출"
                desc="서버에서 본문 파싱"
                color="bg-purple-600"
              />
              <ProcessStep
                num={3}
                label="형식 검사"
                desc="분량 · 초록 · 참고문헌 확인"
                color="bg-green-600"
              />
              <ProcessStep
                num={4}
                label="AI 평가 준비"
                desc="Phase 3으로 전달"
                color="bg-military-gold"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── 사이드바 컴포넌트 ─────────────────────────────────────────────────────

function RuleSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
        {title}
      </p>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function RuleItem({
  icon,
  text,
}: {
  icon: 'ok' | 'warn' | 'file' | 'field'
  text: string
}) {
  const icons = {
    ok: <CheckCircle2 size={12} className="text-green-500 flex-shrink-0 mt-0.5" />,
    warn: <AlertCircle size={12} className="text-amber-500 flex-shrink-0 mt-0.5" />,
    file: <FileText size={12} className="text-blue-400 flex-shrink-0 mt-0.5" />,
    field: <span className="w-3 h-3 rounded-full bg-military-light flex-shrink-0 mt-0.5 inline-block" />,
  }
  return (
    <div className="flex items-start gap-1.5 text-xs text-gray-600">
      {icons[icon]}
      {text}
    </div>
  )
}

function ProcessStep({
  num,
  label,
  desc,
  color,
}: {
  num: number
  label: string
  desc: string
  color: string
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${color}`}
      >
        {num}
      </div>
      <div>
        <p className="text-xs font-semibold text-gray-700">{label}</p>
        <p className="text-[11px] text-gray-400">{desc}</p>
      </div>
    </div>
  )
}
