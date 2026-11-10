/*---
description: Ported from TypeScript's tests/cases/compiler/enumWithoutInitializerAfterComputedMember.ts.
outcome: success
source: tests/cases/compiler/enumWithoutInitializerAfterComputedMember.ts
---*/
// @target: es2015
enum E {
    a,
    b = a,
    c
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
