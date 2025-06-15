export interface AIModel {
  id: string
  name: string
  provider: 'replicate' | 'runway' | 'openai'
  type: 'image' | 'video' | 'enhancement' | 'analysis'
  capabilities: string[]
  costPerOperation: number
  maxResolution?: string
  maxDuration?: number
  description: string
}

export const AI_MODELS: AIModel[] = [
  // Image Generation Models
  {
    id: 'flux-pro',
    name: 'FLUX Pro',
    provider: 'replicate',
    type: 'image',
    capabilities: ['text-to-image', 'high-quality', 'commercial-use'],
    costPerOperation: 0.055,
    maxResolution: '4MP',
    description: 'State-of-the-art image generation with exceptional quality and prompt adherence'
  },
  {
    id: 'flux-dev',
    name: 'FLUX Dev',
    provider: 'replicate',
    type: 'image',
    capabilities: ['text-to-image', 'fine-tuning', 'experimental'],
    costPerOperation: 0.025,
    maxResolution: '2MP',
    description: 'Developer-friendly FLUX model for experimentation and fine-tuning'
  },
  {
    id: 'flux-schnell',
    name: 'FLUX Schnell',
    provider: 'replicate',
    type: 'image',
    capabilities: ['text-to-image', 'fast-generation'],
    costPerOperation: 0.003,
    maxResolution: '1MP',
    description: 'Lightning-fast image generation for rapid prototyping'
  },
  {
    id: 'sdxl',
    name: 'SDXL',
    provider: 'replicate',
    type: 'image',
    capabilities: ['text-to-image', 'style-transfer', 'inpainting'],
    costPerOperation: 0.012,
    maxResolution: '1024x1024',
    description: 'Versatile image generation and editing model'
  },
  
  // Image Enhancement Models
  {
    id: 'esrgan',
    name: 'Real-ESRGAN',
    provider: 'replicate',
    type: 'enhancement',
    capabilities: ['upscaling', 'denoising', 'restoration'],
    costPerOperation: 0.005,
    description: 'AI-powered image upscaling and restoration'
  },
  {
    id: 'remove-bg',
    name: 'Background Removal',
    provider: 'replicate',
    type: 'enhancement',
    capabilities: ['background-removal', 'segmentation'],
    costPerOperation: 0.002,
    description: 'Precise background removal and object segmentation'
  },
  {
    id: 'inpainting',
    name: 'Inpainting Model',
    provider: 'replicate',
    type: 'enhancement',
    capabilities: ['inpainting', 'object-removal', 'healing'],
    costPerOperation: 0.015,
    description: 'Remove or replace objects in images seamlessly'
  },

  // Video Generation Models
  {
    id: 'runway-gen4',
    name: 'Runway Gen-4',
    provider: 'runway',
    type: 'video',
    capabilities: ['text-to-video', 'image-to-video', '4k-upscaling'],
    costPerOperation: 0.10,
    maxDuration: 10,
    maxResolution: '4K',
    description: 'Latest generation video creation with 4K capabilities'
  },
  {
    id: 'runway-gen3-alpha',
    name: 'Runway Gen-3 Alpha',
    provider: 'runway',
    type: 'video',
    capabilities: ['text-to-video', 'video-to-video', 'motion-control'],
    costPerOperation: 0.05,
    maxDuration: 10,
    maxResolution: '1080p',
    description: 'Advanced video generation with improved motion and consistency'
  },
  {
    id: 'runway-gen3-turbo',
    name: 'Runway Gen-3 Turbo',
    provider: 'runway',
    type: 'video',
    capabilities: ['text-to-video', 'fast-generation'],
    costPerOperation: 0.025,
    maxDuration: 5,
    maxResolution: '720p',
    description: 'Fast video generation for quick iterations'
  },
  {
    id: 'stable-video-diffusion',
    name: 'Stable Video Diffusion',
    provider: 'replicate',
    type: 'video',
    capabilities: ['image-to-video', 'motion-synthesis'],
    costPerOperation: 0.03,
    maxDuration: 4,
    maxResolution: '1024x576',
    description: 'Convert images to short video clips with natural motion'
  },

  // Analysis Models
  {
    id: 'claude-sonnet-37',
    name: 'Claude 3.7 Sonnet',
    provider: 'replicate',
    type: 'analysis',
    capabilities: ['prompt-enhancement', 'intent-recognition', 'visual-analysis'],
    costPerOperation: 0.003,
    description: 'Advanced reasoning model for prompt enhancement and content analysis'
  }
]

export function getModelById(id: string): AIModel | undefined {
  return AI_MODELS.find(model => model.id === id)
}

export function getModelsByType(type: string): AIModel[] {
  return AI_MODELS.filter(model => model.type === type)
}

export function getModelsByCapability(capability: string): AIModel[] {
  return AI_MODELS.filter(model => model.capabilities.includes(capability))
}