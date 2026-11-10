/*---
description: Ported from TypeScript's tests/cases/compiler/es6-amd.ts.
outcome: success
source: tests/cases/compiler/es6-amd.ts
---*/
// @target: ES6
// @sourcemap: false
// @declaration: false
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
