// The code that Node 26 runs for import() without loader hooks, which a program that calls import()
// runs as its own, so that each step that awaits takes the jobs that Node's takes: a port of
// importModuleDynamicallyCallback (lib/internal/modules/esm/utils.js), ModuleLoader's import and
// getOrCreateModuleJob (esm/loader.js), ModuleJob's syncLink, #instantiate, and run
// (esm/module_job.js), and SafePromiseAllReturnVoid (per_context/primordials.js). The host's
// functions that it takes load a module and its requests, link and evaluate one, and give one's
// namespace, as JS.tla's module semantics do, which a module index names, and give the error that
// Node's resolution throws for a specifier, where the files alone decide it, whose class
// makeNodeErrorWithCode (lib/internal/errors.js) makes, which the port writes as Node does, and
// whose stack, which V8 writes with Node's frames, tla-ts can't read.
export const NODE_IMPORT = `(function (hostLoad, hostDependencies, hostIsInstantiated, hostInstantiate, hostEvaluate, hostNamespace, hostFailure, hostUntrace) {
  "use strict";
  // Node's primordials: the built-ins as the realm first has them, which the program's code can't
  // replace.
  const uncurryThis = Function.prototype.bind.bind(Function.prototype.call);
  const SafePromise = Promise;
  const PromiseResolve = Promise.resolve.bind(Promise);
  const PromisePrototypeThen = uncurryThis(Promise.prototype.then);
  const SafeMap = Map;
  const MapPrototypeGet = uncurryThis(Map.prototype.get);
  const MapPrototypeSet = uncurryThis(Map.prototype.set);
  const SafeSet = Set;
  const SetPrototypeHas = uncurryThis(Set.prototype.has);
  const SetPrototypeAdd = uncurryThis(Set.prototype.add);
  const ArrayPrototypeMap = uncurryThis(Array.prototype.map);
  const ArrayPrototypePush = uncurryThis(Array.prototype.push);
  const ObjectDefineProperty = Object.defineProperty;
  const SafeError = Error;
  const SafeTypeError = TypeError;
  const resolvedPromise = PromiseResolve();
  const kIsNodeError = Symbol('kIsNodeError');
  // getMessage for a message that a function makes, which hostFailure gives with the url that
  // the function sets as its own property (setOwnProperty of lib/internal/util.js), if any.
  const getMessage = (key, args, self) => {
    if (args[1] !== undefined) {
      ObjectDefineProperty(self, 'url', {
        __proto__: null,
        configurable: true,
        enumerable: true,
        value: args[1],
        writable: true,
      });
    }
    return args[0];
  };
  const makeNodeErrorWithCode = (Base, key) => {
      class NodeError extends Base {
        code = key;

        constructor(...args) {
          super();
          ObjectDefineProperty(this, 'message', {
            __proto__: null,
            value: getMessage(key, args, this),
            enumerable: false,
            writable: true,
            configurable: true,
          });
        }

        // This is a workaround for wpt tests that expect that the error
        // constructor has a \`name\` property of the base class.
        get ['constructor']() {
          return Base;
        }

        get [kIsNodeError]() {
          return true;
        }

        toString() {
          return \`\${this.name} [\${key}]: \${this.message}\`;
        }
      }
      return NodeError;
  };
  // Each code's class, made once, as Node makes them.
  const nodeErrors = new SafeMap();
  const getNodeError = (failure) => {
    const key = failure[1];
    if (MapPrototypeGet(nodeErrors, key) === undefined) {
      MapPrototypeSet(nodeErrors, key, makeNodeErrorWithCode(failure[0] === 'TypeError' ? SafeTypeError : SafeError, key));
    }
    const NodeError = MapPrototypeGet(nodeErrors, key);
    return hostUntrace(new NodeError(failure[2], failure[3]));
  };
  const SafePromiseAllReturnVoid = (promises, mapFn) =>
    new SafePromise((resolve, reject) => {
      let pendingPromises = promises.length;
      if (pendingPromises === 0) resolve();
      const onFulfilled = () => {
        if (--pendingPromises === 0) {
          resolve();
        }
      };
      for (let i = 0; i < promises.length; i++) {
        const promise = mapFn != null ? mapFn(promises[i], i) : promises[i];
        PromisePrototypeThen(PromiseResolve(promise), onFulfilled, reject);
      }
    });
  const loadCache = new SafeMap();
  const getOrCreateModuleJob = (module) => {
    const cached = MapPrototypeGet(loadCache, module);
    if (cached !== undefined) return cached;
    const job = { module, linked: undefined, instantiated: hostIsInstantiated(module) ? resolvedPromise : undefined };
    MapPrototypeSet(loadCache, module, job);
    job.linked = ArrayPrototypeMap(hostDependencies(module), getOrCreateModuleJob);
    return job;
  };
  const asyncInstantiate = async (job) => {
    const jobsInGraph = new SafeSet();
    // The jobs in the order that the set has them, which a SafeSet iterates without the program's
    // iterators.
    const jobsInOrder = [];
    const addJobsToDependencyGraph = async (moduleJob) => {
      if (SetPrototypeHas(jobsInGraph, moduleJob)) {
        return;
      }
      SetPrototypeAdd(jobsInGraph, moduleJob);
      ArrayPrototypePush(jobsInOrder, moduleJob);
      const dependencyJobs = moduleJob.linked;
      return SafePromiseAllReturnVoid(dependencyJobs, addJobsToDependencyGraph);
    };
    await addJobsToDependencyGraph(job);
    hostInstantiate(job.module);
    for (let i = 0; i < jobsInOrder.length; i++) {
      jobsInOrder[i].instantiated = resolvedPromise;
    }
  };
  const instantiate = (job) => {
    if (job.instantiated === undefined) {
      job.instantiated = asyncInstantiate(job);
    }
    return job.instantiated;
  };
  const run = async (job) => {
    await instantiate(job);
    try {
      await hostEvaluate(job.module);
    } catch (e) {
      throw e;
    }
    return { module: job.module };
  };
  // ModuleLoader's import, an async method whose body is onImport.tracePromise's function, which
  // the channel calls itself where nothing subscribes to it.
  const loaderImport = async (specifier, referrer, type) => tracedImport(specifier, referrer, type);
  const tracedImport = async (specifier, referrer, type) => {
    let moduleJob;
    try {
      const failure = hostFailure(referrer, specifier);
      if (failure !== undefined) throw getNodeError(failure);
      moduleJob = await getOrCreateModuleJob(hostLoad(referrer, specifier, type));
    } catch (e) {
      throw e;
    }
    const { module } = await run(moduleJob);
    return hostNamespace(module);
  };
  return async function importModuleDynamicallyCallback(specifier, referrer, type) {
    return loaderImport(specifier, referrer, type);
  };
})`;
