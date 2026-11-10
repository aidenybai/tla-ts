/*---
description: Ported from TypeScript's tests/cases/conformance/expressions/optionalChaining/callChain/thisMethodCall.ts.
outcome: success
source: tests/cases/conformance/expressions/optionalChaining/callChain/thisMethodCall.ts
---*/
// @strict: true
// @target: es6
class C {
    method?() {}
    other() {
        this.method?.();
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
