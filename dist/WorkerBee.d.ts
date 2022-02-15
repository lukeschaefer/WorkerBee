export declare class WorkerBee {
    counter: number;
    worker: Worker;
    constructor(init?: {
        [key: string]: Function;
    });
    sendMessage(message: WorkerBMessage): Promise<any>;
}
/** Used so we can override in tests. */
export declare const WorkerConfig: {
    workerCode: string;
};
export declare type WorkerBResponse = {
    type: 'success' | 'failure';
    body: any;
    id: string;
};
export declare type WorkerBMessage = {
    id?: string;
} & (SetProperty | CallFunctionMessage | ImportScriptsMessage | GetProperty);
export declare type SetProperty = {
    type: 'setProperty';
    name: string;
    value: string;
};
export declare type GetProperty = {
    type: 'getProperty';
    name: string;
};
export declare type ImportScriptsMessage = {
    type: 'importScripts';
    scripts: string[];
};
export declare type CallFunctionMessage = {
    type: 'callFunction';
    name: string;
    args: any[];
};
