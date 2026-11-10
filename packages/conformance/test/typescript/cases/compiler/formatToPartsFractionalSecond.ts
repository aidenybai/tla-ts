/*---
description: Ported from TypeScript's tests/cases/compiler/formatToPartsFractionalSecond.ts.
outcome: success
source: tests/cases/compiler/formatToPartsFractionalSecond.ts
---*/
// @target: esnext

new Intl.DateTimeFormat().formatToParts().find((val) => val.type === 'fractionalSecond')

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
