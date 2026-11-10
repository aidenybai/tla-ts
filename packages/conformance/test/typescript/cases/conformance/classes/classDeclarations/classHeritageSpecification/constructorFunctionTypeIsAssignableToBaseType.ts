/*---
description: Ported from TypeScript's tests/cases/conformance/classes/classDeclarations/classHeritageSpecification/constructorFunctionTypeIsAssignableToBaseType.ts.
outcome: success
source: tests/cases/conformance/classes/classDeclarations/classHeritageSpecification/constructorFunctionTypeIsAssignableToBaseType.ts
---*/
// @target: es2015
class Base {
    static foo: {
        bar: Object;
    }
}

class Derived extends Base {
    // ok
    static foo: {
        bar: number;
    }
}

class Derived2 extends Base {
    // ok, use assignability here
    static foo: {
        bar: any;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
