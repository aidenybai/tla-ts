/*---
description: Ported from TypeScript's tests/cases/compiler/libdtsFix.ts.
outcome: success
source: tests/cases/compiler/libdtsFix.ts
---*/
// @target: es2015
interface HTMLElement {
    type: string;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
