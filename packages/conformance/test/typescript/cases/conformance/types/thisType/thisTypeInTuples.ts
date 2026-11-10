/*---
description: Ported from TypeScript's tests/cases/conformance/types/thisType/thisTypeInTuples.ts.
outcome: success
source: tests/cases/conformance/types/thisType/thisTypeInTuples.ts
---*/
// @target: es2015
interface Array<T> {
    slice(): this;
}

let t: [number, string] = [42, "hello"];
let a = t.slice();
let b = t.slice(1);
let c = t.slice(0, 1);

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
