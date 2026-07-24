import { describe, it, expect, beforeEach } from 'vitest';
import { useAuditStore } from './audit-store';

describe('audit-store (live)', () => {
  beforeEach(() => {
    useAuditStore.setState({ events: [] });
  });

  const sample = {
    category: 'audit' as const,
    severity: 'info' as const,
    title: 'Deleted study',
    action: 'delete',
  };

  it('log() prepends an event and assigns an audit-live id + timestamp', () => {
    useAuditStore.getState().log(sample);

    const { events } = useAuditStore.getState();
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject(sample);
    expect(events[0].id).toMatch(/^audit-live-\d+$/);
    expect(typeof events[0].timestamp).toBe('number');
  });

  it('log() prepends newest events first with distinct ids', () => {
    useAuditStore.getState().log({ ...sample, title: 'first' });
    useAuditStore.getState().log({ ...sample, title: 'second' });

    const { events } = useAuditStore.getState();
    expect(events).toHaveLength(2);
    expect(events[0].title).toBe('second');
    expect(events[1].title).toBe('first');
    expect(events[0].id).not.toBe(events[1].id);
  });

  it('clear() empties events', () => {
    useAuditStore.getState().log(sample);
    useAuditStore.getState().clear();

    expect(useAuditStore.getState().events).toEqual([]);
  });
});
