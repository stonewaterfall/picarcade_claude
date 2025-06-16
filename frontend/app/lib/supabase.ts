import { createClient } from '@supabase/supabase-js'

// Types for AI services
export interface IntentDetectionRequest {
  prompt: string
  hasActiveImage: boolean
  hasUpload: boolean
  hasReference: boolean
  previousContext?: string
  referenceMentions?: string[] // @mentions found in prompt
  activeImageUrl?: string
  uploadedImages?: string[]
  referenceImages?: Array<{ tag: string; url: string; description?: string }>
}

export interface IntentDetectionResponse {
  intent: 'create' | 'edit' | 'enhance' | 'generate' | 'modify' | 'transfer' | 'style' | 'swap'
  confidence: number
  reasoning: string
  recommendedModel: 'runway-gen3' | 'runway-gen4' | 'kontext-max' | 'stable-diffusion' | 'dalle'
  subModel?: 'persona' | 'style' | 'image-to-video' // Specific Runway model variant
  parameters: Record<string, any>
  referenceUsage?: {
    primary?: string // Main reference image URL
    secondary?: string // Second reference image URL
    activeImage?: string // Current working image
    operation: 'person-swap' | 'style-transfer' | 'object-placement' | 'appearance-copy'
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://icgwpkroorulmsfdiuoh.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljZ3dwa3Jvb3J1bG1zZmRpdW9oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxODkwNjMsImV4cCI6MjA2NDc2NTA2M30.EcFRMaxCCRtS-ynKXZVrKbWdG_LI93zgaxrzW82BTYc'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

// Auth helper functions
export const authHelpers = {
  // Sign up new user
  async signUp(email: string, password: string, metadata?: any) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })
    return { data, error }
  },

  // Sign in existing user
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  // Sign out current user
  async signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Get current session
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  },

  // Get current user
  async getUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  // Refresh session
  async refreshSession() {
    const { data, error } = await supabase.auth.refreshSession()
    return { data, error }
  },

  // Listen to auth state changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Supabase Storage helper functions
export const storageHelpers = {
  // Upload image directly to Supabase Storage
  async uploadImage(
    file: File, 
    bucket: string = 'images',
    folder: string = 'uploads'
  ): Promise<{ data: any; error: any; publicURL?: string }> {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
      
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Upload error:', error)
        return { data: null, error }
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName)

      return {
        data,
        error: null,
        publicURL: urlData.publicUrl
      }
    } catch (error) {
      console.error('Upload exception:', error)
      return { data: null, error }
    }
  },

  // Delete image from Supabase Storage
  async deleteImage(filePath: string, bucket: string = 'images'): Promise<{ error: any }> {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath])

    return { error }
  },

  // List images for a user
  async listUserImages(userId: string, bucket: string = 'images'): Promise<{ data: any[]; error: any }> {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(`uploads/${userId}`, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' }
      })

    return { data: data || [], error }
  }
}

// API helper functions with authentication
export const apiHelpers = {
  // Get authorization header for API calls
  async getAuthHeader(): Promise<Record<string, string>> {
    try {
      // First try Supabase session
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.access_token) {
        return {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      }

      // Fallback to localStorage (from custom auth system)
      const storedSession = localStorage.getItem('auth_session')
      if (storedSession) {
        const customSession = JSON.parse(storedSession)
        if (customSession?.access_token) {
          return {
            'Authorization': `Bearer ${customSession.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      }
    } catch (error) {
      console.warn('Failed to get auth token:', error)
    }
    
    return {
      'Content-Type': 'application/json'
    }
  },

  // Make authenticated API call
  async authenticatedFetch(url: string, options: RequestInit = {}) {
    const authHeaders = await this.getAuthHeader()
    
    return fetch(url, {
      ...options,
      headers: {
        ...authHeaders,
        ...(options.headers as Record<string, string> || {})
      }
    })
  }
} 