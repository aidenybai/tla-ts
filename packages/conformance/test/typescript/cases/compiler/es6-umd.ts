/*---
description: Ported from TypeScript's tests/cases/compiler/es6-umd.ts.
outcome: success
source: tests/cases/compiler/es6-umd.ts
---*/
// @target: ES6
// @sourcemap: false
// @declaration: false
// @module: umd

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
