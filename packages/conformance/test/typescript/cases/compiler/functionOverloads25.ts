/*---
description: Ported from TypeScript's tests/cases/compiler/functionOverloads25.ts.
outcome: success
source: tests/cases/compiler/functionOverloads25.ts
---*/
// @target: es2015
function foo():string;
function foo(bar:string):number;
function foo(bar?:any):any{ return '' };
var x = foo();

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
