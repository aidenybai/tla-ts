/*---
description: Ported from TypeScript's tests/cases/compiler/instanceSubtypeCheck1.ts.
outcome: success
source: tests/cases/compiler/instanceSubtypeCheck1.ts
---*/
// @target: es2015
interface A<T>
{
   x: A<B<T>>
}
 
interface B<T> extends A<T>
{
   x: B<A<T>>
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
