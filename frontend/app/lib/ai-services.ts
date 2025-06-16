import type { IntentDetectionRequest, IntentDetectionResponse } from './supabase'

// Replicate API configuration
const REPLICATE_API_TOKEN = process.env.NEXT_PUBLIC_REPLICATE_API_TOKEN || ''
const REPLICATE_BASE_URL = 'https://api.replicate.com/v1'

// Sonnet 3.7 model for intent detection
const SONNET_MODEL = 'anthropic/claude-3-5-sonnet-20241022'

// Runway models for video and reference-based generation
const RUNWAY_MODELS = {
  gen3: 'runwayml/gen-3-alpha-turbo',
  gen4: 'runwayml/gen-4-turbo', // New Gen-4 with reference support
  imageToVideo: 'runwayml/gen-2',
  personTransfer: 'runwayml/gen-4-persona', // Person/object transfer
  styleTransfer: 'runwayml/gen-4-style' // Style and appearance transfer
}

// Kontext Max model for image editing
const KONTEXT_MAX_MODEL = 'kontext-max/flux-dev-inpainting'

export class AIServices {
  private static instance: AIServices
  
  static getInstance(): AIServices {
    if (!AIServices.instance) {
      AIServices.instance = new AIServices()
    }
    return AIServices.instance
  }

  // Parse @mentions from prompt
  private parseReferenceMentions(prompt: string): string[] {
    const mentionRegex = /@([a-zA-Z0-9_-]+)/g
    const mentions = []
    let match
    while ((match = mentionRegex.exec(prompt)) !== null) {
      mentions.push(match[1])
    }
    return mentions
  }

