/*---
description: Ported from TypeScript's tests/cases/compiler/recursiveGenericSignatureInstantiation.ts.
outcome: success
source: tests/cases/compiler/recursiveGenericSignatureInstantiation.ts
---*/
// @target: es2015
function f6<T>(x: T) {
    return f6(x);
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
