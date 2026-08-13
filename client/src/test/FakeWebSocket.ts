export class FakeWebSocket extends EventTarget {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;

  static instances: FakeWebSocket[] = [];

  readonly url: string;
  readyState = FakeWebSocket.CONNECTING;
  sentMessages: string[] = [];
  closeCallCount = 0;

  constructor(url: string | URL) {
    super();
    this.url = url.toString();
    FakeWebSocket.instances.push(this);
  }

  open(): void {
    this.readyState = FakeWebSocket.OPEN;
    this.dispatchEvent(new Event("open"));
  }

  receive(value: string): void {
    this.dispatchEvent(new MessageEvent("message", { data: value }));
  }

  fail(): void {
    this.dispatchEvent(new Event("error"));
  }

  serverClose(): void {
    this.readyState = FakeWebSocket.CLOSED;
    this.dispatchEvent(new CloseEvent("close"));
  }

  send(value: string): void {
    this.sentMessages.push(value);
  }

  close(): void {
    this.closeCallCount += 1;
    this.readyState = FakeWebSocket.CLOSED;
  }

  static reset(): void {
    FakeWebSocket.instances = [];
  }
}