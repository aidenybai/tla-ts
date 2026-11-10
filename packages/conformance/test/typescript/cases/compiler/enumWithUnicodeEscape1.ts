/*---
description: Ported from TypeScript's tests/cases/compiler/enumWithUnicodeEscape1.ts.
outcome: success
source: tests/cases/compiler/enumWithUnicodeEscape1.ts
---*/
// @target: es2015
enum E {
  'gold \u2730'
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
