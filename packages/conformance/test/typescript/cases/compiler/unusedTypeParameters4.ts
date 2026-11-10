/*---
description: Ported from TypeScript's tests/cases/compiler/unusedTypeParameters4.ts.
outcome: success
source: tests/cases/compiler/unusedTypeParameters4.ts
---*/
// @target: es2015
//@noUnusedLocals:true
//@noUnusedParameters:true

var x: {
    new <T, U>(a: T): void;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
