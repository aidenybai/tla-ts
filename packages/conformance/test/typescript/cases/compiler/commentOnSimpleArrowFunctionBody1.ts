/*---
description: Ported from TypeScript's tests/cases/compiler/commentOnSimpleArrowFunctionBody1.ts.
outcome: success
source: tests/cases/compiler/commentOnSimpleArrowFunctionBody1.ts
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
