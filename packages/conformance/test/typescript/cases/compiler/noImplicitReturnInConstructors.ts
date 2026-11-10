/*---
description: Ported from TypeScript's tests/cases/compiler/noImplicitReturnInConstructors.ts.
outcome: success
source: tests/cases/compiler/noImplicitReturnInConstructors.ts
---*/
// @target: es2015
// @noImplicitReturns: true
class C {
  constructor() {
    return;
  }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
