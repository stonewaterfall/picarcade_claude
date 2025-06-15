export interface SubscriptionTier {
  id: string
  name: string
  price: number // Monthly price in USD
  credits: number // Monthly credits included
  features: string[]
  limits: {
    maxResolution: string
    maxVideoDuration: number
    maxGenerationsPerDay: number
    maxFileSize: string
    priorityQueue: boolean
    apiAccess: boolean
  }
  costPerExtraCredit?: number
  recommended?: boolean
}

export const SUBSCRIPTION_TIERS: SubscriptionTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    credits: 25,
    features: [
      '25 monthly credits',
      'Basic image generation',
      'Standard resolution (1024x1024)',
      'Community support',
      'Watermarked outputs'
    ],
    limits: {
      maxResolution: '1024x1024',
      maxVideoDuration: 0,
      maxGenerationsPerDay: 5,
      maxFileSize: '5MB',
      priorityQueue: false,
      apiAccess: false
    }
  },
  {
    id: 'starter',
    name: 'Starter',
    price: 19,
    credits: 200,
    features: [
      '200 monthly credits',
      'All image generation models',
      'Basic video generation (5s max)',
      'HD resolution (2048x2048)',
      'No watermarks',
      'Email support'
    ],
    limits: {
      maxResolution: '2048x2048',
      maxVideoDuration: 5,
      maxGenerationsPerDay: 50,
      maxFileSize: '25MB',
      priorityQueue: false,
      apiAccess: false
    },
    costPerExtraCredit: 0.12
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 49,
    credits: 600,
    features: [
      '600 monthly credits',
      'All AI models available',
      'Extended video generation (10s max)',
      '4K resolution support',
      'Priority processing',
      'Advanced editing tools',
      'Prompt enhancement with Claude',
      'Priority support'
    ],
    limits: {
      maxResolution: '4096x4096',
      maxVideoDuration: 10,
      maxGenerationsPerDay: 150,
      maxFileSize: '100MB',
      priorityQueue: true,
      apiAccess: false
    },
    costPerExtraCredit: 0.10,
    recommended: true
  },
  {
    id: 'business',
    name: 'Business',
    price: 149,
    credits: 2000,
    features: [
      '2000 monthly credits',
      'All premium models',
      'Unlimited video duration',
      '8K resolution support',
      'Fastest processing',
      'API access included',
      'Custom model fine-tuning',
      'Team collaboration tools',
      'Dedicated support manager'
    ],
    limits: {
      maxResolution: '8192x8192',
      maxVideoDuration: 60,
      maxGenerationsPerDay: 500,
      maxFileSize: '500MB',
      priorityQueue: true,
      apiAccess: true
    },
    costPerExtraCredit: 0.08
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 499,
    credits: 8000,
    features: [
      '8000+ monthly credits',
      'Custom credit packages',
      'All models + beta access',
      'Unlimited resolution',
      'Dedicated infrastructure',
      'Full API access',
      'Custom integrations',
      'On-premise deployment options',
      'SLA guarantees',
      '24/7 priority support'
    ],
    limits: {
      maxResolution: 'Unlimited',
      maxVideoDuration: 300,
      maxGenerationsPerDay: 2000,
      maxFileSize: 'Unlimited',
      priorityQueue: true,
      apiAccess: true
    },
    costPerExtraCredit: 0.05
  }
]

export interface CreditCost {
  modelId: string
  operation: string
  credits: number
  description: string
}

export const CREDIT_COSTS: CreditCost[] = [
  // Image Generation
  { modelId: 'flux-pro', operation: 'generate', credits: 10, description: 'FLUX Pro image generation' },
  { modelId: 'flux-dev', operation: 'generate', credits: 5, description: 'FLUX Dev image generation' },
  { modelId: 'flux-schnell', operation: 'generate', credits: 1, description: 'FLUX Schnell fast generation' },
  { modelId: 'sdxl', operation: 'generate', credits: 3, description: 'SDXL image generation' },

  // Image Enhancement
  { modelId: 'esrgan', operation: 'upscale', credits: 2, description: 'AI upscaling and enhancement' },
  { modelId: 'remove-bg', operation: 'process', credits: 1, description: 'Background removal' },
  { modelId: 'inpainting', operation: 'edit', credits: 4, description: 'Image inpainting and editing' },

  // Video Generation
  { modelId: 'runway-gen4', operation: 'generate', credits: 25, description: 'Runway Gen-4 video (per second)' },
  { modelId: 'runway-gen3-alpha', operation: 'generate', credits: 15, description: 'Runway Gen-3 Alpha (per second)' },
  { modelId: 'runway-gen3-turbo', operation: 'generate', credits: 8, description: 'Runway Gen-3 Turbo (per second)' },
  { modelId: 'stable-video-diffusion', operation: 'generate', credits: 12, description: 'Stable Video Diffusion (per second)' },

  // Analysis and Enhancement
  { modelId: 'claude-sonnet-37', operation: 'analyze', credits: 1, description: 'Prompt enhancement and analysis' }
]

export function getTierById(id: string): SubscriptionTier | undefined {
  return SUBSCRIPTION_TIERS.find(tier => tier.id === id)
}

export function calculateCreditCost(modelId: string, operation: string, duration?: number): number {
  const cost = CREDIT_COSTS.find(c => c.modelId === modelId && c.operation === operation)
  if (!cost) return 0
  
  // For video operations, multiply by duration
  if (operation === 'generate' && modelId.includes('runway') && duration) {
    return cost.credits * duration
  }
  
  return cost.credits
}

export function getRecommendedTier(monthlyUsage: number): SubscriptionTier {
  for (const tier of SUBSCRIPTION_TIERS) {
    if (monthlyUsage <= tier.credits) {
      return tier
    }
  }
  return SUBSCRIPTION_TIERS[SUBSCRIPTION_TIERS.length - 1] // Return enterprise if usage is very high
}

export function calculateMonthlyCost(creditsUsed: number, tierId: string): number {
  const tier = getTierById(tierId)
  if (!tier) return 0

  const baseCost = tier.price
  const extraCredits = Math.max(0, creditsUsed - tier.credits)
  const extraCost = extraCredits * (tier.costPerExtraCredit || 0)

  return baseCost + extraCost
}