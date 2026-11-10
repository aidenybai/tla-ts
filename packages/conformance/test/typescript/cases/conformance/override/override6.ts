/*---
description: Ported from TypeScript's tests/cases/conformance/override/override6.ts.
outcome: success
source: tests/cases/conformance/override/override6.ts
---*/
// @target: es2015
// @declaration: true
// @noImplicitOverride: true
class B {
    public baz: number = 1;
    constructor(public foo: string, public bar: number) {

    }
}

class D extends B {
    public bar: number = 1
    constructor(public foo: string, public baz: number) {
        super(foo, 42)
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
