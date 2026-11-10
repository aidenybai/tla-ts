/*---
description: Ported from TypeScript's tests/cases/conformance/types/primitives/number/validNumberAssignments.ts.
outcome: success
source: tests/cases/conformance/types/primitives/number/validNumberAssignments.ts
---*/
// @target: es2015
var x = 1;

var a: any = x;
var b: Object = x;
var c: number = x;
enum E { A };
var d: E = x;
var e = E.A;
e = x;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
