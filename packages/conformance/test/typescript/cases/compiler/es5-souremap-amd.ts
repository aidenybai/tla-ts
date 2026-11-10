/*---
description: Ported from TypeScript's tests/cases/compiler/es5-souremap-amd.ts.
outcome: success
source: tests/cases/compiler/es5-souremap-amd.ts
---*/
// @target: ES5, ES2015
// @sourcemap: true
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
