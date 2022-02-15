"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workerCode = void 0;
function workerCode(self) {
    const context = {};
    function sendMessage(message) {
        self.postMessage(JSON.stringify(message));
    }
    function setProperty(name, value, id) {
        context[name] = value;
        sendMessage({
            id,
            type: "success",
            body: value
        });
    }
    function setFunction(name, body, id) {
        let test = () => { };
        eval(`test = ${body}`);
        context[name] = test;
        sendMessage({
            id,
            type: "success",
            body: true
        });
    }
    function callFunction(message) {
        if (context[message.name] && context[message.name] instanceof Function) {
            const result = context[message.name].apply(context, message.args);
            sendMessage({
                id: message.id,
                type: 'success',
                body: result,
            });
        }
    }
    function getProperty(message) {
        sendMessage({
            id: message.id,
            type: 'success',
            body: context[message.name],
        });
    }
    self.onmessage = function (e) {
        const message = JSON.parse(e.data);
        try {
            if (message.type == 'setProperty') {
                setProperty(message.name, message.value, message.id);
            }
            else if (message.type == 'setFunction') {
                setFunction(message.name, message.body, message.id);
            }
            else if (message.type == 'callFunction') {
                callFunction(message);
            }
            else if (message.type == 'getProperty') {
                getProperty(message);
            }
            else if (message.type == 'importScripts') {
                // TODO: Worker type should know about importScripts, right?
                self.importScripts(message.scripts);
            }
        }
        catch (e) {
            console.error(e);
            sendMessage({
                id: message.id,
                type: 'failure',
                body: e,
            });
        }
    };
}
exports.workerCode = workerCode;
//# sourceMappingURL=workerCode.js.map