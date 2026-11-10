/*---
description: Ported from TypeScript's tests/cases/compiler/generatorES6_3.ts.
outcome: success
source: tests/cases/compiler/generatorES6_3.ts
---*/
// @target: es6
var v = function*() {
    yield 0
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
