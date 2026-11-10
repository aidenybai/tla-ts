/*---
description: Ported from TypeScript's tests/cases/compiler/circularContextualReturnType.ts.
outcome: success
source: tests/cases/compiler/circularContextualReturnType.ts
---*/
// @target: es2015
// @strict: true

// Repro from #17711

Object.freeze({
    foo() {
        return Object.freeze('a');
    },
});

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
