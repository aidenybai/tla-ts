/*---
description: Ported from TypeScript's tests/cases/conformance/types/objectTypeLiteral/callSignatures/typeParameterUsedAsTypeParameterConstraint2.ts.
outcome: success
source: tests/cases/conformance/types/objectTypeLiteral/callSignatures/typeParameterUsedAsTypeParameterConstraint2.ts
---*/
// @target: es2015
// Type parameters are in scope in their own and other type parameter lists
// Nested local functions

function foo<T, U extends T>(x: T, y: U) {
    function bar<V extends T, W extends U>() {
        function baz<X extends W, Y extends V>(a: X, b: Y): T {
            x = y;
            return y;
        }
    }
}

function foo2<U extends T, T>(x: T, y: U) {
    function bar<V extends T, W extends U>() {
        function baz<X extends W, Y extends V>(a: X, b: Y): T {
            x = y;
            return y;
        }
    }
}

var f = function <T, U extends T>(x: T, y: U) {
    function bar<V extends T, W extends U>() {
        var g = function <X extends W, Y extends V>(a: X, b: Y): T {
            x = y;
            return y;
        }
    }
}

var f2 = function <U extends T, T>(x: T, y: U) {
    function bar<V extends T, W extends U>() {
        var g = function baz<X extends W, Y extends V>(a: X, b: Y): T {
            x = y;
            return y;
        }
    }
}

var f3 = <T, U extends T>(x: T, y: U) => {
    function bar<V extends T, W extends U>() {
        var g = <X extends W, Y extends V>(a: X, b: Y): T => {
            x = y;
            return y;
        }
    }
}

var f4 = <U extends T, T>(x: T, y: U) => {
    function bar<V extends T, W extends U>() {
        var g = <X extends W, Y extends V>(a: X, b: Y): T => {
            x = y;
            return y;
        }
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
