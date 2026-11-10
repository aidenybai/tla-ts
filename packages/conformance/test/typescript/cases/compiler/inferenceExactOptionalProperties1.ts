/*---
description: Ported from TypeScript's tests/cases/compiler/inferenceExactOptionalProperties1.ts.
outcome: success
source: tests/cases/compiler/inferenceExactOptionalProperties1.ts
---*/
// @target: es2015
// @strict: true
// @exactOptionalPropertyTypes: true
// @noEmit: true

type Test1 = { prop?: never } extends { prop?: infer T } ? T : false; // never

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
