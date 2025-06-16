'use client'

import { Button } from './button'
import { CreditCard, Menu, User, X } from 'lucide-react'

interface HeaderProps {
  user?: { creditsRemaining: number } | null
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
}

export function Header({ user, sidebarOpen, setSidebarOpen }: HeaderProps) {
  return (
    <header className="bg-white border-b sticky top-0 z-40">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            PicArcade
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          {user && (
            <div className="text-sm text-gray-600">
              Credits: {user.creditsRemaining}
            </div>
          )}
          <Button variant="outline" size="sm">
            <CreditCard className="w-4 h-4 mr-2" />
            Upgrade
          </Button>
          <Button variant="ghost" size="icon">
            <User className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}