/*---
description: Ported from TypeScript's tests/cases/conformance/es2017/useSharedArrayBuffer3.ts.
outcome: success
source: tests/cases/conformance/es2017/useSharedArrayBuffer3.ts
---*/
// @target: es6

var foge = new SharedArrayBuffer(1024);
var bar = foge.slice(1, 10);
var len = foge.byteLength;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
