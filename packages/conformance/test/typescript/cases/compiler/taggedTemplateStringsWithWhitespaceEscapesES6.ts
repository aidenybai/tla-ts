/*---
description: Ported from TypeScript's tests/cases/compiler/taggedTemplateStringsWithWhitespaceEscapesES6.ts.
outcome: success
source: tests/cases/compiler/taggedTemplateStringsWithWhitespaceEscapesES6.ts
---*/
//@target: es6
function f(...args: any[]) {
}

f `\t\n\v\f\r\\`;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
