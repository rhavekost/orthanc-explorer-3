import { describe, it, expect, beforeEach } from 'vitest';
import { useAuditStore } from './audit-store';

describe('auditStore', () => {
  beforeEach(() => {
    useAuditStore.setState({ events: [] });
  });

  it('prepends logged events', () => {
    useAuditStore.getState().log({
      category: 'audit',
      severity: 'info',
      title: 'Deleted study',
      action: 'delete',
    });

    expect(useAuditStore.getState().events).toHaveLength(1);
    expect(useAuditStore.getState().events[0].title).toBe('Deleted study');

    useAuditStore.getState().log({
      category: 'audit',
      severity: 'warning',
      title: 'Modified study',
      action: 'modify',
    });

    const events = useAuditStore.getState().events;
    expect(events).toHaveLength(2);
    expect(events[0].title).toBe('Modified study');
    expect(events[1].title).toBe('Deleted study');
  });

  it('generates an id and timestamp for logged events', () => {
    useAuditStore.getState().log({
      category: 'audit',
      severity: 'info',
      title: 'Deleted study',
      action: 'delete',
    });

    const [event] = useAuditStore.getState().events;
    expect(event.id).toMatch(/^audit-live-\d+$/);
    expect(typeof event.timestamp).toBe('number');
  });

  it('clears logged events', () => {
    useAuditStore.getState().log({
      category: 'audit',
      severity: 'info',
      title: 'Deleted study',
      action: 'delete',
    });

    useAuditStore.getState().clear();

    expect(useAuditStore.getState().events).toHaveLength(0);
  });
});
