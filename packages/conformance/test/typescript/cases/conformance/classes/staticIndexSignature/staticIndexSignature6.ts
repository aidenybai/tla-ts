/*---
description: Ported from TypeScript's tests/cases/conformance/classes/staticIndexSignature/staticIndexSignature6.ts.
outcome: success
source: tests/cases/conformance/classes/staticIndexSignature/staticIndexSignature6.ts
---*/
// @target: es2015
// @strict: true

function foo () {
    return class<T> {
        static [s: string]: number
        static [s: number]: 42

        foo(v: T) { return v }
    }
}

const C = foo()
C.a;
C.a = 1;
C[2];
C[2] = 42;

const c = new C<number>();
c.foo(1);

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
