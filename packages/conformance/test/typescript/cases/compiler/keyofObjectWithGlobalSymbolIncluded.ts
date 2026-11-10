/*---
description: Ported from TypeScript's tests/cases/compiler/keyofObjectWithGlobalSymbolIncluded.ts.
outcome: success
source: tests/cases/compiler/keyofObjectWithGlobalSymbolIncluded.ts
---*/
// @target: es6
// @strict: true
const obj = {
    [Symbol.species]: Array
};

type Q = keyof typeof obj;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
