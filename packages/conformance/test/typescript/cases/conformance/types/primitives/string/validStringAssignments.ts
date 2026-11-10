/*---
description: Ported from TypeScript's tests/cases/conformance/types/primitives/string/validStringAssignments.ts.
outcome: success
source: tests/cases/conformance/types/primitives/string/validStringAssignments.ts
---*/
// @target: es2015
var x = '';

var a: any = x;
var b: Object = x;
var c: string = x;
var d: String = x;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
