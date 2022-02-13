/** Creates a worker that can execute one function in another thread */
export declare function miniWorker<P extends (...args: any[]) => any>(func: (P)): (...args: Parameters<P>) => Promise<ReturnType<P>>;
