import { WorkerMap } from "./quickWorkers";
import { workerCode } from "./workerCode";


export class WorkerBee {
  counter = 0;
  worker: Worker;

  constructor(init: {[key: string]: Function} = {}) {
    let workerString = `(${WorkerConfig.workerCode})(self)`;
    const blob = new Blob([workerString], { type: 'application/javascript' });
    this.worker = new Worker(URL.createObjectURL(blob));
  }
  
  sendMessage(message: WorkerBMessage): Promise<any> {
    message.id = `${message.type}_${this.counter++}`;
    this.worker.postMessage(JSON.stringify(message));

    return new Promise((resolve, reject) => {
      const listener = (e: MessageEvent<any>) => {
        const response = JSON.parse(e.data) as WorkerBResponse;
        if (response.id === message.id) {

          this.worker.removeEventListener('message', listener);

          if (response.type == "failure") {
            reject(response.body);
          } else {
            resolve(response.body);
          }
        }
      };
      this.worker.addEventListener('message', listener);
    });
  }  
}

/** Used so we can override in tests. */
export const WorkerConfig = {
  workerCode: workerCode.toString()
}

export type WorkerBResponse = {
  type: 'success' | 'failure',
  body: any,
  id: string
}

export type WorkerBMessage = { id?: string }
  & (SetFunctionMessage | CallFunctionMessage | ImportScriptsMessage);

type SetFunctionMessage = {
  type: 'setFunction';
  name: string;
  function: string;
}

type ImportScriptsMessage = {
  type: 'importScripts';
  scripts: string[];
}

type CallFunctionMessage = {
  type: 'callFunction';
  name: string;
  args: any[];
}