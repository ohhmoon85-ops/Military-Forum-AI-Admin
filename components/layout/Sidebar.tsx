'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Upload,
  BrainCircuit,
  GitCompare,
  MessageSquareText,
  FileText,
  ChevronRight,
  BookOpen,
  BarChart3,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  isOpen: boolean
}

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  badge?: string | number
  description?: string
}

const mainNavItems: NavItem[] = [
  {
    label: '대시보드',
    href: '/',
    icon: <LayoutDashboard size={18} />,
    description: '전체 현황 요약',
  },
  {
    label: '논문 업로드',
    href: '/upload',
    icon: <Upload size={18} />,
    description: 'PDF / DOCX 드래그 업로드',
  },
  {
    label: 'AI 평가 · 분석',
    href: '/evaluation',
    icon: <BrainCircuit size={18} />,
    description: '적합성 점수 · 요약 · 표절',
  },
  {
    label: '양식 수정 · 비교',
    href: '/formatting',
    icon: <GitCompare size={18} />,
    description: '자동 서식 적용 & Diff 뷰',
  },
  {
    label: '재투고 피드백',
    href: '/feedback',
    icon: <MessageSquareText size={18} />,
    description: '수정 로드맵 자동 생성',
  },
]

const secondaryNavItems: NavItem[] = [
  {
    label: '투고 규정',
    href: '/guidelines',
    icon: <BookOpen size={18} />,
  },
  {
    label: '통계 리포트',
    href: '/reports',
    icon: <BarChart3 size={18} />,
  },
  {
    label: '시스템 설정',
    href: '/settings',
    icon: <Settings size={18} />,
  },
]


export default function Sidebar({ isOpen }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* 모바일 오버레이 */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-30 md:hidden" />
      )}

      <aside
        className={cn(
          'fixed top-16 left-0 bottom-0 z-40 w-64 bg-white border-r border-gray-200',
          'flex flex-col transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'md:translate-x-0'
        )}
      >
        {/* 발간 현황 배너 */}
        <div className="mx-3 mt-3 rounded-lg bg-gradient-to-br from-military-primary to-military-secondary p-3">
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-blue-200" />
            <span className="text-white font-bold text-sm">군사논단 관리시스템</span>
          </div>
          <p className="text-blue-300 text-[11px] mt-1">사단법인 한국군사학회</p>
        </div>

        {/* 메인 네비게이션 */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          <div className="mb-1 px-2">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
              주요 기능
            </span>
          </div>
          <ul className="space-y-0.5">
            {mainNavItems.map((item) => (
              <NavLink key={item.href} item={item} active={pathname === item.href} />
            ))}
          </ul>

          <div className="mt-5 mb-1 px-2">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
              관리
            </span>
          </div>
          <ul className="space-y-0.5">
            {secondaryNavItems.map((item) => (
              <NavLink key={item.href} item={item} active={pathname === item.href} />
            ))}
          </ul>
        </nav>

        {/* 하단 버전 정보 */}
        <div className="px-4 py-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[11px] text-gray-500 font-medium">Military Forum AI Admin</p>
              <p className="text-[10px] text-gray-400">v1.0.0 · 사단법인 한국군사학회</p>
            </div>
            <div className="w-2 h-2 rounded-full bg-green-400" title="서버 정상 운영 중" />
          </div>
        </div>
      </aside>
    </>
  )
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <li>
      <Link
        href={item.href}
        className={cn(
          'group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-150',
          active
            ? 'bg-military-light text-military-primary font-semibold shadow-sm border border-blue-100'
            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
        )}
      >
        {/* 아이콘 */}
        <span
          className={cn(
            'flex-shrink-0 transition-colors',
            active ? 'text-military-primary' : 'text-gray-400 group-hover:text-gray-600'
          )}
        >
          {item.icon}
        </span>

        {/* 레이블 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate">{item.label}</span>
          </div>
          {item.description && (
            <p className="text-[10px] text-gray-400 truncate mt-0.5">{item.description}</p>
          )}
        </div>

        {/* 배지 또는 화살표 */}
        {item.badge ? (
          <span className="flex-shrink-0 min-w-[20px] h-5 bg-military-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {item.badge}
          </span>
        ) : (
          <ChevronRight
            size={14}
            className={cn(
              'flex-shrink-0 transition-all',
              active ? 'text-military-primary' : 'text-gray-300 group-hover:text-gray-400 group-hover:translate-x-0.5'
            )}
          />
        )}
      </Link>
    </li>
  )
}
