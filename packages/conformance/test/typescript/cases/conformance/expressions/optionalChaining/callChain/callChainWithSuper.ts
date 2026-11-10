/*---
description: Ported from TypeScript's tests/cases/conformance/expressions/optionalChaining/callChain/callChainWithSuper.ts.
outcome: success
source: tests/cases/conformance/expressions/optionalChaining/callChain/callChainWithSuper.ts
---*/
// @target: *,-es3
// @strict: true
// @noTypesAndSymbols: true

// GH#34952
class Base { method?() {} }
class Derived extends Base {
    method1() { return super.method?.(); }
    method2() { return super["method"]?.(); }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
