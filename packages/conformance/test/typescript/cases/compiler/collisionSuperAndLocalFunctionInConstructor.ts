/*---
description: Ported from TypeScript's tests/cases/compiler/collisionSuperAndLocalFunctionInConstructor.ts.
outcome: success
source: tests/cases/compiler/collisionSuperAndLocalFunctionInConstructor.ts
---*/
// @target: es2015
function _super() { // No error
}
class Foo {
    constructor() {
        function _super() { // No error
        }
    }
}
class b extends Foo {
    constructor() {
        super();
        function _super() { // Should be error
        }
    }
}
class c extends Foo {
    constructor() {
        super();
        var x = () => {
            function _super() { // Should be error
            }
        }
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
