"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerConfig = exports.WorkerBee = void 0;
const workerCode_1 = require("./workerCode");
class WorkerBee {
    constructor(init = {}) {
        this.counter = 0;
        let workerString = `(${exports.WorkerConfig.workerCode})(self)`;
        const blob = new Blob([workerString], { type: 'application/javascript' });
        this.worker = new Worker(URL.createObjectURL(blob));
    }
    sendMessage(message) {
        message.id = `${message.type}_${this.counter++}`;
        this.worker.postMessage(JSON.stringify(message));
        return new Promise((resolve, reject) => {
            const listener = (e) => {
                const response = JSON.parse(e.data);
                if (response.id === message.id) {
                    this.worker.removeEventListener('message', listener);
                    if (response.type == "failure") {
                        reject(response.body);
                    }
                    else {
                        resolve(response.body);
                    }
                }
            };
            this.worker.addEventListener('message', listener);
        });
    }
}
exports.WorkerBee = WorkerBee;
/** Used so we can override in tests. */
exports.WorkerConfig = {
    workerCode: workerCode_1.workerCode.toString()
};
//# sourceMappingURL=WorkerBee.js.map