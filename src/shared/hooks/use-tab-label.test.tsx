import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useTabLabel } from './use-tab-label';
import { useTabStore } from '@/store/tab-store';

const initialTabState = useTabStore.getState();

function wrapperFor(path: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <MemoryRouter initialEntries={[path]}>{children}</MemoryRouter>;
  };
}

describe('useTabLabel', () => {
  beforeEach(() => {
    useTabStore.setState({ ...initialTabState, tabs: [], activeTabId: null }, true);
  });

  it('updates the matching tab label when it changes', () => {
    const updateTabLabel = vi.fn();
    useTabStore.setState({
      tabs: [
        { id: 'tab-1', path: '/studies/study-1', label: 'Loading...', closable: true },
      ],
      updateTabLabel,
    });

    renderHook(() => useTabLabel('Study 1'), {
      wrapper: wrapperFor('/studies/study-1'),
    });

    expect(updateTabLabel).toHaveBeenCalledWith('tab-1', 'Study 1');
  });

  it('does not update when the matching tab already has the label', () => {
    const updateTabLabel = vi.fn();
    useTabStore.setState({
      tabs: [
        { id: 'tab-1', path: '/studies/study-1', label: 'Study 1', closable: true },
      ],
      updateTabLabel,
    });

    renderHook(() => useTabLabel('Study 1'), {
      wrapper: wrapperFor('/studies/study-1'),
    });

    expect(updateTabLabel).not.toHaveBeenCalled();
  });

  it('does not update when no tab matches the current route', () => {
    const updateTabLabel = vi.fn();
    useTabStore.setState({
      tabs: [
        { id: 'tab-1', path: '/studies/study-1', label: 'Loading...', closable: true },
      ],
      updateTabLabel,
    });

    renderHook(() => useTabLabel('Study 2'), {
      wrapper: wrapperFor('/studies/study-2'),
    });

    expect(updateTabLabel).not.toHaveBeenCalled();
  });
});
