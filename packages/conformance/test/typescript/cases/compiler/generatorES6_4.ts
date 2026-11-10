/*---
description: Ported from TypeScript's tests/cases/compiler/generatorES6_4.ts.
outcome: success
source: tests/cases/compiler/generatorES6_4.ts
---*/
// @target: es6
var v = { 
   *foo() {
       yield 0
   }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
