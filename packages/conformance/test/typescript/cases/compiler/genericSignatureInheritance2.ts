/*---
description: Ported from TypeScript's tests/cases/compiler/genericSignatureInheritance2.ts.
outcome: success
source: tests/cases/compiler/genericSignatureInheritance2.ts
---*/
// @target: es2015
interface I {
    <T>(x: T): string;
}

interface I2 extends I { 
    <T>(x: T): void;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
