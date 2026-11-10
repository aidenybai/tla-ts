/*---
description: Ported from TypeScript's tests/cases/compiler/enumNumbering1.ts.
outcome: success
source: tests/cases/compiler/enumNumbering1.ts
---*/
// @target: es2015
enum Test {
    A,
    B,
    C = Math.floor(Math.random() * 1000),
    D = 10,
    E // Error but shouldn't be
}

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
