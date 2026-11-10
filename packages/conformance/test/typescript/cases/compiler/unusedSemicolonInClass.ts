/*---
description: Ported from TypeScript's tests/cases/compiler/unusedSemicolonInClass.ts.
outcome: success
source: tests/cases/compiler/unusedSemicolonInClass.ts
---*/
// @target: es2015
// @noUnusedLocals: true
class Unused {
    ;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
