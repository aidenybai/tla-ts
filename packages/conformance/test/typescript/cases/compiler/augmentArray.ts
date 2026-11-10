/*---
description: Ported from TypeScript's tests/cases/compiler/augmentArray.ts.
outcome: success
source: tests/cases/compiler/augmentArray.ts
---*/
// @target: es2015
interface Array<T> {
    (): any[];
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
