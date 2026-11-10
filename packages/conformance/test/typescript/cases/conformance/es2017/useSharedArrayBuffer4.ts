/*---
description: Ported from TypeScript's tests/cases/conformance/es2017/useSharedArrayBuffer4.ts.
outcome: success
source: tests/cases/conformance/es2017/useSharedArrayBuffer4.ts
---*/
// @target: es6
// @lib: es2017

var foge = new SharedArrayBuffer(1024);
var bar = foge.slice(1, 10);
var stringTag = foge[Symbol.toStringTag];
var len = foge.byteLength;
var species = SharedArrayBuffer[Symbol.species];

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
