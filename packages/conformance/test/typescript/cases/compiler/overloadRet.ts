/*---
description: Ported from TypeScript's tests/cases/compiler/overloadRet.ts.
outcome: success
source: tests/cases/compiler/overloadRet.ts
---*/
// @target: es2015
interface I {
    f(s:string):number;  
    f(n:number):string;
    g(n:number):any; 
    g(n:number,m:number):string;
    h(n:number):I;  
    h(b:boolean):number;
    i(b:boolean):number;
    i(b:boolean):any;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
