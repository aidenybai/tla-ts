/*---
description: Ported from TypeScript's tests/cases/compiler/infiniteExpandingTypeThroughInheritanceInstantiation.ts.
outcome: success
source: tests/cases/compiler/infiniteExpandingTypeThroughInheritanceInstantiation.ts
---*/
// @target: es2015
interface A<T>
{
   x: A<B<T>>
}

interface B<T> extends A<T> // error
{
   x: B<A<T>>
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
