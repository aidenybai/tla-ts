/*---
description: Ported from TypeScript's tests/cases/conformance/es2021/intlDateTimeFormatRangeES2021.ts.
outcome: success
source: tests/cases/conformance/es2021/intlDateTimeFormatRangeES2021.ts
---*/
// @target: es2015
// @lib: es2021

new Intl.DateTimeFormat().formatRange(new Date(0), new Date());
const [ part ] = new Intl.DateTimeFormat().formatRangeToParts(1000, 1000000000);

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
