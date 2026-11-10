/*---
description: Ported from TypeScript's tests/cases/compiler/recursiveGenericTypeHierarchy.ts.
outcome: success
source: tests/cases/compiler/recursiveGenericTypeHierarchy.ts
---*/
// @target: es2015
// used to ICE
interface A<T extends A<T, S>, S extends A<T, S>> { }
interface B<T extends B<T, S>, S extends B<T, S>> extends A<B<T, S>, B<T, S>> { }

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
