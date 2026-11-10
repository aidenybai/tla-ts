/*---
description: Ported from TypeScript's tests/cases/conformance/classes/propertyMemberDeclarations/memberFunctionDeclarations/staticFactory1.ts.
outcome: success
source: tests/cases/conformance/classes/propertyMemberDeclarations/memberFunctionDeclarations/staticFactory1.ts
---*/
// @target: es2015
class Base {
    foo() { return 1; }
    static create() {
        return new this();
    }
}

class Derived extends Base {
    foo() { return 2; }
}
var d = Derived.create(); 

d.foo();

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
