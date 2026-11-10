/*---
description: Ported from TypeScript's tests/cases/conformance/async/es6/asyncArrowFunction/asyncArrowFunctionCapturesThis_es6.ts.
outcome: success
source: tests/cases/conformance/async/es6/asyncArrowFunction/asyncArrowFunctionCapturesThis_es6.ts
---*/
// @target: ES6
// @noEmitHelpers: true
class C {
   method() {
      var fn = async () => await this;      
   }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
