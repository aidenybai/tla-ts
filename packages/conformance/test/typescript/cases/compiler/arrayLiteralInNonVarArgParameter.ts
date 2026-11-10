/*---
description: Ported from TypeScript's tests/cases/compiler/arrayLiteralInNonVarArgParameter.ts.
outcome: success
source: tests/cases/compiler/arrayLiteralInNonVarArgParameter.ts
---*/
// @target: es2015
function panic(val: string[], ...opt: string[]) { }

panic([], 'one', 'two');

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
