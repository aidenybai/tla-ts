/*---
description: Ported from TypeScript's tests/cases/compiler/functionOverloads28.ts.
outcome: success
source: tests/cases/compiler/functionOverloads28.ts
---*/
// @target: es2015
function foo():string;
function foo(bar:string):number;
function foo(bar?:any):any{ return '' }
var t:any; var x = foo(t);

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
