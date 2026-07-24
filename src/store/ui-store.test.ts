import { describe, it, expect, beforeEach } from 'vitest';
import { useUiStore } from './ui-store';

describe('uiStore', () => {
  beforeEach(() => {
    useUiStore.setState({ theme: 'light', sidebarCollapsed: false });
    document.documentElement.classList.remove('dark');
  });

  it('has initial state', () => {
    expect(useUiStore.getState().theme).toBe('light');
    expect(useUiStore.getState().sidebarCollapsed).toBe(false);
  });

  it('sets dark theme and adds dark class', () => {
    useUiStore.getState().setTheme('dark');

    expect(useUiStore.getState().theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('sets light theme and removes dark class', () => {
    useUiStore.getState().setTheme('dark');
    useUiStore.getState().setTheme('light');

    expect(useUiStore.getState().theme).toBe('light');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('sets system theme without dark class when system does not prefer dark', () => {
    useUiStore.getState().setTheme('system');

    expect(useUiStore.getState().theme).toBe('system');
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('toggles sidebar collapsed state', () => {
    useUiStore.getState().toggleSidebar();
    expect(useUiStore.getState().sidebarCollapsed).toBe(true);

    useUiStore.getState().toggleSidebar();
    expect(useUiStore.getState().sidebarCollapsed).toBe(false);
  });
});
