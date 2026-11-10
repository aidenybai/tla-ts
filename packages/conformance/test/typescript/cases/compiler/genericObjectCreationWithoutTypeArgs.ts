/*---
description: Ported from TypeScript's tests/cases/compiler/genericObjectCreationWithoutTypeArgs.ts.
outcome: success
source: tests/cases/compiler/genericObjectCreationWithoutTypeArgs.ts
---*/
// @target: es2015
class SS<T>{

}

var x1 = new SS<number>(); // OK
var x2 = new SS<number>;   // OK 
var x3 = new SS();         // OK
var x4 = new SS;           // OK

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
