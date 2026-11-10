/*---
description: Ported from TypeScript's tests/cases/compiler/unusedTypeParametersCheckedByNoUnusedParameters.ts.
outcome: success
source: tests/cases/compiler/unusedTypeParametersCheckedByNoUnusedParameters.ts
---*/
// @target: es2015
//@noUnusedParameters:true

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
