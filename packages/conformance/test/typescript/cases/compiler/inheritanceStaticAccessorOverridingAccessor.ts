/*---
description: Ported from TypeScript's tests/cases/compiler/inheritanceStaticAccessorOverridingAccessor.ts.
outcome: success
source: tests/cases/compiler/inheritanceStaticAccessorOverridingAccessor.ts
---*/
// @target: es2015
// @strict: false
class a {
    static get x() {
        return "20";
    }
    static set x(aValue: string) {

    }
}

class b extends a {
    static get x() {
        return "20";
    }
    static set x(aValue: string) {

    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
