/*---
description: Ported from TypeScript's tests/cases/compiler/styleOptions.ts.
outcome: success
source: tests/cases/compiler/styleOptions.ts
---*/
// @target: es2015
///<style eqeqeq="on" strict="on" /> 

var x = 1;
var y = 1;
var t = x == y;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
