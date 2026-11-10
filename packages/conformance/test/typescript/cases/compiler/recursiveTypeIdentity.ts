/*---
description: Ported from TypeScript's tests/cases/compiler/recursiveTypeIdentity.ts.
outcome: success
source: tests/cases/compiler/recursiveTypeIdentity.ts
---*/
// @target: es2015
interface A {
    <T extends A>(x: T): void;
}

interface B {
    <T extends B>(x: T): void;
}

interface C {
    (x: A): void;
    (x: B): void;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
