/*---
description: Ported from TypeScript's tests/cases/compiler/inheritanceStaticFuncOverridingPropertyOfFuncType.ts.
outcome: success
source: tests/cases/compiler/inheritanceStaticFuncOverridingPropertyOfFuncType.ts
---*/
// @target: es2015
// @strict: false
class a {
    static x: () => string;
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
