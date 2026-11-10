/*---
description: Ported from TypeScript's tests/cases/compiler/typeGuardNarrowsIndexedAccessOfKnownProperty4.ts.
outcome: success
source: tests/cases/compiler/typeGuardNarrowsIndexedAccessOfKnownProperty4.ts
---*/
// @target: es2015
// @strict: true

class Foo {
    x: number | undefined;

    constructor() {
        this.x = 5;

        this.x;    // number
        this['x']; // number

        const key = 'x';
        this[key]; // number
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
