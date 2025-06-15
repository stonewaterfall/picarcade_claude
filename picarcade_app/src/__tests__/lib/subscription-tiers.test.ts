import { 
  SUBSCRIPTION_TIERS, 
  getTierById, 
  calculateCreditCost, 
  getRecommendedTier, 
  calculateMonthlyCost 
} from '@/lib/subscription-tiers'

describe('Subscription Tiers', () => {
  describe('getTierById', () => {
    it('should return correct tier for valid id', () => {
      const tier = getTierById('pro')
      expect(tier).toBeDefined()
      expect(tier?.name).toBe('Pro')
      expect(tier?.price).toBe(49)
    })

    it('should return undefined for invalid id', () => {
      const tier = getTierById('invalid-tier')
      expect(tier).toBeUndefined()
    })
  })

  describe('calculateCreditCost', () => {
    it('should return correct cost for image generation', () => {
      const cost = calculateCreditCost('flux-pro', 'generate')
      expect(cost).toBe(10)
    })

    it('should return correct cost for video generation with duration', () => {
      const cost = calculateCreditCost('runway-gen4', 'generate', 5)
      expect(cost).toBe(125) // 25 credits per second * 5 seconds
    })

    it('should return 0 for unknown model/operation', () => {
      const cost = calculateCreditCost('unknown-model', 'unknown-operation')
      expect(cost).toBe(0)
    })

    it('should handle enhancement operations', () => {
      const cost = calculateCreditCost('esrgan', 'upscale')
      expect(cost).toBe(2)
    })
  })

  describe('getRecommendedTier', () => {
    it('should recommend free tier for low usage', () => {
      const tier = getRecommendedTier(20)
      expect(tier.id).toBe('free')
    })

    it('should recommend starter tier for moderate usage', () => {
      const tier = getRecommendedTier(150)
      expect(tier.id).toBe('starter')
    })

    it('should recommend pro tier for high usage', () => {
      const tier = getRecommendedTier(500)
      expect(tier.id).toBe('pro')
    })

    it('should recommend enterprise tier for very high usage', () => {
      const tier = getRecommendedTier(10000)
      expect(tier.id).toBe('enterprise')
    })
  })

  describe('calculateMonthlyCost', () => {
    it('should return base price when within credits limit', () => {
      const cost = calculateMonthlyCost(150, 'starter')
      expect(cost).toBe(19) // Base price, no extra credits
    })

    it('should add extra credit costs when exceeding limit', () => {
      const cost = calculateMonthlyCost(250, 'starter') // 50 extra credits
      expect(cost).toBe(19 + (50 * 0.12)) // Base + extra credits
    })

    it('should return 0 for invalid tier', () => {
      const cost = calculateMonthlyCost(100, 'invalid-tier')
      expect(cost).toBe(0)
    })

    it('should handle free tier correctly', () => {
      const cost = calculateMonthlyCost(30, 'free') // 5 extra credits
      expect(cost).toBe(0) // Free tier has no extra credit cost
    })
  })

  describe('Tier data validation', () => {
    it('should have all required fields', () => {
      SUBSCRIPTION_TIERS.forEach(tier => {
        expect(tier.id).toBeDefined()
        expect(tier.name).toBeDefined()
        expect(typeof tier.price).toBe('number')
        expect(typeof tier.credits).toBe('number')
        expect(Array.isArray(tier.features)).toBe(true)
        expect(tier.limits).toBeDefined()
        expect(tier.limits.maxResolution).toBeDefined()
        expect(typeof tier.limits.maxVideoDuration).toBe('number')
        expect(typeof tier.limits.maxGenerationsPerDay).toBe('number')
        expect(tier.limits.maxFileSize).toBeDefined()
        expect(typeof tier.limits.priorityQueue).toBe('boolean')
        expect(typeof tier.limits.apiAccess).toBe('boolean')
      })
    })

    it('should have ascending price order', () => {
      for (let i = 1; i < SUBSCRIPTION_TIERS.length; i++) {
        expect(SUBSCRIPTION_TIERS[i].price).toBeGreaterThanOrEqual(SUBSCRIPTION_TIERS[i - 1].price)
      }
    })

    it('should have ascending credit allocation', () => {
      for (let i = 1; i < SUBSCRIPTION_TIERS.length; i++) {
        expect(SUBSCRIPTION_TIERS[i].credits).toBeGreaterThan(SUBSCRIPTION_TIERS[i - 1].credits)
      }
    })

    it('should have higher tiers with better limits', () => {
      for (let i = 1; i < SUBSCRIPTION_TIERS.length; i++) {
        const current = SUBSCRIPTION_TIERS[i]
        const previous = SUBSCRIPTION_TIERS[i - 1]
        
        expect(current.limits.maxGenerationsPerDay).toBeGreaterThanOrEqual(previous.limits.maxGenerationsPerDay)
        expect(current.limits.maxVideoDuration).toBeGreaterThanOrEqual(previous.limits.maxVideoDuration)
      })
    })

    it('should have one recommended tier', () => {
      const recommendedTiers = SUBSCRIPTION_TIERS.filter(tier => tier.recommended)
      expect(recommendedTiers.length).toBe(1)
      expect(recommendedTiers[0].id).toBe('pro')
    })
  })

  describe('Business logic validation', () => {
    it('should offer increasing value per credit at higher tiers', () => {
      const tiers = SUBSCRIPTION_TIERS.filter(tier => tier.price > 0)
      
      for (let i = 1; i < tiers.length; i++) {
        const current = tiers[i]
        const previous = tiers[i - 1]
        
        const currentValuePerCredit = current.price / current.credits
        const previousValuePerCredit = previous.price / previous.credits
        
        expect(currentValuePerCredit).toBeLessThanOrEqual(previousValuePerCredit)
      }
    })

    it('should have reasonable extra credit pricing', () => {
      SUBSCRIPTION_TIERS.forEach(tier => {
        if (tier.costPerExtraCredit) {
          expect(tier.costPerExtraCredit).toBeGreaterThan(0)
          expect(tier.costPerExtraCredit).toBeLessThan(1) // Should be reasonable
        }
      })
    })

    it('should have progressive features', () => {
      const freeFeatures = SUBSCRIPTION_TIERS.find(t => t.id === 'free')?.features.length || 0
      const proFeatures = SUBSCRIPTION_TIERS.find(t => t.id === 'pro')?.features.length || 0
      const enterpriseFeatures = SUBSCRIPTION_TIERS.find(t => t.id === 'enterprise')?.features.length || 0
      
      expect(proFeatures).toBeGreaterThan(freeFeatures)
      expect(enterpriseFeatures).toBeGreaterThan(proFeatures)
    })
  })
})