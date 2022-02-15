/** Utils for easy use of WorkerBee workers */
export declare function miniWorker<P extends WorkerFunction>(func: (P)): (...args: Parameters<P>) => Promise<ReturnType<P>>;
export declare function createWorker<T extends WorkerMap>(init: T): ToPromiseMap<T> & WorkerUtils;
export declare type WorkerUtils = {
    destroy: () => void;
    importScripts: (scripts: string[]) => Promise<void>;
};
export declare type WorkerFunction = (...args: any[]) => any;
export declare type ToWorkerProperty<T> = T extends WorkerFunction ? ToPromiseFunction<T> : Promise<T>;
export declare type ToPromiseFunction<T extends WorkerFunction> = (...args: Parameters<T>) => Promise<ReturnType<T>>;
export declare type WorkerMap = {
    [key: string]: (any);
};
export declare type ToPromiseMap<T extends WorkerMap> = {
    [Property in keyof T]: ToWorkerProperty<T[Property]>;
};
