# WorkerB

WorkerB is a minimal TypeScript library to make using Web Workers as easy as possible. Instead of having to create a seperate file for code that is run in a different thread, workers can be made inline with their own functions and be communicated with asynchronously.

# Usage

## Installation

TBD. This was a tiny script I made in college, now it's seven years later and I migrated it to TypeScript and made it simpler. Later this week I'll make it usable. For now, feel free to copy-paste the src.
    
## Usage example:

    import { miniWorker} from './WorkerB';

    const multiplier = await miniWorker((x: number, y:number) => {
      return x * y;
    });
    
    // result becomes 36
    const result = await multiplier(12,3);

    const bigOperation = (bigNumber: number) => {
      let x = 0;
      while(x < bigNumber) x++;
      return "done!";
    }

    // Will likely cause your browser to become unresponsive:
    bigOperation(1000000000000000);

    // Wont cause any issues:
    workerBigOperation = await miniWorker(bigOperation)
    workerBigOperation(1000000000000000);
