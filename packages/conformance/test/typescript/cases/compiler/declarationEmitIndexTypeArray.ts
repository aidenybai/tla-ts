/*---
description: Ported from TypeScript's tests/cases/compiler/declarationEmitIndexTypeArray.ts.
outcome: success
source: tests/cases/compiler/declarationEmitIndexTypeArray.ts
---*/
// @target: es2015
// @declaration: true
function doSomethingWithKeys<T>(...keys: (keyof T)[]) { }

const utilityFunctions = {
  doSomethingWithKeys
};

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
