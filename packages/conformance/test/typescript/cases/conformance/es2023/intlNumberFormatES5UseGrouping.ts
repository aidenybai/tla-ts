/*---
description: Ported from TypeScript's tests/cases/conformance/es2023/intlNumberFormatES5UseGrouping.ts.
outcome: success
source: tests/cases/conformance/es2023/intlNumberFormatES5UseGrouping.ts
---*/
// @target: es5, es2015
// @strict: true

new Intl.NumberFormat('en-GB', { useGrouping: true });
new Intl.NumberFormat('en-GB', { useGrouping: 'true' }); // expect error
new Intl.NumberFormat('en-GB', { useGrouping: 'always' }); // expect error

const { useGrouping } = new Intl.NumberFormat('en-GB').resolvedOptions();

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
