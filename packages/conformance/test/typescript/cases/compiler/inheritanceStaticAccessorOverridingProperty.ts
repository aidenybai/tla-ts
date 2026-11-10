/*---
description: Ported from TypeScript's tests/cases/compiler/inheritanceStaticAccessorOverridingProperty.ts.
outcome: success
source: tests/cases/compiler/inheritanceStaticAccessorOverridingProperty.ts
---*/
// @target: es2015
// @strict: false
class a {
    static x: string;
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
