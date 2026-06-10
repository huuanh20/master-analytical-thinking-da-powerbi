import * as signalR from '@microsoft/signalr';

// In dev: Vite proxy routes /hubs → http://localhost:5030/hubs (ws:true)
// In prod: set VITE_API_URL to point to backend host
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

type NoteUpdatedPayload = { lectureId: string; content: string };
type StatusUpdatedPayload = { lectureId: string; status: number };

type EventHandler<T> = (payload: T) => void;

class LectureSignalRService {
  private connection: signalR.HubConnection | null = null;
  private currentLectureId: string | null = null;
  private noteUpdatedHandlers: EventHandler<NoteUpdatedPayload>[] = [];
  private statusUpdatedHandlers: EventHandler<StatusUpdatedPayload>[] = [];
  private connectionStateHandlers: EventHandler<signalR.HubConnectionState>[] = [];

  init() {
    if (this.connection) return;

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/hubs/lecture`, {
        transport: signalR.HttpTransportType.WebSockets,
        skipNegotiation: false,
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          // Exponential backoff: 0s, 2s, 10s, 30s, then 30s every retry
          const delays = [0, 2000, 10000, 30000];
          return delays[retryContext.previousRetryCount] ?? 30000;
        },
      })
      .configureLogging(
        import.meta.env.DEV ? signalR.LogLevel.Information : signalR.LogLevel.Warning
      )
      .build();

    // Event listeners
    this.connection.on('NoteUpdated', (payload: NoteUpdatedPayload) => {
      this.noteUpdatedHandlers.forEach((h) => h(payload));
    });

    this.connection.on('StatusUpdated', (payload: StatusUpdatedPayload) => {
      this.statusUpdatedHandlers.forEach((h) => h(payload));
    });

    // Connection state events
    this.connection.onreconnecting(() => {
      this.notifyConnectionState(signalR.HubConnectionState.Reconnecting);
    });

    this.connection.onreconnected(() => {
      this.notifyConnectionState(signalR.HubConnectionState.Connected);
      // Re-join room if we were in one
      if (this.currentLectureId) {
        this.joinRoom(this.currentLectureId);
      }
    });

    this.connection.onclose(() => {
      this.notifyConnectionState(signalR.HubConnectionState.Disconnected);
    });
  }

  async start(): Promise<void> {
    if (!this.connection) this.init();
    if (this.connection!.state !== signalR.HubConnectionState.Disconnected) return;

    try {
      await this.connection!.start();
      this.notifyConnectionState(signalR.HubConnectionState.Connected);
      console.log('[SignalR] Connected to LectureHub');
    } catch (err) {
      console.warn('[SignalR] Failed to connect, will retry automatically:', err);
      this.notifyConnectionState(signalR.HubConnectionState.Disconnected);
    }
  }

  async stop(): Promise<void> {
    if (this.connection && this.connection.state !== signalR.HubConnectionState.Disconnected) {
      await this.connection.stop();
    }
  }

  async joinRoom(lectureId: string): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) return;

    // Leave previous room if any
    if (this.currentLectureId && this.currentLectureId !== lectureId) {
      await this.leaveRoom(this.currentLectureId);
    }

    this.currentLectureId = lectureId;
    await this.connection.invoke('JoinLectureRoom', lectureId);
    console.log(`[SignalR] Joined lecture room: ${lectureId}`);
  }

  async leaveRoom(lectureId: string): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) return;
    await this.connection.invoke('LeaveLectureRoom', lectureId);
  }

  async broadcastNoteUpdate(lectureId: string, content: string): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) return;
    await this.connection.invoke('BroadcastNoteUpdate', lectureId, content);
  }

  async broadcastStatusUpdate(lectureId: string, status: number): Promise<void> {
    if (!this.connection || this.connection.state !== signalR.HubConnectionState.Connected) return;
    await this.connection.invoke('BroadcastStatusUpdate', lectureId, status);
  }

  getState(): signalR.HubConnectionState {
    return this.connection?.state ?? signalR.HubConnectionState.Disconnected;
  }

  onNoteUpdated(handler: EventHandler<NoteUpdatedPayload>): () => void {
    this.noteUpdatedHandlers.push(handler);
    return () => {
      this.noteUpdatedHandlers = this.noteUpdatedHandlers.filter((h) => h !== handler);
    };
  }

  onStatusUpdated(handler: EventHandler<StatusUpdatedPayload>): () => void {
    this.statusUpdatedHandlers.push(handler);
    return () => {
      this.statusUpdatedHandlers = this.statusUpdatedHandlers.filter((h) => h !== handler);
    };
  }

  onConnectionStateChange(handler: EventHandler<signalR.HubConnectionState>): () => void {
    this.connectionStateHandlers.push(handler);
    return () => {
      this.connectionStateHandlers = this.connectionStateHandlers.filter((h) => h !== handler);
    };
  }

  private notifyConnectionState(state: signalR.HubConnectionState) {
    this.connectionStateHandlers.forEach((h) => h(state));
  }
}

// Singleton instance
export const lectureHub = new LectureSignalRService();
export { signalR };
