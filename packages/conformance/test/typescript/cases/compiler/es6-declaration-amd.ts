/*---
description: Ported from TypeScript's tests/cases/compiler/es6-declaration-amd.ts.
outcome: success
source: tests/cases/compiler/es6-declaration-amd.ts
---*/
// @target: ES6
// @sourcemap: false
// @declaration: true
// @module: amd

class A
{
    constructor ()
    {

    }

    public B()
    {
        return 42;
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
