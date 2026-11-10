/*---
description: Ported from TypeScript's tests/cases/compiler/anyIsAssignableToObject.ts.
outcome: success
source: tests/cases/compiler/anyIsAssignableToObject.ts
---*/
// @target: es2015
interface P {
    p: {};
}

interface Q extends P { // Check assignability here. Any is assignable to {}
    p: any;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
