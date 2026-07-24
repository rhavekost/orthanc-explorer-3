/**
 * Task context for managing long-running background operations.
 * Wraps the job store and provides polling + lifecycle management.
 * Components subscribe here instead of managing local task state.
 */

import { createContext, useContext, useCallback, type ReactNode } from 'react';
import { useJobStore } from '@/store/job-store';
import type { Job, JobType, JobStatus } from '@/shared/types/job';

export interface TaskContextValue {
  /** All tasks */
  tasks: Job[];
  /** Currently running or pending tasks */
  activeTasks: Job[];
  /** Whether any tasks are active */
  hasActiveTasks: boolean;

  /** Start a new task and return its ID */
  startTask: (params: {
    id: string;
    type: JobType;
    label: string;
    description?: string;
    totalItems?: number;
  }) => string;

  /** Update task progress */
  updateTask: (id: string, patch: Partial<Pick<Job, 'progress' | 'status' | 'error' | 'completedItems' | 'label' | 'description'>>) => void;

  /** Remove a task from the list */
  removeTask: (id: string) => void;

  /** Retry a failed or interrupted task */
  retryTask: (id: string) => void;

  /** Clear all completed tasks */
  clearCompleted: () => void;
}

const TaskContext = createContext<TaskContextValue | null>(null);

export function TaskProvider({ children }: { children: ReactNode }) {
  const store = useJobStore();

  const startTask = useCallback((params: {
    id: string;
    type: JobType;
    label: string;
    description?: string;
    totalItems?: number;
  }) => {
    return store.addJob({
      ...params,
      progress: 0,
      status: 'pending' as JobStatus,
    });
  }, [store]);

  const value: TaskContextValue = {
    tasks: store.jobs,
    activeTasks: store.activeJobs(),
    hasActiveTasks: store.hasActiveJobs(),
    startTask,
    updateTask: store.updateJob,
    removeTask: store.removeJob,
    retryTask: store.retryJob,
    clearCompleted: store.clearCompleted,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}

export function useTask(): TaskContextValue {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTask must be used within TaskProvider');
  return ctx;
}

/**
 * Hook to poll a specific task by ID.
 * Returns the task or null if not found.
 */
export function useTaskById(taskId: string): Job | undefined {
  const { tasks } = useTask();
  return tasks.find((t) => t.id === taskId);
}
