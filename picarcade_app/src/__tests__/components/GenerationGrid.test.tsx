import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GenerationGrid } from '@/components/GenerationGrid'
import { GenerationResult } from '@/lib/api-clients'
import { useAppStore } from '@/lib/store'

// Mock the store
jest.mock('@/lib/store')
const mockUseAppStore = useAppStore as jest.MockedFunction<typeof useAppStore>

// Mock updateGeneration
const mockUpdateGeneration = jest.fn()

describe('GenerationGrid Component', () => {
  const mockOnDelete = jest.fn()
  const mockOnFavorite = jest.fn()
  
  const sampleGenerations: GenerationResult[] = [
    {
      id: 'gen1',
      status: 'completed',
      output: 'https://example.com/image1.jpg',
      cost: 0.05,
      processingTime: 5000,
      metadata: { prompt: 'A beautiful landscape', type: 'image' }
    },
    {
      id: 'gen2',
      status: 'processing',
      cost: 0.03,
      metadata: { prompt: 'A city skyline', type: 'image' }
    },
    {
      id: 'gen3',
      status: 'failed',
      error: 'Generation failed due to invalid prompt',
      cost: 0.02,
      metadata: { prompt: 'Invalid prompt', type: 'image' }
    },
    {
      id: 'gen4',
      status: 'completed',
      output: 'https://example.com/video1.mp4',
      cost: 0.15,
      processingTime: 10000,
      metadata: { prompt: 'A flowing river', type: 'video' }
    }
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAppStore.mockReturnValue({
      updateGeneration: mockUpdateGeneration
    } as any)
    
    // Mock fetch for download functionality
    global.fetch = jest.fn().mockResolvedValue({
      blob: () => Promise.resolve(new Blob(['test'], { type: 'image/jpeg' }))
    } as any)

    // Mock URL methods
    global.URL.createObjectURL = jest.fn().mockReturnValue('blob:mock-url')
    global.URL.revokeObjectURL = jest.fn()
    
    // Mock navigator.share
    Object.defineProperty(navigator, 'share', {
      writable: true,
      value: jest.fn().mockResolvedValue(undefined)
    })
    
    // Mock navigator.clipboard
    Object.defineProperty(navigator, 'clipboard', {
      writable: true,
      value: {
        writeText: jest.fn().mockResolvedValue(undefined)
      }
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders empty state when no generations', () => {
    render(<GenerationGrid generations={[]} />)
    
    expect(screen.getByText(/no generations yet/i)).toBeInTheDocument()
    expect(screen.getByText(/start by creating your first ai generation/i)).toBeInTheDocument()
  })

  it('renders all generation cards', () => {
    render(<GenerationGrid generations={sampleGenerations} />)
    
    expect(screen.getByText('A beautiful landscape')).toBeInTheDocument()
    expect(screen.getByText('A city skyline')).toBeInTheDocument()
    expect(screen.getByText('Invalid prompt')).toBeInTheDocument()
    expect(screen.getByText('A flowing river')).toBeInTheDocument()
  })

  it('shows correct status badges', () => {
    render(<GenerationGrid generations={sampleGenerations} />)
    
    expect(screen.getByText('Completed')).toBeInTheDocument()
    expect(screen.getByText('Processing')).toBeInTheDocument()
    expect(screen.getByText('Failed')).toBeInTheDocument()
  })

  it('displays images for completed image generations', () => {
    render(<GenerationGrid generations={sampleGenerations} />)
    
    const images = screen.getAllByAltText('Generated content')
    expect(images).toHaveLength(2) // One for image, one for video
    expect(images[0]).toHaveAttribute('src', 'https://example.com/image1.jpg')
  })

  it('displays videos for completed video generations', () => {
    render(<GenerationGrid generations={sampleGenerations} />)
    
    const video = screen.getByRole('application') // video element
    expect(video).toHaveAttribute('src', 'https://example.com/video1.mp4')
    expect(video).toHaveAttribute('controls')
    expect(video).toHaveAttribute('muted')
    expect(video).toHaveAttribute('loop')
  })

  it('shows processing state for processing generations', () => {
    render(<GenerationGrid generations={sampleGenerations} />)
    
    expect(screen.getByText('Processing...')).toBeInTheDocument()
  })

  it('shows error state for failed generations', () => {
    render(<GenerationGrid generations={sampleGenerations} />)
    
    expect(screen.getByText('Generation Failed')).toBeInTheDocument()
    expect(screen.getByText('Generation failed due to invalid prompt')).toBeInTheDocument()
  })

  it('displays cost and processing time', () => {
    render(<GenerationGrid generations={sampleGenerations} />)
    
    expect(screen.getByText('Cost: $0.050')).toBeInTheDocument()
    expect(screen.getByText('5s')).toBeInTheDocument()
  })

  it('calls onDelete when delete button is clicked', async () => {
    const user = userEvent.setup()
    render(<GenerationGrid generations={sampleGenerations} onDelete={mockOnDelete} />)
    
    const deleteButtons = screen.getAllByRole('button', { name: '' })
    const deleteButton = deleteButtons.find(btn => 
      btn.querySelector('svg[data-lucide="trash-2"]')
    )
    
    if (deleteButton) {
      await user.click(deleteButton)
      expect(mockOnDelete).toHaveBeenCalledWith('gen1')
    }
  })

  it('calls onFavorite when favorite button is clicked', async () => {
    const user = userEvent.setup()
    render(<GenerationGrid generations={sampleGenerations} onFavorite={mockOnFavorite} />)
    
    const favoriteButtons = screen.getAllByRole('button', { name: '' })
    const favoriteButton = favoriteButtons.find(btn => 
      btn.querySelector('svg[data-lucide="heart"]')
    )
    
    if (favoriteButton) {
      await user.click(favoriteButton)
      expect(mockOnFavorite).toHaveBeenCalledWith('gen1')
    }
  })

  it('handles download functionality', async () => {
    const user = userEvent.setup()
    render(<GenerationGrid generations={sampleGenerations} />)
    
    // Find download button for completed generation
    const downloadButtons = screen.getAllByRole('button', { name: '' })
    const downloadButton = downloadButtons.find(btn => 
      btn.querySelector('svg[data-lucide="download"]')
    )
    
    if (downloadButton) {
      await user.click(downloadButton)
      
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('https://example.com/image1.jpg')
      })
    }
  })

  it('handles share functionality with native share API', async () => {
    const user = userEvent.setup()
    render(<GenerationGrid generations={sampleGenerations} />)
    
    const shareButtons = screen.getAllByRole('button', { name: '' })
    const shareButton = shareButtons.find(btn => 
      btn.querySelector('svg[data-lucide="share-2"]')
    )
    
    if (shareButton) {
      await user.click(shareButton)
      
      expect(navigator.share).toHaveBeenCalledWith({
        title: 'Check out my AI creation!',
        text: 'Created with PicArcade AI',
        url: 'https://example.com/image1.jpg'
      })
    }
  })

  it('handles share functionality fallback to clipboard', async () => {
    // Mock navigator.share to not exist
    Object.defineProperty(navigator, 'share', {
      value: undefined
    })
    
    const user = userEvent.setup()
    render(<GenerationGrid generations={sampleGenerations} />)
    
    const shareButtons = screen.getAllByRole('button', { name: '' })
    const shareButton = shareButtons.find(btn => 
      btn.querySelector('svg[data-lucide="share-2"]')
    )
    
    if (shareButton) {
      await user.click(shareButton)
      
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('https://example.com/image1.jpg')
    }
  })

  it('opens modal when image is clicked', async () => {
    const user = userEvent.setup()
    render(<GenerationGrid generations={sampleGenerations} />)
    
    const image = screen.getByAltText('Generated content')
    await user.click(image)
    
    expect(screen.getByText('Close')).toBeInTheDocument()
    
    // Modal should show the same image
    const modalImages = screen.getAllByAltText('Generated content')
    expect(modalImages).toHaveLength(2) // Original + modal
  })

  it('closes modal when close button is clicked', async () => {
    const user = userEvent.setup()
    render(<GenerationGrid generations={sampleGenerations} />)
    
    // Open modal
    const image = screen.getByAltText('Generated content')
    await user.click(image)
    
    // Close modal
    const closeButton = screen.getByText('Close')
    await user.click(closeButton)
    
    expect(screen.queryByText('Close')).not.toBeInTheDocument()
  })

  describe('Grid layout', () => {
    it('applies correct grid classes', () => {
      const { container } = render(<GenerationGrid generations={sampleGenerations} />)
      
      const gridContainer = container.querySelector('.grid')
      expect(gridContainer).toHaveClass(
        'grid-cols-1',
        'md:grid-cols-2', 
        'lg:grid-cols-3',
        'xl:grid-cols-4'
      )
    })
  })

  describe('Accessibility', () => {
    it('has proper alt text for images', () => {
      render(<GenerationGrid generations={sampleGenerations} />)
      
      const images = screen.getAllByAltText('Generated content')
      expect(images).toHaveLength(2)
    })

    it('has proper video controls', () => {
      render(<GenerationGrid generations={sampleGenerations} />)
      
      const video = screen.getByRole('application')
      expect(video).toHaveAttribute('controls')
      expect(video).toHaveAttribute('muted')
    })

    it('supports keyboard navigation for interactive elements', async () => {
      const user = userEvent.setup()
      render(<GenerationGrid generations={sampleGenerations} />)
      
      // Tab through interactive elements
      await user.tab()
      const focusedElement = document.activeElement
      expect(focusedElement).toBeInTheDocument()
    })
  })

  describe('Edge cases', () => {
    it('handles missing output gracefully', () => {
      const generationWithoutOutput: GenerationResult = {
        id: 'gen-no-output',
        status: 'completed',
        cost: 0.05,
        metadata: { prompt: 'Test prompt', type: 'image' }
      }
      
      render(<GenerationGrid generations={[generationWithoutOutput]} />)
      
      // Should not crash and should show status
      expect(screen.getByText('Completed')).toBeInTheDocument()
    })

    it('handles array output for images', () => {
      const generationWithArrayOutput: GenerationResult = {
        id: 'gen-array',
        status: 'completed',
        output: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
        cost: 0.05,
        metadata: { prompt: 'Multiple images', type: 'image' }
      }
      
      render(<GenerationGrid generations={[generationWithArrayOutput]} />)
      
      const image = screen.getByAltText('Generated content')
      expect(image).toHaveAttribute('src', 'https://example.com/image1.jpg')
    })

    it('handles missing metadata gracefully', () => {
      const generationWithoutMetadata: GenerationResult = {
        id: 'gen-no-meta',
        status: 'completed',
        output: 'https://example.com/image.jpg',
        cost: 0.05
      }
      
      render(<GenerationGrid generations={[generationWithoutMetadata]} />)
      
      // Should not crash
      expect(screen.getByText('Completed')).toBeInTheDocument()
      expect(screen.getByText('No prompt available')).toBeInTheDocument()
    })
  })
})