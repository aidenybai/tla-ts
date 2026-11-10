/*---
description: Ported from TypeScript's tests/cases/conformance/async/es2017/asyncArrowFunction/asyncArrowFunctionCapturesThis_es2017.ts.
outcome: success
source: tests/cases/conformance/async/es2017/asyncArrowFunction/asyncArrowFunctionCapturesThis_es2017.ts
---*/
// @target: es2017
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
