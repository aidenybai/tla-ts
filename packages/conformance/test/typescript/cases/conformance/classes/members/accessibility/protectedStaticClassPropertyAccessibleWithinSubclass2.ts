/*---
description: Ported from TypeScript's tests/cases/conformance/classes/members/accessibility/protectedStaticClassPropertyAccessibleWithinSubclass2.ts.
outcome: success
source: tests/cases/conformance/classes/members/accessibility/protectedStaticClassPropertyAccessibleWithinSubclass2.ts
---*/
// @target: es5, es2015
class Base {
    protected static x: string;
    static staticMethod() {
        this.x;         // OK, accessed within their declaring class
    }
}

class Derived1 extends Base {
    static staticMethod1() {
        this.x;         // OK, accessed within a class derived from their declaring class
        super.x;        // Error, x is not public
    }
}

class Derived2 extends Derived1 {
    protected static x: string;
    static staticMethod3() {
        this.x;         // OK, accessed within a class derived from their declaring class
        super.x;        // Error, x is not public
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
