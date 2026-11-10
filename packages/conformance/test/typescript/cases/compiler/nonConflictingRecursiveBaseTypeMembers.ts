/*---
description: Ported from TypeScript's tests/cases/compiler/nonConflictingRecursiveBaseTypeMembers.ts.
outcome: success
source: tests/cases/compiler/nonConflictingRecursiveBaseTypeMembers.ts
---*/
// @target: es2015
interface A<T> {
    x: C<T>
}

interface B<T> {
    x: C<T>
}

interface C<T> extends A<T>, B<T> { } // Should not be an error

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
