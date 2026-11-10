/*---
description: Ported from TypeScript's tests/cases/compiler/collisionSuperAndLocalVarInConstructor.ts.
outcome: success
source: tests/cases/compiler/collisionSuperAndLocalVarInConstructor.ts
---*/
// @target: es2015
var _super = 10; // No Error
class Foo {
    constructor() {
        var _super = 10; // No error
    }
}
class b extends Foo {
    constructor() {
        super();
        var _super = 10; // Should be error 
    }
}
class c extends Foo {
    constructor() {
        super();
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
