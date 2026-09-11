import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useToastStore } from '@/utils/clipboard';
import { CLOUD_DETAILS_QUERY_KEY } from '@/hooks/useCloudDetails';
import {
  filterDuplicateClientNodes,
  extractIpv4,
  extractNodeNames,
  isContainerNode,
  isNodeOnline,
} from '@/utils/cloudNodes';
import type { CloudNode, CloudDetailsResponse } from '@/api/modules/cloudApi';
import type { HeadscaleSyncNode, NodeSyncResponse } from '@/types/websocket';

const STORAGE_KEY_LAST_SYNC = 'headscale_last_node_sync_timestamp';
const DEFAULT_COOLDOWN_SECONDS = 15;

/**
 * Normaliza e mapeia os nós recebidos do Headscale para a estrutura CloudNode da aplicação,
 * preservando associações existentes de containers Proxmox quando aplicável.
 * Descarta nós do tipo 'client' se houver um container com o mesmo nome e mesmo IPv4.
 */
export const mapHeadscaleNodesToCloudNodes = (
  headscaleNodes: HeadscaleSyncNode[],
  existingNodes: CloudNode[] = []
): CloudNode[] => {
  if (!Array.isArray(headscaleNodes)) return filterDuplicateClientNodes(existingNodes);

  const mapped = headscaleNodes.map((hNode) => {
    const hIp = extractIpv4(hNode.tailscale_ip);
    const hNames = extractNodeNames({
      hostname: hNode.hostname,
      name: hNode.name,
      node_type: 'client',
      online: false,
      service_running: false,
    });

    const existing = existingNodes.find((e) => {
      // 1. Match por Headscale Node ID
      if (
        e.headscale_node_id &&
        hNode.headscale_node_id &&
        String(e.headscale_node_id) === String(hNode.headscale_node_id)
      ) {
        return true;
      }
      // 2. Match por IPv4 (normalizado)
      const eIp = extractIpv4(e.tailscale_ip);
      if (eIp && hIp && eIp === hIp) {
        return true;
      }
      // 3. Match por variações de nome
      const eNames = extractNodeNames(e);
      return eNames.some((en) => hNames.includes(en));
    });

    const isContainer = Boolean(
      hNode.api_local_container_id ||
        (existing && isContainerNode(existing)) ||
        existing?.proxmox_container_id
    );

    const proxmoxContainerId = hNode.api_local_container_id
      ? Number(hNode.api_local_container_id)
      : existing?.proxmox_container_id ?? null;

    const onlineStatus = isNodeOnline(hNode) || Boolean(existing && isNodeOnline(existing));

    return {
      headscale_node_id: String(hNode.headscale_node_id),
      hostname: hNode.hostname || hNode.name || existing?.hostname || 'Sem nome',
      name: hNode.name || hNode.hostname,
      machine_id: existing?.machine_id || hNode.machine_key,
      cloud_connection_id: existing?.cloud_connection_id || null,
      tailscale_ip: existing?.tailscale_ip || hNode.tailscale_ip || null,
      online: onlineStatus,
      service_running: onlineStatus,
      node_type: isContainer ? 'container' : 'client',
      container_id: existing?.container_id || null,
      proxmox_container_id: isContainer ? proxmoxContainerId : null,
      container_name: isContainer
        ? existing?.container_name || hNode.name || hNode.hostname
        : null,
      last_sync: hNode.last_seen || existing?.last_sync || new Date().toISOString(),
      machine_key: hNode.machine_key || existing?.machine_key || null,
      node_key: hNode.node_key || existing?.node_key || null,
      user: hNode.user || existing?.user || null,
      tags: hNode.tags || existing?.tags || [],
      ephemeral: Boolean(hNode.ephemeral ?? existing?.ephemeral),
      last_seen: hNode.last_seen || existing?.last_seen || null,
      expiration: hNode.expiration || existing?.expiration || null,
      expired: Boolean(hNode.expired ?? existing?.expired),
      api_local_container_id: hNode.api_local_container_id ?? existing?.api_local_container_id ?? null,
    };
  });

  return filterDuplicateClientNodes(mapped);
};

export interface UseNodeSyncOptions {
  cooldownSeconds?: number;
}

