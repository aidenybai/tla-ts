/*---
description: Ported from TypeScript's tests/cases/conformance/types/any/anyPropertyAccess.ts.
outcome: throws
source: tests/cases/conformance/types/any/anyPropertyAccess.ts
---*/
// @target: es2015
var x: any;
var a = x.foo;
var b = x['foo'];
var c = x['fn']();
var d = x.bar.baz;
var e = x[0].foo;
var f = x['0'].bar;

/*--- recorded
all:
  exit: 1
  transcript: throws
---*/
