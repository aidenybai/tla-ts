/*---
description: Ported from TypeScript's tests/cases/conformance/es2017/useSharedArrayBuffer5.ts.
outcome: success
source: tests/cases/conformance/es2017/useSharedArrayBuffer5.ts
---*/
// @target: es5, es2015
// @lib: es6,es2017.sharedmemory

var foge = new SharedArrayBuffer(1024);
var stringTag = foge[Symbol.toStringTag];
var species = SharedArrayBuffer[Symbol.species];

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
