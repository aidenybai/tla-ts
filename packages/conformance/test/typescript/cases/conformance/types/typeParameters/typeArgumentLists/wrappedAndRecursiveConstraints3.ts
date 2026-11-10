/*---
description: Ported from TypeScript's tests/cases/conformance/types/typeParameters/typeArgumentLists/wrappedAndRecursiveConstraints3.ts.
outcome: success
source: tests/cases/conformance/types/typeParameters/typeArgumentLists/wrappedAndRecursiveConstraints3.ts
---*/
// @target: es2015
// no errors expected

class C<T extends { length: number }> {
    constructor(x: T) { }
    foo<U extends T>(x: U) {
        function bar<V extends U>(x: V) {
            return x;
        }
        return bar;
    }
}

var c = new C({ length: 2 });
var r = c.foo({ length: 3, charAt: (x: number) => { '' } });
var r2 = r('');

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
