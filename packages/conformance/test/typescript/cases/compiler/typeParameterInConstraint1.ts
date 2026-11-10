/*---
description: Ported from TypeScript's tests/cases/compiler/typeParameterInConstraint1.ts.
outcome: success
source: tests/cases/compiler/typeParameterInConstraint1.ts
---*/
// @target: es2015
class C<T, U extends T> {
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
