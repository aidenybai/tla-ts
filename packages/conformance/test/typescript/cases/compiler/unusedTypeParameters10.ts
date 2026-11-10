/*---
description: Ported from TypeScript's tests/cases/compiler/unusedTypeParameters10.ts.
outcome: success
source: tests/cases/compiler/unusedTypeParameters10.ts
---*/
// @target: es2015
//@noUnusedLocals:true
//@noUnusedParameters:true

type Alias<T> = { };
type Alias2<T> = { x: T };

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
