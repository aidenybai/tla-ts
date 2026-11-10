/*---
description: Ported from TypeScript's tests/cases/compiler/functionOverloads33.ts.
outcome: success
source: tests/cases/compiler/functionOverloads33.ts
---*/
// @target: es2015
function foo(bar:string):string;
function foo(bar:any):number;
function foo(bar:any):any{ return bar }
var x = foo(5);

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
