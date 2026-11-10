/*---
description: Ported from TypeScript's tests/cases/compiler/unusedLocalsInRecursiveReturn.ts.
outcome: success
source: tests/cases/compiler/unusedLocalsInRecursiveReturn.ts
---*/
// @target: es2015
// @strict: true
// @noEmit: true
// @noUnusedLocals: true

// Test that we unconditionally check return expression, even if we don't need its type.
function recursive(arg: string, other: string) {
    const someLocalVar = arg + other;
    return recursive(someLocalVar, arg);
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
