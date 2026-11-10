/*---
description: Ported from TypeScript's tests/cases/compiler/taggedTemplateStringsHexadecimalEscapesES6.ts.
outcome: success
source: tests/cases/compiler/taggedTemplateStringsHexadecimalEscapesES6.ts
---*/
//@target: es6
function f(...args: any[]) {
}

f `\x0D${ "Interrupted CRLF" }\x0A`;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
