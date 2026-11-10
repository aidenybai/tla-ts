/*---
description: Ported from TypeScript's tests/cases/compiler/out-flag.ts.
outcome: success
source: tests/cases/compiler/out-flag.ts
---*/
// @target: ES5, ES2015
// @sourcemap: true
// @declaration: true
// @module: commonjs
//// @outFile: bin\
// @removeComments: false

// my class comments
class MyClass
{
    // my function comments
    public Count(): number
    {
        return 42;
    }

    public SetCount(value: number)
    {
        //
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
