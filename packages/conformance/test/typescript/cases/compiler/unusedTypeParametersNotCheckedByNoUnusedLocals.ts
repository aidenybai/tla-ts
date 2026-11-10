/*---
description: Ported from TypeScript's tests/cases/compiler/unusedTypeParametersNotCheckedByNoUnusedLocals.ts.
outcome: success
source: tests/cases/compiler/unusedTypeParametersNotCheckedByNoUnusedLocals.ts
---*/
// @target: es2015
//@noUnusedLocals:true

function f<T>() { }

type T<T> = { };

interface I<T> { };

class C<T> {
    public m<V>() { }
};

let l = <T>() => { };

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
