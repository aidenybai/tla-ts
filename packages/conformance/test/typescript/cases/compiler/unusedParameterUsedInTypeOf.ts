/*---
description: Ported from TypeScript's tests/cases/compiler/unusedParameterUsedInTypeOf.ts.
outcome: success
source: tests/cases/compiler/unusedParameterUsedInTypeOf.ts
---*/
//@target: ES5, ES2015
//@noUnusedLocals:true
//@noUnusedParameters:true

function f1 (a: number, b: typeof a) {
    return b;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
