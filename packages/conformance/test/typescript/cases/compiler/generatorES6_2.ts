/*---
description: Ported from TypeScript's tests/cases/compiler/generatorES6_2.ts.
outcome: success
source: tests/cases/compiler/generatorES6_2.ts
---*/
// @target: es6
class C {
    public * foo() {
        yield 1
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
