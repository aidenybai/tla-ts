/*---
description: Ported from TypeScript's tests/cases/compiler/strictOptionalProperties2.ts.
outcome: success
source: tests/cases/compiler/strictOptionalProperties2.ts
---*/
// @target: es2015
// @strict: true
// @exactOptionalPropertyTypes: true
// @declaration: true

// Repro from #44567

type T1 = { 0?: string | undefined } extends { 0?: string } ? true : false;  // false
type T2 = [(string | undefined)?] extends [string?] ? true : false;  // false

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
