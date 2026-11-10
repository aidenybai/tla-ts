/*---
description: Ported from TypeScript's tests/cases/conformance/salsa/constructorNameInObjectLiteralAccessor.ts.
outcome: success
source: tests/cases/conformance/salsa/constructorNameInObjectLiteralAccessor.ts
---*/
// @target: esnext
const c1 = {
    get constructor() { return },
    set constructor(value) {}
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
