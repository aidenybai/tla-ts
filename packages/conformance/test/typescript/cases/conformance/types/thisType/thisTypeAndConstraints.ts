/*---
description: Ported from TypeScript's tests/cases/conformance/types/thisType/thisTypeAndConstraints.ts.
outcome: success
source: tests/cases/conformance/types/thisType/thisTypeAndConstraints.ts
---*/
// @target: es2015
class A {
    self() {
        return this;
    }
}

function f<T extends A>(x: T) {
    function g<U extends T>(x: U) {
        x = x.self();
    }
    x = x.self();
}

class B<T extends A> {
    foo(x: T) {
        x = x.self();
    }
    bar<U extends T>(x: U) {
        x = x.self();
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
