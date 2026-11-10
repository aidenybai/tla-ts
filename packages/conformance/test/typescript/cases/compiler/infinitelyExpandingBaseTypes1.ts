/*---
description: Ported from TypeScript's tests/cases/compiler/infinitelyExpandingBaseTypes1.ts.
outcome: success
source: tests/cases/compiler/infinitelyExpandingBaseTypes1.ts
---*/
// @target: es2015
interface A<T>
{
    x : A<A<T>>
}
 
interface B<T>
{
    x : B<T>
}
 
interface C<T> extends A<T>, B<T> { }

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
