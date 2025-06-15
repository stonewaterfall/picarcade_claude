import { 
  USER_SCENARIOS, 
  getScenariosByCategory, 
  getScenariosByUserType, 
  getScenariosByComplexity 
} from '@/lib/prompt-scenarios'

describe('Prompt Scenarios', () => {
  describe('getScenariosByCategory', () => {
    it('should return social media scenarios', () => {
      const scenarios = getScenariosByCategory('social-media')
      expect(scenarios.length).toBeGreaterThan(0)
      expect(scenarios.every(s => s.category === 'social-media')).toBe(true)
    })

    it('should return business scenarios', () => {
      const scenarios = getScenariosByCategory('business')
      expect(scenarios.length).toBeGreaterThan(0)
      expect(scenarios.every(s => s.category === 'business')).toBe(true)
    })

    it('should return entertainment scenarios', () => {
      const scenarios = getScenariosByCategory('entertainment')
      expect(scenarios.length).toBeGreaterThan(0)
      expect(scenarios.every(s => s.category === 'entertainment')).toBe(true)
    })

    it('should return empty array for invalid category', () => {
      const scenarios = getScenariosByCategory('invalid-category')
      expect(scenarios).toEqual([])
    })
  })

  describe('getScenariosByUserType', () => {
    it('should return influencer scenarios', () => {
      const scenarios = getScenariosByUserType('influencer')
      expect(scenarios.length).toBeGreaterThan(0)
      expect(scenarios.every(s => s.userType === 'influencer')).toBe(true)
    })

    it('should return small business scenarios', () => {
      const scenarios = getScenariosByUserType('small-business')
      expect(scenarios.length).toBeGreaterThan(0)
      expect(scenarios.every(s => s.userType === 'small-business')).toBe(true)
    })

    it('should return casual user scenarios', () => {
      const scenarios = getScenariosByUserType('casual-user')
      expect(scenarios.length).toBeGreaterThan(0)
      expect(scenarios.every(s => s.userType === 'casual-user')).toBe(true)
    })
  })

  describe('getScenariosByComplexity', () => {
    it('should return basic scenarios', () => {
      const scenarios = getScenariosByComplexity('basic')
      expect(scenarios.length).toBeGreaterThan(0)
      expect(scenarios.every(s => s.complexity === 'basic')).toBe(true)
    })

    it('should return intermediate scenarios', () => {
      const scenarios = getScenariosByComplexity('intermediate')
      expect(scenarios.length).toBeGreaterThan(0)
      expect(scenarios.every(s => s.complexity === 'intermediate')).toBe(true)
    })

    it('should return advanced scenarios', () => {
      const scenarios = getScenariosByComplexity('advanced')
      expect(scenarios.length).toBeGreaterThan(0)
      expect(scenarios.every(s => s.complexity === 'advanced')).toBe(true)
    })
  })

  describe('Scenario data validation', () => {
    it('should have all required fields', () => {
      USER_SCENARIOS.forEach(scenario => {
        expect(scenario.id).toBeDefined()
        expect(scenario.category).toBeDefined()
        expect(scenario.userType).toBeDefined()
        expect(scenario.title).toBeDefined()
        expect(scenario.description).toBeDefined()
        expect(Array.isArray(scenario.examples)).toBe(true)
        expect(scenario.examples.length).toBeGreaterThan(0)
        expect(scenario.complexity).toBeDefined()
        expect(Array.isArray(scenario.recommendedModels)).toBe(true)
        expect(Array.isArray(scenario.inputTypes)).toBe(true)
      })
    })

    it('should have valid category values', () => {
      const validCategories = ['social-media', 'business', 'entertainment', 'professional', 'artistic']
      USER_SCENARIOS.forEach(scenario => {
        expect(validCategories).toContain(scenario.category)
      })
    })

    it('should have valid complexity values', () => {
      const validComplexities = ['basic', 'intermediate', 'advanced']
      USER_SCENARIOS.forEach(scenario => {
        expect(validComplexities).toContain(scenario.complexity)
      })
    })

    it('should have valid input types', () => {
      const validInputTypes = ['text', 'image', 'video', 'url']
      USER_SCENARIOS.forEach(scenario => {
        scenario.inputTypes.forEach(inputType => {
          expect(validInputTypes).toContain(inputType)
        })
      })
    })

    it('should have meaningful examples', () => {
      USER_SCENARIOS.forEach(scenario => {
        scenario.examples.forEach(example => {
          expect(typeof example).toBe('string')
          expect(example.length).toBeGreaterThan(10)
        })
      })
    })
  })

  describe('Coverage tests', () => {
    it('should cover all major user types', () => {
      const userTypes = [...new Set(USER_SCENARIOS.map(s => s.userType))]
      expect(userTypes).toContain('influencer')
      expect(userTypes).toContain('small-business')
      expect(userTypes).toContain('casual-user')
      expect(userTypes).toContain('content-creator')
      expect(userTypes).toContain('marketer')
      expect(userTypes).toContain('artist')
    })

    it('should cover all complexity levels', () => {
      const complexities = [...new Set(USER_SCENARIOS.map(s => s.complexity))]
      expect(complexities).toContain('basic')
      expect(complexities).toContain('intermediate')
      expect(complexities).toContain('advanced')
    })

    it('should cover image and video scenarios', () => {
      const hasImageScenarios = USER_SCENARIOS.some(s => 
        s.inputTypes.includes('image') || s.title.toLowerCase().includes('image')
      )
      const hasVideoScenarios = USER_SCENARIOS.some(s => 
        s.inputTypes.includes('video') || s.title.toLowerCase().includes('video')
      )
      
      expect(hasImageScenarios).toBe(true)
      expect(hasVideoScenarios).toBe(true)
    })
  })
})