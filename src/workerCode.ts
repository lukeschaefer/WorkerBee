import { WorkerMap } from "./quickWorkers";
import { WorkerBResponse, WorkerBMessage, CallFunctionMessage, GetProperty } from "./WorkerBee";

export function workerCode(self: Worker) {
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
}