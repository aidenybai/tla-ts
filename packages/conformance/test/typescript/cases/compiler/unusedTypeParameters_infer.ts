/*---
description: Ported from TypeScript's tests/cases/compiler/unusedTypeParameters_infer.ts.
outcome: success
source: tests/cases/compiler/unusedTypeParameters_infer.ts
---*/
// @target: es2015
// @noUnusedParameters: true

type Length<T> = T extends ArrayLike<infer U> ? number : never;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
