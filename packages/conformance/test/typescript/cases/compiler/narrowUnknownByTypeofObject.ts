/*---
description: Ported from TypeScript's tests/cases/compiler/narrowUnknownByTypeofObject.ts.
outcome: success
source: tests/cases/compiler/narrowUnknownByTypeofObject.ts
---*/
// @target: es2015
// @strictNullChecks: true
function foo(x: unknown) {
    if (typeof x === "object") {
        x
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
