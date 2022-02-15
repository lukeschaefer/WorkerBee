/** Utils for easy use of WorkerBee workers */

import { WorkerBee } from "./WorkerBee";

export function miniWorker<P extends (...args: any[]) => any>(func: (P)): (...args: Parameters<P>) => Promise<ReturnType<P>> {
  const worker = createWorker({
    mini: func
  });
  return worker.mini;
}

export function createWorker<T extends WorkerMap>(init: T): ToPromiseMap<T> & WorkerUtils {
  const worker = new WorkerBee();

  const functionMap = {} as ToPromiseMap<T> ;

  Object.keys(init).forEach(methodName => {
    const functionReady = worker.sendMessage({
      type: 'setFunction',
      name: methodName,
      function: init[methodName].toString(),
    });

    if(init[methodName] instanceof Function) {
      functionMap[methodName as keyof T] = async (...args: any[]): Promise<ReturnType<T[keyof T]>> => {
        await functionReady;
        return await worker.sendMessage({
          type: 'callFunction',
          name: methodName,
          args
        });
      };
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

export type WorkerMap = {[key: string] : (...args: any) => any};

export type ToPromiseMap<T extends WorkerMap> = {
  [Property in keyof T]: ((...args: Parameters<T[Property]>) => Promise<ReturnType<T[Property]>>)
};
