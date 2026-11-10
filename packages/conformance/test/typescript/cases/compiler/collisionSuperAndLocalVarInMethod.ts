/*---
description: Ported from TypeScript's tests/cases/compiler/collisionSuperAndLocalVarInMethod.ts.
outcome: success
source: tests/cases/compiler/collisionSuperAndLocalVarInMethod.ts
---*/
// @target: es2015
var _super = 10; // No Error
class Foo {
    x() {
        var _super = 10; // No error
    }
}
class b extends Foo {
    public foo() {
        var _super = 10; // Should be error 
    }
}
class c extends Foo {
    public foo() {
        var x = () => {
            var _super = 10; // Should be error
        }
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
