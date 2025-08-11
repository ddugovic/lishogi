import { attributesModule, classModule, init, type VNode } from 'snabbdom';

const sInit: (oldVnode: VNode | Element, vnode: VNode) => VNode = init([
  classModule,
  attributesModule,
]);

export default sInit;
