/*---
description: Ported from TypeScript's tests/cases/compiler/recursiveFunctionTypes1.ts.
outcome: success
source: tests/cases/compiler/recursiveFunctionTypes1.ts
---*/
// @target: es2015
class C {
     static g(t: typeof C.g){ }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
