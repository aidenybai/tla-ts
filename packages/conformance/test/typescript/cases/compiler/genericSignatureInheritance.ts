/*---
description: Ported from TypeScript's tests/cases/compiler/genericSignatureInheritance.ts.
outcome: success
source: tests/cases/compiler/genericSignatureInheritance.ts
---*/
// @target: es2015
interface I {
    <T>(x: T): string;
}

interface I2 extends I { }

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
