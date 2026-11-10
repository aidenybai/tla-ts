/*---
description: Ported from TypeScript's tests/cases/compiler/contextualTypingTwoInstancesOfSameTypeParameter.ts.
outcome: success
source: tests/cases/compiler/contextualTypingTwoInstancesOfSameTypeParameter.ts
---*/
// @target: es2015
// @strict: false
function f6<T>(x: (a: T) => T) {
    return null;
} 
f6(x => f6(y => x = y));

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
