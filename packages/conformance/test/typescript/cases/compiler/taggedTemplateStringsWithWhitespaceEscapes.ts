/*---
description: Ported from TypeScript's tests/cases/compiler/taggedTemplateStringsWithWhitespaceEscapes.ts.
outcome: success
source: tests/cases/compiler/taggedTemplateStringsWithWhitespaceEscapes.ts
---*/
// @target: es2015
function f(...args: any[]) {
}

f `\t\n\v\f\r\\`;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
