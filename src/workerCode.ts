import { WorkerMap } from "./quickWorkers";
import { WorkerBResponse, WorkerBMessage } from "./WorkerBee";

export function workerCode(self: Worker) {
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
}