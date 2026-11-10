/*---
description: Ported from TypeScript's tests/cases/conformance/types/typeParameters/typeArgumentLists/wrappedAndRecursiveConstraints.ts.
outcome: success
source: tests/cases/conformance/types/typeParameters/typeArgumentLists/wrappedAndRecursiveConstraints.ts
---*/
// @target: es2015
// no errors expected

class C<T extends Date> {
    constructor(public data: T) { }
    foo<U extends T>(x: U) {
        return x;
    }
}

interface Foo extends Date {
    foo: string;
}

var y: Foo = {} as Foo;
var c = new C(y);
var r = c.foo(y);

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
