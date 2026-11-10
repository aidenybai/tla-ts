/*---
description: Ported from TypeScript's tests/cases/compiler/thisTypeAsConstraint.ts.
outcome: success
source: tests/cases/compiler/thisTypeAsConstraint.ts
---*/
// @target: es2015
class C {
  public m<T extends this>() {
  }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
