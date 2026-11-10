/*---
description: Ported from TypeScript's tests/cases/compiler/taggedTemplateStringsWithUnicodeEscapes.ts.
outcome: success
source: tests/cases/compiler/taggedTemplateStringsWithUnicodeEscapes.ts
---*/
// @target: es2015
function f(...args: any[]) {
}

f `'\u{1f4a9}'${ " should be converted to " }'\uD83D\uDCA9'`;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
