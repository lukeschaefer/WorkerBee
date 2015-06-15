// WORKER
if(typeof document !== "undefined"){
	function WorkerB(init){
		this.worker = new Worker('WorkerB.js#newWorker');
		this.func = false;
		this._cb = {};
		this.callFunction = function(name, args){
			var i = args.length;
			var args2 = [];		
			while(i--)
				args2.push(args[i]);		
			
			this.worker.postMessage(name);	
			this.worker.postMessage(args2);
		}; 
			
		this.method = function(name, func, cb){
			this.callFunction('method', [name, func.toString()]);
			this[name] = function(){
				this.callFunction(name,arguments);		
			}.bind(this);	
			this._cb[name] = cb ? cb : false;
		}.bind(this); 
		
		this.worker.addEventListener('message', function(e){ 
			if(!this.func)
				this.func = e.data;
			else{
				if(this._cb[this.func])
					this._cb[this.func](e.data);	
				this.func = false;
			}
		}.bind(this));
		
		if(init){
			this.method('init', init);
			var args = arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments).sort();
			args.pop();
			this.init.apply(this, args);	
		}
	}
}else{	 
	WorkerB = function(){
		this.func = false;
		this.debug = false;
		this.method = function(strfunc, name){
			eval('var func = '+strfunc);
			
			this[name] = function(){			
				var response = func.apply(this,arguments);
				self.postMessage(name);
				self.postMessage(response);
				this.func = false;
			}
		}
	}

	
	WorkerB.prototype.loadLibrary = function() {
		importScripts().call(arguments);
	}

	worker = new WorkerB();

	self.addEventListener('message', function(e){
		if(worker.func === false){
			worker.func = e.data;
			if(!worker[worker.func]) 
				console.log("ERROR! FUNCTION NOT DEFINED!");
		}else{
			var func = worker.func;
			worker.func = false;
			var args = [];
			for(var i in e.data){
				args.push(e.data[i]);
			}
			//if(worker.debug) console.log("Calling " + func + ".");
			if(worker[func])
				worker[func].apply(worker, args);
			else
				console.log("ERROR! FUNCTION NOT DEFINED!");
			
		}
	}); 
}