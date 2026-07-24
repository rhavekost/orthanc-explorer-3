
export type JobStatus = 'pending' | 'running' | 'complete' | 'error' | 'interrupted';

export interface Job {
  id: string;
  type: JobType;
  label: string;
  description?: string;
  progress: number;
  status: JobStatus;
  error?: string;
  createdAt: number;
  updatedAt: number;
  /** For uploads: total bytes. For sends: number of studies. */
  totalItems?: number;
  completedItems?: number;
}
