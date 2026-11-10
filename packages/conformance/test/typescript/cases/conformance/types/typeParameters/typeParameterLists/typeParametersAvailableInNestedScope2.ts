/*---
description: Ported from TypeScript's tests/cases/conformance/types/typeParameters/typeParameterLists/typeParametersAvailableInNestedScope2.ts.
outcome: success
source: tests/cases/conformance/types/typeParameters/typeParameterLists/typeParametersAvailableInNestedScope2.ts
---*/
// @target: es2015
function foo<T, U>(x: T, y: U) {
    function bar<V>(z: V) {
        function baz<W>(a: W) {
            var c: T;
            var d: U;
            var e: V;
        }
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
