/*---
description: Ported from TypeScript's tests/cases/conformance/directives/ts-expect-error-nocheck.ts.
outcome: success
source: tests/cases/conformance/directives/ts-expect-error-nocheck.ts
---*/
// @target: es2015
// @ts-nocheck

// there should not be a "Unused @ts-expect-error" error due to the // @ts-nocheck

// @ts-expect-error
const a = 1;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
