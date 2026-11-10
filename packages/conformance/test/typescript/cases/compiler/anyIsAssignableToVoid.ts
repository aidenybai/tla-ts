/*---
description: Ported from TypeScript's tests/cases/compiler/anyIsAssignableToVoid.ts.
outcome: success
source: tests/cases/compiler/anyIsAssignableToVoid.ts
---*/
// @target: es2015
interface P {
    p: void;
}

interface Q extends P { // check assignability here. any is assignable to void.
    p: any;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
