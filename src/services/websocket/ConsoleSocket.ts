export class ConsoleSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private token: string;

  constructor(url: string, token: string) {
    this.url = url;
    this.token = token;
  }

  public connect(
    onOpen: () => void,
    onMessage: (message: any) => void,
    onClose: (event: CloseEvent) => void,
    onError: (error: Event) => void
  ): void {
    // Adiciona o token de autenticação via query parameter
    const separator = this.url.includes('?') ? '&' : '?';
    const socketUrl = `${this.url}${separator}token=${encodeURIComponent(this.token)}`;

    try {
      this.ws = new WebSocket(socketUrl);

      this.ws.onopen = () => {
        onOpen();
      };

      this.ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          onMessage(parsed);
        } catch (err) {
          // Se não for JSON, envia o raw data (mas o protocolo prevê JSON)
          onMessage({ type: 'output', data: event.data });
        }
      };

      this.ws.onclose = (event) => {
        onClose(event);
      };

      this.ws.onerror = (error) => {
        onError(error);
      };
    } catch (err) {
      onError(err as Event);
    }
  }

  public sendInput(data: string): void {
    this.send({
      type: 'input',
      data: data,
    });
  }

  public sendResize(cols: number, rows: number): void {
    this.send({
      type: 'resize',
      cols: cols,
      rows: rows,
    });
  }

  private send(payload: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  public close(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  public isOpen(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}
