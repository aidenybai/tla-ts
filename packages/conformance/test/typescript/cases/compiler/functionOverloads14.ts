/*---
description: Ported from TypeScript's tests/cases/compiler/functionOverloads14.ts.
outcome: success
source: tests/cases/compiler/functionOverloads14.ts
---*/
// @target: es2015
// @strict: false
function foo():{a:number;}
function foo():{a:string;}
function foo():{a:any;} { return {a:1} }

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
