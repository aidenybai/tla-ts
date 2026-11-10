/*---
description: Ported from TypeScript's tests/cases/compiler/generatorES6_1.ts.
outcome: success
source: tests/cases/compiler/generatorES6_1.ts
---*/
// @strict: false
// @target: es6
function* foo() {
    yield
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
