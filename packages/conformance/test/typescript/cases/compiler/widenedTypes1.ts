/*---
description: Ported from TypeScript's tests/cases/compiler/widenedTypes1.ts.
outcome: success
source: tests/cases/compiler/widenedTypes1.ts
---*/
// @target: es2015
// @strict: false
var a = null;
var b = undefined;

var c = {x: null};
var d = [{x: null}];
var f = [null, null];
var g = [undefined, undefined];
var h = [{x: undefined}];

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
