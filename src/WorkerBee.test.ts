import { createWorker, WorkerMap } from "./quickWorkers";
import { WorkerConfig, WorkerBMessage, WorkerBResponse, CallFunctionMessage, GetProperty } from "./WorkerBee";

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

  it('generates property setters and accessors', async () => {
    const worker = createWorker({
      a: 123,
      b: 'abc',
      c: function() {
        return "You and me"
      }
    });

    expect(await worker.a).toBe(123);
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

  function setProperty(name: string, value: string, id: string) {
    let test = () => { };
    try {
      eval(`test = ${value}`);
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

  function callFunction(message: CallFunctionMessage & { id?: string }) {
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
  }

  function getProperty(message: GetProperty & { id?: string }) {
    sendMessage({
      id: message.id!,
      type: 'success',
      body: context[message.name],
    });    
  }

  self.onmessage = function (e) {
    const message = JSON.parse(e.data) as WorkerBMessage;

    if (message.type == 'setProperty') {
      setProperty(message.name, message.value, message.id!);
    } else if (message.type == 'callFunction') {
      callFunction(message);
    } else if (message.type == 'getProperty') {
      getProperty(message);
    } else if(message.type == 'importScripts') {
      // TODO: Worker type should know about importScripts, right?
      (self as any).importScripts(message.scripts);
    }
  }
}).toString()