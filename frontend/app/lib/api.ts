import axios from 'axios'
import type { GenerationRequest, GenerationResponse, HistoryItem, UploadResponse, Reference } from '../types'
import { apiHelpers, storageHelpers } from './supabase'
import { aiServices } from './ai-services'

// Utility function to parse @mentions from prompts
const parseReferenceMentions = (prompt: string): string[] => {
  const mentionRegex = /@([a-zA-Z0-9_-]+)/g
  const mentions = []
  let match
  while ((match = mentionRegex.exec(prompt)) !== null) {
    mentions.push(match[1])
  }
  return mentions
}

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-api-domain.com' 
  : 'http://localhost:8000'

// Create axios instance with interceptors for authentication
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5 minutes for generation requests
})

// Add request interceptor to include auth headers
api.interceptors.request.use(async (config) => {
  try {
    // Skip auth headers for upload endpoints to avoid interfering with multipart form data
    if (config.url?.includes('/uploads/')) {
      console.log('[Auth] Skipping auth headers for upload endpoint')
      return config
    }
    
    const authHeaders = await apiHelpers.getAuthHeader()
    Object.assign(config.headers, authHeaders)
  } catch (error) {
    console.warn('Failed to get auth headers:', error)
  }
  return config
})

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - could redirect to login or refresh token
      console.warn('Unauthorized request - user may need to sign in')
    }
    return Promise.reject(error)
  }
)

// NEW: Intelligent content generation with automatic intent detection and reference support
export const generateContent = async (request: GenerationRequest): Promise<GenerationResponse> => {
  try {
    console.log('[Generation] Starting intelligent content generation with reference support...')
    
    // Step 1: Parse @mentions and resolve references
    const mentions = parseReferenceMentions(request.prompt)
    console.log('[Generation] Found @mentions:', mentions)
    
    // Resolve reference images from mentions
    let resolvedReferences: Array<{ tag: string; url: string; description?: string }> = []
    if (mentions.length > 0 && request.user_id) {
      try {
        // Get user's references that match the mentions
        const userReferences = await getUserReferences(request.user_id)
        resolvedReferences = userReferences
          .filter(ref => mentions.some(mention => ref.tag.toLowerCase() === mention.toLowerCase()))
          .map(ref => ({
            tag: ref.tag,
            url: ref.image_url,
            description: ref.description
          }))
        console.log('[Generation] Resolved references:', resolvedReferences)
      } catch (error) {
        console.warn('[Generation] Failed to resolve references:', error)
      }
    }
    
    // Step 2: Enhanced intent detection with reference context
    const intentRequest = {
      prompt: request.prompt,
      hasActiveImage: !!request.current_working_image,
      hasUpload: !!(request.uploaded_images?.length),
      hasReference: !!(request.reference_images?.length) || resolvedReferences.length > 0,
      previousContext: request.session_id,
      referenceMentions: mentions,
      activeImageUrl: request.current_working_image,
      uploadedImages: request.uploaded_images,
      referenceImages: resolvedReferences
    }
    
    const intent = await aiServices.detectUserIntent(intentRequest)
    console.log('[Generation] Detected intent with references:', intent)
    
    // Step 3: Route to appropriate model based on intent
    let generationResult: { success: boolean; output?: string; error?: string }
    
    // Handle reference-based operations
    if (intent.referenceUsage && (intent.intent === 'transfer' || intent.intent === 'style' || intent.intent === 'swap')) {
      console.log('[Generation] Using reference-based generation')
      
      // Populate reference URLs in intent
      if (resolvedReferences.length > 0) {
        intent.referenceUsage.primary = intent.referenceUsage.primary || resolvedReferences[0]?.url
        intent.referenceUsage.secondary = intent.referenceUsage.secondary || resolvedReferences[1]?.url
      }
      intent.referenceUsage.activeImage = intent.referenceUsage.activeImage || request.current_working_image
      
      generationResult = await aiServices.generateWithReferences(intent, request.prompt, request)
    } else {
      // Handle non-reference operations
      switch (intent.recommendedModel) {
        case 'runway-gen3':
          console.log('[Generation] Using Runway Gen-3')
          const inputImage = request.current_working_image || request.uploaded_images?.[0]
          generationResult = await aiServices.generateWithRunway(
            request.prompt,
            inputImage ? 'imageToVideo' : 'gen3',
            inputImage,
            intent.parameters
          )
          break
          
        case 'runway-gen4':
          console.log('[Generation] Using Runway Gen-4')
          if (!intent.referenceUsage) {
            throw new Error('Runway Gen-4 requires reference configuration')
          }
          generationResult = await aiServices.generateWithRunwayGen4(
            request.prompt,
            intent.referenceUsage.operation,
            {
              primary: intent.referenceUsage.primary,
              secondary: intent.referenceUsage.secondary,
              activeImage: intent.referenceUsage.activeImage
            },
            intent.parameters
          )
          break
          
        case 'kontext-max':
          console.log('[Generation] Using Kontext Max for image editing')
          const baseImage = request.current_working_image || request.uploaded_images?.[0]
          if (!baseImage) {
            throw new Error('Kontext Max requires an input image')
          }
          generationResult = await aiServices.editWithKontextMax(
            request.prompt,
            baseImage,
            intent.parameters
          )
          break
          
        default:
          console.log('[Generation] Falling back to legacy API')
          // Fallback to existing API for other models
          const response = await api.post('/api/v1/generation/generate', {
            ...request,
            intent_analysis: intent,
            resolved_references: resolvedReferences
          })
          return response.data
      }
    }
    
    // Step 4: Format response
    if (!generationResult.success) {
      throw new Error(generationResult.error || 'Generation failed')
    }
    
    return {
      success: true,
      generation_id: `${Date.now()}-${Math.random().toString(36).substring(2)}`,
      output_url: generationResult.output,
      model_used: intent.recommendedModel + (intent.subModel ? `-${intent.subModel}` : ''),
      execution_time: 0, // Will be calculated by the model
      input_image_used: request.current_working_image || request.uploaded_images?.[0],
      image_source_type: request.current_working_image ? 'working_image' : 
                        request.uploaded_images?.length ? 'uploaded' : undefined,
      references_used: resolvedReferences.map(ref => ({ uri: ref.url, tag: ref.tag })),
      metadata: {
        intent_analysis: intent,
        session_id: request.session_id,
        mentions_detected: mentions,
        references_resolved: resolvedReferences.length,
        reference_operation: intent.referenceUsage?.operation
      }
    }
    
  } catch (error) {
    console.error('[Generation] Error:', error)
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.detail || error.message)
    }
    throw error
  }
}


