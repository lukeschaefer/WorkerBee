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
    const propertiesMap = {};
    const setters = {};
    for (const name in init) {
        // If it's a function, make a wrapper
        if (init[name] instanceof Function) {
            let propertyReady = worker.sendMessage({
                type: 'setFunction',
                name,
                body: init[name].toString(),
            });
            propertiesMap[name] = (async (...args) => {
                await propertyReady;
                return await worker.sendMessage({
                    type: 'callFunction',
                    name: name,
                    args
                });
            });
        }
        else {
            // if it's not, write an async getter/setter wrapper
            let propertyReady = worker.sendMessage({
                type: 'setProperty',
                name,
                value: init[name],
            });
            const setterName = `set${name[0].toUpperCase()}${name.slice(1)}`;
            const setterFunction = async (value) => {
                await propertyReady;
                return await worker.sendMessage({
                    type: 'setProperty',
                    name,
                    value
                });
            };
            setters[setterName] = setterFunction;
            Object.defineProperty(propertiesMap, name, {
                enumerable: true,
                get: async function () {
                    await propertyReady;
                    return await worker.sendMessage({
                        type: 'getProperty',
                        name: name,
                    });
                }
            });
        }
    }
    const utils = {
        destroy: () => worker.worker.terminate(),
        importScripts: async (scripts) => {
            return await worker.sendMessage({
                type: 'importScripts',
                scripts
            });
        }
    };
    // Using Object.assign lets us keep the getters in propertiesMap.
    return Object.assign(propertiesMap, setters, utils);
}
exports.createWorker = createWorker;
//# sourceMappingURL=quickWorkers.js.map