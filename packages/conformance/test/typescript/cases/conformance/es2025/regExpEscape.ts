/*---
description: Ported from TypeScript's tests/cases/conformance/es2025/regExpEscape.ts.
outcome: success
source: tests/cases/conformance/es2025/regExpEscape.ts
---*/
// @target: esnext
// @lib: es2024,es2025.regexp
// @noemit: true
// @strict: true

const regExp = new RegExp(RegExp.escape("foo.bar"));
regExp.test("foo.bar");

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
