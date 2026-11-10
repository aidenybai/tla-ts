/*---
description: Ported from TypeScript's tests/cases/compiler/substitutionTypeForNonGenericIndexedAccessType.ts.
outcome: success
source: tests/cases/compiler/substitutionTypeForNonGenericIndexedAccessType.ts
---*/
// @target: es2015
// @strict: true
// @noEmit: true

interface A {}

type B = A extends Record<'foo', string> ? A['foo'] : string; // no error

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
