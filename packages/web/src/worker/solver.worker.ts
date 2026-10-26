/// <reference lib="webworker" />
import type { WorkerCommand } from '@tsp/core';
import { createSession } from './session';

// setTimeout(0) iç içe çağrılarda ~4 ms bekletir; MessageChannel beklemeden sıraya alır.
const channel = new MessageChannel();
const queue: (() => void)[] = [];
channel.port1.onmessage = () => queue.shift()?.();

const session = createSession({
  post: (event) => self.postMessage(event),
  schedule: (fn) => {
    queue.push(fn);
    channel.port2.postMessage(null);
  },
});

self.onmessage = (e: MessageEvent<WorkerCommand>) => session.handle(e.data);