  // Intelligent intent detection using Sonnet 3.7 with reference support
  async detectUserIntent(request: IntentDetectionRequest): Promise<IntentDetectionResponse> {
    // Extract @mentions from prompt
    const mentions = request.referenceMentions || this.parseReferenceMentions(request.prompt)
    
    const systemPrompt = `You are an advanced AI assistant specialized in understanding user intent for creative content generation with advanced reference image support. Analyze user prompts and context to determine the most appropriate action.

Context Analysis:
- Has Active Image: ${request.hasActiveImage}
- Has Upload: ${request.hasUpload} 
- Has Reference: ${request.hasReference}
- Reference Mentions: ${mentions.join(', ') || 'None'}
- Previous Context: ${request.previousContext || 'None'}
- Available References: ${request.referenceImages?.map(r => r.tag).join(', ') || 'None'}

Your task is to determine the user's intent and recommend the best model/approach:

1. **CREATE**: Generate new content from scratch
   - Use when: No active images, text-only prompts
   - Models: Stable Diffusion, DALLE for images; Runway Gen-3 for videos

2. **EDIT**: Modify existing content
   - Use when: Active image exists, edit keywords
   - Models: Kontext Max for image editing

3. **ENHANCE**: Improve/upscale existing content
   - Use when: Active image with enhancement keywords
   - Models: Kontext Max for enhancement

4. **TRANSFER**: Person/object transfer using references
   - Use when: @mentions + active image ("put @me on the horse")
   - Models: Runway Gen-4 with persona transfer
   - Operation: person-swap, object-placement

5. **STYLE**: Apply style/appearance from references
   - Use when: @mentions + style keywords ("apply this haircut to @me")
   - Models: Runway Gen-4 with style transfer
   - Operation: style-transfer, appearance-copy

6. **SWAP**: Replace person/object with reference
   - Use when: @mentions without active image ("put @me on a horse")
   - Models: Runway Gen-4 with dual references
   - Operation: person-swap with scene generation

7. **GENERATE**: Create variations or similar content
   - Use when: Reference images, "like this", "similar to"
   - Models: Style-aware models

8. **MODIFY**: Specific alterations to existing content
   - Use when: Active image with specific changes
   - Models: Kontext Max

Reference Usage Guidelines:
- If @mentions present + active image → TRANSFER or STYLE intent
- If @mentions present + no active image → SWAP intent  
- If multiple @mentions → Use both as references in Runway Gen-4
- If prompt suggests appearance/style transfer → STYLE intent
- If prompt suggests person/object placement → TRANSFER intent

Respond with JSON only:
{
  "intent": "create|edit|enhance|transfer|style|swap|generate|modify",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of decision",
  "recommendedModel": "runway-gen3|runway-gen4|kontext-max|stable-diffusion|dalle",
  "subModel": "persona|style|image-to-video" (only for runway models),
  "parameters": {
    "strength": 0.0-1.0,
    "guidance_scale": 1-30,
    "steps": 20-100,
    "seed": null
  },
  "referenceUsage": {
    "primary": "reference_image_url",
    "secondary": "second_reference_url",
    "activeImage": "current_working_image_url",
    "operation": "person-swap|style-transfer|object-placement|appearance-copy"
  }
}`

    try {
      const response = await fetch(`${REPLICATE_BASE_URL}/predictions`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          version: SONNET_MODEL,
          input: {
            prompt: request.prompt,
            system_prompt: systemPrompt,
            max_tokens: 1000,
            temperature: 0.1
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Replicate API error: ${response.status}`)
      }

      const prediction = await response.json()
      
      // Poll for completion
      const result = await this.pollPrediction(prediction.id)
      
      // Parse the JSON response from Sonnet
      try {
        const intentData = JSON.parse(result.output.join(''))
        return intentData as IntentDetectionResponse
      } catch (parseError) {
        console.warn('Failed to parse intent response, using fallback')
        return this.fallbackIntentDetection(request)
      }

    } catch (error) {
      console.error('Intent detection failed:', error)
      return this.fallbackIntentDetection(request)
    }
  }

  // Fallback intent detection with reference support
  private fallbackIntentDetection(request: IntentDetectionRequest): IntentDetectionResponse {
    const prompt = request.prompt.toLowerCase()
    const mentions = request.referenceMentions || this.parseReferenceMentions(request.prompt)
    
    // Keywords for different intents
    const editKeywords = ['edit', 'change', 'modify', 'alter', 'adjust', 'fix', 'update']
    const enhanceKeywords = ['enhance', 'improve', 'better', 'higher quality', 'upscale', 'sharpen']
    const transferKeywords = ['put', 'place', 'add', 'insert', 'move']
    const styleKeywords = ['apply', 'give', 'use', 'style', 'haircut', 'outfit', 'look']
    const swapKeywords = ['replace', 'swap', 'substitute', 'become']
    
    let intent: IntentDetectionResponse['intent'] = 'create'
    let confidence = 0.5
    let recommendedModel: IntentDetectionResponse['recommendedModel'] = 'stable-diffusion'
    let subModel: IntentDetectionResponse['subModel'] | undefined
    let referenceUsage: IntentDetectionResponse['referenceUsage'] | undefined
    
    // Reference-based operations
    if (mentions.length > 0) {
      if (request.hasActiveImage) {
        // Active image + references = transfer or style
        if (styleKeywords.some(keyword => prompt.includes(keyword))) {
          intent = 'style'
          recommendedModel = 'runway-gen4'
          subModel = 'style'
          confidence = 0.8
          referenceUsage = {
            activeImage: request.activeImageUrl,
            primary: request.referenceImages?.[0]?.url,
            operation: 'style-transfer'
          }
        } else {
          intent = 'transfer'
          recommendedModel = 'runway-gen4'
          subModel = 'persona'
          confidence = 0.8
          referenceUsage = {
            activeImage: request.activeImageUrl,
            primary: request.referenceImages?.[0]?.url,
            operation: 'person-swap'
          }
        }
      } else {
        // No active image + references = swap/generate with references
        intent = 'swap'
        recommendedModel = 'runway-gen4'
        subModel = 'persona'
        confidence = 0.7
        referenceUsage = {
          primary: request.referenceImages?.[0]?.url,
          secondary: request.referenceImages?.[1]?.url,
          operation: 'person-swap'
        }
      }
    } else {
      // Non-reference operations (original logic)
      if (request.hasActiveImage) {
        if (editKeywords.some(keyword => prompt.includes(keyword))) {
          intent = 'edit'
          recommendedModel = 'kontext-max'
          confidence = 0.8
        } else if (enhanceKeywords.some(keyword => prompt.includes(keyword))) {
          intent = 'enhance'
          recommendedModel = 'kontext-max'
          confidence = 0.8
        } else if (prompt.includes('video') || prompt.includes('motion')) {
          intent = 'generate'
          recommendedModel = 'runway-gen3'
          confidence = 0.7
        } else {
          intent = 'modify'
          recommendedModel = 'kontext-max'
          confidence = 0.6
        }
      } else {
        if (prompt.includes('video') || prompt.includes('motion') || prompt.includes('animate')) {
          intent = 'create'
          recommendedModel = 'runway-gen3'
          confidence = 0.9
        } else {
          intent = 'create'
          recommendedModel = 'stable-diffusion'
          confidence = 0.8
        }
      }
    }

    return {
      intent,
      confidence,
      reasoning: `Fallback analysis: Detected "${intent}" with ${mentions.length} references`,
      recommendedModel,
      subModel,
      parameters: {
        strength: intent === 'edit' ? 0.7 : 0.9,
        guidance_scale: 7.5,
        steps: 50,
        seed: null
      },
      referenceUsage
    }
  }

  // Generate content using Runway models
  async generateWithRunway(
    prompt: string,
    modelType: 'gen3' | 'imageToVideo' = 'gen3',
    inputImage?: string,
    parameters?: Record<string, any>
  ): Promise<{ success: boolean; output?: string; error?: string }> {
    try {
      const model = RUNWAY_MODELS[modelType]
      const input: any = {
        prompt,
        ...parameters
      }

      if (inputImage && modelType === 'imageToVideo') {
        input.image = inputImage
      }

      const response = await fetch(`${REPLICATE_BASE_URL}/predictions`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          version: model,
          input
        })
      })

      if (!response.ok) {
        throw new Error(`Runway API error: ${response.status}`)
      }

      const prediction = await response.json()
      const result = await this.pollPrediction(prediction.id)

      return {
        success: true,
        output: Array.isArray(result.output) ? result.output[0] : result.output
      }

    } catch (error) {
      console.error('Runway generation failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Generation failed'
      }
    }
  }

  // NEW: Generate with Runway Gen-4 using reference images
  async generateWithRunwayGen4(
    prompt: string,
    operation: 'person-swap' | 'style-transfer' | 'object-placement' | 'appearance-copy',
    references: {
      primary?: string
      secondary?: string
      activeImage?: string
    },
    parameters?: Record<string, any>
  ): Promise<{ success: boolean; output?: string; error?: string }> {
    try {
      console.log('[Runway Gen-4] Starting generation:', { operation, references })
      
      // Select appropriate Gen-4 model based on operation
      let model: string
      switch (operation) {
        case 'person-swap':
        case 'object-placement':
          model = RUNWAY_MODELS.personTransfer
          break
        case 'style-transfer':
        case 'appearance-copy':
          model = RUNWAY_MODELS.styleTransfer
          break
        default:
          model = RUNWAY_MODELS.gen4
      }
      
      const input: any = {
        prompt,
        operation_type: operation,
        ...parameters
      }
      
      // Add reference images based on operation type
      if (operation === 'person-swap' || operation === 'object-placement') {
        if (references.activeImage && references.primary) {
          // Person/object from primary into active image scene
          input.base_image = references.activeImage
          input.reference_image = references.primary
        } else if (references.primary && references.secondary) {
          // Person from primary into secondary image scene
          input.person_image = references.primary
          input.scene_image = references.secondary
        } else if (references.primary) {
          // Generate scene with person from reference
          input.reference_image = references.primary
        }
      } else if (operation === 'style-transfer' || operation === 'appearance-copy') {
        if (references.activeImage && references.primary) {
          // Apply style/appearance from primary to active image
          input.base_image = references.activeImage
          input.style_reference = references.primary
        }
      }
      
      const response = await fetch(`${REPLICATE_BASE_URL}/predictions`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          version: model,
          input
        })
      })

      if (!response.ok) {
        throw new Error(`Runway Gen-4 API error: ${response.status}`)
      }

      const prediction = await response.json()
      const result = await this.pollPrediction(prediction.id)

      return {
        success: true,
        output: Array.isArray(result.output) ? result.output[0] : result.output
      }

    } catch (error) {
      console.error('Runway Gen-4 generation failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Gen-4 generation failed'
      }
    }
  }

  // Edit images using Kontext Max
  async editWithKontextMax(
    prompt: string,
    inputImage: string,
    parameters?: Record<string, any>
  ): Promise<{ success: boolean; output?: string; error?: string }> {
    try {
      const response = await fetch(`${REPLICATE_BASE_URL}/predictions`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          version: KONTEXT_MAX_MODEL,
          input: {
            prompt,
            image: inputImage,
            strength: parameters?.strength || 0.8,
            guidance_scale: parameters?.guidance_scale || 7.5,
            num_inference_steps: parameters?.steps || 50,
            ...parameters
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Kontext Max API error: ${response.status}`)
      }

      const prediction = await response.json()
      const result = await this.pollPrediction(prediction.id)

      return {
        success: true,
        output: Array.isArray(result.output) ? result.output[0] : result.output
      }

    } catch (error) {
      console.error('Kontext Max editing failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Editing failed'
      }
    }
  }

