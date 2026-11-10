/*---
description: Ported from TypeScript's tests/cases/compiler/forLoopWithDestructuringDoesNotElideFollowingStatement.ts.
outcome: success
source: tests/cases/compiler/forLoopWithDestructuringDoesNotElideFollowingStatement.ts
---*/
// @target: es2015
let array = [{a: 0, b: 1}]
for (let { a, ...rest } of array)
    void a

/*--- recorded
all:
  exit: 0
  transcript: success
---*/
