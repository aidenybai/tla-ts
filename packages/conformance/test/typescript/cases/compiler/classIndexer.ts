/*---
description: Ported from TypeScript's tests/cases/compiler/classIndexer.ts.
outcome: success
source: tests/cases/compiler/classIndexer.ts
---*/
// @target: es2015
class C123 {
    [s: string]: number;
    constructor() {
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
