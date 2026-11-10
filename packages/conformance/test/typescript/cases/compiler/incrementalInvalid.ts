/*---
description: Ported from TypeScript's tests/cases/compiler/incrementalInvalid.ts.
outcome: success
source: tests/cases/compiler/incrementalInvalid.ts
---*/
// @target: es2015
// @incremental: true

const x = 10;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
