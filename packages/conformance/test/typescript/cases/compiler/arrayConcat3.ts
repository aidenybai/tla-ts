/*---
description: Ported from TypeScript's tests/cases/compiler/arrayConcat3.ts.
outcome: success
source: tests/cases/compiler/arrayConcat3.ts
---*/
// @target: es2015
// @strictFunctionTypes: true
// TODO: remove lib hack when https://github.com/Microsoft/TypeScript/issues/20454 is fixed
type Fn<T extends object> = <U extends T>(subj: U) => U
function doStuff<T extends object, T1 extends T>(a: Array<Fn<T>>, b: Array<Fn<T1>>) {
    b.concat(a);
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
