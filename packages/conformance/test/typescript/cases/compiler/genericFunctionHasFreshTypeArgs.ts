/*---
description: Ported from TypeScript's tests/cases/compiler/genericFunctionHasFreshTypeArgs.ts.
outcome: success
source: tests/cases/compiler/genericFunctionHasFreshTypeArgs.ts
---*/
// @target: es2015
function f(p: <T>(x: T) => void) { };
f(x => f(y => x = y));

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
