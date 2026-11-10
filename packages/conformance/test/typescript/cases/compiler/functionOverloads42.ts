/*---
description: Ported from TypeScript's tests/cases/compiler/functionOverloads42.ts.
outcome: success
source: tests/cases/compiler/functionOverloads42.ts
---*/
// @target: es2015
function foo(bar:{a:number;}[]):string;
function foo(bar:{a:any;}[]):number;
function foo(bar:{a:any;}[]):any{ return bar }
var x = foo([{a:'s'}]);

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
