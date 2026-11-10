/*---
description: Ported from TypeScript's tests/cases/compiler/functionOverloads39.ts.
outcome: success
source: tests/cases/compiler/functionOverloads39.ts
---*/
// @target: es2015
function foo(bar:{a:number;}[]):string;
function foo(bar:{a:boolean;}[]):number;
function foo(bar:{a:any;}[]):any{ return bar }
var x = foo([{a:true}]);

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
