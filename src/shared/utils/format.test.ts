import { describe, it, expect, vi } from 'vitest';
import { formatDiskSize, formatDuration, formatPatientName, formatRelativeTime } from './format';

describe('formatPatientName', () => {
  it('replaces every caret with a comma and space', () => {
    expect(formatPatientName('Doe^Jane^A')).toBe('Doe, Jane, A');
  });
});

describe('formatDiskSize', () => {
  it('returns an em dash for missing or zero byte counts', () => {
    expect(formatDiskSize()).toBe('—');
    expect(formatDiskSize(0)).toBe('—');
  });

  it('formats byte counts under one kilobyte as bytes', () => {
    expect(formatDiskSize(512)).toBe('512 B');
  });

  it('formats kilobytes with one decimal place', () => {
    expect(formatDiskSize(1024)).toBe('1.0 KB');
  });

  it('formats megabytes with one decimal place', () => {
    expect(formatDiskSize(1048576)).toBe('1.0 MB');
  });

  it('formats gigabytes with two decimal places', () => {
    expect(formatDiskSize(1073741824)).toBe('1.00 GB');
  });
});

describe('formatDuration', () => {
  it('returns an em dash for missing or zero durations', () => {
    expect(formatDuration()).toBe('—');
    expect(formatDuration(0)).toBe('—');
  });

  it('formats sub-second durations as milliseconds', () => {
    expect(formatDuration(999)).toBe('999ms');
  });

  it('formats durations under one minute as seconds with one decimal place', () => {
    expect(formatDuration(1500)).toBe('1.5s');
  });

  it('formats durations of one minute or longer as minutes and seconds', () => {
    expect(formatDuration(65000)).toBe('1m 5s');
  });
});

describe('formatRelativeTime', () => {
  it('formats recent timestamps as just now', () => {
    const now = new Date('2026-07-21T12:00:00.000Z').getTime();
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(now);

    expect(formatRelativeTime(now - 30 * 1000)).toBe('just now');

    nowSpy.mockRestore();
  });

  it('formats timestamps minutes ago', () => {
    const now = new Date('2026-07-21T12:00:00.000Z').getTime();
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(now);

    expect(formatRelativeTime(now - 5 * 60 * 1000)).toBe('5m ago');

    nowSpy.mockRestore();
  });

  it('formats timestamps hours ago', () => {
    const now = new Date('2026-07-21T12:00:00.000Z').getTime();
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(now);

    expect(formatRelativeTime(now - 2 * 60 * 60 * 1000)).toBe('2h ago');

    nowSpy.mockRestore();
  });

  it('formats timestamps days ago', () => {
    const now = new Date('2026-07-21T12:00:00.000Z').getTime();
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(now);

    expect(formatRelativeTime(now - 3 * 24 * 60 * 60 * 1000)).toBe('3d ago');

    nowSpy.mockRestore();
  });
});
