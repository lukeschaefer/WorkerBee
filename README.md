# WorkerB

WorkerB is a minimal JavaScript library to make using Web Workers as painless as possible. Instead of having to create a seperate file for code that is run in a different thread, workers can be made inline with their own functions and be communicated with asynchronously. The idea is to consolidate the seperate script, and the logic to interact with that script into one JS object.

# Usage

## Installation

WorkerB has no dependencies - simply include the minified file in your project folder, and import it in a script tag:

    <script src='lib/WorkerB.min.js'></script>
    
## Usage example:

    // Create a new, empty WorkerB
    var worker = new WorkerB();
    
    // Give it a method it can perform asynchronously. This method needs:
      //  A name -> 'countToX'
      //  A function it will perform
      //  The callback that will be called when done
      
    worker.method("countToX", function(x){
        for(var i = 0; i<x; i++){
          continue;
        }
        return i;
    }, function(x){
      console.log('X is ' + x);
    });
    
    // Call the method. Operation is non-blocking, and performed in a seperate thread.
    worker.countToX(34);
    
Every WorkerB is also given a method 'loadScripts()' - which will place a call in the actual worker thread to [importScripts()](https://developer.mozilla.org/en-US/docs/Web/API/WorkerGlobalScope/importScripts). It is used similarly: 

    var worker = new WorkerB();
    worker.loadLibrary('lib/library.js');
