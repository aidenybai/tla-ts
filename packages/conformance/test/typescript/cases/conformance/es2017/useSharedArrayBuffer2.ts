/*---
description: Ported from TypeScript's tests/cases/conformance/es2017/useSharedArrayBuffer2.ts.
outcome: success
source: tests/cases/conformance/es2017/useSharedArrayBuffer2.ts
---*/
// @target: es5, es2015
// @lib: es5

var foge = new SharedArrayBuffer(1024);
var bar = foge.slice(1, 10);
var len = foge.byteLength;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
