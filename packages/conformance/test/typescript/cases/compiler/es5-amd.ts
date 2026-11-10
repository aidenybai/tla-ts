/*---
description: Ported from TypeScript's tests/cases/compiler/es5-amd.ts.
outcome: success
source: tests/cases/compiler/es5-amd.ts
---*/
// @target: ES5, ES2015
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
