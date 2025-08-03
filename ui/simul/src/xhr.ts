import throttle from 'common/throttle';
import type SimulCtrl from './ctrl';

// when the simul no longer exists
const onFail = () => window.lishogi.reload();

const post = (action: string) => (id: string) =>
  window.lishogi.xhr.json('POST', `/simul/${id}/${action}`).catch(onFail);

const xhr: Record<
  'ping' | 'start' | 'abort' | 'join' | 'withdraw' | 'accept' | 'reject',
  (...args: any[]) => any
> = {
  ping: post('host-ping'),
  start: post('start'),
  abort: post('abort'),
  join: throttle(3500, (ctrl: SimulCtrl, variant: VariantKey) =>
    post(`join/${variant}`)(ctrl.data.id).then(() => ctrl.clear()),
  ),
  withdraw: (ctrl: SimulCtrl) => post('withdraw')(ctrl.data.id).then(() => ctrl.clear()),
  accept: (user: string) => post(`accept/${user}`),
  reject: (user: string) => post(`reject/${user}`),
};

export default xhr;
