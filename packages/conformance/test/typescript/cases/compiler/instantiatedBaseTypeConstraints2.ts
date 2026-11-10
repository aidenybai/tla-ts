/*---
description: Ported from TypeScript's tests/cases/compiler/instantiatedBaseTypeConstraints2.ts.
outcome: success
source: tests/cases/compiler/instantiatedBaseTypeConstraints2.ts
---*/
// @target: es2015
interface A<T extends A<T, S>, S extends A<T, S>> { }
interface B<U> extends A<B<U>, B<U>> { }

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
