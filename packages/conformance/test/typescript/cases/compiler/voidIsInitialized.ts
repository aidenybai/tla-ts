/*---
description: Ported from TypeScript's tests/cases/compiler/voidIsInitialized.ts.
outcome: success
source: tests/cases/compiler/voidIsInitialized.ts
---*/
// @target: es2015
// @strict: true

const x: void = undefined;
const y: void = undefined;

if(typeof x === "undefined") {
    x // no error: assume x2 is initialised
}

if(typeof y !== "undefined") {
    y // no error: do not narrow void
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
