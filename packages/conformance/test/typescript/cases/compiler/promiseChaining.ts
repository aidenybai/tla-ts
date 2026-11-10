/*---
description: Ported from TypeScript's tests/cases/compiler/promiseChaining.ts.
outcome: success
source: tests/cases/compiler/promiseChaining.ts
---*/
// @target: es2015
class Chain<T> {
    constructor(public value: T) { }
    then<S>(cb: (x: T) => S): Chain<S> {
        var result = cb(this.value);
        // should get a fresh type parameter which each then call
        var z = this.then(x => result)/*S*/.then(x => "abc")/*string*/.then(x => x.length)/*number*/; // No error
        return new Chain(result);
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