  // Poll Replicate prediction until completion
  private async pollPrediction(predictionId: string, maxAttempts: number = 60): Promise<any> {
    for (let i = 0; i < maxAttempts; i++) {
      const response = await fetch(`${REPLICATE_BASE_URL}/predictions/${predictionId}`, {
        headers: {
          'Authorization': `Token ${REPLICATE_API_TOKEN}`
        }
      })

      if (!response.ok) {
        throw new Error(`Failed to poll prediction: ${response.status}`)
      }

      const prediction = await response.json()

      if (prediction.status === 'succeeded') {
        return prediction
      } else if (prediction.status === 'failed') {
        throw new Error(`Prediction failed: ${prediction.error}`)
      }

      // Wait 2 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 2000))
    }

    throw new Error('Prediction timed out')
  }
  
  // NEW: Resolve reference images from @mentions
  async resolveReferences(
    mentions: string[],
    availableReferences: Array<{ tag: string; url: string; description?: string }>
  ): Promise<Array<{ tag: string; url: string; description?: string }>> {
    const resolved = []
    
    for (const mention of mentions) {
      const reference = availableReferences.find(ref => 
        ref.tag.toLowerCase() === mention.toLowerCase()
      )
      if (reference) {
        resolved.push(reference)
      } else {
        console.warn(`Reference @${mention} not found in available references`)
      }
    }
    
    return resolved
  }
  
