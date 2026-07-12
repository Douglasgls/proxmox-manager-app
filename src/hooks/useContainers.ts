import { useContainerStore } from '@/stores/containerStore';

export const useContainers = () => {
  const containers = useContainerStore((state) => state.containers);
  const setContainers = useContainerStore((state) => state.setContainers);
  const updateContainer = useContainerStore((state) => state.updateContainer);

  return {
    containers,
    setContainers,
    updateContainer,
  };
};
