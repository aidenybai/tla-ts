/*---
description: Ported from TypeScript's tests/cases/conformance/es6/yieldExpressions/generatorInAmbientContext5.ts.
outcome: success
source: tests/cases/conformance/es6/yieldExpressions/generatorInAmbientContext5.ts
---*/
//@target: ES6
//@declaration: true
class C {
    *generator(): any { }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
