import { apiClient } from '@/api/client/ApiClient';
import type { Job } from '../types';

export const jobsService = {
  /**
   * Lista todos os jobs.
   * GET /jobs
   */
  list: async (): Promise<Job[]> => {
    const response = await apiClient.get<Job[]>('/jobs');
    return response.data;
  },

  /**
   * Consulta um job específico pelo ID.
   * GET /jobs/{job_id}
   */
  getById: async (jobId: string): Promise<Job> => {
    const response = await apiClient.get<Job>(`/jobs/${jobId}`);
    return response.data;
  },
};
