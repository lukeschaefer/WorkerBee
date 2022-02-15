"use strict";
/** Utils for easy use of WorkerBee workers */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWorker = exports.miniWorker = void 0;
const WorkerBee_1 = require("./WorkerBee");
function miniWorker(func) {
    const worker = createWorker({
        mini: func
    });
    return worker.mini;
}
exports.miniWorker = miniWorker;
function createWorker(init) {
    const worker = new WorkerBee_1.WorkerBee();
    const functionMap = {};
    Object.keys(init).forEach(name => {
        const propertyReady = worker.sendMessage({
            type: 'setProperty',
            name,
            value: init[name].toString(),
        });
        // If it's a function, make a wrapper
        if (init[name] instanceof Function) {
            let func = async (...args) => {
                await propertyReady;
                return await worker.sendMessage({
                    type: 'callFunction',
                    name: name,
                    args
                });
            };
            functionMap[name] = func;
        }
        else {
            // if it's not, write an async getter/setter wrapper
            Object.defineProperty(functionMap, name, {
                get: async function () {
                    await propertyReady;
                    return await worker.sendMessage({
                        type: 'getProperty',
                        name: name,
                    });
                }
            });
        }
    });
    functionMap.destroy = () => worker.worker.terminate();
    functionMap.importScripts = async (scripts) => {
        return await worker.sendMessage({
            type: 'importScripts',
            scripts
        });
    };
    return functionMap;
}
exports.createWorker = createWorker;
//# sourceMappingURL=quickWorkers.js.map