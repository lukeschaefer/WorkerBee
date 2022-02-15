import { createWorker, WorkerMap } from "./quickWorkers";
import { WorkerConfig, WorkerBMessage, WorkerBResponse } from "./WorkerBee";

describe('createWorker workers', () => {

  beforeEach(() => {
    WorkerConfig.workerCode = swappedOutWorkerCode;
  });

  it('can execute a standalone function', async () => {
    const worker = createWorker({
      add: (a: number, b: number) => a + b,
    });
    expect(await worker.add(1,2)).toBe(3);
  });

  it('can execute scoped functions', async () => {
    const worker = createWorker({
      add: (a: number, b: number, c: number) => a + b + c,
      complexThing: function (a: number, b: number): number {
        return this.add(a, b, 3);
      }
    });

    expect(await worker.complexThing(1,2)).toBe(6);
  });

});

// TODO: Not have to do this. Karma messes with the worker code, so we
// manually replace it here. Another option would be to regex it out of the
// WorkerB.ts source file? Because keeping these in parity is dumb.
const swappedOutWorkerCode = ((self: Worker) => {
  const context: WorkerMap = {};

  function sendMessage(message: WorkerBResponse) {
    self.postMessage(JSON.stringify(message));
  }

  function setFunction(name: string, body: string, id: string) {
    let test = () => { };
    try {
      eval(`test = ${body}`);
    } catch (e) {
      sendMessage({
        id,
        type: "failure",
        body: e,
      });
      return;
    }

    if (test instanceof Function) {
      context[name] = test;
      sendMessage({
        id,
        type: "success",
        body: true
      });
    } else {
      sendMessage({
        id,
        type: "failure",
        body: false
      });
    }
  }

  self.onmessage = function (e) {
    const message = JSON.parse(e.data) as WorkerBMessage;

    if (message.type == 'setFunction') {
      setFunction(message.name, message.function, message.id!);
    } else if (message.type == 'callFunction') {
      if (context[message.name] && context[message.name] instanceof Function) {
        try {
          const result = context[message.name].apply(context, message.args);
          sendMessage({
            id: message.id!,
            type: 'success',
            body: result,
          });
        } catch (e) {
          console.error(e);
          sendMessage({
            id: message.id!,
            type: 'failure',
            body: e,
          });
        }

      }
    } else if(message.type == 'importScripts') {
      // TODO: Worker type should know about importScripts, right?
      (self as any).importScripts(message.scripts);
    }
  }
}).toString();