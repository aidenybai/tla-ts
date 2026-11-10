/*---
description: Ported from TypeScript's tests/cases/compiler/inheritanceStaticFuncOverridingMethod.ts.
outcome: success
source: tests/cases/compiler/inheritanceStaticFuncOverridingMethod.ts
---*/
// @target: es2015
// @strict: false
class a {
    static x() {
        return "10";
    }
}

class b extends a {
    static x() {
        return "20";
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
