'use client'

import { useState } from 'react'
import { Bell, ChevronDown, LogOut, Settings, User, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'

interface GNBProps {
  onMenuToggle: () => void
}

const notifications = [
  { id: 1, message: '신규 논문 투고가 접수되었습니다.', time: '5분 전', unread: true },
  { id: 2, message: 'AI 평가가 완료되었습니다. (홍길동 저)', time: '1시간 전', unread: true },
  { id: 3, message: '표절 검사 결과가 준비되었습니다.', time: '2시간 전', unread: false },
]

export default function GNB({ onMenuToggle }: GNBProps) {
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const unreadCount = notifications.filter((n) => n.unread).length

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-military-primary border-b border-navy-700 flex items-center px-4 shadow-lg">
      {/* 좌측: 로고 + 메뉴 토글 */}
      <div className="flex items-center gap-3 min-w-[240px]">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-md text-blue-200 hover:bg-navy-700 hover:text-white transition-colors"
          aria-label="메뉴 토글"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-2">
          {/* 군 마크 아이콘 */}
          <div className="w-8 h-8 bg-military-gold rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-xs">군</span>
          </div>
          <div className="leading-tight">
            <p className="text-white font-bold text-sm tracking-tight">군사논단</p>
            <p className="text-blue-300 text-[10px]">AI Admin System</p>
          </div>
        </div>
      </div>

      {/* 중앙: 시스템 상태 */}
      <div className="flex-1 flex justify-center">
        <div className="hidden md:flex items-center gap-2 bg-navy-700/50 rounded-full px-4 py-1.5">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-blue-200 text-xs font-medium">
            계간 군사논단 투고 관리시스템
          </span>
        </div>
      </div>

      {/* 우측: 알림 + 사용자 */}
      <div className="flex items-center gap-2 min-w-[200px] justify-end">
        {/* 알림 */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications)
              setShowUserMenu(false)
            }}
            className="relative p-2 rounded-md text-blue-200 hover:bg-navy-700 hover:text-white transition-colors"
            aria-label="알림"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <span className="font-semibold text-gray-800 text-sm">알림</span>
                <span className="text-xs text-military-accent font-medium cursor-pointer hover:underline">
                  모두 읽음
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-gray-50">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      'px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors',
                      n.unread && 'bg-blue-50/60'
                    )}
                  >
                    <div className="flex items-start gap-2">
                      {n.unread && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                      )}
                      {!n.unread && <span className="w-2 h-2 mt-1.5 flex-shrink-0" />}
                      <div>
                        <p className="text-sm text-gray-700 leading-snug">{n.message}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="px-4 py-2 border-t border-gray-100 text-center">
                <span className="text-xs text-military-accent font-medium cursor-pointer hover:underline">
                  모든 알림 보기
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 구분선 */}
        <div className="w-px h-6 bg-navy-600" />

        {/* 사용자 메뉴 */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu)
              setShowNotifications(false)
            }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-blue-200 hover:bg-navy-700 hover:text-white transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-military-secondary flex items-center justify-center">
              <User size={14} className="text-blue-200" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-white text-xs font-semibold leading-tight">관리자</p>
              <p className="text-blue-300 text-[10px] leading-tight">편집위원회</p>
            </div>
            <ChevronDown size={14} className="text-blue-300" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-12 w-52 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <p className="font-semibold text-gray-800 text-sm">관리자</p>
                <p className="text-xs text-gray-500">admin@koams.or.kr</p>
              </div>
              <div className="py-1">
                <MenuItem icon={<User size={15} />} label="프로필 설정" />
                <MenuItem icon={<Settings size={15} />} label="시스템 설정" />
              </div>
              <div className="py-1 border-t border-gray-100">
                <MenuItem
                  icon={<LogOut size={15} />}
                  label="로그아웃"
                  className="text-red-600 hover:bg-red-50"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 배경 클릭 시 드롭다운 닫기 */}
      {(showNotifications || showUserMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowNotifications(false)
            setShowUserMenu(false)
          }}
        />
      )}
    </header>
  )
}

function MenuItem({
  icon,
  label,
  className,
}: {
  icon: React.ReactNode
  label: string
  className?: string
}) {
  return (
    <button
      className={cn(
        'w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors',
        className
      )}
    >
      <span className="text-gray-500">{icon}</span>
      {label}
    </button>
  )
}
