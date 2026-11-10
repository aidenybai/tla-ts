/*---
description: Ported from TypeScript's tests/cases/compiler/functionOverloads16.ts.
outcome: success
source: tests/cases/compiler/functionOverloads16.ts
---*/
// @target: es2015
// @strict: false
function foo(foo:{a:string;}):string;
function foo(foo:{a:string;}):number;
function foo(foo:{a:string; b?:number;}):any { return "" }

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
