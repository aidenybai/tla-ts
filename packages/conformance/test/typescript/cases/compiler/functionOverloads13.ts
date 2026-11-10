/*---
description: Ported from TypeScript's tests/cases/compiler/functionOverloads13.ts.
outcome: success
source: tests/cases/compiler/functionOverloads13.ts
---*/
// @target: es2015
// @strict: false
function foo(bar:number):string;
function foo(bar:number):number;
function foo(bar?:number):any { return "" }

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
