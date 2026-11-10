/*---
description: Ported from TypeScript's tests/cases/compiler/anyPlusAny1.ts.
outcome: throws
source: tests/cases/compiler/anyPlusAny1.ts
---*/
// @target: es2015
var x: any;
x.name = "hello";
var z = x + x;

/*--- recorded
all:
  exit: 1
  transcript: throws
---*/
