/** Utils for easy use of WorkerBee workers */
export declare function miniWorker<P extends AnyFunction>(func: (P)): (...args: Parameters<P>) => Promise<ReturnType<P>>;
export declare function createWorker<T extends WorkerMap>(init: T): WorkerInterface<T>;
export declare type WorkerUtils = {
    destroy: () => void;
    importScripts: (scripts: string[]) => Promise<void>;
};
export declare type AnyFunction = (...args: any[]) => any;
export declare type WorkerFunction<T extends AnyFunction> = (...args: Parameters<T>) => Promise<ReturnType<T>>;
export declare type ToWorkerProperty<T> = T extends AnyFunction ? WorkerFunction<T> : Promise<T>;
export declare type WorkerMap = {
    [key: string]: (any);
};
export declare type WorkerProperties<T> = {
    [key in keyof T]: ToWorkerProperty<T[key]>;
};
export declare type SetterKey<T extends string> = `set${Capitalize<T>}`;
export declare type SetterFunc<T> = (value: T) => Promise<T>;
export declare type WorkerSetters<T extends WorkerMap> = {
    [Key in keyof T & string as SetterKey<Key extends string ? T[Key] extends AnyFunction ? never : Key : never>]: SetterFunc<T[Key]>;
};
export declare type WorkerInterface<T extends WorkerMap> = WorkerProperties<T> & WorkerSetters<T> & WorkerUtils;
