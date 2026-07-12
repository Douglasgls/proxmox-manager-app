import { create } from 'zustand';
import type { Job } from '@/types/job';

interface JobStoreState {
  jobs: Job[];
  setJobs: (jobs: Job[]) => void;
  addOrUpdateJob: (job: Partial<Job> & { upid: string }) => void;
}

export const useJobStore = create<JobStoreState>((set) => ({
  jobs: [],
  setJobs: (jobs) => set({ jobs }),
  addOrUpdateJob: (updatedJob) => set((state) => {
    const jobIndex = state.jobs.findIndex((j) => j.upid === updatedJob.upid);
    if (jobIndex > -1) {
      const newJobs = [...state.jobs];
      newJobs[jobIndex] = {
        ...newJobs[jobIndex],
        ...updatedJob,
      } as Job;
      return { jobs: newJobs };
    } else {
      const { upid, ...rest } = updatedJob;
      const newJob: Job = {
        id: rest.id || Math.random().toString(36).substr(2, 9),
        upid,
        node: rest.node || '',
        user: rest.user || '',
        type: rest.type || '',
        status: rest.status || 'running',
        starttime: rest.starttime || Math.floor(Date.now() / 1000),
        ...rest,
      } as Job;
      return { jobs: [newJob, ...state.jobs] };
    }
  }),
}));
