export function idleTimer(delay: number, onIdle: () => void, onWakeUp: () => void): void {
  const events = ['mousemove', 'touchstart'];

  let listening = false;
  let active = true;
  let lastSeenActive = performance.now();

  const onActivity = () => {
    if (!active) {
      onWakeUp();
    }
    active = true;
    lastSeenActive = performance.now();
    stopListening();
  };

  const startListening = () => {
    if (!listening) {
      events.forEach(e => {
        document.addEventListener(e, onActivity);
      });
      listening = true;
    }
  };

  const stopListening = () => {
    if (listening) {
      events.forEach(e => {
        document.removeEventListener(e, onActivity);
      });
      listening = false;
    }
  };

  setInterval(() => {
    if (active && performance.now() - lastSeenActive > delay) {
      onIdle();
      active = false;
    }
    startListening();
  }, 10000);
}

export function browserTaskQueueMonitor(interval: number): {
  wasSuspended: boolean;
  reset: () => void;
} {
  let lastTime: number;
  let timeout: Timeout;
  let suspended = false;

  start();

  return {
    get wasSuspended() {
      return suspended;
    },
    reset() {
      suspended = false;
      clearTimeout(timeout);
      start();
    },
  };

  function monitor() {
    if (performance.now() - lastTime > interval + 400) suspended = true;
    else start();
  }

  function start() {
    lastTime = performance.now();
    timeout = setTimeout(monitor, interval);
  }
}

export function debounce<T extends (...args: any) => any>(
  f: T,
  wait: number,
  immediate = false,
): (...args: Parameters<T>) => any {
  let timeout: Timeout | undefined;
  let lastBounce = 0;

  return function (this: any, ...args: Parameters<T>) {
    if (timeout) clearTimeout(timeout);
    timeout = undefined;

    const elapsed = performance.now() - lastBounce;
    lastBounce = performance.now();
    if (immediate && elapsed > wait) f.apply(this, args);
    else
      timeout = setTimeout(() => {
        timeout = undefined;
        f.apply(this, args);
      }, wait);
  };
}
