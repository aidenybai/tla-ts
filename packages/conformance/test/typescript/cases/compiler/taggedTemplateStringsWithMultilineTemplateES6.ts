/*---
description: Ported from TypeScript's tests/cases/compiler/taggedTemplateStringsWithMultilineTemplateES6.ts.
outcome: success
source: tests/cases/compiler/taggedTemplateStringsWithMultilineTemplateES6.ts
---*/
//@target: es6
function f(...args: any[]): void {
}

f `
\

`;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
