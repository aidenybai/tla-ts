/*---
description: Ported from TypeScript's tests/cases/compiler/genericInstanceOf.ts.
outcome: success
source: tests/cases/compiler/genericInstanceOf.ts
---*/
// @target: es2015
interface F {
    (): number;
}

class C<T> {
    constructor(public a: T, public b: F) {}
    foo() {
        if (this.a instanceof this.b) {
        }
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
