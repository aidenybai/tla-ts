/*---
description: Ported from TypeScript's tests/cases/compiler/inheritanceMemberAccessorOverridingAccessor.ts.
outcome: success
source: tests/cases/compiler/inheritanceMemberAccessorOverridingAccessor.ts
---*/
// @target: es2015
// @strict: false
class a {
    get x() {
        return "20";
    }
    set x(aValue: string) {

    }
}

class b extends a {
    get x() {
        return "20";
    }
    set x(aValue: string) {

    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
