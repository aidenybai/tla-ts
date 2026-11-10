/*---
description: Ported from TypeScript's tests/cases/compiler/collisionSuperAndLocalVarInProperty.ts.
outcome: success
source: tests/cases/compiler/collisionSuperAndLocalVarInProperty.ts
---*/
// @target: es2015
var _super = 10; // No Error
class Foo {
   public prop1 = {
        doStuff: () => {
            var _super = 10; // No error
        }
    }
    public _super = 10; // No error
}
class b extends Foo {
    public prop2 = {
        doStuff: () => {
            var _super = 10; // Should be error 
        }
    }
    public _super = 10; // No error
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
