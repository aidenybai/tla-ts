/*---
description: Ported from TypeScript's tests/cases/conformance/types/typeParameters/typeArgumentLists/wrappedAndRecursiveConstraints2.ts.
outcome: success
source: tests/cases/conformance/types/typeParameters/typeArgumentLists/wrappedAndRecursiveConstraints2.ts
---*/
// @target: es2015
class C<T extends C<T>> { // error
    constructor(x: T) { }
}

var c = new C(1);
var c = new C(new C('')); // error

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
