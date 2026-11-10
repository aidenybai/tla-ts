/*---
description: Ported from TypeScript's tests/cases/conformance/types/primitives/boolean/booleanPropertyAccess.ts.
outcome: success
source: tests/cases/conformance/types/primitives/boolean/booleanPropertyAccess.ts
---*/
// @target: es2015
var x = true;

var a = x.toString();
var b = x['toString']();

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
