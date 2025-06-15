export interface UserScenario {
  id: string
  category: 'social-media' | 'business' | 'entertainment' | 'professional' | 'artistic'
  userType: 'influencer' | 'small-business' | 'casual-user' | 'marketer' | 'artist' | 'content-creator'
  title: string
  description: string
  examples: string[]
  complexity: 'basic' | 'intermediate' | 'advanced'
  recommendedModels: string[]
  inputTypes: ('text' | 'image' | 'video' | 'url')[]
}

export const USER_SCENARIOS: UserScenario[] = [
  // Social Media Scenarios
  {
    id: 'instagram-posts',
    category: 'social-media',
    userType: 'influencer',
    title: 'Instagram Post Creation',
    description: 'Create engaging Instagram posts with perfect aesthetics',
    examples: [
      'Create a cozy coffee shop aesthetic with warm lighting',
      'Make this photo look like a vintage film shot',
      'Add dreamy bokeh effects to this portrait',
      'Transform this into a minimalist aesthetic'
    ],
    complexity: 'basic',
    recommendedModels: ['flux-pro', 'sdxl'],
    inputTypes: ['text', 'image']
  },
  {
    id: 'viral-memes',
    category: 'entertainment',
    userType: 'casual-user',
    title: 'Meme and Viral Content',
    description: 'Create trending memes and shareable content',
    examples: [
      'Turn my cat into a superhero meme',
      'Create a Drake pointing meme with custom text',
      'Make a "This is fine" dog meme with my situation',
      'Generate a wojak reaction face for my feeling'
    ],
    complexity: 'basic',
    recommendedModels: ['flux-schnell', 'sdxl'],
    inputTypes: ['text', 'image']
  },
  {
    id: 'tiktok-videos',
    category: 'social-media',
    userType: 'content-creator',
    title: 'TikTok Video Creation',
    description: 'Create engaging short-form video content',
    examples: [
      'Create a satisfying transformation video',
      'Make a before/after style comparison',
      'Generate a trending dance background',
      'Create a story-time animation'
    ],
    complexity: 'intermediate',
    recommendedModels: ['runway-gen3-turbo', 'stable-video-diffusion'],
    inputTypes: ['text', 'image', 'video']
  },

  // Business Scenarios
  {
    id: 'product-photography',
    category: 'business',
    userType: 'small-business',
    title: 'Product Photography Enhancement',
    description: 'Professional product photos for e-commerce',
    examples: [
      'Remove background and add studio lighting',
      'Place my product in a lifestyle setting',
      'Create multiple angles of this product',
      'Add professional reflections and shadows'
    ],
    complexity: 'intermediate',
    recommendedModels: ['flux-pro', 'remove-bg', 'inpainting'],
    inputTypes: ['image']
  },
  {
    id: 'marketing-banners',
    category: 'business',
    userType: 'marketer',
    title: 'Marketing Banner Creation',
    description: 'Eye-catching banners for digital marketing',
    examples: [
      'Create a Black Friday sale banner with bold text',
      'Design a professional service announcement',
      'Make a product launch countdown banner',
      'Generate social proof testimonial graphics'
    ],
    complexity: 'intermediate',
    recommendedModels: ['flux-pro', 'sdxl'],
    inputTypes: ['text', 'image']
  },
  {
    id: 'brand-assets',
    category: 'business',
    userType: 'small-business',
    title: 'Brand Asset Creation',
    description: 'Consistent brand imagery and assets',
    examples: [
      'Create logo variations in different styles',
      'Generate brand-consistent social media templates',
      'Design business card backgrounds',
      'Create branded presentation slides'
    ],
    complexity: 'advanced',
    recommendedModels: ['flux-pro', 'claude-sonnet-37'],
    inputTypes: ['text', 'image']
  },

  // Entertainment Scenarios
  {
    id: 'fantasy-art',
    category: 'entertainment',
    userType: 'casual-user',
    title: 'Fantasy and Sci-Fi Art',
    description: 'Create imaginative fantasy and science fiction artwork',
    examples: [
      'Transform me into a fantasy character',
      'Create a cyberpunk version of my city',
      'Generate an alien landscape with two moons',
      'Make a steampunk version of everyday objects'
    ],
    complexity: 'intermediate',
    recommendedModels: ['flux-pro', 'sdxl'],
    inputTypes: ['text', 'image']
  },
  {
    id: 'photo-restoration',
    category: 'entertainment',
    userType: 'casual-user',
    title: 'Photo Restoration and Enhancement',
    description: 'Restore old photos and enhance memories',
    examples: [
      'Restore this old family photo',
      'Colorize this black and white photo',
      'Remove scratches and damage from this picture',
      'Enhance the quality of this low-res image'
    ],
    complexity: 'basic',
    recommendedModels: ['esrgan', 'inpainting'],
    inputTypes: ['image']
  },

  // Professional Scenarios
  {
    id: 'architectural-viz',
    category: 'professional',
    userType: 'artist',
    title: 'Architectural Visualization',
    description: 'Create professional architectural renderings',
    examples: [
      'Create a photorealistic exterior rendering',
      'Generate interior design concepts',
      'Visualize landscape architecture',
      'Create urban planning visualizations'
    ],
    complexity: 'advanced',
    recommendedModels: ['flux-pro', 'claude-sonnet-37'],
    inputTypes: ['text', 'image']
  },
  {
    id: 'concept-art',
    category: 'professional',
    userType: 'artist',
    title: 'Concept Art and Design',
    description: 'Professional concept art for creative projects',
    examples: [
      'Create character concept sheets',
      'Design vehicle concepts for a game',
      'Generate environment concept art',
      'Create prop design variations'
    ],
    complexity: 'advanced',
    recommendedModels: ['flux-pro', 'sdxl'],
    inputTypes: ['text', 'image']
  },

  // Artistic Scenarios
  {
    id: 'style-transfer',
    category: 'artistic',
    userType: 'artist',
    title: 'Artistic Style Transfer',
    description: 'Apply famous art styles to images',
    examples: [
      'Make this photo look like Van Gogh painted it',
      'Apply Picasso cubist style to my portrait',
      'Create a Japanese woodblock print version',
      'Transform into Monet impressionist style'
    ],
    complexity: 'intermediate',
    recommendedModels: ['flux-pro', 'sdxl'],
    inputTypes: ['image']
  },
  {
    id: 'digital-art',
    category: 'artistic',
    userType: 'artist',
    title: 'Digital Art Creation',
    description: 'Create original digital artwork',
    examples: [
      'Create an abstract composition with bold colors',
      'Generate surreal dreamscape artwork',
      'Design geometric pattern art',
      'Create emotional expression through color and form'
    ],
    complexity: 'intermediate',
    recommendedModels: ['flux-pro', 'sdxl'],
    inputTypes: ['text']
  }
]

export const PROMPT_TEMPLATES = {
  enhancement: [
    'Enhance the quality and details of',
    'Improve the lighting and composition of',
    'Add professional polish to',
    'Increase the resolution and clarity of'
  ],
  style: [
    'Apply {style} style to',
    'Transform into {style} aesthetic',
    'Recreate in the style of {artist}',
    'Give {style} treatment to'
  ],
  composition: [
    'Create a {composition} composition with',
    'Arrange in {layout} format',
    'Design with {focal_point} as the main focus',
    'Balance the elements with {technique}'
  ],
  mood: [
    'Create a {mood} atmosphere',
    'Evoke {emotion} through',
    'Set a {tone} mood with',
    'Capture the feeling of {sentiment}'
  ]
}

export function getScenariosByCategory(category: string): UserScenario[] {
  return USER_SCENARIOS.filter(scenario => scenario.category === category)
}

export function getScenariosByUserType(userType: string): UserScenario[] {
  return USER_SCENARIOS.filter(scenario => scenario.userType === userType)
}

export function getScenariosByComplexity(complexity: string): UserScenario[] {
  return USER_SCENARIOS.filter(scenario => scenario.complexity === complexity)
}