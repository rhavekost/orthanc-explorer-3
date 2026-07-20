import { describe, it, expect, beforeEach } from 'vitest';
import { useTabStore } from './tab-store';

beforeEach(() => {
  useTabStore.setState({ tabs: [], activeTabId: null });
});

describe('tab-store openTab', () => {
  it('adds a new tab, returns its id, and makes it active', () => {
    const id = useTabStore
      .getState()
      .openTab({ path: '/studies', label: 'Studies', closable: true });

    const state = useTabStore.getState();
    expect(state.tabs).toHaveLength(1);
    expect(state.tabs[0]).toEqual({
      id,
      path: '/studies',
      label: 'Studies',
      closable: true,
    });
    expect(state.activeTabId).toBe(id);
  });

  it('reuses an existing tab with the same studyId and updates its path', () => {
    const first = useTabStore
      .getState()
      .openTab({ path: '/studies/a', label: 'A', closable: true, studyId: 's1' });
    const second = useTabStore
      .getState()
      .openTab({ path: '/studies/a/series', label: 'A2', closable: true, studyId: 's1' });

    const state = useTabStore.getState();
    expect(second).toBe(first);
    expect(state.tabs).toHaveLength(1);
    expect(state.tabs[0]).toMatchObject({
      id: first,
      path: '/studies/a/series',
      label: 'A',
      studyId: 's1',
    });
    expect(state.activeTabId).toBe(first);
  });

  it('reuses an existing tab with the same path', () => {
    const first = useTabStore
      .getState()
      .openTab({ path: '/studies', label: 'Studies', closable: false });
    const other = useTabStore
      .getState()
      .openTab({ path: '/settings', label: 'Settings', closable: true });
    const second = useTabStore
      .getState()
      .openTab({ path: '/studies', label: 'Studies duplicate', closable: true });

    const state = useTabStore.getState();
    expect(second).toBe(first);
    expect(state.tabs).toHaveLength(2);
    expect(state.activeTabId).toBe(first);
    expect(state.tabs.map((tab) => tab.id)).toEqual([first, other]);
    expect(state.tabs[0].label).toBe('Studies');
  });

  it('evicts the first closable tab when opening beyond the max tab count', () => {
    const ids = Array.from({ length: 10 }, (_, index) =>
      useTabStore.getState().openTab({
        path: `/tabs/${index}`,
        label: `Tab ${index}`,
        closable: index === 3,
      }),
    );

    const newId = useTabStore
      .getState()
      .openTab({ path: '/tabs/new', label: 'New tab', closable: true });

    const state = useTabStore.getState();
    expect(state.tabs).toHaveLength(10);
    expect(state.tabs.map((tab) => tab.id)).not.toContain(ids[3]);
    expect(state.tabs.map((tab) => tab.id)).toContain(newId);
    expect(state.activeTabId).toBe(newId);
  });
});

describe('tab-store closeTab', () => {
  it('removes a closable tab', () => {
    const pinned = useTabStore
      .getState()
      .openTab({ path: '/studies', label: 'Studies', closable: false });
    const closable = useTabStore
      .getState()
      .openTab({ path: '/settings', label: 'Settings', closable: true });

    useTabStore.getState().closeTab(closable);

    const state = useTabStore.getState();
    expect(state.tabs).toHaveLength(1);
    expect(state.tabs[0].id).toBe(pinned);
  });

  it('does not remove a non-closable tab', () => {
    const pinned = useTabStore
      .getState()
      .openTab({ path: '/studies', label: 'Studies', closable: false });

    useTabStore.getState().closeTab(pinned);

    const state = useTabStore.getState();
    expect(state.tabs).toHaveLength(1);
    expect(state.tabs[0].id).toBe(pinned);
  });

  it('chooses a new active tab from the remaining tabs when closing the active tab', () => {
    const first = useTabStore
      .getState()
      .openTab({ path: '/first', label: 'First', closable: true });
    const second = useTabStore
      .getState()
      .openTab({ path: '/second', label: 'Second', closable: true });
    const third = useTabStore
      .getState()
      .openTab({ path: '/third', label: 'Third', closable: true });

    useTabStore.getState().activateTab(second);
    useTabStore.getState().closeTab(second);

    const state = useTabStore.getState();
    expect(state.tabs.map((tab) => tab.id)).toEqual([first, third]);
    expect(state.activeTabId).toBe(third);
  });

  it('sets activeTabId to null when closing the last tab', () => {
    const onlyTab = useTabStore
      .getState()
      .openTab({ path: '/only', label: 'Only', closable: true });

    useTabStore.getState().closeTab(onlyTab);

    const state = useTabStore.getState();
    expect(state.tabs).toEqual([]);
    expect(state.activeTabId).toBeNull();
  });
});

describe('tab-store tab mutations', () => {
  it('activates a tab by id', () => {
    const first = useTabStore
      .getState()
      .openTab({ path: '/first', label: 'First', closable: true });
    useTabStore
      .getState()
      .openTab({ path: '/second', label: 'Second', closable: true });

    useTabStore.getState().activateTab(first);

    expect(useTabStore.getState().activeTabId).toBe(first);
  });

  it('updates only the targeted tab path', () => {
    const first = useTabStore
      .getState()
      .openTab({ path: '/first', label: 'First', closable: true });
    const second = useTabStore
      .getState()
      .openTab({ path: '/second', label: 'Second', closable: true });

    useTabStore.getState().updateTabPath(first, '/first/updated');

    expect(useTabStore.getState().tabs).toEqual([
      expect.objectContaining({ id: first, path: '/first/updated' }),
      expect.objectContaining({ id: second, path: '/second' }),
    ]);
  });

  it('updates only the targeted tab label', () => {
    const first = useTabStore
      .getState()
      .openTab({ path: '/first', label: 'First', closable: true });
    const second = useTabStore
      .getState()
      .openTab({ path: '/second', label: 'Second', closable: true });

    useTabStore.getState().updateTabLabel(second, 'Second updated');

    expect(useTabStore.getState().tabs).toEqual([
      expect.objectContaining({ id: first, label: 'First' }),
      expect.objectContaining({ id: second, label: 'Second updated' }),
    ]);
  });
});

describe('tab-store selectors', () => {
  it('gets a tab by studyId', () => {
    const studyTab = useTabStore
      .getState()
      .openTab({ path: '/studies/s1', label: 'Study 1', closable: true, studyId: 's1' });
    useTabStore
      .getState()
      .openTab({ path: '/studies/s2', label: 'Study 2', closable: true, studyId: 's2' });

    expect(useTabStore.getState().getTabByStudyId('s1')).toEqual(
      expect.objectContaining({ id: studyTab, studyId: 's1' }),
    );
    expect(useTabStore.getState().getTabByStudyId('missing')).toBeUndefined();
  });

  it('gets a tab by path', () => {
    const studiesTab = useTabStore
      .getState()
      .openTab({ path: '/studies', label: 'Studies', closable: false });
    useTabStore
      .getState()
      .openTab({ path: '/settings', label: 'Settings', closable: true });

    expect(useTabStore.getState().getTabByPath('/studies')).toEqual(
      expect.objectContaining({ id: studiesTab, path: '/studies' }),
    );
    expect(useTabStore.getState().getTabByPath('/missing')).toBeUndefined();
  });
});
