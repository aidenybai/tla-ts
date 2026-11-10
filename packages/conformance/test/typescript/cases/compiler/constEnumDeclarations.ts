/*---
description: Ported from TypeScript's tests/cases/compiler/constEnumDeclarations.ts.
outcome: success
source: tests/cases/compiler/constEnumDeclarations.ts
---*/
// @target: es2015
// @declaration: true

const enum E {
    A = 1,
    B = 2,
    C = A | B
}

const enum E2 {
    A = 1,
    B,
    C
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
