'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PromptInput } from '@/components/PromptInput'
import { GenerationGrid } from '@/components/GenerationGrid'
import { useAppStore } from '@/lib/store'
import { AIAPIManager, GenerationRequest } from '@/lib/api-clients'
import { calculateCreditCost } from '@/lib/subscription-tiers'
import { 
  Palette, 
  Video, 
  Wand2, 
  Search, 
  Settings, 
  User, 
  CreditCard,
  Menu,
  X
} from 'lucide-react'

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

  const tools = [
    { id: 'generate', icon: Palette, label: 'Generate', description: 'Create images and videos from text' },
    { id: 'enhance', icon: Wand2, label: 'Enhance', description: 'Improve and upscale existing content' },
    { id: 'edit', icon: Video, label: 'Edit', description: 'Advanced editing and manipulation' },
    { id: 'analyze', icon: Search, label: 'Analyze', description: 'Understand and describe content' }
  ]

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
      {/* Header */}
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

      <div className="flex">
        {/* Sidebar */}
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

            {/* Quick Stats */}
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

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-6 space-y-6">
          {/* Tool Header */}
          <div className="bg-white rounded-lg p-6 border">
            <div className="flex items-center gap-3 mb-2">
              {tools.find(t => t.id === selectedTool)?.icon && (
                React.createElement(tools.find(t => t.id === selectedTool)!.icon, {
                  className: "w-6 h-6 text-blue-600"
                })
              )}
              <h2 className="text-2xl font-bold">
                {tools.find(t => t.id === selectedTool)?.label}
              </h2>
            </div>
            <p className="text-gray-600">
              {tools.find(t => t.id === selectedTool)?.description}
            </p>
          </div>

          {/* Prompt Input */}
          <PromptInput
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />

          {/* Generations Grid */}
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
              onFavorite={(id) => {
                // Implement favorite functionality
                console.log('Favorite:', id)
              }}
            />
          </div>
        </main>
      </div>
    </div>
  )
}