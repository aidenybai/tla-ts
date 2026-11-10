/*---
description: Ported from TypeScript's tests/cases/compiler/inferredRestTypeFixedOnce.ts.
outcome: success
source: tests/cases/compiler/inferredRestTypeFixedOnce.ts
---*/
// @target: es2015
function wrap<Args extends unknown[]>(_: (...args: Args) => void) {}
wrap(({ cancelable } = {}) => {});

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