  // NEW: Smart routing for reference-based operations
  async generateWithReferences(
    intent: IntentDetectionResponse,
    prompt: string,
    request: any
  ): Promise<{ success: boolean; output?: string; error?: string }> {
    try {
      if (!intent.referenceUsage) {
        throw new Error('No reference usage specified for reference-based operation')
      }
      
      const { referenceUsage } = intent
      
      // Route to appropriate generation method
      switch (intent.recommendedModel) {
        case 'runway-gen4':
          return await this.generateWithRunwayGen4(
            prompt,
            referenceUsage.operation,
            {
              primary: referenceUsage.primary,
              secondary: referenceUsage.secondary,
              activeImage: referenceUsage.activeImage
            },
            intent.parameters
          )
          
        case 'kontext-max':
          // Fallback to Kontext Max for simpler reference operations
          if (referenceUsage.activeImage && referenceUsage.primary) {
            return await this.editWithKontextMax(
              prompt,
              referenceUsage.activeImage,
              intent.parameters
            )
          }
          break
          
        default:
          throw new Error(`Model ${intent.recommendedModel} not supported for reference operations`)
      }
      
      throw new Error('Could not route reference-based operation to appropriate model')
      
    } catch (error) {
      console.error('Reference-based generation failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Reference generation failed'
      }
    }
  }
}

// Export singleton instance
export const aiServices = AIServices.getInstance()