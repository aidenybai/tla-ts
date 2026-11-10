/*---
description: Ported from TypeScript's tests/cases/conformance/classes/constructorDeclarations/classConstructorAccessibility4.ts.
outcome: success
source: tests/cases/conformance/classes/constructorDeclarations/classConstructorAccessibility4.ts
---*/
// @target: es2015
// @declaration: true

class A {
    private constructor() { }

    method() {
        class B {
            method() {
                new A(); // OK
            }
        }

        class C extends A { // OK
        }
    }
}

class D {
    protected constructor() { }

    method() {
        class E {
            method() {
                new D(); // OK
            }
        }

        class F extends D { // OK
        }
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
