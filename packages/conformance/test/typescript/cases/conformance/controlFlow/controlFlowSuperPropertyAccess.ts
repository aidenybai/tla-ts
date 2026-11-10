/*---
description: Ported from TypeScript's tests/cases/conformance/controlFlow/controlFlowSuperPropertyAccess.ts.
outcome: success
source: tests/cases/conformance/controlFlow/controlFlowSuperPropertyAccess.ts
---*/
// @target: es2015
// @strictNullChecks: true
class B {
    protected m?(): void;
}
class C extends B {
    body() {
        super.m && super.m();
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
