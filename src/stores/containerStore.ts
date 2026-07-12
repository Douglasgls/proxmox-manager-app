import { create } from 'zustand';
import type { Container } from '@/types/container';

interface ContainerStoreState {
  containers: Container[];
  setContainers: (containers: Container[]) => void;
  updateContainer: (updatedContainer: Partial<Container> & { vmid: number }) => void;
}

export const useContainerStore = create<ContainerStoreState>((set) => ({
  containers: [],
  setContainers: (containers) => set({ containers }),
  updateContainer: (updatedContainer) => set((state) => {
    const containerIndex = state.containers.findIndex((c) => c.vmid === updatedContainer.vmid);
    if (containerIndex > -1) {
      const newContainers = [...state.containers];
      newContainers[containerIndex] = {
        ...newContainers[containerIndex],
        ...updatedContainer,
      } as Container;
      return { containers: newContainers };
    }
    return {};
  }),
}));
