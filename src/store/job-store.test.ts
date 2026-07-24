// src/store/job-store.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useJobStore } from './job-store';
import type { Job } from '@/shared/types/job';

type JobInput = Omit<Job, 'createdAt' | 'updatedAt'>;

const makeJob = (overrides: Partial<JobInput> = {}): JobInput => ({
  id: 'job-1',
  type: 'upload',
  label: 'a.dcm',
  progress: 0,
  status: 'pending',
  ...overrides,
});

beforeEach(() => {
  useJobStore.setState({ jobs: [] });
});

describe('addJob()', () => {
  it('prepends the job and returns its id', () => {
    const id = useJobStore.getState().addJob(makeJob({ id: 'j1' }));
    useJobStore.getState().addJob(makeJob({ id: 'j2' }));

    expect(id).toBe('j1');
    expect(useJobStore.getState().jobs.map((job) => job.id)).toEqual(['j2', 'j1']);
    expect(useJobStore.getState().jobs[0].createdAt).toEqual(expect.any(Number));
    expect(useJobStore.getState().jobs[0].updatedAt).toEqual(expect.any(Number));
  });
});

describe('updateJob()', () => {
  it('merges the patch into the matching job', () => {
    useJobStore.getState().addJob(makeJob({ id: 'j1', status: 'running' }));
    useJobStore.getState().updateJob('j1', { progress: 50, status: 'complete' });

    const job = useJobStore.getState().jobs.find((item) => item.id === 'j1');
    expect(job?.progress).toBe(50);
    expect(job?.status).toBe('complete');
    expect(job?.updatedAt).toEqual(expect.any(Number));
  });
});

describe('removeJob()', () => {
  it('removes only the matching job', () => {
    useJobStore.getState().addJob(makeJob({ id: 'j1' }));
    useJobStore.getState().addJob(makeJob({ id: 'j2' }));

    useJobStore.getState().removeJob('j1');

    expect(useJobStore.getState().jobs.map((job) => job.id)).toEqual(['j2']);
  });
});

describe('clearCompleted()', () => {
  it('drops complete jobs and keeps the rest', () => {
    useJobStore.getState().addJob(makeJob({ id: 'done', status: 'complete' }));
    useJobStore.getState().addJob(makeJob({ id: 'run', status: 'running' }));

    useJobStore.getState().clearCompleted();

    expect(useJobStore.getState().jobs.map((job) => job.id)).toEqual(['run']);
  });
});

describe('retryJob()', () => {
  it('resets status to pending, progress to 0, and clears error', () => {
    useJobStore
      .getState()
      .addJob(makeJob({ id: 'j1', status: 'error', progress: 80, error: 'boom' }));

    useJobStore.getState().retryJob('j1');

    const job = useJobStore.getState().jobs.find((item) => item.id === 'j1');
    expect(job?.status).toBe('pending');
    expect(job?.progress).toBe(0);
    expect(job?.error).toBeUndefined();
    expect(job?.updatedAt).toEqual(expect.any(Number));
  });
});

describe('activeJobs() / hasActiveJobs()', () => {
  it('counts only pending and running jobs as active', () => {
    useJobStore.getState().addJob(makeJob({ id: 'p', status: 'pending' }));
    useJobStore.getState().addJob(makeJob({ id: 'r', status: 'running' }));
    useJobStore.getState().addJob(makeJob({ id: 'c', status: 'complete' }));
    useJobStore.getState().addJob(makeJob({ id: 'e', status: 'error' }));
    useJobStore.getState().addJob(makeJob({ id: 'i', status: 'interrupted' }));

    expect(
      useJobStore
        .getState()
        .activeJobs()
        .map((job) => job.id)
        .sort(),
    ).toEqual(['p', 'r']);
    expect(useJobStore.getState().hasActiveJobs()).toBe(true);
  });

  it('hasActiveJobs is false when no job is pending or running', () => {
    useJobStore.getState().addJob(makeJob({ id: 'c', status: 'complete' }));
    useJobStore.getState().addJob(makeJob({ id: 'e', status: 'error' }));
    useJobStore.getState().addJob(makeJob({ id: 'i', status: 'interrupted' }));

    expect(useJobStore.getState().hasActiveJobs()).toBe(false);
  });
});

const fullJob = (overrides: Partial<Job> = {}): Job => ({
  id: 'job-1',
  type: 'upload',
  label: 'a.dcm',
  progress: 0,
  status: 'pending',
  createdAt: 1,
  updatedAt: 1,
  ...overrides,
});

describe('onRehydrateStorage()', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('flips running and pending jobs to interrupted on rehydration, leaving others', async () => {
    const seeded: Job[] = [
      fullJob({ id: 'run', status: 'running' }),
      fullJob({ id: 'pend', status: 'pending' }),
      fullJob({ id: 'done', status: 'complete' }),
      fullJob({ id: 'err', status: 'error' }),
      fullJob({ id: 'intr', status: 'interrupted' }),
    ];
    localStorage.setItem(
      'orthanc-job-store',
      JSON.stringify({ state: { jobs: seeded }, version: 0 }),
    );

    await useJobStore.persist.rehydrate();

    const byId = Object.fromEntries(useJobStore.getState().jobs.map((j) => [j.id, j.status]));
    expect(byId.run).toBe('interrupted');
    expect(byId.pend).toBe('interrupted');
    expect(byId.done).toBe('complete');
    expect(byId.err).toBe('error');
    expect(byId.intr).toBe('interrupted');
  });
});
