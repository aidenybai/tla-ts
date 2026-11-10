/*---
description: Ported from TypeScript's tests/cases/compiler/extendNonClassSymbol1.ts.
outcome: success
source: tests/cases/compiler/extendNonClassSymbol1.ts
---*/
// @target: es2015
class A { foo() { } }
var x = A;
class C extends x { } // error, could not find symbol xs

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
