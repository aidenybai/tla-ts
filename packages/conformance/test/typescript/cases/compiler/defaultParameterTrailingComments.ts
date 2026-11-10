/*---
description: Ported from TypeScript's tests/cases/compiler/defaultParameterTrailingComments.ts.
outcome: success
source: tests/cases/compiler/defaultParameterTrailingComments.ts
---*/
// @target: es2015
class C {
    constructor(defaultParam: boolean = false /* Emit only once*/) {}
}

function foo(defaultParam = 10 /*emit only once*/) {}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
