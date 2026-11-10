/*---
description: Ported from TypeScript's tests/cases/compiler/functionOverloads35.ts.
outcome: success
source: tests/cases/compiler/functionOverloads35.ts
---*/
// @target: es2015
function foo(bar:{a:number;}):number;
function foo(bar:{a:string;}):string;
function foo(bar:{a:any;}):any{ return bar }
var x = foo({a:1});

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
