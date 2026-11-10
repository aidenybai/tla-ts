/*---
description: Ported from TypeScript's tests/cases/compiler/unaryPlus.ts.
outcome: success
source: tests/cases/compiler/unaryPlus.ts
---*/
// @target: es2015
// allowed per spec
var a = +1;
var b = +(<any>"");
enum E { some, thing };
var c = +E.some;

// also allowed, used to be errors
var x = +"3"; //should be valid
var y = -"3"; // should be valid
var z = ~"3"; // should be valid

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
