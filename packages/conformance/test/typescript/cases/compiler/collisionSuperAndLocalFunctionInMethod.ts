/*---
description: Ported from TypeScript's tests/cases/compiler/collisionSuperAndLocalFunctionInMethod.ts.
outcome: success
source: tests/cases/compiler/collisionSuperAndLocalFunctionInMethod.ts
---*/
// @target: es2015
function _super() { // No error
} 
class Foo {
    x() {
        function _super() { // No error
        } 
    }
    _super() { // No error
    }
}
class b extends Foo {
    public foo() {
        function _super() { // should be error
        } 
    }
    _super() { // No Error
    }
}
class c extends Foo {
    public foo() {
        var x = () => {
            function _super() { // should be error
            } 
        }
    }
    _super() { // No error
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
