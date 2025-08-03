import { wsConnect } from 'common/ws';

function main(): void {
  wsConnect('/socket/v5', false, {
    params: { flag: 'simul' },
  });

  window.lishogi.pubsub.on('socket.in.reload', async () => {
    const rsp = await fetch('/simul/reload');
    const html = await rsp.text();
    $('.simul-list__content').html(html);
    window.lishogi.pubsub.emit('content_loaded');
  });
}

window.lishogi.registerModule(__bundlename__, main);
