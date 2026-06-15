import { storage } from '../utils/storage';

const WS_URL = 'ws://localhost:3001/ws';

export class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectDelay: number = 1000;
  private callbacks: Map<string, Function[]> = new Map();
  private isConnecting: boolean = false;
  private subscriptions: string[] = [];

  constructor(url: string = WS_URL) {
    this.url = url;
  }

  async connect() {
    if (this.isConnecting || (this.ws && this.ws.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    const token = await storage.getToken();

    try {
      this.ws = new WebSocket(`${this.url}?token=${token}`);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.resubscribe();
        this.emit('connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.emit(data.type, data.payload);
        } catch (error) {
          console.error('Message parse error:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnecting = false;
        this.emit('disconnected');
        this.reconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
      };
    } catch (error) {
      console.error('Connection error:', error);
      this.isConnecting = false;
      this.reconnect();
    }
  }

  private reconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnect attempts reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      this.connect();
    }, delay);
  }

  private resubscribe() {
    this.subscriptions.forEach((channel) => {
      this.send('subscribe', { channel });
    });
  }

  subscribe(channel: string, callback: Function) {
    if (!this.callbacks.has(channel)) {
      this.callbacks.set(channel, []);
    }
    this.callbacks.get(channel)!.push(callback);

    if (!this.subscriptions.includes(channel)) {
      this.subscriptions.push(channel);
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send('subscribe', { channel });
    }
  }

  unsubscribe(channel: string) {
    this.callbacks.delete(channel);
    this.subscriptions = this.subscriptions.filter((s) => s !== channel);

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send('unsubscribe', { channel });
    }
  }

  on(event: string, callback: Function) {
    if (!this.callbacks.has(event)) {
      this.callbacks.set(event, []);
    }
    this.callbacks.get(event)!.push(callback);
  }

  off(event: string, callback: Function) {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      this.callbacks.set(event, callbacks.filter((cb) => cb !== callback));
    }
  }

  private emit(event: string, data?: any) {
    const callbacks = this.callbacks.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data));
    }
  }

  private send(type: string, payload: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.callbacks.clear();
    this.subscriptions = [];
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

export const wsService = new WebSocketService();