export const useNodeSync = (options: UseNodeSyncOptions = {}) => {
  const cooldownDuration = options.cooldownSeconds ?? DEFAULT_COOLDOWN_SECONDS;
  const { connectionManager } = useWebSocket();
  const queryClient = useQueryClient();
  const showToast = useToastStore((state) => state.showToast);

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LAST_SYNC);
      return saved ? new Date(parseInt(saved, 10)) : null;
    } catch {
      return null;
    }
  });

  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Calcula o cooldown restante com base no localStorage ao montar e em intervalos
  const calculateCooldown = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LAST_SYNC);
      if (!saved) return 0;
      const lastSync = parseInt(saved, 10);
      if (isNaN(lastSync)) return 0;

      const elapsedSeconds = Math.floor((Date.now() - lastSync) / 1000);
      const remaining = cooldownDuration - elapsedSeconds;
      return remaining > 0 ? remaining : 0;
    } catch {
      return 0;
    }
  }, [cooldownDuration]);

  // Efeito do timer de contagem regressiva do cooldown
  useEffect(() => {
    const initialRemaining = calculateCooldown();
    setCooldownRemaining(initialRemaining);

    if (initialRemaining <= 0) return;

    const timer = setInterval(() => {
      const remaining = calculateCooldown();
      setCooldownRemaining(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [calculateCooldown, lastSyncTime]);

  // Ativa o cooldown e persiste timestamp
  const triggerCooldown = useCallback(() => {
    const now = Date.now();
    try {
      localStorage.setItem(STORAGE_KEY_LAST_SYNC, String(now));
    } catch (e) {
      console.warn('[useNodeSync] Não foi possível salvar cooldown no localStorage', e);
    }
    setLastSyncTime(new Date(now));
    setCooldownRemaining(cooldownDuration);
  }, [cooldownDuration]);

  // Handler para quando a resposta de sincronização chega da Cloud via WebSocket
  const handleSyncResponse = useCallback(
    (payloadOrMessage: any, rawMessage?: NodeSyncResponse) => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }
      setIsSyncing(false);

      const response: NodeSyncResponse = rawMessage || payloadOrMessage;
      const isSuccess = response.success !== false;
      const incomingNodes: HeadscaleSyncNode[] =
        response.payload?.nodes || payloadOrMessage?.nodes || [];

      if (isSuccess && Array.isArray(incomingNodes)) {
        // Atualiza a cache do React Query instantaneamente
        queryClient.setQueryData<CloudDetailsResponse>(CLOUD_DETAILS_QUERY_KEY, (prev) => {
          if (!prev) return prev;
          const updatedNodes = mapHeadscaleNodesToCloudNodes(incomingNodes, prev.nodes);
          return {
            ...prev,
            nodes: updatedNodes,
            total_nodes: updatedNodes.length,
            online_nodes: updatedNodes.filter((n) => n.online).length,
          };
        });

        // Invalida a query para revalidação de fundo
        queryClient.invalidateQueries({ queryKey: CLOUD_DETAILS_QUERY_KEY });

        triggerCooldown();
        showToast(
          `Sincronização concluída! ${incomingNodes.length} nó(s) atualizado(s).`,
          'success'
        );
      } else {
        const errorMsg = response.error || response.message || 'Falha ao sincronizar nós com a Cloud.';
        showToast(errorMsg, 'error');
      }
    },
    [queryClient, showToast, triggerCooldown]
  );

  // Escuta mensagens WebSocket de tipo "node.sync.response"
  useEffect(() => {
    if (!connectionManager) return;

    const unsubscribe = connectionManager.subscribe('node.sync.response', handleSyncResponse);

    return () => {
      unsubscribe();
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [connectionManager, handleSyncResponse]);

  // Função principal de envio da requisição de sincronização manual
  const syncNodes = useCallback(async () => {
    if (cooldownRemaining > 0 || isSyncing) {
      showToast(`Aguarde ${cooldownRemaining}s para sincronizar novamente.`, 'info');
      return;
    }

    setIsSyncing(true);

    const isWsOpen = connectionManager && connectionManager.getReadyState() === WebSocket.OPEN;

    if (isWsOpen) {
      const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      console.log('[useNodeSync] Enviando node.sync.request via WebSocket', { requestId });

      connectionManager.send({
        type: 'node.sync.request',
        request_id: requestId,
      });

      showToast('Sincronizando nós com a Cloud...', 'info');

      // Timeout de segurança caso a Cloud demore a responder
      syncTimeoutRef.current = setTimeout(() => {
        setIsSyncing(false);
        queryClient.invalidateQueries({ queryKey: CLOUD_DETAILS_QUERY_KEY });
        triggerCooldown();
      }, 8000);
    } else {
      // Fallback via React Query refetch se o WebSocket estiver desconectado
      try {
        await queryClient.refetchQueries({ queryKey: CLOUD_DETAILS_QUERY_KEY });
        triggerCooldown();
        showToast('Nós atualizados via API local.', 'success');
      } catch (err) {
        showToast('Não foi possível sincronizar os nós.', 'error');
      } finally {
        setIsSyncing(false);
      }
    }
  }, [cooldownRemaining, isSyncing, connectionManager, showToast, queryClient, triggerCooldown]);

  return {
    syncNodes,
    isSyncing,
    cooldownRemaining,
    canSync: !isSyncing && cooldownRemaining === 0,
    lastSyncTime,
  };
};

export default useNodeSync;
