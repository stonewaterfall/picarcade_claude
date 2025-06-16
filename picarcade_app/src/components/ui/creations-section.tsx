'use client'

import { Button } from './button'
import { GenerationGrid } from '../GenerationGrid'
import { Settings } from 'lucide-react'

interface CreationsSectionProps {
  generationsList: any[]
  removeGeneration: (id: string) => void
  onFavorite: (id: string) => void
}

export function CreationsSection({ 
  generationsList, 
  removeGeneration, 
  onFavorite 
}: CreationsSectionProps) {
  return (
    <div className="bg-white rounded-lg p-6 border">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Your Creations</h3>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>
      
      <GenerationGrid
        generations={generationsList}
        onDelete={removeGeneration}
        onFavorite={onFavorite}
      />
    </div>
  )
}