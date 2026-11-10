/*---
description: Ported from TypeScript's tests/cases/compiler/superHasMethodsFromMergedInterface.ts.
outcome: success
source: tests/cases/compiler/superHasMethodsFromMergedInterface.ts
---*/
// @target: es2015
class C { m1() { } }
interface C { m2(): void }
class Sub extends C {
    m3() {
        super.m2();
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
