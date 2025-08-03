const allSubs: Map<string, Set<PubsubCallback>> = new Map();

export const pubsub: Pubsub = {
  on(name: PubsubEvent, cb: PubsubCallback) {
    const subs = allSubs.get(name);
    if (subs) subs.add(cb);
    else allSubs.set(name, new Set([cb]));
  },
  off(name: PubsubEvent, cb: PubsubCallback) {
    allSubs.get(name)?.delete(cb);
  },
  emit(name: PubsubEvent, ...args: any[]) {
    for (const fn of allSubs.get(name) || []) fn.apply(null, args);
  },
};
