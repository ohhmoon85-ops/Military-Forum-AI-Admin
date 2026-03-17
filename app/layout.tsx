import type { Metadata } from 'next'
import './globals.css'
import MainLayout from '@/components/layout/MainLayout'

export const metadata: Metadata = {
  title: '군사논단 AI Admin | 사단법인 한국군사학회',
  description:
    '계간 군사논단 기고문 접수, 평가, 요약, 표절 검사 및 양식 수정을 자동화하는 AI 관리 시스템',
  keywords: ['군사논단', '한국군사학회', '기고문 심사', 'AI 평가', '학술지'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <body>
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  )
}
