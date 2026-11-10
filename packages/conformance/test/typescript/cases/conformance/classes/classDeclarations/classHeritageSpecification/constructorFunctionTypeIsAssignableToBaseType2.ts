/*---
description: Ported from TypeScript's tests/cases/conformance/classes/classDeclarations/classHeritageSpecification/constructorFunctionTypeIsAssignableToBaseType2.ts.
outcome: success
source: tests/cases/conformance/classes/classDeclarations/classHeritageSpecification/constructorFunctionTypeIsAssignableToBaseType2.ts
---*/
// @target: es2015
// the constructor function itself does not need to be a subtype of the base type constructor function

class Base {
    static foo: {
        bar: Object;
    }
    constructor(x: Object) {
    }
}

class Derived extends Base {
    // ok
    static foo: {
        bar: number;
    }

    constructor(x: number) {
        super(x);
    }
}

class Derived2 extends Base {   
    static foo: {
        bar: number;
    }

    // ok, not enforcing assignability relation on this
    constructor(x: any) {
        super(x);
        return 1;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
