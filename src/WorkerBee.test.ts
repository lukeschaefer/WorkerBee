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
    expect(await worker.add(1, 2)).toBe(3);
  });

  it('can execute scoped functions', async () => {
    const worker = createWorker({
      add: (a: number, b: number, c: number) => a + b + c,
      complexThing: function (a: number, b: number): number {
        return this.add(a, b, 3);
      }
    });

    expect(await worker.complexThing(1, 2)).toBe(6);
  });

  it('generates property getters', async () => {
    const worker = createWorker({
      a: 123,
      b: 'abc',
    });

    expect(await worker.a).toBe(123);
    expect(await worker.b).toBe('abc');
  });

  it('generates property setters', async () => {
    const worker = createWorker({
      a: 1,
      b: 'abc',
    });
    await worker.setA(2);
    await worker.setB('345');

    expect(await worker.a).toBe(2);
    expect(await worker.b).toBe('345');
  });

  it('functions can access propeties', async () => {
    const worker = createWorker({
      a: 123,
      b: 'abc',
      c: function () {
        return this.a + this.b.length;
      }
    });

    expect(await worker.c()).toBe(126);
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
    context[name] = value;
    sendMessage({
      id,
      type: "success",
      body: value
    });
  }

  function setFunction(name: string, body: string, id: string) {
    let test = () => { };
    eval(`test = ${body}`);

    context[name] = test;
    sendMessage({
      id,
      type: "success",
      body: true
    });
  }

  function callFunction(message: CallFunctionMessage & { id?: string }) {
    if (context[message.name] && context[message.name] instanceof Function) {
      const result = context[message.name].apply(context, message.args);
      sendMessage({
        id: message.id!,
        type: 'success',
        body: result,
      });
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

    try {
      if (message.type == 'setProperty') {
        setProperty(message.name, message.value, message.id!);
      } else if (message.type == 'setFunction') {
        setFunction(message.name, message.body, message.id!);
      } else if (message.type == 'callFunction') {
        callFunction(message);
      } else if (message.type == 'getProperty') {
        getProperty(message);
      } else if (message.type == 'importScripts') {
        // TODO: Worker type should know about importScripts, right?
        (self as any).importScripts(message.scripts);
      }
    } catch (e) {
      console.error(e);
      sendMessage({
        id: message.id!,
        type: 'failure',
        body: e,
      });
    }
  }
}).toString()