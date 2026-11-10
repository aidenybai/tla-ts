/*---
description: Ported from TypeScript's tests/cases/compiler/restParameters.ts.
outcome: success
source: tests/cases/compiler/restParameters.ts
---*/
// @target: es2015
function f18(a?:string, ...b:number[]){}
 
function f19(a?:string, b?:number, ...c:number[]){}
 
function f20(a:string, b?:string, ...c:number[]){}
 
function f21(a:string, b?:string, c?:number, ...d:number[]){}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
