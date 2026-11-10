/*---
description: Ported from TypeScript's tests/cases/compiler/taggedTemplateStringsHexadecimalEscapes.ts.
outcome: success
source: tests/cases/compiler/taggedTemplateStringsHexadecimalEscapes.ts
---*/
// @target: es2015
function f(...args: any[]) {
}

f `\x0D${ "Interrupted CRLF" }\x0A`;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
