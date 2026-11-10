/*---
description: Ported from TypeScript's tests/cases/compiler/duplicateConstructSignature2.ts.
outcome: success
source: tests/cases/compiler/duplicateConstructSignature2.ts
---*/
// @target: es2015
interface I<T> {
    (x: T): number;
    (x: T): string;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
