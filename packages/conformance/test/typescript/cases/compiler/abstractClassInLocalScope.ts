/*---
description: Ported from TypeScript's tests/cases/compiler/abstractClassInLocalScope.ts.
outcome: success
source: tests/cases/compiler/abstractClassInLocalScope.ts
---*/
// @target: es2015
(() => {
    abstract class A {}
    class B extends A {}
    new B();
    return A;
})();

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
