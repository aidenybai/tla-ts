/*---
description: Ported from TypeScript's tests/cases/compiler/inOperatorWithGeneric.ts.
outcome: success
source: tests/cases/compiler/inOperatorWithGeneric.ts
---*/
// @target: es2015
// @strict: false
class C<T> {
    foo(x:T) {
        for (var p in x) {
        }
    }
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
