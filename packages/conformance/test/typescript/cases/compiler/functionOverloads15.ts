/*---
description: Ported from TypeScript's tests/cases/compiler/functionOverloads15.ts.
outcome: success
source: tests/cases/compiler/functionOverloads15.ts
---*/
// @target: es2015
// @strict: false
function foo(foo:{a:string; b:number;}):string;
function foo(foo:{a:string; b:number;}):number;
function foo(foo:{a:string; b?:number;}):any { return "" }

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
