/*---
description: Ported from TypeScript's tests/cases/compiler/declarationEmitTupleRestSignatureLeadingVariadic.ts.
outcome: success
source: tests/cases/compiler/declarationEmitTupleRestSignatureLeadingVariadic.ts
---*/
// @target: es2015
// @declaration: true
const f = <TFirstArgs extends any[], TLastArg>(...args: [...TFirstArgs, TLastArg]): void => {};

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
