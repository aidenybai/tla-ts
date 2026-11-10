/*---
description: Ported from TypeScript's tests/cases/compiler/declFileClassWithIndexSignature.ts.
outcome: success
source: tests/cases/compiler/declFileClassWithIndexSignature.ts
---*/
// @target: es2015
// @declaration: true

class BlockIntrinsics {
    [s: string]: string;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
