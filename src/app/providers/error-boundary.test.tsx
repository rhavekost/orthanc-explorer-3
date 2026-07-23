import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ErrorBoundary } from './error-boundary';

function ThrowingComponent({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('Test boundary error');
  }

  return <div>Normal Content</div>;
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Normal Content</div>
      </ErrorBoundary>,
    );

    expect(screen.getByText('Normal Content')).toBeInTheDocument();
  });

  it('renders default fallback UI when a child component throws', () => {
    render(
      <ErrorBoundary>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test boundary error')).toBeInTheDocument();
  });

  it('renders custom fallback prop when provided', () => {
    render(
      <ErrorBoundary fallback={<div>Custom Fallback</div>}>
        <ThrowingComponent shouldThrow={true} />
      </ErrorBoundary>,
    );

    expect(screen.getByText('Custom Fallback')).toBeInTheDocument();
  });

  it('resets error state when Try Again button is clicked', () => {
    let shouldThrow = true;

    function TestWrapper() {
      return (
        <ErrorBoundary>
          <ThrowingComponent shouldThrow={shouldThrow} />
        </ErrorBoundary>
      );
    }

    const { rerender } = render(<TestWrapper />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    shouldThrow = false;
    // Update the existing boundary props before resetting so the retry renders non-throwing children.
    rerender(<TestWrapper />);
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    expect(screen.getByText('Normal Content')).toBeInTheDocument();
  });
});
