import { WorkerMap } from "./quickWorkers";
import { WorkerBResponse, WorkerBMessage, CallFunctionMessage, GetProperty } from "./WorkerBee";

export function workerCode(self: Worker){
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
}