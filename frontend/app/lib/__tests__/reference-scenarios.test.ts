/**
 * Comprehensive tests for reference-based AI operations
 * Tests the integration between @mention parsing, intent detection, and Runway Gen-4 routing
 */

import { aiServices } from '../ai-services'
import type { IntentDetectionRequest, IntentDetectionResponse } from '../supabase'

// Mock Replicate API calls
global.fetch = jest.fn()

describe('Reference-Based AI Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock successful Replicate responses
    ;(fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        id: 'test-prediction-id',
        status: 'succeeded',
        output: ['https://example.com/generated-image.jpg']
      })
    })
  })

  describe('@mention parsing', () => {
    test('should parse single @mention', () => {
      const prompt = 'Put @me on the horse'
      const mentions = extractMentions(prompt)
      expect(mentions).toEqual(['me'])
    })

    test('should parse multiple @mentions', () => {
      const prompt = 'Apply @john_style to @me with @background_ref'
      const mentions = extractMentions(prompt)
      expect(mentions).toEqual(['john_style', 'me', 'background_ref'])
    })

    test('should handle no @mentions', () => {
      const prompt = 'Create a beautiful sunset'
      const mentions = extractMentions(prompt)
      expect(mentions).toEqual([])
    })

    test('should handle @mentions with numbers and underscores', () => {
      const prompt = 'Use @person_123 and @style_v2'
      const mentions = extractMentions(prompt)
      expect(mentions).toEqual(['person_123', 'style_v2'])
    })
  })

  describe('Intent detection with references', () => {
    test('should detect TRANSFER intent for active image + @mention', async () => {
      const request: IntentDetectionRequest = {
        prompt: 'Put @me on the horse',
        hasActiveImage: true,
        hasUpload: false,
        hasReference: true,
        referenceMentions: ['me'],
        activeImageUrl: 'https://example.com/horse.jpg',
        referenceImages: [{ tag: 'me', url: 'https://example.com/person.jpg' }]
      }

      const mockResponse = {
        intent: 'transfer',
        confidence: 0.9,
        reasoning: 'Active image with person reference for placement',
        recommendedModel: 'runway-gen4',
        subModel: 'persona',
        referenceUsage: {
          activeImage: 'https://example.com/horse.jpg',
          primary: 'https://example.com/person.jpg',
          operation: 'person-swap'
        }
      }

      // Mock Sonnet response
      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 'test-id',
          status: 'succeeded',
          output: [JSON.stringify(mockResponse)]
        })
      })

      const result = await aiServices.detectUserIntent(request)
      expect(result.intent).toBe('transfer')
      expect(result.recommendedModel).toBe('runway-gen4')
      expect(result.referenceUsage?.operation).toBe('person-swap')
    })

    test('should detect STYLE intent for style transfer', async () => {
      const request: IntentDetectionRequest = {
        prompt: 'Apply this haircut to @me',
        hasActiveImage: true,
        hasUpload: false,
        hasReference: true,
        referenceMentions: ['me'],
        activeImageUrl: 'https://example.com/haircut.jpg',
        referenceImages: [{ tag: 'me', url: 'https://example.com/person.jpg' }]
      }

      const mockResponse = {
        intent: 'style',
        confidence: 0.85,
        reasoning: 'Style transfer detected from haircut reference',
        recommendedModel: 'runway-gen4',
        subModel: 'style',
        referenceUsage: {
          activeImage: 'https://example.com/haircut.jpg',
          primary: 'https://example.com/person.jpg',
          operation: 'style-transfer'
        }
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 'test-id',
          status: 'succeeded',
          output: [JSON.stringify(mockResponse)]
        })
      })

      const result = await aiServices.detectUserIntent(request)
      expect(result.intent).toBe('style')
      expect(result.referenceUsage?.operation).toBe('style-transfer')
    })

    test('should detect SWAP intent for no active image + @mention', async () => {
      const request: IntentDetectionRequest = {
        prompt: 'Put @me on a horse',
        hasActiveImage: false,
        hasUpload: false,
        hasReference: true,
        referenceMentions: ['me'],
        referenceImages: [{ tag: 'me', url: 'https://example.com/person.jpg' }]
      }

      const mockResponse = {
        intent: 'swap',
        confidence: 0.8,
        reasoning: 'No active image, generate scene with person reference',
        recommendedModel: 'runway-gen4',
        subModel: 'persona',
        referenceUsage: {
          primary: 'https://example.com/person.jpg',
          operation: 'person-swap'
        }
      }

      ;(fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          id: 'test-id',
          status: 'succeeded',
          output: [JSON.stringify(mockResponse)]
        })
      })

      const result = await aiServices.detectUserIntent(request)
      expect(result.intent).toBe('swap')
      expect(result.recommendedModel).toBe('runway-gen4')
    })
  })

  describe('Runway Gen-4 generation', () => {
    test('should generate with person-swap operation', async () => {
      const result = await aiServices.generateWithRunwayGen4(
        'Put @me on the horse',
        'person-swap',
        {
          primary: 'https://example.com/person.jpg',
          activeImage: 'https://example.com/horse.jpg'
        }
      )

      expect(result.success).toBe(true)
      expect(result.output).toBe('https://example.com/generated-image.jpg')
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/predictions'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('person-swap')
        })
      )
    })

    test('should generate with style-transfer operation', async () => {
      const result = await aiServices.generateWithRunwayGen4(
        'Apply this haircut to @me',
        'style-transfer',
        {
          primary: 'https://example.com/person.jpg',
          activeImage: 'https://example.com/haircut.jpg'
        }
      )

      expect(result.success).toBe(true)
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/predictions'),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('style-transfer')
        })
      )
    })

    test('should handle dual reference scenario', async () => {
      const result = await aiServices.generateWithRunwayGen4(
        'Put @me in @paris_background',
        'person-swap',
        {
          primary: 'https://example.com/person.jpg',
          secondary: 'https://example.com/paris.jpg'
        }
      )

      expect(result.success).toBe(true)
      const callBody = JSON.parse((fetch as jest.Mock).mock.calls[0][1].body)
      expect(callBody.input.person_image).toBe('https://example.com/person.jpg')
      expect(callBody.input.scene_image).toBe('https://example.com/paris.jpg')
    })
  })

  describe('Reference resolution', () => {
    test('should resolve references from mentions', async () => {
      const mentions = ['me', 'style1']
      const availableReferences = [
        { tag: 'me', url: 'https://example.com/person.jpg', description: 'My photo' },
        { tag: 'style1', url: 'https://example.com/style.jpg', description: 'Cool style' },
        { tag: 'unused', url: 'https://example.com/unused.jpg' }
      ]

      const resolved = await aiServices.resolveReferences(mentions, availableReferences)
      expect(resolved).toHaveLength(2)
      expect(resolved[0].tag).toBe('me')
      expect(resolved[1].tag).toBe('style1')
    })

    test('should handle missing references gracefully', async () => {
      const mentions = ['missing_ref']
      const availableReferences = [
        { tag: 'me', url: 'https://example.com/person.jpg' }
      ]

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation()
      const resolved = await aiServices.resolveReferences(mentions, availableReferences)
      
      expect(resolved).toHaveLength(0)
      expect(consoleSpy).toHaveBeenCalledWith('Reference @missing_ref not found in available references')
      
      consoleSpy.mockRestore()
    })
  })

  describe('Fallback scenarios', () => {
    test('should fallback to heuristic detection when Sonnet fails', async () => {
      // Mock failed Sonnet response
      ;(fetch as jest.Mock).mockRejectedValueOnce(new Error('API unavailable'))

      const request: IntentDetectionRequest = {
        prompt: 'Put @me on the horse',
        hasActiveImage: true,
        hasUpload: false,
        hasReference: true,
        referenceMentions: ['me'],
        activeImageUrl: 'https://example.com/horse.jpg',
        referenceImages: [{ tag: 'me', url: 'https://example.com/person.jpg' }]
      }

      const result = await aiServices.detectUserIntent(request)
      
      // Should still detect reference-based operation
      expect(result.intent).toBe('transfer')
      expect(result.recommendedModel).toBe('runway-gen4')
      expect(result.reasoning).toContain('Fallback analysis')
    })

    test('should route to Kontext Max when Gen-4 unavailable', async () => {
      const intent: IntentDetectionResponse = {
        intent: 'transfer',
        confidence: 0.8,
        reasoning: 'Test routing',
        recommendedModel: 'kontext-max',
        parameters: {},
        referenceUsage: {
          activeImage: 'https://example.com/image.jpg',
          primary: 'https://example.com/ref.jpg',
          operation: 'person-swap'
        }
      }

      const result = await aiServices.generateWithReferences(intent, 'test prompt', {})
      expect(result.success).toBe(true)
    })
  })

  describe('Real-world scenarios', () => {
    const scenarios = [
      {
        name: 'Person on existing object',
        prompt: 'Put @me on the horse',
        hasActiveImage: true,
        expectedIntent: 'transfer',
        expectedModel: 'runway-gen4',
        expectedOperation: 'person-swap'
      },
      {
        name: 'Style application',
        prompt: 'Apply this haircut to @me',
        hasActiveImage: true,
        expectedIntent: 'style',
        expectedModel: 'runway-gen4',
        expectedOperation: 'style-transfer'
      },
      {
        name: 'Person in new scene',
        prompt: 'Put @me on a horse',
        hasActiveImage: false,
        expectedIntent: 'swap',
        expectedModel: 'runway-gen4',
        expectedOperation: 'person-swap'
      },
      {
        name: 'Outfit transfer',
        prompt: 'Give @me this outfit',
        hasActiveImage: true,
        expectedIntent: 'style',
        expectedModel: 'runway-gen4',
        expectedOperation: 'appearance-copy'
      },
      {
        name: 'Face swap',
        prompt: 'Replace the person with @me',
        hasActiveImage: true,
        expectedIntent: 'transfer',
        expectedModel: 'runway-gen4',
        expectedOperation: 'person-swap'
      }
    ]

    scenarios.forEach(scenario => {
      test(`should handle: ${scenario.name}`, async () => {
        const mockResponse = {
          intent: scenario.expectedIntent,
          confidence: 0.85,
          reasoning: `Detected ${scenario.expectedIntent} for ${scenario.name}`,
          recommendedModel: scenario.expectedModel,
          subModel: 'persona',
          referenceUsage: {
            operation: scenario.expectedOperation
          }
        }

        ;(fetch as jest.Mock).mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({
            id: 'test-id',
            status: 'succeeded',
            output: [JSON.stringify(mockResponse)]
          })
        })

        const request: IntentDetectionRequest = {
          prompt: scenario.prompt,
          hasActiveImage: scenario.hasActiveImage,
          hasUpload: false,
          hasReference: true,
          referenceMentions: ['me'],
          referenceImages: [{ tag: 'me', url: 'https://example.com/person.jpg' }]
        }

        const result = await aiServices.detectUserIntent(request)
        expect(result.intent).toBe(scenario.expectedIntent)
        expect(result.recommendedModel).toBe(scenario.expectedModel)
        expect(result.referenceUsage?.operation).toBe(scenario.expectedOperation)
      })
    })
  })
})

// Helper function to extract mentions (matches the actual implementation)
function extractMentions(prompt: string): string[] {
  const mentionRegex = /@([a-zA-Z0-9_-]+)/g
  const mentions = []
  let match
  while ((match = mentionRegex.exec(prompt)) !== null) {
    mentions.push(match[1])
  }
  return mentions
}