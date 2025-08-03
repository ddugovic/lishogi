// helper functions for websocket
// do not use window.lishogi.socket directly

export function wsConnect(
  url: string,
  version: number | false,
  settings: Partial<Socket.Settings> = {},
): IStrongSocket {
  window.lishogi.socket = new window.lishogi.StrongSocket(url, version, settings);
  return window.lishogi.socket;
}

export function wsConnected(): boolean {
  return !!window.lishogi.socket;
}

export function wsDestroy(): void {
  window.lishogi.socket?.destroy();
  window.lishogi.socket = undefined;
}

export function wsSend(t: string, d?: any, o?: any, noRetry?: boolean): void {
  window.lishogi.socket?.send(t, d, o, noRetry);
}

export function wsIsReady(): boolean {
  return !!window.lishogi.socket?.isReady();
}

export function wsVersion(): number | false {
  return window.lishogi.socket?.getVersion() ?? false;
}

export function wsLastVersionTime(): number | undefined {
  return window.lishogi.socket?.getLastVersionTime();
}

export function wsPingInterval(): number {
  return window.lishogi.socket?.getPingInterval() ?? 0;
}

export function wsAverageLag(): number {
  return window.lishogi.socket?.getAverageLag() ?? 0;
}

// function called on every reconnection
export function wsOnOpen(f: () => void): void {
  if (window.lishogi.socket?.isReady()) f();
  window.lishogi.pubsub.on('socket.open', () => {
    f();
  });
}
