/*---
description: Ported from TypeScript's tests/cases/conformance/types/primitives/number/numberPropertyAccess.ts.
outcome: success
source: tests/cases/conformance/types/primitives/number/numberPropertyAccess.ts
---*/
// @target: es2015
var x = 1;
var a = x.toExponential();
var b = x.hasOwnProperty('toFixed');

var c = x['toExponential']();
var d = x['hasOwnProperty']('toFixed');

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
