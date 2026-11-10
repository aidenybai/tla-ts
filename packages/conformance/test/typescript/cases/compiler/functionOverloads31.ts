/*---
description: Ported from TypeScript's tests/cases/compiler/functionOverloads31.ts.
outcome: success
source: tests/cases/compiler/functionOverloads31.ts
---*/
// @target: es2015
function foo(bar:string):string;
function foo(bar:number):number;
function foo(bar:any):any{ return bar }
var x = foo(5);

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
