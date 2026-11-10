/*---
description: Ported from TypeScript's tests/cases/compiler/functionOverloads22.ts.
outcome: success
source: tests/cases/compiler/functionOverloads22.ts
---*/
// @target: es2015
function foo(bar:number):{a:number;}[];
function foo(bar:string):{a:number; b:string;}[];
function foo(bar:any):{a:any;b?:any;}[] { return [{a:""}] }

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
