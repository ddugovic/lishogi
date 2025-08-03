import { wsDestroy } from 'common/ws';

export function redirect(obj: string | { url: string; cookie: Cookie }): void {
  let url: string;
  if (typeof obj == 'string') url = obj;
  else {
    url = obj.url;
    if (obj.cookie) {
      const cookie = [
        `${encodeURIComponent(obj.cookie.name)}=${obj.cookie.value}`,
        `; max-age=${obj.cookie.maxAge}`,
        '; path=/',
        `; domain=${location.hostname}`,
      ].join('');
      document.cookie = cookie;
    }
  }
  const href = `//${location.host}/${url.replace(/^\//, '')}`;
  window.lishogi.redirectInProgress = href;
  location.href = href;
}

export function reload(): void {
  if (window.lishogi.redirectInProgress) return;
  window.lishogi.properReload = true;
  wsDestroy();
  if (location.hash) location.reload();
  else location.assign(location.href);
}
