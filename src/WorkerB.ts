/** Creates a worker that can execute one function in another thread */
export function miniWorker<P extends (...args: any[]) => any>(func: (P)): (...args: Parameters<P>) => Promise<ReturnType<P>> {
  let workerString = workerCode.toString();
  workerString = workerString.substring(workerString.indexOf('{') + 1, workerString.lastIndexOf('}'));
  const blob = new Blob([workerString], { type: 'application/javascript' });
  const worker = new Worker(URL.createObjectURL(blob));

  let counter = 0;

  function sendMessage(message: WorkerBMessage): Promise<any> {
    message.id = `${message.type}_${counter++}`;

    worker.postMessage(JSON.stringify(message));

    return new Promise((resolve, reject) => {
      const listener = (e: MessageEvent<any>) => {
        const response = JSON.parse(e.data) as WorkerBResponse;
        if (response.id === message.id) {
          worker.removeEventListener('message', listener);

          if (response.type == "failure") {
            reject(response.body);
          } else {
            resolve(response.body);
          }
        }
      };
      worker.addEventListener('message', listener);
    });
  }

  const isReady = sendMessage({
    type: 'setFunction',
    function: func.toString(),
  });

  return async (...args: Parameters<P>) => {
    // await isReady;
    return await sendMessage({
      type: 'callFunction',
      args
    });
  }
}


/** This function isn't executed in the main thread, but stringified, sent
  * as a blob, and used as the logic for the Worker thread. */
function workerCode(self: Worker) {
  let method = (...args: any[]) => { console.log("Hello from worker!"); };

  function setFunction(body: string, id?: string) {
    let test = eval(body);
    if (test instanceof Function) {
      method = test;

      self.postMessage(JSON.stringify({
        id,
        type: "success",
        body: true
      }));
    } else {
      self.postMessage(JSON.stringify({
        id,
        type: "failure",
        body: false
      }));
    }
  }

  self.onmessage = function (e) {
    const message = JSON.parse(e.data) as WorkerBMessage;

    if (message.type == 'setFunction') {
      setFunction(message.function, message.id);
    } else if (message.type == 'callFunction') {
      if (method && method instanceof Function) {
        self.postMessage(JSON.stringify({
          id: message.id,
          type: 'response',
          body: method(...message.args)
        }));
      }
    }
  }
}

type WorkerBResponse = {
  type: 'success' | 'failure',
  body: boolean,
  id: string
}

type WorkerBMessage = { id?: string }
  & (SetFunctionMessage | CallFunctionMessage);

type SetFunctionMessage = {
  type: 'setFunction';
  function: string;

}

type CallFunctionMessage = {
  type: 'callFunction';
  args: any[];
}
