/*---
description: Ported from TypeScript's tests/cases/conformance/expressions/optionalChaining/callChain/superMethodCall.ts.
outcome: success
source: tests/cases/conformance/expressions/optionalChaining/callChain/superMethodCall.ts
---*/
// @strict: true
// @target: ES6
class Base {
    method?() { }
}

class Derived extends Base {
    method() {
        return super.method?.();
    }

    async asyncMethod() {
        return super.method?.();
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
