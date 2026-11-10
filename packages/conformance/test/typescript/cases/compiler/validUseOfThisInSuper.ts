/*---
description: Ported from TypeScript's tests/cases/compiler/validUseOfThisInSuper.ts.
outcome: success
source: tests/cases/compiler/validUseOfThisInSuper.ts
---*/
// @target: es2015
class Base {
    constructor(public b: Base) {
    }
}
class Super extends Base {
    constructor() {
        super((() => this)()); // ok since this is not the case: The constructor declares parameter properties or the containing class declares instance member variables with initializers.
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
