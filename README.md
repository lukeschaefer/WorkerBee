# WorkerBee

WorkerBee is a minimal TypeScript library to make using Web Workers as easy as possible. 
Instead of having to create a seperate file for code that is run in a different thread, 
workers can be made inline with their own functions and be communicated with asynchronously.

# Usage

## Installation

```npm install @lukeschaefer/worker-bee```
    
## Usage:

The basic usage is as follows:

```typescript
import { miniWorker} from '@lukeschaefer/worker-bee';

const multiplier = miniWorker((x: number, y:number) => {
  return x * y;
});

const result = await multiplier(12,3);
console.log(result); // 36 is logged
```

The reason you may want to use this tool is for large operations that don't give up the thread of execution. 
For example:

```typescript
const bigOperation = function() {
  let x = 0;
  const target = 999999999999;
  while(x < target) x++;
  return "done!";
}

// Will likely cause your browser to become unresponsive:
bigOperation();

// Wont cause any issues:
workerBigOperation = miniWorker(bigOperation)
workerBigOperation();
```