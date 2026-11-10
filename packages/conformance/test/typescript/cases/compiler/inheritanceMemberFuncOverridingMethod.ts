/*---
description: Ported from TypeScript's tests/cases/compiler/inheritanceMemberFuncOverridingMethod.ts.
outcome: success
source: tests/cases/compiler/inheritanceMemberFuncOverridingMethod.ts
---*/
// @target: es2015
// @strict: false
class a {
    x() {
        return "10";
    }
}

class b extends a {
    x() {
        return "20";
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
