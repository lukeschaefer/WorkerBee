/** Utils for easy use of WorkerBee workers */

import { WorkerBee } from "./WorkerBee";

export function miniWorker<P extends AnyFunction>(func: (P)): (...args: Parameters<P>) => Promise<ReturnType<P>> {
  const worker = createWorker({
    mini: func
  });
  return worker.mini;
}

export function createWorker<T extends WorkerMap>(init: T): WorkerInterface<T> {
  const worker = new WorkerBee();

  const propertiesMap = {} as WorkerProperties<T>;
  const setters = {} as WorkerSetters<T>;
  for (const name in init) {
    // If it's a function, make a wrapper
    if ((init[name] as any) instanceof Function) {
      let propertyReady = worker.sendMessage({
        type: 'setFunction',
        name,
        body: init[name].toString(),
      });

      propertiesMap[name] = (async (...args: any[]) => {
        await propertyReady;
        return await worker.sendMessage({
          type: 'callFunction',
          name: name,
          args
        });
      }) as ToWorkerProperty<typeof init[typeof name]>;
    } else {
      // if it's not, write an async getter/setter wrapper
      let propertyReady = worker.sendMessage({
        type: 'setProperty',
        name,
        value: init[name],
      });

      const setterName = `set${name[0].toUpperCase()}${name.slice(1)}` as SetterKey<typeof name extends string ? T[typeof name] extends AnyFunction ? never : typeof name : never>;
      const setterFunction = async (value: any) => {
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

  const utils: WorkerUtils = {
    destroy: () => worker.worker.terminate(),
    importScripts: async (scripts: string[]) => {
      return await worker.sendMessage({
        type: 'importScripts',
        scripts
      });
    }
  };

  // Using Object.assign lets us keep the getters in propertiesMap.
  return Object.assign(propertiesMap, setters, utils);
}

export type WorkerUtils = {
  destroy: () => void;
  importScripts: (scripts: string[]) => Promise<void>;
}

export type AnyFunction = (...args: any[]) => any;
export type WorkerFunction<T extends AnyFunction> = (...args: Parameters<T>) => Promise<ReturnType<T>>;

export type ToWorkerProperty<T> = T extends AnyFunction ? WorkerFunction<T> : Promise<T>;

export type WorkerMap = { [key: string]: (any) };
export type WorkerProperties<T>
  = { [key in keyof T]: ToWorkerProperty<T[key]> };

export type SetterKey<T extends string> = `set${Capitalize<T>}`
export type SetterFunc<T> = (value: T) => Promise<T>

export type WorkerSetters<T extends WorkerMap> = {
  [Key in keyof T & string as SetterKey<Key extends string ? T[Key] extends AnyFunction ? never : Key : never>]: SetterFunc<T[Key]> };


export type WorkerInterface<T extends WorkerMap> = WorkerProperties<T> & WorkerSetters<T> & WorkerUtils;