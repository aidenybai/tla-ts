/*---
description: Ported from TypeScript's tests/cases/compiler/genericConstraint3.ts.
outcome: success
source: tests/cases/compiler/genericConstraint3.ts
---*/
// @target: es2015
interface C<P> { x: P; }
interface A<T, U extends C<T>> { x: U; }
interface B extends A<{}, { x: {} }> { } // Should not produce an error

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
