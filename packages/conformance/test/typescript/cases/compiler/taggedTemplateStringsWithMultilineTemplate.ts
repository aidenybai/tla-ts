/*---
description: Ported from TypeScript's tests/cases/compiler/taggedTemplateStringsWithMultilineTemplate.ts.
outcome: success
source: tests/cases/compiler/taggedTemplateStringsWithMultilineTemplate.ts
---*/
// @target: es2015
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
