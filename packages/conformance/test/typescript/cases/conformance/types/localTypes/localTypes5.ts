/*---
description: Ported from TypeScript's tests/cases/conformance/types/localTypes/localTypes5.ts.
outcome: success
source: tests/cases/conformance/types/localTypes/localTypes5.ts
---*/
// @target: es2015
function foo<A>() {
    class X {
        m<B, C>() {
            return (function <D>() {
                class Y<E> {
                }
                return new Y<string>();
            })<Date>();
        }
    }
    var x = new X();
    return x.m<number, boolean>();
}
var x = foo<void>();

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
