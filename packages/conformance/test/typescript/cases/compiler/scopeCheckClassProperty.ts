/*---
description: Ported from TypeScript's tests/cases/compiler/scopeCheckClassProperty.ts.
outcome: success
source: tests/cases/compiler/scopeCheckClassProperty.ts
---*/
// @target: es2015
class C {
  constructor() {
    new A().p; // ok
  }
  public x = new A().p; // should also be ok
}
class A {
  public p = '';
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
