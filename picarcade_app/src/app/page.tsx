'use client'

import { useState, useEffect, useCallback } from 'react'
import { PromptInput } from '@/components/PromptInput'
import { Header } from '@/components/ui/header'
import { Sidebar } from '@/components/ui/sidebar'
import { ToolHeader } from '@/components/ui/tool-header'
import { CreationsSection } from '@/components/ui/creations-section'
import { useAppStore } from '@/lib/store'
import { AIAPIManager, GenerationRequest } from '@/lib/api-clients'
import { calculateCreditCost } from '@/lib/subscription-tiers'

export default function Home() {
  const [apiManager, setApiManager] = useState<AIAPIManager | null>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  const {
    user,
    generations,
    pendingGenerations,
    selectedTool,
    setSelectedTool,
    isGenerating,
    setIsGenerating,
    sidebarOpen,
    setSidebarOpen,
    addGeneration,
    updateGeneration,
    removeGeneration,
    addToHistory,
    updateCredits
  } = useAppStore()

  // Initialize API manager with dummy keys for demo
  useEffect(() => {
    const replicateKey = process.env.NEXT_PUBLIC_REPLICATE_API_KEY || 'demo-key'
    const runwayKey = process.env.NEXT_PUBLIC_RUNWAY_API_KEY || 'demo-key'
    
    const manager = new AIAPIManager(replicateKey, runwayKey)
    setApiManager(manager)
    setIsInitialized(true)
  }, [])

  // Poll for generation results
  useEffect(() => {
    if (!apiManager || pendingGenerations.length === 0) return

    const pollResults = async () => {
      for (const generationId of pendingGenerations) {
        const generation = generations[generationId]
        if (!generation || generation.status === 'completed') continue

        try {
          const result = await apiManager.getResult(generationId, 'replicate')
          if (result.success && result.data) {
            updateGeneration(generationId, result.data)
            
            if (result.data.status === 'completed') {
              updateCredits(result.data.cost)
            }
          }
        } catch (error) {
          console.error('Error polling result:', error)
        }
      }
    }

    const interval = setInterval(pollResults, 3000)
    return () => clearInterval(interval)
  }, [apiManager, pendingGenerations, generations, updateGeneration, updateCredits])

  const handleGenerate = useCallback(async (prompt: string, modelId: string, inputImage?: string) => {
    if (!apiManager) return

    setIsGenerating(true)

    try {
      const request: GenerationRequest = {
        prompt,
        modelId,
        inputImage,
        parameters: {
          width: 1024,
          height: 1024,
          num_outputs: 1,
          guidance_scale: 7.5,
          num_inference_steps: 50
        }
      }

      // Calculate cost
      const creditCost = calculateCreditCost(modelId, 'generate')
      
      // Add to history
      addToHistory(request)

      // Create pending generation
      const generation = {
        id: `gen_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
        status: 'pending' as const,
        cost: creditCost * 0.01, // Convert credits to dollars (rough estimate)
        metadata: { prompt, model: modelId, type: 'image' }
      }

      addGeneration(generation)

      // For demo purposes, simulate API call
      setTimeout(() => {
        updateGeneration(generation.id, {
          status: 'processing'
        })

        // Simulate completion after 5 seconds
        setTimeout(() => {
          updateGeneration(generation.id, {
            status: 'completed',
            output: `https://picsum.photos/1024/1024?random=${generation.id}`,
            processingTime: 5000
          })
          updateCredits(creditCost)
        }, 5000)
      }, 1000)

    } catch (error) {
      console.error('Generation failed:', error)
    } finally {
      setIsGenerating(false)
    }
  }, [apiManager, addGeneration, updateGeneration, addToHistory, updateCredits, setIsGenerating])

  const generationsList = Object.values(generations).sort((a, b) => 
    new Date(b.metadata?.createdAt || 0).getTime() - new Date(a.metadata?.createdAt || 0).getTime()
  )

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Initializing PicArcade...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header 
        user={user}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      <div className="flex">
        <Sidebar
          sidebarOpen={sidebarOpen}
          selectedTool={selectedTool}
          setSelectedTool={setSelectedTool}
          generationsList={generationsList}
          pendingGenerations={pendingGenerations}
          user={user}
        />

        <main className="flex-1 p-4 lg:p-6 space-y-6">
          <ToolHeader selectedTool={selectedTool} />

          <PromptInput
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />

          <CreationsSection
            generationsList={generationsList}
            removeGeneration={removeGeneration}
            onFavorite={(id) => {
              console.log('Favorite:', id)
            }}
          />
        </main>
      </div>
    </div>
  )
}