/*---
description: Ported from TypeScript's tests/cases/compiler/parserIsClassMemberStart.ts.
outcome: success
source: tests/cases/compiler/parserIsClassMemberStart.ts
---*/
// @target: es2015
class C {
    type!: number;
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
