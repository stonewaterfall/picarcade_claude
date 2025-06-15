import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Home from '@/app/page'
import { useAppStore } from '@/lib/store'

// Mock the store
jest.mock('@/lib/store')
const mockUseAppStore = useAppStore as jest.MockedFunction<typeof useAppStore>

// Mock environment variables
process.env.NEXT_PUBLIC_REPLICATE_API_KEY = 'test-replicate-key'
process.env.NEXT_PUBLIC_RUNWAY_API_KEY = 'test-runway-key'

describe('App Integration Tests', () => {
  const mockStoreActions = {
    addGeneration: jest.fn(),
    updateGeneration: jest.fn(),
    removeGeneration: jest.fn(),
    addToHistory: jest.fn(),
    updateCredits: jest.fn(),
    setSelectedTool: jest.fn(),
    setIsGenerating: jest.fn(),
    setSidebarOpen: jest.fn()
  }

  const mockStoreState = {
    user: {
      id: 'user1',
      email: 'test@example.com',
      name: 'Test User',
      creditsUsed: 50,
      creditsRemaining: 150,
      subscription: { id: 'pro', name: 'Pro' },
      apiKeys: { replicate: 'test-key', runway: 'test-key' }
    },
    generations: {},
    pendingGenerations: [],
    selectedTool: 'generate',
    isGenerating: false,
    sidebarOpen: true,
    settings: {
      enablePromptEnhancement: true,
      autoSave: true,
      qualityPreference: 'balanced',
      defaultResolution: '1024x1024'
    },
    ...mockStoreActions
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAppStore.mockReturnValue(mockStoreState as any)
  })

  it('renders the complete application', async () => {
    render(<Home />)
    
    await waitFor(() => {
      expect(screen.getByText('PicArcade')).toBeInTheDocument()
    })
    
    expect(screen.getByText('Generate')).toBeInTheDocument()
    expect(screen.getByText('Create images and videos from text')).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/serene landscape/i)).toBeInTheDocument()
  })

  it('shows user credit information', async () => {
    render(<Home />)
    
    await waitFor(() => {
      expect(screen.getByText('Credits: 150')).toBeInTheDocument()
    })
  })

  it('allows switching between tools', async () => {
    const user = userEvent.setup()
    render(<Home />)
    
    await waitFor(() => {
      expect(screen.getByText('PicArcade')).toBeInTheDocument()
    })
    
    const enhanceButton = screen.getByRole('button', { name: /enhance/i })
    await user.click(enhanceButton)
    
    expect(mockStoreActions.setSelectedTool).toHaveBeenCalledWith('enhance')
  })

  it('handles the complete generation workflow', async () => {
    const user = userEvent.setup()
    render(<Home />)
    
    await waitFor(() => {
      expect(screen.getByText('PicArcade')).toBeInTheDocument()
    })
    
    // Enter a prompt
    const textarea = screen.getByPlaceholderText(/serene landscape/i)
    await user.type(textarea, 'A beautiful mountain landscape')
    
    // Click generate
    const generateButton = screen.getByRole('button', { name: /generate/i })
    await user.click(generateButton)
    
    // Verify store actions were called
    expect(mockStoreActions.addToHistory).toHaveBeenCalled()
    expect(mockStoreActions.addGeneration).toHaveBeenCalled()
    expect(mockStoreActions.setIsGenerating).toHaveBeenCalledWith(true)
  })

  it('toggles sidebar on mobile', async () => {
    const user = userEvent.setup()
    
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 640,
    })
    
    render(<Home />)
    
    await waitFor(() => {
      expect(screen.getByText('PicArcade')).toBeInTheDocument()
    })
    
    const menuButton = screen.getByRole('button', { name: /menu/i })
    if (menuButton) {
      await user.click(menuButton)
      expect(mockStoreActions.setSidebarOpen).toHaveBeenCalled()
    }
  })

  it('displays generation statistics', async () => {
    const mockStateWithGenerations = {
      ...mockStoreState,
      generations: {
        'gen1': {
          id: 'gen1',
          status: 'completed',
          output: 'https://example.com/image1.jpg',
          cost: 0.05
        },
        'gen2': {
          id: 'gen2',
          status: 'processing',
          cost: 0.03
        }
      },
      pendingGenerations: ['gen2']
    }
    
    mockUseAppStore.mockReturnValue(mockStateWithGenerations as any)
    
    render(<Home />)
    
    await waitFor(() => {
      expect(screen.getByText('PicArcade')).toBeInTheDocument()
    })
    
    expect(screen.getByText('2')).toBeInTheDocument() // Total generations
    expect(screen.getByText('1')).toBeInTheDocument() // Processing
    expect(screen.getByText('50')).toBeInTheDocument() // Credits used
  })

  it('handles tool-specific features', async () => {
    const user = userEvent.setup()
    
    // Test enhance tool
    mockUseAppStore.mockReturnValue({
      ...mockStoreState,
      selectedTool: 'enhance'
    } as any)
    
    render(<Home />)
    
    await waitFor(() => {
      expect(screen.getByText('Enhance')).toBeInTheDocument()
    })
    
    expect(screen.getByText('Improve and upscale existing content')).toBeInTheDocument()
  })

  describe('Responsive behavior', () => {
    it('adapts to mobile screens', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      
      render(<Home />)
      
      await waitFor(() => {
        expect(screen.getByText('PicArcade')).toBeInTheDocument()
      })
      
      // Mobile menu button should be visible
      expect(screen.getByRole('button', { name: /menu/i })).toBeInTheDocument()
    })

    it('adapts to desktop screens', async () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1920,
      })
      
      render(<Home />)
      
      await waitFor(() => {
        expect(screen.getByText('PicArcade')).toBeInTheDocument()
      })
      
      // Sidebar should be visible
      expect(screen.getByText('Tools')).toBeInTheDocument()
    })
  })

  describe('Error handling', () => {
    it('handles initialization errors gracefully', async () => {
      // Mock console.error to avoid test output noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      // Mock a store error
      mockUseAppStore.mockImplementation(() => {
        throw new Error('Store initialization failed')
      })
      
      // Should not crash the app
      expect(() => render(<Home />)).not.toThrow()
      
      consoleSpy.mockRestore()
    })
  })

  describe('Performance considerations', () => {
    it('does not re-render unnecessarily', async () => {
      const renderSpy = jest.fn()
      
      const TestWrapper = ({ children }: { children: React.ReactNode }) => {
        renderSpy()
        return <>{children}</>
      }
      
      render(
        <TestWrapper>
          <Home />
        </TestWrapper>
      )
      
      await waitFor(() => {
        expect(screen.getByText('PicArcade')).toBeInTheDocument()
      })
      
      expect(renderSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('Accessibility', () => {
    it('has proper heading structure', async () => {
      render(<Home />)
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('PicArcade')
      })
      
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument()
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<Home />)
      
      await waitFor(() => {
        expect(screen.getByText('PicArcade')).toBeInTheDocument()
      })
      
      // Tab through interactive elements
      await user.tab()
      expect(document.activeElement).toBeInTheDocument()
    })

    it('has proper ARIA labels', async () => {
      render(<Home />)
      
      await waitFor(() => {
        expect(screen.getByText('PicArcade')).toBeInTheDocument()
      })
      
      expect(screen.getByRole('main')).toBeInTheDocument()
      expect(screen.getByRole('complementary')).toBeInTheDocument() // sidebar
    })
  })
})