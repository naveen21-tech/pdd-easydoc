import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CommandPalette } from '@/components/ui/CommandPalette';

// Mock useRouter
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe('CommandPalette UI Component (components/ui/CommandPalette.tsx)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render nothing when isOpen is false', () => {
    const { container } = render(<CommandPalette isOpen={false} onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render search input and action list when isOpen is true', () => {
    render(<CommandPalette isOpen={true} onClose={vi.fn()} />);

    const searchInput = screen.getByPlaceholderText(/Type a command or search templates/i);
    expect(searchInput).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('AI Document Studio')).toBeInTheDocument();
  });

  it('should filter actions when user types in search query', () => {
    render(<CommandPalette isOpen={true} onClose={vi.fn()} />);

    const searchInput = screen.getByPlaceholderText(/Type a command or search templates/i);
    fireEvent.change(searchInput, { target: { value: 'Resume' } });

    expect(screen.getByText('ATS Resume Builder')).toBeInTheDocument();
    expect(screen.queryByText('Government Applications')).not.toBeInTheDocument();
  });

  it('should navigate to target route and close palette on item click', () => {
    const onClose = vi.fn();
    render(<CommandPalette isOpen={true} onClose={onClose} />);

    const studioItem = screen.getByText('AI Document Studio');
    fireEvent.click(studioItem);

    expect(onClose).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/generate');
  });

  it('should call onClose when Escape key is pressed', () => {
    const onClose = vi.fn();
    render(<CommandPalette isOpen={true} onClose={onClose} />);

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
