/*---
description: Ported from TypeScript's tests/cases/compiler/functionOverloads30.ts.
outcome: success
source: tests/cases/compiler/functionOverloads30.ts
---*/
// @target: es2015
function foo(bar:string):string;
function foo(bar:number):number;
function foo(bar:any):any{ return bar }
var x = foo('bar');

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
