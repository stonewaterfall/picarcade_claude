'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Wand2, Upload, Sparkles } from 'lucide-react'
import { useAppStore } from '@/lib/store'
import { getScenariosByCategory } from '@/lib/prompt-scenarios'
import { getModelsByType } from '@/lib/ai-models'

interface PromptInputProps {
  onGenerate: (prompt: string, modelId: string, inputImage?: string) => void
  isGenerating: boolean
}

export function PromptInput({ onGenerate, isGenerating }: PromptInputProps) {
  const [prompt, setPrompt] = useState('')
  const [selectedModel, setSelectedModel] = useState('flux-pro')
  const [inputImage, setInputImage] = useState<string>('')
  const [showScenarios, setShowScenarios] = useState(false)
  const [enhancedPrompt, setEnhancedPrompt] = useState('')

  const { selectedTool, settings } = useAppStore()

  const imageModels = getModelsByType('image')
  const videoModels = getModelsByType('video')
  const availableModels = selectedTool === 'generate' 
    ? [...imageModels, ...videoModels]
    : selectedTool === 'enhance' 
    ? getModelsByType('enhancement')
    : imageModels

  const socialMediaScenarios = getScenariosByCategory('social-media')
  const businessScenarios = getScenariosByCategory('business')
  const entertainmentScenarios = getScenariosByCategory('entertainment')

  const handleGenerate = useCallback(() => {
    if (!prompt.trim()) return
    const finalPrompt = enhancedPrompt || prompt
    onGenerate(finalPrompt, selectedModel, inputImage)
  }, [prompt, enhancedPrompt, selectedModel, inputImage, onGenerate])

  const handleScenarioSelect = (scenarioPrompt: string) => {
    setPrompt(scenarioPrompt)
    setShowScenarios(false)
  }

  const handleEnhancePrompt = async () => {
    // This would call the AI API to enhance the prompt
    setEnhancedPrompt(`Enhanced: ${prompt} with photorealistic details, professional lighting, and artistic composition`)
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setInputImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Prompt Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Describe what you want to create</label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowScenarios(!showScenarios)}
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  Examples
                </Button>
                {settings.enablePromptEnhancement && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEnhancePrompt}
                    disabled={!prompt.trim()}
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    Enhance
                  </Button>
                )}
              </div>
            </div>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="A serene landscape with mountains and a lake at sunset..."
              className="min-h-[100px] resize-none"
            />
            {enhancedPrompt && (
              <div className="p-3 bg-blue-50 rounded-md border">
                <p className="text-sm font-medium text-blue-800 mb-1">Enhanced Prompt:</p>
                <p className="text-sm text-blue-700">{enhancedPrompt}</p>
              </div>
            )}
          </div>

          {/* Scenario Examples */}
          {showScenarios && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium text-sm">Popular Scenarios</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <h4 className="font-medium text-xs text-gray-600 mb-2">Social Media</h4>
                  {socialMediaScenarios.slice(0, 2).map((scenario) => (
                    <div key={scenario.id} className="mb-2">
                      {scenario.examples.slice(0, 2).map((example, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleScenarioSelect(example)}
                          className="block w-full text-left text-xs p-2 hover:bg-white rounded border mb-1"
                        >
                          {example}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
                <div>
                  <h4 className="font-medium text-xs text-gray-600 mb-2">Business</h4>
                  {businessScenarios.slice(0, 2).map((scenario) => (
                    <div key={scenario.id} className="mb-2">
                      {scenario.examples.slice(0, 2).map((example, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleScenarioSelect(example)}
                          className="block w-full text-left text-xs p-2 hover:bg-white rounded border mb-1"
                        >
                          {example}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
                <div>
                  <h4 className="font-medium text-xs text-gray-600 mb-2">Entertainment</h4>
                  {entertainmentScenarios.slice(0, 2).map((scenario) => (
                    <div key={scenario.id} className="mb-2">
                      {scenario.examples.slice(0, 2).map((example, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleScenarioSelect(example)}
                          className="block w-full text-left text-xs p-2 hover:bg-white rounded border mb-1"
                        >
                          {example}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Model Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">AI Model</label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="w-full p-2 border rounded-md bg-background"
            >
              {availableModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} - ${model.costPerOperation.toFixed(3)} per use
                </option>
              ))}
            </select>
          </div>

          {/* Input Options */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium block mb-2">Upload Image (optional)</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer">
                  <Upload className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm text-gray-600">Click to upload an image</p>
                </label>
              </div>
              {inputImage && (
                <div className="mt-2">
                  <img
                    src={inputImage}
                    alt="Input"
                    className="w-full h-20 object-cover rounded border"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 mr-2" />
                Generate
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}