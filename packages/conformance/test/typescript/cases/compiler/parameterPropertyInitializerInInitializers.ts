/*---
description: Ported from TypeScript's tests/cases/compiler/parameterPropertyInitializerInInitializers.ts.
outcome: success
source: tests/cases/compiler/parameterPropertyInitializerInInitializers.ts
---*/
// @target: es2015
class Foo {
    constructor(public x: number, public y: number = x) { }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
