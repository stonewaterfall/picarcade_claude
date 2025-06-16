'use client'

import { Button } from './button'
import { Palette, Video, Wand2, Search } from 'lucide-react'

interface SidebarProps {
  sidebarOpen: boolean
  selectedTool: string
  setSelectedTool: (tool: string) => void
  generationsList: any[]
  pendingGenerations: string[]
  user?: { creditsUsed?: number } | null
}

const tools = [
  { id: 'generate', icon: Palette, label: 'Generate', description: 'Create images and videos from text' },
  { id: 'enhance', icon: Wand2, label: 'Enhance', description: 'Improve and upscale existing content' },
  { id: 'edit', icon: Video, label: 'Edit', description: 'Advanced editing and manipulation' },
  { id: 'analyze', icon: Search, label: 'Analyze', description: 'Understand and describe content' }
]

export function Sidebar({ 
  sidebarOpen, 
  selectedTool, 
  setSelectedTool, 
  generationsList, 
  pendingGenerations, 
  user 
}: SidebarProps) {
  return (
    <aside className={`
      ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
      lg:translate-x-0 transition-transform duration-200 ease-in-out
      fixed lg:relative z-30 w-64 h-screen bg-white border-r
    `}>
      <div className="p-4">
        <h2 className="font-semibold text-gray-900 mb-4">Tools</h2>
        <div className="space-y-2">
          {tools.map((tool) => (
            <Button
              key={tool.id}
              variant={selectedTool === tool.id ? "default" : "ghost"}
              className="w-full justify-start"
              onClick={() => setSelectedTool(tool.id as any)}
            >
              <tool.icon className="w-4 h-4 mr-3" />
              <div className="text-left">
                <div className="font-medium">{tool.label}</div>
                <div className="text-xs text-gray-500">{tool.description}</div>
              </div>
            </Button>
          ))}
        </div>

        <div className="mt-8">
          <h3 className="font-semibold text-gray-900 mb-2">Statistics</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Generations</span>
              <span className="font-medium">{generationsList.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Processing</span>
              <span className="font-medium">{pendingGenerations.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Credits Used</span>
              <span className="font-medium">{user?.creditsUsed || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}