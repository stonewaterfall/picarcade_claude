import axios from 'axios'
import { getModelById } from './ai-models'

export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  cost?: number
  processingTime?: number
}

export interface GenerationRequest {
  prompt: string
  modelId: string
  parameters?: Record<string, any>
  inputImage?: string
  inputVideo?: string
  webhook?: string
}

export interface GenerationResult {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  output?: string | string[]
  error?: string
  cost: number
  processingTime?: number
  metadata?: Record<string, any>
}

class ReplicateClient {
  private apiKey: string
  private baseURL = 'https://api.replicate.com/v1'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async generateImage(request: GenerationRequest): Promise<APIResponse<GenerationResult>> {
    try {
      const model = getModelById(request.modelId)
      if (!model || model.provider !== 'replicate') {
        throw new Error('Invalid Replicate model')
      }

      const response = await axios.post(
        `${this.baseURL}/predictions`,
        {
          version: this.getModelVersion(request.modelId),
          input: {
            prompt: request.prompt,
            ...request.parameters
          },
          webhook: request.webhook
        },
        {
          headers: {
            'Authorization': `Token ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      return {
        success: true,
        data: {
          id: response.data.id,
          status: response.data.status,
          cost: model.costPerOperation,
          metadata: response.data
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message
      }
    }
  }

  async getResult(predictionId: string): Promise<APIResponse<GenerationResult>> {
    try {
      const response = await axios.get(
        `${this.baseURL}/predictions/${predictionId}`,
        {
          headers: {
            'Authorization': `Token ${this.apiKey}`
          }
        }
      )

      return {
        success: true,
        data: {
          id: response.data.id,
          status: response.data.status,
          output: response.data.output,
          error: response.data.error,
          cost: 0, // Will be calculated based on model
          processingTime: this.calculateProcessingTime(response.data),
          metadata: response.data
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message
      }
    }
  }

  private getModelVersion(modelId: string): string {
    const versions: Record<string, string> = {
      'flux-pro': 'black-forest-labs/flux-1.1-pro',
      'flux-dev': 'black-forest-labs/flux-dev',
      'flux-schnell': 'black-forest-labs/flux-schnell',
      'sdxl': 'stability-ai/sdxl',
      'esrgan': 'nightmareai/real-esrgan',
      'remove-bg': 'cjwbw/rembg',
      'inpainting': 'stability-ai/stable-diffusion-inpainting',
      'stable-video-diffusion': 'stability-ai/stable-video-diffusion',
      'claude-sonnet-37': 'anthropic/claude-3.7-sonnet'
    }
    return versions[modelId] || modelId
  }

  private calculateProcessingTime(data: any): number {
    if (data.completed_at && data.started_at) {
      return new Date(data.completed_at).getTime() - new Date(data.started_at).getTime()
    }
    return 0
  }
}

class RunwayClient {
  private apiKey: string
  private baseURL = 'https://api.runwayml.com/v1'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  async generateVideo(request: GenerationRequest): Promise<APIResponse<GenerationResult>> {
    try {
      const model = getModelById(request.modelId)
      if (!model || model.provider !== 'runway') {
        throw new Error('Invalid Runway model')
      }

      const response = await axios.post(
        `${this.baseURL}/image_to_video`,
        {
          model: this.getModelName(request.modelId),
          prompt_text: request.prompt,
          init_image: request.inputImage,
          motion_vector: request.parameters?.motionVector || 'default',
          seed: request.parameters?.seed,
          watermark: false,
          enhance_prompt: true,
          image_as_end_frame: request.parameters?.imageAsEndFrame || false
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      )

      return {
        success: true,
        data: {
          id: response.data.id,
          status: 'processing',
          cost: model.costPerOperation,
          metadata: response.data
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      }
    }
  }

  async getResult(taskId: string): Promise<APIResponse<GenerationResult>> {
    try {
      const response = await axios.get(
        `${this.baseURL}/tasks/${taskId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      )

      return {
        success: true,
        data: {
          id: response.data.id,
          status: response.data.status,
          output: response.data.output,
          error: response.data.failure_reason,
          cost: 0,
          processingTime: this.calculateProcessingTime(response.data),
          metadata: response.data
        }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message
      }
    }
  }

  private getModelName(modelId: string): string {
    const models: Record<string, string> = {
      'runway-gen4': 'gen4',
      'runway-gen3-alpha': 'gen3a',
      'runway-gen3-turbo': 'gen3a_turbo'
    }
    return models[modelId] || 'gen3a'
  }

  private calculateProcessingTime(data: any): number {
    if (data.createdAt && data.updatedAt) {
      return new Date(data.updatedAt).getTime() - new Date(data.createdAt).getTime()
    }
    return 0
  }
}

export class AIAPIManager {
  private replicateClient: ReplicateClient
  private runwayClient: RunwayClient

  constructor(replicateKey: string, runwayKey: string) {
    this.replicateClient = new ReplicateClient(replicateKey)
    this.runwayClient = new RunwayClient(runwayKey)
  }

  async generate(request: GenerationRequest): Promise<APIResponse<GenerationResult>> {
    const model = getModelById(request.modelId)
    if (!model) {
      return {
        success: false,
        error: 'Model not found'
      }
    }

    try {
      switch (model.provider) {
        case 'replicate':
          return await this.replicateClient.generateImage(request)
        case 'runway':
          return await this.runwayClient.generateVideo(request)
        default:
          return {
            success: false,
            error: 'Unsupported provider'
          }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  async getResult(predictionId: string, provider: 'replicate' | 'runway'): Promise<APIResponse<GenerationResult>> {
    try {
      switch (provider) {
        case 'replicate':
          return await this.replicateClient.getResult(predictionId)
        case 'runway':
          return await this.runwayClient.getResult(predictionId)
        default:
          return {
            success: false,
            error: 'Unsupported provider'
          }
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  async enhancePrompt(prompt: string): Promise<APIResponse<string>> {
    try {
      const response = await this.replicateClient.generateImage({
        prompt: `Enhance this creative prompt for AI image generation. Make it more detailed, specific, and visually descriptive while maintaining the original intent: "${prompt}"`,
        modelId: 'claude-sonnet-37',
        parameters: {
          max_tokens: 200,
          temperature: 0.7
        }
      })

      if (response.success && response.data) {
        // Poll for result
        let attempts = 0
        while (attempts < 30) {
          const result = await this.replicateClient.getResult(response.data.id)
          if (result.success && result.data?.status === 'completed') {
            return {
              success: true,
              data: result.data.output as string,
              cost: response.data.cost
            }
          }
          if (result.data?.status === 'failed') {
            throw new Error(result.data.error || 'Prompt enhancement failed')
          }
          await new Promise(resolve => setTimeout(resolve, 2000))
          attempts++
        }
        throw new Error('Prompt enhancement timeout')
      }

      return response as APIResponse<string>
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }
}