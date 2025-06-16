'use client'

import React from 'react'
import { Palette, Video, Wand2, Search } from 'lucide-react'

interface ToolHeaderProps {
  selectedTool: string
}

const tools = [
  { id: 'generate', icon: Palette, label: 'Generate', description: 'Create images and videos from text' },
  { id: 'enhance', icon: Wand2, label: 'Enhance', description: 'Improve and upscale existing content' },
  { id: 'edit', icon: Video, label: 'Edit', description: 'Advanced editing and manipulation' },
  { id: 'analyze', icon: Search, label: 'Analyze', description: 'Understand and describe content' }
]

export function ToolHeader({ selectedTool }: ToolHeaderProps) {
  const currentTool = tools.find(t => t.id === selectedTool)

  return (
    <div className="bg-white rounded-lg p-6 border">
      <div className="flex items-center gap-3 mb-2">
        {currentTool?.icon && (
          React.createElement(currentTool.icon, {
            className: "w-6 h-6 text-blue-600"
          })
        )}
        <h2 className="text-2xl font-bold">
          {currentTool?.label}
        </h2>
      </div>
      <p className="text-gray-600">
        {currentTool?.description}
      </p>
    </div>
  )
}