import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { ServiceFilter } from '../ServiceFilter';
import { ServiceType } from '@/types';

describe('ServiceFilter', () => {
  const mockOnServiceChange = vi.fn();

  beforeEach(() => {
    mockOnServiceChange.mockClear();
  });

  it('renders with default "All Services" selected', () => {
    render(
      <ServiceFilter
        selectedService="All"
        onServiceChange={mockOnServiceChange}
      />
    );

    expect(screen.getByText('All Services')).toBeInTheDocument();
  });

  it('renders with specific service selected', () => {
    render(
      <ServiceFilter
        selectedService="OpenAI"
        onServiceChange={mockOnServiceChange}
      />
    );

    expect(screen.getByText('OpenAI')).toBeInTheDocument();
  });

  it('opens dropdown when trigger is clicked', () => {
    render(
      <ServiceFilter
        selectedService="All"
        onServiceChange={mockOnServiceChange}
      />
    );

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    expect(screen.getByText('Filter by Service')).toBeInTheDocument();
  });

  it('displays all service options in dropdown', () => {
    render(
      <ServiceFilter
        selectedService="All"
        onServiceChange={mockOnServiceChange}
      />
    );

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    expect(screen.getAllByText('All Services').length).toBeGreaterThan(0);
    expect(screen.getByText('OpenAI')).toBeInTheDocument();
    expect(screen.getByText('Anthropic')).toBeInTheDocument();
    expect(screen.getByText('Azure OpenAI')).toBeInTheDocument();
    expect(screen.getByText('Groq')).toBeInTheDocument();
    expect(screen.getByText('Custom')).toBeInTheDocument();
  });

  it('shows check mark for selected service', () => {
    render(
      <ServiceFilter
        selectedService="OpenAI"
        onServiceChange={mockOnServiceChange}
      />
    );

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    const openAIButton = screen.getAllByText('OpenAI')[1].closest('button');
    expect(openAIButton).toHaveClass('active');
    expect(openAIButton?.querySelector('.check-mark')).toBeInTheDocument();
  });

  it('calls onServiceChange when service is selected', () => {
    render(
      <ServiceFilter
        selectedService="All"
        onServiceChange={mockOnServiceChange}
      />
    );

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    const anthropicButton = screen.getByText('Anthropic').closest('button');
    fireEvent.click(anthropicButton!);

    expect(mockOnServiceChange).toHaveBeenCalledWith('Anthropic');
  });

  it('closes dropdown after service selection', async () => {
    render(
      <ServiceFilter
        selectedService="All"
        onServiceChange={mockOnServiceChange}
      />
    );

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    const groqButton = screen.getByText('Groq').closest('button');
    fireEvent.click(groqButton!);

    await waitFor(() => {
      expect(screen.queryByText('Filter by Service')).not.toBeInTheDocument();
    });
  });

  it('closes dropdown when clicking outside', async () => {
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <ServiceFilter
          selectedService="All"
          onServiceChange={mockOnServiceChange}
        />
      </div>
    );

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    expect(screen.getByText('Filter by Service')).toBeInTheDocument();

    const outside = screen.getByTestId('outside');
    fireEvent.mouseDown(outside);

    await waitFor(() => {
      expect(screen.queryByText('Filter by Service')).not.toBeInTheDocument();
    });
  });

  it('toggles dropdown open/closed on trigger click', () => {
    render(
      <ServiceFilter
        selectedService="All"
        onServiceChange={mockOnServiceChange}
      />
    );

    const trigger = screen.getByRole('button');

    // Open
    fireEvent.click(trigger);
    expect(screen.getByText('Filter by Service')).toBeInTheDocument();

    // Close
    fireEvent.click(trigger);
    expect(screen.queryByText('Filter by Service')).not.toBeInTheDocument();
  });

  it('displays correct arrow direction based on dropdown state', () => {
    render(
      <ServiceFilter
        selectedService="All"
        onServiceChange={mockOnServiceChange}
      />
    );

    const trigger = screen.getByRole('button');

    // Closed - down arrow
    expect(screen.getByText('▼')).toBeInTheDocument();

    // Open - up arrow
    fireEvent.click(trigger);
    expect(screen.getByText('▲')).toBeInTheDocument();
  });
});
