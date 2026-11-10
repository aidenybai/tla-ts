/*---
description: Ported from TypeScript's tests/cases/compiler/lambdaASIEmit.ts.
outcome: success
source: tests/cases/compiler/lambdaASIEmit.ts
---*/
// @target: es2015
// @removeComments: false

function Foo(x: any)
{
}
 
Foo(() =>
    // do something
    127);

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
