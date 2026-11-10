/*---
description: Ported from TypeScript's tests/cases/compiler/functionOverloads26.ts.
outcome: success
source: tests/cases/compiler/functionOverloads26.ts
---*/
// @target: es2015
function foo():string;
function foo(bar:string):number;
function foo(bar?:any):any{ return '' }
var x = foo('baz');

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
