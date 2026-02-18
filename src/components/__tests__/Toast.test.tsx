import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Toast } from '../Toast';

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('renders toast message', () => {
    const onClose = vi.fn();
    render(<Toast message="Test message" onClose={onClose} />);

    expect(screen.getByText('Test message')).toBeTruthy();
  });

  it('calls onClose after default duration', () => {
    const onClose = vi.fn();
    render(<Toast message="Test message" onClose={onClose} />);

    expect(onClose).not.toHaveBeenCalled();

    vi.advanceTimersByTime(2000);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose after custom duration', () => {
    const onClose = vi.fn();
    render(<Toast message="Test message" onClose={onClose} duration={3000} />);

    vi.advanceTimersByTime(2000);
    expect(onClose).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1000);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('cleans up timer on unmount', () => {
    const onClose = vi.fn();
    const { unmount } = render(<Toast message="Test message" onClose={onClose} />);

    unmount();
    vi.advanceTimersByTime(2000);

    expect(onClose).not.toHaveBeenCalled();
  });
});
