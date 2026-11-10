/*---
description: Ported from TypeScript's tests/cases/compiler/superPropertyAccess1.ts.
outcome: success
source: tests/cases/compiler/superPropertyAccess1.ts
---*/
// @target: es5, es2015
class C {
    public foo() { }
    public get x() {
        return 1;
    }

    public bar() { }
}

class D extends C {
    public foo() {
        super.bar();
        super.x;  // error
    }    

    constructor() {
        super();
        super.bar();
        super.x;  // error
    }

    public get y() {
        super.bar();
        super.x; // error
        return 1;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
