type MessageHandler = (data: any, rawMessage?: any) => void;
type StatusCallback = (event?: any) => void;

export class ConnectionManager {
  private ws: WebSocket | null = null;
  private url: string;
  private autoReconnect: boolean = true;
  private reconnectInterval: number = 2000;
  private maxReconnectAttempts: number = 10;
  private reconnectAttempts: number = 0;
  private reconnectTimeoutId: any = null;
  
  // Key: channel name, Value: Set of callbacks
  private listeners: Map<string, Set<MessageHandler>> = new Map();
  // Status listeners (e.g. 'open', 'close', etc.)
  private statusListeners: Map<string, Set<StatusCallback>> = new Map();

  constructor(url: string) {
    // Ensure URL points to /ws
    let formattedUrl = url;
    try {
      const parsedUrl = new URL(url.replace('ws://', 'http://').replace('wss://', 'https://'));
      parsedUrl.pathname = '/ws';
      formattedUrl = parsedUrl.toString().replace('http://', 'ws://').replace('https://', 'wss://');
    } catch (e) {
      console.warn('[WS] Could not parse / format url', url);
    }
    this.url = formattedUrl;
  }

  public connect(): void {
    this.autoReconnect = true;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = (event) => {
        console.log('[WS] Connected to', this.url);
        this.reconnectAttempts = 0;
        this.triggerStatus('open', event);

        // Auto resubscribe to all active channels on open / reconnect
        this.resubscribeAll();
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleIncomingMessage(message);
        } catch (err) {
          console.error('[WS] Failed to parse message', err);
        }
      };

      this.ws.onclose = (event) => {
        console.log('[WS] Disconnected', event);
        this.triggerStatus('close', event);
        if (this.autoReconnect) {
          this.attemptReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('[WS] Error', error);
        this.triggerStatus('error', error);
      };
    } catch (error) {
      console.error('[WS] Connection attempt failed', error);
      this.attemptReconnect();
    }
  }

  public disconnect(): void {
    this.autoReconnect = false;
    if (this.reconnectTimeoutId) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  // send(data) method
  public send(eventOrData: any, data?: any): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[WS] Cannot send message, socket is not open');
      return;
    }
    if (typeof eventOrData === 'string') {
      // Legacy send(event, data) format for backwards compatibility
      this.ws.send(JSON.stringify({ event: eventOrData, data }));
    } else {
      // New send(data) format
      this.ws.send(JSON.stringify(eventOrData));
    }
  }

  // subscribe(channel, callback)
  public subscribe(channel: string, callback: MessageHandler): () => void {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set());
      // Automatically send subscribe action to backend if WebSocket is open
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ action: 'subscribe', channel });
      }
    }

    this.listeners.get(channel)!.add(callback);

    // Return cleanup/unsubscribe function
    return () => {
      this.unsubscribe(channel, callback);
    };
  }

  // unsubscribe(channel, callback)
  public unsubscribe(channel: string, callback?: MessageHandler): void {
    const channelListeners = this.listeners.get(channel);
    if (!channelListeners) return;

    if (callback) {
      channelListeners.delete(callback);
    } else {
      channelListeners.clear();
    }

    if (channelListeners.size === 0) {
      this.listeners.delete(channel);
      // Automatically send unsubscribe action to backend if WebSocket is open
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ action: 'unsubscribe', channel });
      }
    }
  }

  // Legacy channel registration methods for JobSocket compatibility
  public subscribeChannel(channel: string): void {
    this.send({ action: 'subscribe', channel });
  }

  public unsubscribeChannel(channel: string): void {
    this.send({ action: 'unsubscribe', channel });
  }

  // Connection status listener
  public onStatus(event: 'open' | 'close' | 'error', callback: StatusCallback): () => void {
    if (!this.statusListeners.has(event)) {
      this.statusListeners.set(event, new Set());
    }
    this.statusListeners.get(event)!.add(callback);
    return () => {
      const listeners = this.statusListeners.get(event);
      if (listeners) {
        listeners.delete(callback);
      }
    };
  }

  private triggerStatus(event: string, data: any): void {
    const listeners = this.statusListeners.get(event);
    if (listeners) {
      listeners.forEach((callback) => {
        try {
          callback(data);
        } catch (err) {
          console.error('[WS] Error executing status listener for', event, err);
        }
      });
    }
  }

  private handleIncomingMessage(message: any): void {
    if (!message || typeof message !== 'object') return;

    const allHandlers = new Set<MessageHandler>();

    // 1. Canal direto explícito (ex: message.channel = "jobs.123" ou "dashboard.metrics")
    if (message.channel && this.listeners.has(message.channel)) {
      this.listeners.get(message.channel)!.forEach((h) => allHandlers.add(h));
    }

    // 2. Canal de Job (ex: message.job_id = "123" -> canal "jobs.123")
    if (message.job_id) {
      const jobChannel = `jobs.${message.job_id}`;
      if (this.listeners.has(jobChannel)) {
        this.listeners.get(jobChannel)!.forEach((h) => allHandlers.add(h));
      }
    }

    // 3. Tipo de mensagem (ex: message.type = "node.sync.response")
    if (message.type && this.listeners.has(message.type)) {
      this.listeners.get(message.type)!.forEach((h) => allHandlers.add(h));
    }

    // 4. Eventos nomeados (ex: "dashboard.metrics" ou "containers.100.metrics.updated")
    if (message.event) {
      if (this.listeners.has(message.event)) {
        this.listeners.get(message.event)!.forEach((h) => allHandlers.add(h));
      }
      if (message.event.endsWith('.updated')) {
        const baseChannel = message.event.slice(0, -8);
        if (this.listeners.has(baseChannel)) {
          this.listeners.get(baseChannel)!.forEach((h) => allHandlers.add(h));
        }
      }
    }

    if (allHandlers.size === 0) return;

    allHandlers.forEach((handler) => {
      try {
        const isJobStatus = Boolean(message.job_id && (message.status !== undefined || message.progress !== undefined));
        const payload =
          isJobStatus
            ? message
            : message.payload !== undefined
            ? message.payload
            : message.data !== undefined
            ? message.data
            : message;
        handler(payload, message);
      } catch (err) {
        console.error(`[WS] Error executing callback for message`, message, err);
      }
    });
  }

  private resubscribeAll(): void {
    this.listeners.forEach((_, channel) => {
      this.send({ action: 'subscribe', channel });
      console.log(`[WS] Re-subscribed to channel: ${channel}`);
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectTimeoutId) return;

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('[WS] Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const backoff = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
    console.log(`[WS] Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${backoff}ms`);

    this.reconnectTimeoutId = setTimeout(() => {
      this.reconnectTimeoutId = null;
      this.connect();
    }, backoff);
  }

  public getReadyState(): number {
    return this.ws ? this.ws.readyState : WebSocket.CLOSED;
  }
}
