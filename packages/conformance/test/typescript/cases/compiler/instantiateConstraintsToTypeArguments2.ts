/*---
description: Ported from TypeScript's tests/cases/compiler/instantiateConstraintsToTypeArguments2.ts.
outcome: success
source: tests/cases/compiler/instantiateConstraintsToTypeArguments2.ts
---*/
// @target: es2015
interface A<T extends A<T, S>, S extends A<T, S>> { }
interface B<T extends B<T, S>, S extends B<T, S>> extends A<B<T, S>, B<T, S>> { }

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
