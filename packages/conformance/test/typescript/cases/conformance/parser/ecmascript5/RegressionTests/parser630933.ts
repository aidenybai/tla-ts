/*---
description: Ported from TypeScript's tests/cases/conformance/parser/ecmascript5/RegressionTests/parser630933.ts.
outcome: success
source: tests/cases/conformance/parser/ecmascript5/RegressionTests/parser630933.ts
---*/
// @target: es2015
var a = "Hello";
var b = a.match(/\/ver=([^/]+)/);

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
