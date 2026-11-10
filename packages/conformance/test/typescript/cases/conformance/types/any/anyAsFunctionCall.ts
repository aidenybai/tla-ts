/*---
description: Ported from TypeScript's tests/cases/conformance/types/any/anyAsFunctionCall.ts.
outcome: throws
source: tests/cases/conformance/types/any/anyAsFunctionCall.ts
---*/
// @target: es2015
// any is considered an untyped function call
// can be called except with type arguments which is an error

var x: any;
var a = x();
var b = x('hello');
var c = x(x);

/*--- recorded
all:
  exit: 1
  transcript: throws
---*/
