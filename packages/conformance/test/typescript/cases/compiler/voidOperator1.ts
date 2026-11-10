/*---
description: Ported from TypeScript's tests/cases/compiler/voidOperator1.ts.
outcome: success
source: tests/cases/compiler/voidOperator1.ts
---*/
// @target: es2015
// @strict: false
var x: any = void 1;
var y: void = void 1;
var z = void 1;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
