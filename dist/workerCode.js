"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workerCode = void 0;
function workerCode(self) {
    const context = {};
    function sendMessage(message) {
        self.postMessage(JSON.stringify(message));
    }
    function setProperty(name, value, id) {
        let test = () => { };
        try {
            eval(`test = ${value}`);
        }
        catch (e) {
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
        }
        else {
            sendMessage({
                id,
                type: "failure",
                body: false
            });
        }
    }
    function callFunction(message) {
        if (context[message.name] && context[message.name] instanceof Function) {
            try {
                const result = context[message.name].apply(context, message.args);
                sendMessage({
                    id: message.id,
                    type: 'success',
                    body: result,
                });
            }
            catch (e) {
                console.error(e);
                sendMessage({
                    id: message.id,
                    type: 'failure',
                    body: e,
                });
            }
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
        if (message.type == 'setProperty') {
            setProperty(message.name, message.value, message.id);
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
    };
}
exports.workerCode = workerCode;
//# sourceMappingURL=workerCode.js.map