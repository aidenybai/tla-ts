/*---
description: Ported from TypeScript's tests/cases/conformance/es2025/intlDurationFormat.ts.
outcome: success
source: tests/cases/conformance/es2025/intlDurationFormat.ts
---*/
// @target: esnext
// @lib: es2024,es2025.intl
// @noemit: true
// @strict: true

new Intl.DurationFormat('en').format({
  years: 1,
  hours: 20,
  minutes: 15,
  seconds: 35
});

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
