/*---
description: Ported from TypeScript's tests/cases/compiler/classDeclaredBeforeClassFactory.ts.
outcome: success
source: tests/cases/compiler/classDeclaredBeforeClassFactory.ts
---*/
// @target: es2015
// Should be OK due to hoisting
class Derived extends makeBaseClass() {}

function makeBaseClass() {
    return class Base {};
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
