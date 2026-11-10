/*---
description: Ported from TypeScript's tests/cases/compiler/properties.ts.
outcome: success
source: tests/cases/compiler/properties.ts
---*/
// @target: ES5, ES2015
// @sourcemap: true
// @declaration: true

class MyClass
{
    public get Count(): number
    {
        return 42;
    }

    public set Count(value: number)
    {
        //
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
