"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.miniWorker = void 0;
/** Creates a worker that can execute one function in another thread */
async function miniWorker(func) {
    let workerString = workerCode.toString();
    workerString = workerString.substring(workerString.indexOf('{') + 1, workerString.lastIndexOf('}'));
    const blob = new Blob([workerString], { type: 'application/javascript' });
    const worker = new Worker(URL.createObjectURL(blob));
    let counter = 0;
    function sendMessage(message) {
        message.id = `${message.type}_${counter++}`;
        worker.postMessage(JSON.stringify(message));
        return new Promise((resolve, reject) => {
            const listener = (e) => {
                const response = JSON.parse(e.data);
                if (response.id === message.id) {
                    worker.removeEventListener('message', listener);
                    if (response.type == "failure") {
                        reject(response.body);
                    }
                    else {
                        resolve(response.body);
                    }
                }
            };
            worker.addEventListener('message', listener);
        });
    }
    const result = await sendMessage({
        type: 'setFunction',
        function: func.toString(),
    });
    if (!result) {
        throw new Error("Could not initialize worker");
    }
    return async (...args) => {
        return await sendMessage({
            type: 'callFunction',
            args
        });
    };
}
exports.miniWorker = miniWorker;
/** This function isn't executed in the main thread, but stringified, sent
  * as a blob, and used as the logic for the Worker thread. */
function workerCode(self) {
    let method = (...args) => { console.log("Hello from worker!"); };
    function setFunction(body, id) {
        let test = eval(body);
        if (test instanceof Function) {
            method = test;
            self.postMessage(JSON.stringify({
                id,
                type: "success",
                body: true
            }));
        }
        else {
            self.postMessage(JSON.stringify({
                id,
                type: "failure",
                body: false
            }));
        }
    }
    self.onmessage = function (e) {
        const message = JSON.parse(e.data);
        if (message.type == 'setFunction') {
            setFunction(message.function, message.id);
        }
        else if (message.type == 'callFunction') {
            if (method && method instanceof Function) {
                self.postMessage(JSON.stringify({
                    id: message.id,
                    type: 'response',
                    body: method(...message.args)
                }));
            }
        }
    };
}
//# sourceMappingURL=WorkerB.js.map