/*---
description: Ported from TypeScript's tests/cases/compiler/excessPropertyCheckingIntersectionWithConditional.ts.
outcome: success
source: tests/cases/compiler/excessPropertyCheckingIntersectionWithConditional.ts
---*/
// @target: es2015
type Foo<K> = K extends unknown ? { a: number } : unknown
const createDefaultExample = <K,>(x: K): Foo<K> & { x: K; } => {
  return { a: 1, x: x }; // okay in TS 4.7.4, error in TS 4.8.2
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
