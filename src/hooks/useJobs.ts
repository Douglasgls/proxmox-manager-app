import { useJobStore } from '@/stores/jobStore';

export const useJobs = () => {
  const jobs = useJobStore((state) => state.jobs);
  const setJobs = useJobStore((state) => state.setJobs);
  const addOrUpdateJob = useJobStore((state) => state.addOrUpdateJob);

  return {
    jobs,
    setJobs,
    addOrUpdateJob,
  };
};
