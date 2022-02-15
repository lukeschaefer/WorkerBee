/** Utils for easy use of WorkerBee workers */

import { WorkerBee } from "./WorkerBee";

export function miniWorker<P extends WorkerFunction>(func: (P)): (...args: Parameters<P>) => Promise<ReturnType<P>> {
  const worker = createWorker({
    mini: func
  });
  return worker.mini;
}

export function createWorker<T extends WorkerMap>(init: T): ToPromiseMap<T> & WorkerUtils {
  const worker = new WorkerBee();

  const functionMap = {} as ToPromiseMap<T> ;

  Object.keys(init).forEach(name => {
    const propertyReady = worker.sendMessage({
      type: 'setProperty',
      name,
      value: init[name].toString(),
    });

    // If it's a function, make a wrapper
    if(init[name] instanceof Function) {      
      let func = async (...args: any[])  => {
        await propertyReady;
        return await worker.sendMessage({
          type: 'callFunction',
          name: name,
          args
        });
      };
      functionMap[name as keyof T] = func as ToWorkerProperty<T[keyof T]>;
    } else {
      // if it's not, write an async getter/setter wrapper
      Object.defineProperty(functionMap, name, {
        get: async function(){
          await propertyReady;
          return await worker.sendMessage({
            type: 'getProperty',
            name: name,
          });
        }
    });

    }
  });

  (functionMap as ToPromiseMap<T> & WorkerUtils).destroy = () => worker.worker.terminate();
  (functionMap as ToPromiseMap<T> & WorkerUtils).importScripts = async (scripts: string[]) => {
    return await worker.sendMessage({
      type: 'importScripts',
      scripts
    })
  } 

  return functionMap as ToPromiseMap<T> & WorkerUtils;
}

export type WorkerUtils = {
  destroy: () => void;
  importScripts: (scripts: string[]) => Promise<void>;
}

export type WorkerFunction = (...args: any[]) => any;

export type ToWorkerProperty<T> = 
T extends WorkerFunction ? ToPromiseFunction<T> : Promise<T>;

export type ToPromiseFunction<T extends WorkerFunction> =
(...args: Parameters<T>) => Promise<ReturnType<T>>;

export type WorkerMap = {[key: string] : (any) };

export type ToPromiseMap<T extends WorkerMap> = {
  [Property in keyof T]: ToWorkerProperty<T[Property]>
};