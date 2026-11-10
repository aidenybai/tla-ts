/*---
description: Ported from TypeScript's tests/cases/compiler/superInCatchBlock1.ts.
outcome: success
source: tests/cases/compiler/superInCatchBlock1.ts
---*/
// @target: es2015
class A {
 m(): void { }
}
class B extends A {
 m() {
  try {
  }
  catch (e) {
   super.m();
  }
 }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
