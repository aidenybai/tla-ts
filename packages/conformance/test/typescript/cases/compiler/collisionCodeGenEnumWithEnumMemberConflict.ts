/*---
description: Ported from TypeScript's tests/cases/compiler/collisionCodeGenEnumWithEnumMemberConflict.ts.
outcome: success
source: tests/cases/compiler/collisionCodeGenEnumWithEnumMemberConflict.ts
---*/
// @target: es2015
enum Color {
    Color,
    Thing = Color
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
