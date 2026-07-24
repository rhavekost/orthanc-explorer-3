import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockLog = vi.hoisted(() => vi.fn());

vi.mock('@/store/audit-store', () => ({
  useAuditStore: vi.fn((selector: (state: { log: typeof mockLog }) => unknown) =>
    selector({ log: mockLog })
  ),
}));

import { useAuditLog } from './use-audit-log';

const testUserAgent = 'OrthancExplorerTestAgent/1.0 with enough extra detail to verify truncation';

const expectedStandardMetadata = {
  'IP Address': '192.168.1.42',
  'User Agent': testUserAgent.slice(0, 60),
};

describe('useAuditLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'userAgent', {
      value: testUserAgent,
      configurable: true,
    });
  });

  it('logs audit entry with default info severity and standard metadata', () => {
    const { result } = renderHook(() => useAuditLog());

    act(() => {
      result.current.audit({
        action: 'study.view',
        title: 'Viewed Study',
      });
    });

    expect(mockLog).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'audit',
        severity: 'info',
        action: 'study.view',
        title: 'Viewed Study',
        actor: 'Current User',
        metadata: expect.objectContaining(expectedStandardMetadata),
      })
    );
  });

  it('passes custom severity, description, resource, and merges custom metadata', () => {
    const { result } = renderHook(() => useAuditLog());

    act(() => {
      result.current.audit({
        action: 'study.delete',
        title: 'Deleted Study',
        severity: 'warning',
        description: 'Study deleted by admin',
        resource: 'study-123',
        metadata: { customField: 'value' },
      });
    });

    expect(mockLog).toHaveBeenCalledWith({
      category: 'audit',
      severity: 'warning',
      action: 'study.delete',
      title: 'Deleted Study',
      description: 'Study deleted by admin',
      resource: 'study-123',
      actor: 'Current User',
      metadata: {
        customField: 'value',
        ...expectedStandardMetadata,
      },
    });
  });
});
