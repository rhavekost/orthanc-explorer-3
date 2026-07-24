import { beforeEach, describe, expect, it, vi } from 'vitest';

const { orthancRepositoryConstructor, demoRepositoryConstructor } = vi.hoisted(() => ({
  orthancRepositoryConstructor: vi.fn(() => ({ repository: 'orthanc' })),
  demoRepositoryConstructor: vi.fn(() => ({ repository: 'demo' })),
}));

vi.mock('./orthanc-study-repository', () => ({
  OrthancStudyRepository: orthancRepositoryConstructor,
}));

vi.mock('./mock/demo-study-repository', () => ({
  DemoStudyRepository: demoRepositoryConstructor,
}));

import { RepositoryFactory } from './repository-factory';

describe('RepositoryFactory', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    RepositoryFactory.setUseDemoData(false);
  });

  it('creates and memoizes the Orthanc study repository by default', () => {
    const first = RepositoryFactory.createStudyRepository();
    const second = RepositoryFactory.createStudyRepository();

    expect(first).toBe(second);
    expect(first).toEqual({ repository: 'orthanc' });
    expect(orthancRepositoryConstructor).toHaveBeenCalledTimes(1);
    expect(demoRepositoryConstructor).not.toHaveBeenCalled();
  });

  it('creates a demo repository after enabling demo data', () => {
    RepositoryFactory.setUseDemoData(true);

    const repository = RepositoryFactory.createStudyRepository();

    expect(repository).toEqual({ repository: 'demo' });
    expect(demoRepositoryConstructor).toHaveBeenCalledTimes(1);
    expect(orthancRepositoryConstructor).not.toHaveBeenCalled();
  });

  it('resets the singleton when the demo-data flag changes', () => {
    const orthancBeforeSwitch = RepositoryFactory.createStudyRepository();

    RepositoryFactory.setUseDemoData(true);
    const demoRepository = RepositoryFactory.createStudyRepository();

    RepositoryFactory.setUseDemoData(false);
    const orthancAfterSwitch = RepositoryFactory.createStudyRepository();

    expect(demoRepository).not.toBe(orthancBeforeSwitch);
    expect(orthancAfterSwitch).not.toBe(demoRepository);
    expect(orthancAfterSwitch).not.toBe(orthancBeforeSwitch);
    expect(orthancRepositoryConstructor).toHaveBeenCalledTimes(2);
    expect(demoRepositoryConstructor).toHaveBeenCalledTimes(1);
  });
});
