/*---
description: Ported from TypeScript's tests/cases/compiler/argsInScope.ts.
outcome: success
source: tests/cases/compiler/argsInScope.ts
---*/
// @target: es2015
class C {
    P(ii:number, j:number, k:number) {
       for (var i = 0; i < arguments.length; i++) {
           // WScript.Echo("param: " + arguments[i]);
       }
    }
}

var c = new C();
c.P(1,2,3);

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
