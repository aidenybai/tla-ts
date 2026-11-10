/*---
description: Ported from TypeScript's tests/cases/compiler/parseEntityNameWithReservedWord.ts.
outcome: success
source: tests/cases/compiler/parseEntityNameWithReservedWord.ts
---*/
// @target: es2015
enum Bool { false }
const x: Bool.false = Bool.false;

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
