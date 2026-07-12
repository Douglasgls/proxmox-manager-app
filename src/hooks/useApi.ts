import { authApi } from '@/api/modules/authApi';
import { containerApi } from '@/api/modules/containerApi';
import { jobApi } from '@/api/modules/jobApi';
import { monitoringApi } from '@/api/modules/monitoringApi';
import { inventoryApi } from '@/api/modules/inventoryApi';

export const useApi = () => {
  return {
    auth: authApi,
    container: containerApi,
    job: jobApi,
    monitoring: monitoringApi,
    inventory: inventoryApi,
  };
};
