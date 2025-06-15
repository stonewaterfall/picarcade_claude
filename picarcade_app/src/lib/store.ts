import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { GenerationResult, GenerationRequest } from './api-clients'
import { SubscriptionTier } from './subscription-tiers'

export interface Project {
  id: string
  name: string
  description?: string
  type: 'image' | 'video' | 'mixed'
  createdAt: Date
  updatedAt: Date
  thumbnailUrl?: string
  generations: string[] // Generation IDs
}

export interface User {
  id: string
  email: string
  name: string
  subscription: SubscriptionTier
  creditsUsed: number
  creditsRemaining: number
  apiKeys: {
    replicate: string
    runway: string
  }
}

interface AppState {
  // User state
  user: User | null
  setUser: (user: User | null) => void
  updateCredits: (used: number) => void

  // Projects
  projects: Project[]
  activeProject: Project | null
  createProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Project
  updateProject: (id: string, updates: Partial<Project>) => void
  deleteProject: (id: string) => void
  setActiveProject: (project: Project | null) => void

  // Generations
  generations: Record<string, GenerationResult>
  pendingGenerations: string[]
  addGeneration: (generation: GenerationResult) => void
  updateGeneration: (id: string, updates: Partial<GenerationResult>) => void
  removeGeneration: (id: string) => void

  // UI state
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  
  selectedTool: 'generate' | 'enhance' | 'edit' | 'analyze'
  setSelectedTool: (tool: 'generate' | 'enhance' | 'edit' | 'analyze') => void
  
  isGenerating: boolean
  setIsGenerating: (generating: boolean) => void

  // Settings
  settings: {
    autoSave: boolean
    qualityPreference: 'speed' | 'balanced' | 'quality'
    defaultResolution: string
    enablePromptEnhancement: boolean
  }
  updateSettings: (settings: Partial<AppState['settings']>) => void

  // History
  history: GenerationRequest[]
  addToHistory: (request: GenerationRequest) => void
  clearHistory: () => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // User state
      user: null,
      setUser: (user) => set({ user }),
      updateCredits: (used) => set((state) => {
        if (!state.user) return state
        return {
          user: {
            ...state.user,
            creditsUsed: state.user.creditsUsed + used,
            creditsRemaining: Math.max(0, state.user.creditsRemaining - used)
          }
        }
      }),

      // Projects
      projects: [],
      activeProject: null,
      createProject: (projectData) => {
        const project: Project = {
          ...projectData,
          id: Math.random().toString(36).substring(2, 15),
          createdAt: new Date(),
          updatedAt: new Date(),
          generations: []
        }
        set((state) => ({
          projects: [...state.projects, project],
          activeProject: project
        }))
        return project
      },
      updateProject: (id, updates) => set((state) => ({
        projects: state.projects.map(p => 
          p.id === id 
            ? { ...p, ...updates, updatedAt: new Date() }
            : p
        ),
        activeProject: state.activeProject?.id === id 
          ? { ...state.activeProject, ...updates, updatedAt: new Date() }
          : state.activeProject
      })),
      deleteProject: (id) => set((state) => ({
        projects: state.projects.filter(p => p.id !== id),
        activeProject: state.activeProject?.id === id ? null : state.activeProject
      })),
      setActiveProject: (project) => set({ activeProject: project }),

      // Generations
      generations: {},
      pendingGenerations: [],
      addGeneration: (generation) => set((state) => ({
        generations: {
          ...state.generations,
          [generation.id]: generation
        },
        pendingGenerations: generation.status === 'pending' || generation.status === 'processing'
          ? [...state.pendingGenerations, generation.id]
          : state.pendingGenerations
      })),
      updateGeneration: (id, updates) => set((state) => ({
        generations: {
          ...state.generations,
          [id]: { ...state.generations[id], ...updates }
        },
        pendingGenerations: updates.status === 'completed' || updates.status === 'failed'
          ? state.pendingGenerations.filter(gId => gId !== id)
          : state.pendingGenerations
      })),
      removeGeneration: (id) => set((state) => ({
        generations: Object.fromEntries(
          Object.entries(state.generations).filter(([gId]) => gId !== id)
        ),
        pendingGenerations: state.pendingGenerations.filter(gId => gId !== id)
      })),

      // UI state
      sidebarOpen: true,
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      
      selectedTool: 'generate',
      setSelectedTool: (tool) => set({ selectedTool: tool }),
      
      isGenerating: false,
      setIsGenerating: (generating) => set({ isGenerating: generating }),

      // Settings
      settings: {
        autoSave: true,
        qualityPreference: 'balanced',
        defaultResolution: '1024x1024',
        enablePromptEnhancement: true
      },
      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings }
      })),

      // History
      history: [],
      addToHistory: (request) => set((state) => ({
        history: [request, ...state.history.slice(0, 49)] // Keep last 50
      })),
      clearHistory: () => set({ history: [] })
    }),
    {
      name: 'picarcade-storage',
      partialize: (state) => ({
        user: state.user,
        projects: state.projects,
        settings: state.settings,
        history: state.history
      })
    }
  )
)