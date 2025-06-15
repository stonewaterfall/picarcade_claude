import { AI_MODELS, getModelById, getModelsByType, getModelsByCapability } from '@/lib/ai-models'

describe('AI Models', () => {
  describe('getModelById', () => {
    it('should return correct model for valid id', () => {
      const model = getModelById('flux-pro')
      expect(model).toBeDefined()
      expect(model?.name).toBe('FLUX Pro')
      expect(model?.provider).toBe('replicate')
    })

    it('should return undefined for invalid id', () => {
      const model = getModelById('invalid-model')
      expect(model).toBeUndefined()
    })
  })

  describe('getModelsByType', () => {
    it('should return image models', () => {
      const imageModels = getModelsByType('image')
      expect(imageModels.length).toBeGreaterThan(0)
      expect(imageModels.every(model => model.type === 'image')).toBe(true)
    })

    it('should return video models', () => {
      const videoModels = getModelsByType('video')
      expect(videoModels.length).toBeGreaterThan(0)
      expect(videoModels.every(model => model.type === 'video')).toBe(true)
    })

    it('should return enhancement models', () => {
      const enhancementModels = getModelsByType('enhancement')
      expect(enhancementModels.length).toBeGreaterThan(0)
      expect(enhancementModels.every(model => model.type === 'enhancement')).toBe(true)
    })
  })

  describe('getModelsByCapability', () => {
    it('should return models with text-to-image capability', () => {
      const textToImageModels = getModelsByCapability('text-to-image')
      expect(textToImageModels.length).toBeGreaterThan(0)
      expect(textToImageModels.every(model => 
        model.capabilities.includes('text-to-image')
      )).toBe(true)
    })

    it('should return models with upscaling capability', () => {
      const upscalingModels = getModelsByCapability('upscaling')
      expect(upscalingModels.length).toBeGreaterThan(0)
      expect(upscalingModels.every(model => 
        model.capabilities.includes('upscaling')
      )).toBe(true)
    })
  })

  describe('Model data integrity', () => {
    it('should have all required fields for each model', () => {
      AI_MODELS.forEach(model => {
        expect(model.id).toBeDefined()
        expect(model.name).toBeDefined()
        expect(model.provider).toBeDefined()
        expect(model.type).toBeDefined()
        expect(model.capabilities).toBeDefined()
        expect(Array.isArray(model.capabilities)).toBe(true)
        expect(typeof model.costPerOperation).toBe('number')
        expect(model.description).toBeDefined()
      })
    })

    it('should have positive cost per operation', () => {
      AI_MODELS.forEach(model => {
        expect(model.costPerOperation).toBeGreaterThan(0)
      })
    })

    it('should have valid provider values', () => {
      const validProviders = ['replicate', 'runway', 'openai']
      AI_MODELS.forEach(model => {
        expect(validProviders).toContain(model.provider)
      })
    })

    it('should have valid type values', () => {
      const validTypes = ['image', 'video', 'enhancement', 'analysis']
      AI_MODELS.forEach(model => {
        expect(validTypes).toContain(model.type)
      })
    })
  })
})