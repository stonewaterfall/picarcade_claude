'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download, Heart, Share2, Trash2, Maximize2 } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { GenerationResult } from '@/lib/api-clients'

interface GenerationGridProps {
  generations: GenerationResult[]
  onDelete?: (id: string) => void
  onFavorite?: (id: string) => void
}

export function GenerationGrid({ generations, onDelete, onFavorite }: GenerationGridProps) {
  const [selectedGeneration, setSelectedGeneration] = useState<GenerationResult | null>(null)
  const { updateGeneration } = useAppStore()

  const handleDownload = async (generation: GenerationResult) => {
    if (!generation.output) return

    try {
      const urls = Array.isArray(generation.output) ? generation.output : [generation.output]
      
      for (const url of urls) {
        const response = await fetch(url)
        const blob = await response.blob()
        const downloadUrl = window.URL.createObjectURL(blob)
        
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = `picarcade-${generation.id}.${blob.type.split('/')[1]}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(downloadUrl)
      }
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  const handleShare = async (generation: GenerationResult) => {
    if (!generation.output) return

    const url = Array.isArray(generation.output) ? generation.output[0] : generation.output

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Check out my AI creation!',
          text: 'Created with PicArcade AI',
          url: url
        })
      } catch (error) {
        console.error('Share failed:', error)
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(url)
        alert('Link copied to clipboard!')
      } catch (error) {
        console.error('Copy failed:', error)
      }
    }
  }

  const StatusBadge = ({ status }: { status: GenerationResult['status'] }) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      processing: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  const GenerationCard = ({ generation }: { generation: GenerationResult }) => {
    const isVideo = generation.metadata?.type === 'video' || 
                   (typeof generation.output === 'string' && generation.output.includes('.mp4'))

    return (
      <Card className="overflow-hidden hover:shadow-lg transition-shadow">
        <div className="relative aspect-square bg-gray-100">
          {generation.status === 'completed' && generation.output ? (
            isVideo ? (
              <video
                src={Array.isArray(generation.output) ? generation.output[0] : generation.output}
                className="w-full h-full object-cover"
                controls
                muted
                loop
              />
            ) : (
              <img
                src={Array.isArray(generation.output) ? generation.output[0] : generation.output}
                alt="Generated content"
                className="w-full h-full object-cover cursor-pointer"
                onClick={() => setSelectedGeneration(generation)}
              />
            )
          ) : generation.status === 'processing' ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Processing...</p>
                {generation.processingTime && (
                  <p className="text-xs text-gray-500">
                    {Math.round(generation.processingTime / 1000)}s elapsed
                  </p>
                )}
              </div>
            </div>
          ) : generation.status === 'failed' ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-red-600">
                <p className="text-sm font-medium">Generation Failed</p>
                <p className="text-xs mt-1">{generation.error}</p>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <div className="animate-pulse bg-gray-300 rounded-full h-8 w-8 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Queued</p>
              </div>
            </div>
          )}

          {/* Status badge */}
          <div className="absolute top-2 left-2">
            <StatusBadge status={generation.status} />
          </div>

          {/* Action buttons */}
          {generation.status === 'completed' && generation.output && (
            <div className="absolute top-2 right-2 flex gap-1">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleDownload(generation)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handleShare(generation)}
                className="opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-600 truncate">
                  {generation.metadata?.prompt || 'No prompt available'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">
                    Cost: ${generation.cost.toFixed(3)}
                  </span>
                  {generation.processingTime && (
                    <span className="text-xs text-gray-500">
                      {Math.round(generation.processingTime / 1000)}s
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onFavorite?.(generation.id)}
                >
                  <Heart className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onDelete?.(generation.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (generations.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Maximize2 className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No generations yet</h3>
        <p className="text-gray-500">Start by creating your first AI generation above!</p>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {generations.map((generation) => (
          <div key={generation.id} className="group">
            <GenerationCard generation={generation} />
          </div>
        ))}
      </div>

      {/* Modal for full-size viewing */}
      {selectedGeneration && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <Button
              variant="secondary"
              size="sm"
              className="absolute -top-10 right-0 z-10"
              onClick={() => setSelectedGeneration(null)}
            >
              Close
            </Button>
            <img
              src={Array.isArray(selectedGeneration.output) 
                ? selectedGeneration.output[0] 
                : selectedGeneration.output || ''
              }
              alt="Generated content"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </div>
      )}
    </>
  )
}