export const getUserHistory = async (userId: string, limit: number = 20): Promise<HistoryItem[]> => {
  try {
    const response = await api.get(`/api/v1/generation/history/${userId}?limit=${limit}`)
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.detail || error.message)
    }
    throw error
  }
}

// NEW: Direct Supabase Storage upload (replaces API backend)
export const uploadImage = async (
  file: File, 
  userId?: string, 
  resizeMax: number = 2048
): Promise<UploadResponse> => {
  try {
    console.log('[Upload] Using Supabase Storage for:', file.name, 'Size:', file.size, 'Type:', file.type)
    
    // Upload directly to Supabase Storage
    const userFolder = userId ? `user-${userId}` : 'anonymous'
    const result = await storageHelpers.uploadImage(file, 'images', userFolder)
    
    if (result.error) {
      throw new Error(result.error.message || 'Upload failed')
    }

    // Return in the expected format
    return {
      success: true,
      file_path: result.data?.path || '',
      public_url: result.publicURL || '',
      filename: file.name,
      content_type: file.type,
      message: 'Upload successful via Supabase Storage'
    }
  } catch (error) {
    console.error('[Upload] Supabase Storage error:', error)
    throw new Error(error instanceof Error ? error.message : 'Upload failed')
  }
}


// Authentication API functions
export const authAPI = {
  async login(email: string, password: string) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/auth/login`, {
        email,
        password
      })
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || error.message)
      }
      throw error
    }
  },

  async register(email: string, password: string, metadata?: any) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/auth/register`, {
        email,
        password,
        metadata
      })
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || error.message)
      }
      throw error
    }
  },

  async refreshToken(refreshToken: string) {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, {
        refresh_token: refreshToken
      })
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || error.message)
      }
      throw error
    }
  },

  async logout() {
    try {
      const response = await api.post('/api/v1/auth/logout')
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || error.message)
      }
      throw error
    }
  },

  async getCurrentUser() {
    try {
      const response = await api.get('/api/v1/auth/me')
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || error.message)
      }
      throw error
    }
  },

  async validateToken() {
    try {
      const response = await api.get('/api/v1/auth/validate')
      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.detail || error.message)
      }
      throw error
    }
  }
}

// References API functions
export const createReference = async (
  userId: string,
  tag: string,
  imageUrl: string,
  displayName?: string,
  description?: string,
  category: string = 'general'
): Promise<Reference> => {
  try {
    const response = await api.post(`/api/v1/references/?user_id=${userId}`, {
      tag,
      image_url: imageUrl,
      display_name: displayName,
      description,
      category
    })
    return response.data.reference
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.detail || error.message)
    }
    throw error
  }
}

export const getUserReferences = async (userId: string, category?: string): Promise<Reference[]> => {
  try {
    const params = new URLSearchParams({ user_id: userId })
    if (category && category !== 'all') {
      params.append('category', category)
    }
    
    const response = await api.get(`/api/v1/references/?${params.toString()}`)
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.detail || error.message)
    }
    throw error
  }
}

export const deleteReference = async (userId: string, tag: string): Promise<void> => {
  try {
    await api.delete(`/api/v1/references/${tag}?user_id=${userId}`)
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.detail || error.message)
    }
    throw error
  }
}

export const updateReference = async (
  userId: string,
  oldTag: string,
  newTag?: string,
  displayName?: string,
  description?: string,
  category?: string
): Promise<Reference> => {
  try {
    const response = await api.put(`/api/v1/references/${oldTag}?user_id=${userId}`, {
      new_tag: newTag,
      display_name: displayName,
      description,
      category
    })
    return response.data.reference
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.detail || error.message)
    }
    throw error
  }
}


export const setWorkingImage = async (sessionId: string, imageUrl: string, userId: string): Promise<any> => {
  try {
    const response = await api.post('/api/v1/generation/session/set-working-image', {
      session_id: sessionId,
      image_url: imageUrl,
      user_id: userId
    })
    return response.data
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.detail || error.message)
    }
    throw error
  }
}