import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PromptInput } from '@/components/PromptInput'
import { useAppStore } from '@/lib/store'

// Mock the store
jest.mock('@/lib/store')
const mockUseAppStore = useAppStore as jest.MockedFunction<typeof useAppStore>

// Mock store state
const mockStoreState = {
  selectedTool: 'generate',
  settings: {
    enablePromptEnhancement: true,
    autoSave: true,
    qualityPreference: 'balanced',
    defaultResolution: '1024x1024'
  }
}

describe('PromptInput Component', () => {
  const mockOnGenerate = jest.fn()
  
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseAppStore.mockReturnValue(mockStoreState as any)
  })

  it('renders correctly', () => {
    render(<PromptInput onGenerate={mockOnGenerate} isGenerating={false} />)
    
    expect(screen.getByPlaceholderText(/serene landscape/i)).toBeInTheDocument()
    expect(screen.getByText(/describe what you want to create/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /generate/i })).toBeInTheDocument()
  })

  it('allows user to type in the prompt textarea', async () => {
    const user = userEvent.setup()
    render(<PromptInput onGenerate={mockOnGenerate} isGenerating={false} />)
    
    const textarea = screen.getByPlaceholderText(/serene landscape/i)
    await user.type(textarea, 'A beautiful sunset over mountains')
    
    expect(textarea).toHaveValue('A beautiful sunset over mountains')
  })

  it('disables generate button when prompt is empty', () => {
    render(<PromptInput onGenerate={mockOnGenerate} isGenerating={false} />)
    
    const generateButton = screen.getByRole('button', { name: /generate/i })
    expect(generateButton).toBeDisabled()
  })

  it('enables generate button when prompt is provided', async () => {
    const user = userEvent.setup()
    render(<PromptInput onGenerate={mockOnGenerate} isGenerating={false} />)
    
    const textarea = screen.getByPlaceholderText(/serene landscape/i)
    await user.type(textarea, 'Test prompt')
    
    const generateButton = screen.getByRole('button', { name: /generate/i })
    expect(generateButton).not.toBeDisabled()
  })

  it('calls onGenerate when generate button is clicked', async () => {
    const user = userEvent.setup()
    render(<PromptInput onGenerate={mockOnGenerate} isGenerating={false} />)
    
    const textarea = screen.getByPlaceholderText(/serene landscape/i)
    await user.type(textarea, 'Test prompt')
    
    const generateButton = screen.getByRole('button', { name: /generate/i })
    await user.click(generateButton)
    
    expect(mockOnGenerate).toHaveBeenCalledWith('Test prompt', 'flux-pro', '')
  })

  it('shows generating state correctly', () => {
    render(<PromptInput onGenerate={mockOnGenerate} isGenerating={true} />)
    
    expect(screen.getByText(/generating.../i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /generating.../i })).toBeDisabled()
  })

  it('shows examples when Examples button is clicked', async () => {
    const user = userEvent.setup()
    render(<PromptInput onGenerate={mockOnGenerate} isGenerating={false} />)
    
    const examplesButton = screen.getByRole('button', { name: /examples/i })
    await user.click(examplesButton)
    
    expect(screen.getByText(/popular scenarios/i)).toBeInTheDocument()
    expect(screen.getByText(/social media/i)).toBeInTheDocument()
    expect(screen.getByText(/business/i)).toBeInTheDocument()
  })

  it('selects example prompt when clicked', async () => {
    const user = userEvent.setup()
    render(<PromptInput onGenerate={mockOnGenerate} isGenerating={false} />)
    
    // Open examples
    const examplesButton = screen.getByRole('button', { name: /examples/i })
    await user.click(examplesButton)
    
    // Click on a scenario example
    const exampleButton = screen.getByText(/cozy coffee shop aesthetic/i)
    await user.click(exampleButton)
    
    const textarea = screen.getByPlaceholderText(/serene landscape/i)
    expect(textarea).toHaveValue('Create a cozy coffee shop aesthetic with warm lighting')
  })

  it('allows model selection', async () => {
    const user = userEvent.setup()
    render(<PromptInput onGenerate={mockOnGenerate} isGenerating={false} />)
    
    const modelSelect = screen.getByDisplayValue(/FLUX Pro/i)
    await user.selectOptions(modelSelect, 'flux-dev')
    
    expect(modelSelect).toHaveValue('flux-dev')
  })

  it('handles image upload', async () => {
    const user = userEvent.setup()
    render(<PromptInput onGenerate={mockOnGenerate} isGenerating={false} />)
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    const fileInput = screen.getByLabelText(/click to upload an image/i)
    
    await user.upload(fileInput, file)
    
    await waitFor(() => {
      expect(screen.getByAltText('Input')).toBeInTheDocument()
    })
  })

  it('shows enhance button when prompt enhancement is enabled', () => {
    render(<PromptInput onGenerate={mockOnGenerate} isGenerating={false} />)
    
    expect(screen.getByRole('button', { name: /enhance/i })).toBeInTheDocument()
  })

  it('disables enhance button when prompt is empty', () => {
    render(<PromptInput onGenerate={mockOnGenerate} isGenerating={false} />)
    
    const enhanceButton = screen.getByRole('button', { name: /enhance/i })
    expect(enhanceButton).toBeDisabled()
  })

  it('shows enhanced prompt when enhance is clicked', async () => {
    const user = userEvent.setup()
    render(<PromptInput onGenerate={mockOnGenerate} isGenerating={false} />)
    
    const textarea = screen.getByPlaceholderText(/serene landscape/i)
    await user.type(textarea, 'mountain landscape')
    
    const enhanceButton = screen.getByRole('button', { name: /enhance/i })
    await user.click(enhanceButton)
    
    expect(screen.getByText(/enhanced prompt/i)).toBeInTheDocument()
    expect(screen.getByText(/Enhanced: mountain landscape with photorealistic details/i)).toBeInTheDocument()
  })

  it('uses enhanced prompt for generation when available', async () => {
    const user = userEvent.setup()
    render(<PromptInput onGenerate={mockOnGenerate} isGenerating={false} />)
    
    const textarea = screen.getByPlaceholderText(/serene landscape/i)
    await user.type(textarea, 'mountain landscape')
    
    // Enhance prompt
    const enhanceButton = screen.getByRole('button', { name: /enhance/i })
    await user.click(enhanceButton)
    
    // Generate with enhanced prompt
    const generateButton = screen.getByRole('button', { name: /generate/i })
    await user.click(generateButton)
    
    expect(mockOnGenerate).toHaveBeenCalledWith(
      'Enhanced: mountain landscape with photorealistic details, professional lighting, and artistic composition',
      'flux-pro',
      ''
    )
  })

  describe('Model availability based on tool', () => {
    it('shows image and video models for generate tool', () => {
      mockUseAppStore.mockReturnValue({
        ...mockStoreState,
        selectedTool: 'generate'
      } as any)
      
      render(<PromptInput onGenerate={mockOnGenerate} isGenerating={false} />)
      
      const modelSelect = screen.getByDisplayValue(/FLUX Pro/i)
      fireEvent.click(modelSelect)
      
      // Should have both image and video models
      expect(screen.getByText(/FLUX Pro/i)).toBeInTheDocument()
      expect(screen.getByText(/Runway Gen-4/i)).toBeInTheDocument()
    })

    it('shows enhancement models for enhance tool', () => {
      mockUseAppStore.mockReturnValue({
        ...mockStoreState,
        selectedTool: 'enhance'
      } as any)
      
      render(<PromptInput onGenerate={mockOnGenerate} isGenerating={false} />)
      
      const modelSelect = screen.getByRole('combobox')
      fireEvent.click(modelSelect)
      
      // Should have enhancement models
      expect(screen.getByText(/Real-ESRGAN/i)).toBeInTheDocument()
      expect(screen.getByText(/Background Removal/i)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper labels for form elements', () => {
      render(<PromptInput onGenerate={mockOnGenerate} isGenerating={false} />)
      
      expect(screen.getByLabelText(/describe what you want to create/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/ai model/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/upload image/i)).toBeInTheDocument()
    })

    it('supports keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<PromptInput onGenerate={mockOnGenerate} isGenerating={false} />)
      
      // Tab through form elements
      await user.tab()
      expect(screen.getByPlaceholderText(/serene landscape/i)).toHaveFocus()
      
      await user.tab()
      expect(screen.getByRole('button', { name: /examples/i })).toHaveFocus()
    })
  })
})